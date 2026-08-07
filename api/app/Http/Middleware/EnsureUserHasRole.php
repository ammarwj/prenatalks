<?php

namespace App\Http\Middleware;

use App\Traits\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * RBAC per PRD §5 — dipakai sebagai `role:admin,super_admin` di route.
 */
class EnsureUserHasRole
{
    use ApiResponse;

    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user('api');

        if (! $user || ! $user->hasRole(...$roles)) {
            return $this->error('Anda tidak memiliki hak akses', null, 403);
        }

        return $next($request);
    }
}
