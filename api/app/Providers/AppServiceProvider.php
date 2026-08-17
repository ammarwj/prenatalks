<?php

namespace App\Providers;

use App\Models\User;
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

        // Isi & tautan email auth tidak lagi diatur di sini: keduanya pindah ke
        // App\Notifications\{ResetPassword,VerifyEmail}Notification supaya bisa
        // ter-antre (ShouldQueue), dipasang lewat override di App\Models\User.
    }
}
