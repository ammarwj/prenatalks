<?php

namespace Tests\Feature\Auth;

use App\Http\Middleware\EnsureUserHasRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Tests\TestCase;

class RoleMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    public function test_middleware_allows_matching_role(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $request = Request::create('/api/v1/admin/test');
        $request->setUserResolver(fn () => $admin);

        $response = (new EnsureUserHasRole)->handle($request, fn () => response()->json(['ok' => true]), 'admin', 'super_admin');

        $this->assertSame(200, $response->getStatusCode());
    }

    public function test_middleware_blocks_non_matching_role(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        $request = Request::create('/api/v1/admin/test');
        $request->setUserResolver(fn () => $user);

        $response = (new EnsureUserHasRole)->handle($request, fn () => response()->json(['ok' => true]), 'admin', 'super_admin');

        $this->assertSame(403, $response->getStatusCode());
        $this->assertFalse(json_decode($response->getContent(), true)['success']);
    }

    public function test_middleware_blocks_guests(): void
    {
        $request = Request::create('/api/v1/admin/test');
        $request->setUserResolver(fn () => null);

        $response = (new EnsureUserHasRole)->handle($request, fn () => response()->json(['ok' => true]), 'admin');

        $this->assertSame(403, $response->getStatusCode());
    }

    public function test_access_admin_gate_covers_admin_and_super_admin_only(): void
    {
        $this->assertTrue(Gate::forUser(User::factory()->make(['role' => 'admin']))->allows('access-admin'));
        $this->assertTrue(Gate::forUser(User::factory()->make(['role' => 'super_admin']))->allows('access-admin'));
        $this->assertFalse(Gate::forUser(User::factory()->make(['role' => 'user']))->allows('access-admin'));
        $this->assertFalse(Gate::forUser(User::factory()->make(['role' => 'health_worker']))->allows('access-admin'));
    }

    public function test_access_super_admin_gate_is_exclusive(): void
    {
        $this->assertTrue(Gate::forUser(User::factory()->make(['role' => 'super_admin']))->allows('access-super-admin'));
        $this->assertFalse(Gate::forUser(User::factory()->make(['role' => 'admin']))->allows('access-super-admin'));
    }
}
