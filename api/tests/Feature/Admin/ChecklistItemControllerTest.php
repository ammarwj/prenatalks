<?php

namespace Tests\Feature\Admin;

use App\Models\ChecklistItem;
use App\Models\User;
use App\Models\UserChecklistProgress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class ChecklistItemControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, string>
     */
    private function authHeader(User $user): array
    {
        return ['Authorization' => 'Bearer '.JWTAuth::fromUser($user)];
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'group_name' => 'Dokumen',
            'title' => 'Kartu BPJS atau asuransi kesehatan',
            'description' => 'Pastikan status kepesertaan aktif.',
            'is_active' => true,
        ], $overrides);
    }

    private function item(string $group = 'Dokumen', string $title = 'Buku KIA', int $order = 10): ChecklistItem
    {
        return ChecklistItem::create([
            'group_name' => $group,
            'title' => $title,
            'order_index' => $order,
            'is_active' => true,
        ]);
    }

    public function test_regular_user_is_rejected(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/admin/checklist-items')
            ->assertStatus(403);
    }

    public function test_admin_can_list_items_with_available_groups_in_meta(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->item();

        $response = $this->withHeaders($this->authHeader($admin))
            ->getJson('/api/v1/admin/checklist-items');

        $response->assertOk();
        $this->assertSame(ChecklistItem::GROUPS, $response->json('meta.groups'));
        $this->assertCount(1, $response->json('data'));
    }

    public function test_admin_can_create_an_item(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->withHeaders($this->authHeader($admin))
            ->postJson('/api/v1/admin/checklist-items', $this->payload());

        $response->assertCreated()->assertJson([
            'data' => [
                'group_name' => 'Dokumen',
                'title' => 'Kartu BPJS atau asuransi kesehatan',
                'is_active' => true,
                'order_index' => 10,
            ],
        ]);
    }

    public function test_group_name_outside_the_prd_list_is_rejected(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->withHeaders($this->authHeader($admin))
            ->postJson('/api/v1/admin/checklist-items', $this->payload(['group_name' => 'Kelompok Baru']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('group_name');
    }

    public function test_order_index_is_appended_per_group_not_globally(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);

        $this->withHeaders($headers)->postJson('/api/v1/admin/checklist-items', $this->payload());
        $second = $this->withHeaders($headers)->postJson('/api/v1/admin/checklist-items', $this->payload([
            'title' => 'Kartu Keluarga',
        ]));
        $otherGroup = $this->withHeaders($headers)->postJson('/api/v1/admin/checklist-items', $this->payload([
            'group_name' => 'Perlengkapan Bayi',
            'title' => 'Popok bayi',
        ]));

        $this->assertSame(20, $second->json('data.order_index'));
        // Kelompok lain punya hitungan urutannya sendiri.
        $this->assertSame(10, $otherGroup->json('data.order_index'));
    }

    public function test_moving_an_item_to_another_group_appends_it_there(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->item('Perlengkapan Bayi', 'Bedong bayi', 10);
        $moved = $this->item('Dokumen', 'Popok bayi', 40);

        $response = $this->withHeaders($this->authHeader($admin))
            ->putJson("/api/v1/admin/checklist-items/{$moved->id}", $this->payload([
                'group_name' => 'Perlengkapan Bayi',
                'title' => 'Popok bayi',
            ]));

        $response->assertOk();
        $this->assertSame('Perlengkapan Bayi', $response->json('data.group_name'));
        $this->assertSame(20, $response->json('data.order_index'));
    }

    public function test_admin_can_deactivate_an_item_without_losing_user_progress(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create();
        $item = $this->item();

        UserChecklistProgress::create([
            'user_id' => $user->id,
            'checklist_item_id' => $item->id,
            'is_checked' => true,
            'checked_at' => now(),
        ]);

        $this->withHeaders($this->authHeader($admin))
            ->putJson("/api/v1/admin/checklist-items/{$item->id}", $this->payload([
                'title' => 'Buku KIA',
                'is_active' => false,
            ]))
            ->assertOk()
            ->assertJson(['data' => ['is_active' => false]]);

        $this->assertDatabaseHas('user_checklist_progress', [
            'checklist_item_id' => $item->id,
            'is_checked' => true,
        ]);
    }

    public function test_deleting_an_item_removes_its_progress_rows(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create();
        $item = $this->item();

        UserChecklistProgress::create([
            'user_id' => $user->id,
            'checklist_item_id' => $item->id,
            'is_checked' => true,
        ]);

        $this->withHeaders($this->authHeader($admin))
            ->deleteJson("/api/v1/admin/checklist-items/{$item->id}")
            ->assertOk();

        $this->assertDatabaseMissing('checklist_items', ['id' => $item->id]);
        $this->assertDatabaseMissing('user_checklist_progress', ['checklist_item_id' => $item->id]);
    }

    public function test_reorder_persists_the_new_order_within_a_group(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $first = $this->item('Dokumen', 'Pertama', 10);
        $second = $this->item('Dokumen', 'Kedua', 20);

        $response = $this->withHeaders($this->authHeader($admin))
            ->patchJson('/api/v1/admin/checklist-items/reorder', [
                'group_name' => 'Dokumen',
                'ids' => [$second->id, $first->id],
            ]);

        $response->assertOk();
        $this->assertSame('Kedua', $response->json('data.0.title'));
        $this->assertSame(10, $response->json('data.0.order_index'));
        $this->assertSame(20, $response->json('data.1.order_index'));
    }

    public function test_reorder_rejects_ids_from_another_group(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $document = $this->item('Dokumen', 'Buku KIA', 10);
        $baby = $this->item('Perlengkapan Bayi', 'Popok bayi', 10);

        $this->withHeaders($this->authHeader($admin))
            ->patchJson('/api/v1/admin/checklist-items/reorder', [
                'group_name' => 'Dokumen',
                'ids' => [$document->id, $baby->id],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('ids');
    }

    public function test_reorder_rejects_unknown_ids(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->withHeaders($this->authHeader($admin))
            ->patchJson('/api/v1/admin/checklist-items/reorder', [
                'group_name' => 'Dokumen',
                'ids' => [999999],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('ids.0');
    }

    public function test_listing_is_sorted_by_prd_group_order_not_alphabetically(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->item('Rencana Persalinan', 'Tentukan pendamping', 10);
        $this->item('Dokumen', 'Buku KIA', 10);

        $response = $this->withHeaders($this->authHeader($admin))
            ->getJson('/api/v1/admin/checklist-items');

        $response->assertOk();
        $this->assertSame('Dokumen', $response->json('data.0.group_name'));
        $this->assertSame('Rencana Persalinan', $response->json('data.1.group_name'));
    }
}
