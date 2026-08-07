<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Gate;
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
        ResetPassword::createUrlUsing(function (User $user, string $token) {
            $frontendUrl = rtrim((string) config('app.frontend_url'), '/');

            return "{$frontendUrl}/reset-password?token={$token}&email=".urlencode($user->email);
        });
    }
}
