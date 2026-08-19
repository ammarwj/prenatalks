<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\RefreshTokenService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly RefreshTokenService $refreshTokens) {}

    public function register(RegisterRequest $request)
    {
        $data = $request->validated();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password_hash' => $data['password'],
        ])->refresh();

        $user->sendEmailVerificationNotification();

        return $this->success(
            ['user' => new UserResource($user)],
            'Registrasi berhasil. Silakan cek email Anda untuk verifikasi.',
            status: 201,
        );
    }

    public function login(LoginRequest $request)
    {
        $data = $request->validated();
        $lockKey = 'login-lockout:'.Str::lower($data['email']);

        if (RateLimiter::tooManyAttempts($lockKey, 10)) {
            $minutes = (int) ceil(RateLimiter::availableIn($lockKey) / 60);

            return $this->error("Terlalu banyak percobaan gagal. Coba lagi dalam {$minutes} menit.", null, 429);
        }

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password_hash)) {
            RateLimiter::hit($lockKey, 900);

            return $this->error('Email atau password salah', null, 401);
        }

        if (! $user->is_active) {
            return $this->error('Akun Anda telah dinonaktifkan', null, 403);
        }

        RateLimiter::clear($lockKey);

        $user->forceFill(['last_login_at' => now()])->save();

        return $this->success(
            $this->tokenPayload($user, $request),
            'Berhasil masuk',
        );
    }

    public function refresh(Request $request)
    {
        $plainToken = (string) $request->input('refresh_token');

        if ($plainToken === '') {
            return $this->error('Refresh token wajib diisi', null, 422);
        }

        $refreshToken = $this->refreshTokens->findValid($plainToken);

        if (! $refreshToken) {
            return $this->error('Refresh token tidak valid atau sudah kedaluwarsa', null, 401);
        }

        // Rotasi: token lama masuk denylist begitu dipakai (PRD §6.1 langkah 4)
        $this->refreshTokens->revoke($refreshToken);

        return $this->success(
            $this->tokenPayload($refreshToken->user, $request),
            'Token diperbarui',
        );
    }

    public function logout(Request $request)
    {
        JWTAuth::parseToken()->invalidate();

        $plainRefreshToken = $request->input('refresh_token');
        if ($plainRefreshToken) {
            $refreshToken = $this->refreshTokens->findValid($plainRefreshToken);
            if ($refreshToken) {
                $this->refreshTokens->revoke($refreshToken);
            }
        }

        return $this->success(null, 'Berhasil keluar');
    }

    public function me(Request $request)
    {
        return $this->success(['user' => new UserResource($request->user('api'))], 'Profil pengguna');
    }

    public function updateProfile(UpdateProfileRequest $request)
    {
        /** @var User $user */
        $user = $request->user('api');

        $user->fill($request->validated())->save();

        return $this->success(['user' => new UserResource($user->refresh())], 'Profil berhasil diperbarui');
    }

    /**
     * Ganti kata sandi dari dalam sesi yang aktif.
     *
     * Semua refresh token pengguna dicabut, lalu sepasang token baru
     * diterbitkan untuk perangkat yang sedang dipakai. Tanpa pencabutan itu
     * penggantian kata sandi tidak mengamankan apa pun — sesi yang terlanjur
     * dicuri tetap hidup sampai TTL-nya habis. Penerbitan ulang di langkah
     * terakhir yang membuat perangkat ini tidak ikut terlempar keluar.
     */
    public function changePassword(ChangePasswordRequest $request)
    {
        $data = $request->validated();

        /** @var User $user */
        $user = $request->user('api');

        if (! Hash::check($data['current_password'], $user->password_hash)) {
            // Pesannya sengaja hanya menyebut kata sandi saat ini — tidak ada
            // yang perlu dibocorkan selain itu kepada pemegang sesi curian.
            return $this->error('Kata sandi saat ini salah', ['current_password' => ['Kata sandi saat ini salah']], 422);
        }

        $user->forceFill(['password_hash' => $data['password']])->save();

        $this->refreshTokens->revokeAllFor($user);

        return $this->success($this->tokenPayload($user, $request), 'Kata sandi berhasil diperbarui');
    }

    public function forgotPassword(ForgotPasswordRequest $request)
    {
        Password::sendResetLink($request->only('email'));

        // Balasan sama baik email terdaftar maupun tidak — mencegah enumerasi akun.
        return $this->success(null, 'Jika email terdaftar, tautan atur ulang password telah dikirim.');
    }

    public function resetPassword(ResetPasswordRequest $request)
    {
        $status = Password::reset(
            $request->only('email', 'password', 'token'),
            function (User $user, string $password) {
                $user->forceFill(['password_hash' => $password])->save();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return $this->error('Tautan atur ulang password tidak valid atau sudah kedaluwarsa', null, 422);
        }

        return $this->success(null, 'Password berhasil diperbarui');
    }

    public function verifyEmail(int $id, string $hash)
    {
        $user = User::find($id);

        if (! $user || ! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            return $this->error('Tautan verifikasi tidak valid', null, 403);
        }

        if ($user->hasVerifiedEmail()) {
            return $this->success(['user' => new UserResource($user)], 'Email sudah terverifikasi sebelumnya');
        }

        $user->markEmailAsVerified();

        return $this->success(['user' => new UserResource($user)], 'Email berhasil diverifikasi');
    }

    /**
     * @return array<string, mixed>
     */
    private function tokenPayload(User $user, Request $request): array
    {
        $accessToken = JWTAuth::fromUser($user);
        [$refreshTokenPlain] = $this->refreshTokens->issue($user, $request);

        return [
            'access_token' => $accessToken,
            'refresh_token' => $refreshTokenPlain,
            'token_type' => 'Bearer',
            'expires_in' => JWTAuth::factory()->getTTL() * 60,
            'user' => new UserResource($user),
        ];
    }
}
