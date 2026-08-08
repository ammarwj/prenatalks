<?php

namespace Tests\Feature\Admin;

use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class TeamMemberControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, string>
     */
    private function authHeader(User $user): array
    {
        $this->app['auth']->forgetGuards();
        $this->app['tymon.jwt']->unsetToken();

        return ['Authorization' => 'Bearer '.JWTAuth::fromUser($user)];
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Siti Rahmawati',
            'role_title' => 'Penanggung Jawab Klinis',
            'credential' => 'Bidan · STR 1234567890',
            'description' => 'Mendampingi ibu hamil sejak 2015.',
            'is_published' => true,
        ], $overrides);
    }

    public function test_regular_user_is_rejected(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/admin/team-members')
            ->assertStatus(403);
    }

    public function test_admin_can_create_a_team_member(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->withHeaders($this->authHeader($admin))
            ->postJson('/api/v1/admin/team-members', $this->payload());

        $response->assertCreated()->assertJson([
            'data' => [
                'name' => 'Siti Rahmawati',
                'credential' => 'Bidan · STR 1234567890',
                'is_published' => true,
                'order_index' => 10,
            ],
        ]);
    }

    public function test_new_members_are_appended_to_the_end_of_the_order(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);

        $this->withHeaders($headers)->postJson('/api/v1/admin/team-members', $this->payload());
        $second = $this->withHeaders($headers)
            ->postJson('/api/v1/admin/team-members', $this->payload(['name' => 'Budi']));

        $this->assertSame(20, $second->json('data.order_index'));
    }

    public function test_name_and_role_are_required(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->withHeaders($this->authHeader($admin))
            ->postJson('/api/v1/admin/team-members', ['name' => '', 'role_title' => ''])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'role_title']);
    }

    public function test_photo_is_stored_as_webp(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->withHeaders($this->authHeader($admin))->post(
            '/api/v1/admin/team-members',
            [...$this->payload(), 'photo' => UploadedFile::fake()->image('foto.jpg', 600, 600)],
            ['Accept' => 'application/json']
        );

        $response->assertCreated();
        $photoUrl = $response->json('data.photo_url');
        $this->assertNotNull($photoUrl);
        $this->assertStringEndsWith('.webp', $photoUrl);
        $this->assertStringContainsString('team/', $photoUrl);
    }

    public function test_non_image_upload_is_rejected(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => 'admin']);

        $this->withHeaders($this->authHeader($admin))->post(
            '/api/v1/admin/team-members',
            [...$this->payload(), 'photo' => UploadedFile::fake()->create('dokumen.pdf', 100, 'application/pdf')],
            ['Accept' => 'application/json']
        )->assertStatus(422)->assertJsonValidationErrors('photo');
    }

    public function test_update_can_remove_the_photo(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);

        $created = $this->withHeaders($headers)->post(
            '/api/v1/admin/team-members',
            [...$this->payload(), 'photo' => UploadedFile::fake()->image('foto.jpg', 400, 400)],
            ['Accept' => 'application/json']
        );
        $id = $created->json('data.id');
        $storedPath = TeamMember::find($id)->photo_path;

        $response = $this->withHeaders($headers)->post(
            "/api/v1/admin/team-members/{$id}",
            [...$this->payload(), '_method' => 'PUT', 'remove_photo' => '1'],
            ['Accept' => 'application/json']
        );

        $response->assertOk();
        $this->assertNull($response->json('data.photo_url'));
        Storage::disk('public')->assertMissing($storedPath);
    }

    public function test_admin_can_unpublish_a_member(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);

        $created = $this->withHeaders($headers)
            ->postJson('/api/v1/admin/team-members', $this->payload());

        $this->withHeaders($headers)
            ->putJson(
                "/api/v1/admin/team-members/{$created->json('data.id')}",
                $this->payload(['is_published' => false])
            )
            ->assertOk()
            ->assertJson(['data' => ['is_published' => false]]);

        $this->getJson('/api/v1/team-members')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_deleting_a_member_also_deletes_the_photo(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);

        $created = $this->withHeaders($headers)->post(
            '/api/v1/admin/team-members',
            [...$this->payload(), 'photo' => UploadedFile::fake()->image('foto.jpg', 400, 400)],
            ['Accept' => 'application/json']
        );
        $id = $created->json('data.id');
        $storedPath = TeamMember::find($id)->photo_path;

        $this->withHeaders($headers)->deleteJson("/api/v1/admin/team-members/{$id}")->assertOk();

        $this->assertDatabaseMissing('team_members', ['id' => $id]);
        Storage::disk('public')->assertMissing($storedPath);
    }

    public function test_reorder_persists_the_new_order(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $first = TeamMember::create(['name' => 'Pertama', 'role_title' => 'Bidan', 'order_index' => 10]);
        $second = TeamMember::create(['name' => 'Kedua', 'role_title' => 'Bidan', 'order_index' => 20]);

        $response = $this->withHeaders($this->authHeader($admin))
            ->patchJson('/api/v1/admin/team-members/reorder', ['ids' => [$second->id, $first->id]]);

        $response->assertOk();
        $this->assertSame('Kedua', $response->json('data.0.name'));
        $this->assertSame(10, $response->json('data.0.order_index'));
    }

    public function test_reorder_rejects_unknown_ids(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->withHeaders($this->authHeader($admin))
            ->patchJson('/api/v1/admin/team-members/reorder', ['ids' => [999999]])
            ->assertStatus(422)
            ->assertJsonValidationErrors('ids.0');
    }
}
