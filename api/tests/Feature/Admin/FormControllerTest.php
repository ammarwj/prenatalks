<?php

namespace Tests\Feature\Admin;

use App\Models\Form;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class FormControllerTest extends TestCase
{
    use RefreshDatabase;

    private function authHeader(User $user): array
    {
        return ['Authorization' => 'Bearer '.JWTAuth::fromUser($user)];
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'Survei Kepuasan Layanan',
            'description' => 'Isi survei ini untuk membantu kami',
            'status' => 'draft',
            'fields' => [
                [
                    'label' => 'Nama lengkap',
                    'type' => 'text',
                    'is_required' => true,
                    'placeholder' => 'Nama Anda',
                    'validation' => ['min' => 2, 'max' => 100],
                ],
                [
                    'label' => 'Puas dengan layanan?',
                    'type' => 'radio',
                    'is_required' => true,
                    'options' => ['Sangat puas', 'Puas', 'Kurang puas'],
                ],
            ],
        ], $overrides);
    }

    public function test_regular_user_is_rejected(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/admin/forms')
            ->assertStatus(403);
    }

    public function test_admin_can_create_a_form(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->withHeaders($this->authHeader($admin))
            ->postJson('/api/v1/admin/forms', $this->payload());

        $response->assertCreated()->assertJson([
            'data' => ['title' => 'Survei Kepuasan Layanan', 'status' => 'draft', 'type' => 'form'],
        ]);
        $this->assertNotEmpty($response->json('data.slug'));
        $this->assertCount(2, $response->json('data.fields'));
        $this->assertSame(10, $response->json('data.fields.0.order_index'));
        $this->assertSame(20, $response->json('data.fields.1.order_index'));
    }

    public function test_super_admin_can_also_manage_forms(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $this->withHeaders($this->authHeader($superAdmin))
            ->postJson('/api/v1/admin/forms', $this->payload())
            ->assertCreated();
    }

    public function test_slug_is_auto_generated_and_unique(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);

        $first = $this->withHeaders($headers)->postJson('/api/v1/admin/forms', $this->payload())->json('data');
        $second = $this->withHeaders($headers)->postJson('/api/v1/admin/forms', $this->payload())->json('data');

        $this->assertSame('survei-kepuasan-layanan', $first['slug']);
        $this->assertSame('survei-kepuasan-layanan-2', $second['slug']);
    }

    public function test_choice_field_requires_at_least_one_option(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->withHeaders($this->authHeader($admin))->postJson('/api/v1/admin/forms', $this->payload([
            'fields' => [
                ['label' => 'Pilihan', 'type' => 'select', 'options' => []],
            ],
        ]));

        $response->assertStatus(422);
        $this->assertArrayHasKey('fields.0.options', $response->json('errors'));
    }

    public function test_scale_field_requires_valid_min_max(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->withHeaders($this->authHeader($admin))->postJson('/api/v1/admin/forms', $this->payload([
            'fields' => [
                ['label' => 'Kepuasan', 'type' => 'scale', 'options' => ['min' => 5, 'max' => 1]],
            ],
        ]));

        $response->assertStatus(422);
        $this->assertArrayHasKey('fields.0.options', $response->json('errors'));
    }

    public function test_invalid_regex_is_rejected(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->withHeaders($this->authHeader($admin))->postJson('/api/v1/admin/forms', $this->payload([
            'fields' => [
                ['label' => 'Kode Pos', 'type' => 'text', 'validation' => ['regex' => '(']],
            ],
        ]));

        $response->assertStatus(422);
        $this->assertArrayHasKey('fields.0.validation.regex', $response->json('errors'));
    }

    public function test_file_field_max_size_cannot_exceed_2048_kb(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->withHeaders($this->authHeader($admin))->postJson('/api/v1/admin/forms', $this->payload([
            'fields' => [
                ['label' => 'Berkas', 'type' => 'file', 'validation' => ['max_size_kb' => 5000]],
            ],
        ]));

        $response->assertStatus(422);
        $this->assertArrayHasKey('fields.0.validation.max_size_kb', $response->json('errors'));
    }

    public function test_closes_at_must_be_after_or_equal_opens_at(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->withHeaders($this->authHeader($admin))->postJson('/api/v1/admin/forms', $this->payload([
            'opens_at' => '2026-08-10 00:00:00',
            'closes_at' => '2026-08-01 00:00:00',
        ]));

        $response->assertStatus(422);
        $this->assertArrayHasKey('closes_at', $response->json('errors'));
    }

    public function test_admin_can_update_a_form_and_fields_are_replaced(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);

        $created = $this->withHeaders($headers)->postJson('/api/v1/admin/forms', $this->payload())->json('data');

        $response = $this->withHeaders($headers)->putJson("/api/v1/admin/forms/{$created['id']}", $this->payload([
            'title' => 'Survei Kepuasan Layanan (Revisi)',
            'status' => 'published',
            'fields' => [
                ['label' => 'Saran', 'type' => 'textarea'],
            ],
        ]));

        $response->assertOk()->assertJson([
            'data' => ['id' => $created['id'], 'title' => 'Survei Kepuasan Layanan (Revisi)', 'status' => 'published'],
        ]);
        $this->assertCount(1, $response->json('data.fields'));
        $this->assertSame('Saran', $response->json('data.fields.0.label'));
    }

    public function test_admin_can_delete_a_form(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);

        $created = $this->withHeaders($headers)->postJson('/api/v1/admin/forms', $this->payload())->json('data');

        $this->withHeaders($headers)->deleteJson("/api/v1/admin/forms/{$created['id']}")->assertOk();
        $this->assertNull(Form::find($created['id']));
    }

    public function test_index_lists_forms_without_loading_fields(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);

        $this->withHeaders($headers)->postJson('/api/v1/admin/forms', $this->payload());

        $response = $this->withHeaders($headers)->getJson('/api/v1/admin/forms');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertArrayNotHasKey('fields', $response->json('data.0'));
    }
}
