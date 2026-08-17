<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // RBAC per PRD §5 — dipakai lewat Gate::allows() di controller/policy.
        Gate::define('access-admin', fn (User $user) => $user->hasRole('admin', 'super_admin'));
        Gate::define('access-super-admin', fn (User $user) => $user->hasRole('super_admin'));

        // Tautan reset password mengarah ke halaman Next.js yang sudah dibangun,
        // bukan route Blade — lihat web/app/(auth)/reset-password/page.tsx.
        // Isi email juga di-custom di sini (bukan cuma URL-nya) supaya nada
        // bicaranya konsisten dengan copy Indonesia di seluruh produk.
        ResetPassword::toMailUsing(function (User $user, string $token) {
            $frontendUrl = rtrim((string) config('app.frontend_url'), '/');
            $url = "{$frontendUrl}/reset-password?token={$token}&email=".urlencode($user->email);
            $expireMinutes = config('auth.passwords.'.config('auth.defaults.passwords').'.expire');

            return (new MailMessage)
                ->subject('Atur Ulang Password PrenaTalks Anda')
                ->greeting('Halo, '.$user->name.'!')
                ->line('Kami menerima permintaan untuk mengatur ulang password akun PrenaTalks Anda.')
                ->action('Atur Ulang Password', $url)
                ->line("Tautan ini berlaku selama {$expireMinutes} menit.")
                ->line('Jika Anda tidak meminta ini, abaikan saja email ini — password Anda tetap aman.');
        });

        // Tautan verifikasi awalnya mengarah langsung ke endpoint API
        // (POST /auth/verify-email/{id}/{hash}) — kalau diklik dari email itu
        // jadi GET dan gagal (405), karena rutenya cuma menerima POST. Di sini
        // signed URL backend tetap dibuat sama seperti bawaan Laravel (supaya
        // signature-nya valid), tapi id/hash/expires/signature diteruskan ke
        // halaman Next.js — lihat
        // web/app/(auth)/verifikasi-email/[id]/[hash]/page.tsx — yang lalu
        // memanggil endpoint API itu sendiri lewat fetch (POST) sambil
        // menampilkan UI PrenaTalks, sama seperti alur reset password.
        VerifyEmail::createUrlUsing(function (User $user) {
            $backendUrl = URL::temporarySignedRoute(
                'verification.verify',
                now()->addMinutes(config('auth.verification.expire', 60)),
                ['id' => $user->getKey(), 'hash' => sha1($user->getEmailForVerification())]
            );

            $frontendUrl = rtrim((string) config('app.frontend_url'), '/');
            $query = parse_url($backendUrl, PHP_URL_QUERY);

            return "{$frontendUrl}/verifikasi-email/{$user->getKey()}/".sha1($user->getEmailForVerification())."?{$query}";
        });

        VerifyEmail::toMailUsing(function (User $user, string $url) {
            return (new MailMessage)
                ->subject('Verifikasi Email PrenaTalks Anda')
                ->greeting('Halo, '.$user->name.'!')
                ->line('Terima kasih sudah bergabung dengan PrenaTalks. Yuk, verifikasi email Anda supaya bisa menyimpan hasil cek kondisi kehamilan.')
                ->action('Verifikasi Email', $url)
                ->line('Jika Anda tidak membuat akun ini, abaikan saja email ini.');
        });
    }
}
