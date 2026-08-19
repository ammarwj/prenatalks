<?php

namespace App\Services;

use App\Models\RefreshToken;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;

/**
 * Refresh token opaque (bukan JWT), disimpan sebagai hash di DB dan
 * dirotasi setiap dipakai — PRD §10, §6.1 (alur JWT langkah 4).
 */
class RefreshTokenService
{
    public function issue(User $user, Request $request): array
    {
        $plainToken = Str::random(64);

        $refreshToken = $user->refreshTokens()->create([
            'token_hash' => hash('sha256', $plainToken),
            'expires_at' => now()->addMinutes((int) Config::get('jwt.refresh_ttl')),
            'user_agent' => substr((string) $request->userAgent(), 0, 255),
            'ip' => $request->ip(),
        ]);

        return [$plainToken, $refreshToken];
    }

    public function findValid(string $plainToken): ?RefreshToken
    {
        $refreshToken = RefreshToken::query()
            ->where('token_hash', hash('sha256', $plainToken))
            ->first();

        if (! $refreshToken || ! $refreshToken->isValid()) {
            return null;
        }

        return $refreshToken;
    }

    public function revoke(RefreshToken $refreshToken): void
    {
        $refreshToken->update(['revoked_at' => now()]);
    }

    /**
     * Cabut seluruh refresh token milik satu pengguna — dipakai saat ganti
     * kata sandi. Tanpa ini penggantian tidak mengamankan apa pun: sesi yang
     * terlanjur dicuri tetap bisa menukar refresh token-nya jadi access token
     * baru sampai TTL-nya habis.
     *
     * @return int jumlah token yang dicabut
     */
    public function revokeAllFor(User $user): int
    {
        return $user->refreshTokens()
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);
    }
}
