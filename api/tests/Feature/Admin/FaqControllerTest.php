<?php

namespace Tests\Feature\Admin;

use App\Models\Category;
use App\Models\Faq;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class FaqControllerTest extends TestCase
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
            'question' => 'Apakah PrenaTalks berbayar?',
            'answer' => 'Tidak, seluruh layanan PrenaTalks gratis digunakan.',
            'is_published' => true,
        ], $overrides);
    }

    public function test_regular_user_is_rejected(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/admin/faqs')
            ->assertStatus(403);
    }

    public function test_admin_can_create_a_faq(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->withHeaders($this->authHeader($admin))
            ->postJson('/api/v1/admin/faqs', $this->payload());

        $response->assertCreated()->assertJson([
            'data' => [
                'question' => 'Apakah PrenaTalks berbayar?',
                'is_published' => true,
                'order_index' => 10,
            ],
        ]);
    }

    public function test_new_faqs_are_appended_to_the_end_of_the_order(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);

        $first = $this->withHeaders($headers)->postJson('/api/v1/admin/faqs', $this->payload())->json('data');
        $second = $this->withHeaders($headers)->postJson('/api/v1/admin/faqs', $this->payload())->json('data');

        $this->assertSame(10, $first['order_index']);
        $this->assertSame(20, $second['order_index']);
    }

    public function test_validation_requires_question_and_answer(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->withHeaders($this->authHeader($admin))->postJson('/api/v1/admin/faqs', []);

        $response->assertStatus(422);
        $this->assertArrayHasKey('question', $response->json('errors'));
        $this->assertArrayHasKey('answer', $response->json('errors'));
    }

    public function test_admin_can_update_a_faq(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);

        $created = $this->withHeaders($headers)->postJson('/api/v1/admin/faqs', $this->payload())->json('data');

        $response = $this->withHeaders($headers)->putJson("/api/v1/admin/faqs/{$created['id']}", $this->payload([
            'question' => 'Pertanyaan diperbarui',
            'is_published' => false,
        ]));

        $response->assertOk()->assertJson([
            'data' => ['question' => 'Pertanyaan diperbarui', 'is_published' => false],
        ]);
    }

    public function test_admin_can_delete_a_faq(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);

        $created = $this->withHeaders($headers)->postJson('/api/v1/admin/faqs', $this->payload())->json('data');

        $this->withHeaders($headers)->deleteJson("/api/v1/admin/faqs/{$created['id']}")->assertOk();
        $this->assertNull(Faq::find($created['id']));
    }

    public function test_category_can_be_attached(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $category = Category::create(['name' => 'Umum', 'slug' => 'umum', 'type' => 'faq']);

        $response = $this->withHeaders($this->authHeader($admin))
            ->postJson('/api/v1/admin/faqs', $this->payload(['category_id' => $category->id]));

        $response->assertCreated()->assertJson(['data' => ['category' => ['name' => 'Umum']]]);
    }

    public function test_reorder_persists_new_order(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);

        $a = $this->withHeaders($headers)->postJson('/api/v1/admin/faqs', $this->payload(['question' => 'A']))->json('data');
        $b = $this->withHeaders($headers)->postJson('/api/v1/admin/faqs', $this->payload(['question' => 'B']))->json('data');
        $c = $this->withHeaders($headers)->postJson('/api/v1/admin/faqs', $this->payload(['question' => 'C']))->json('data');

        $response = $this->withHeaders($headers)->patchJson('/api/v1/admin/faqs/reorder', [
            'ids' => [$c['id'], $a['id'], $b['id']],
        ]);

        $response->assertOk();
        $this->assertSame('C', $response->json('data.0.question'));
        $this->assertSame('A', $response->json('data.1.question'));
        $this->assertSame('B', $response->json('data.2.question'));
        $this->assertSame(10, Faq::find($c['id'])->order_index);
        $this->assertSame(20, Faq::find($a['id'])->order_index);
        $this->assertSame(30, Faq::find($b['id'])->order_index);
    }

    public function test_reorder_rejects_unknown_ids(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->withHeaders($this->authHeader($admin))
            ->patchJson('/api/v1/admin/faqs/reorder', ['ids' => [999]]);

        $response->assertStatus(422);
    }
}
