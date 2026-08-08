<?php

namespace Tests\Feature;

use App\Models\ChecklistItem;
use App\Models\User;
use App\Models\UserChecklistProgress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class ChecklistTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, string>
     */
    private function authHeader(User $user): array
    {
        // Guard `api` menyimpan user hasil resolusi, dan singleton `tymon.jwt`
        // (yang dipakai guard itu) menyimpan token yang sudah diurai. Dalam
        // satu test yang memakai dua pengguna, kedua cache itu membuat request
        // berikutnya tetap dikenali sebagai pengguna sebelumnya. Bukan masalah
        // di produksi — di sana satu request HTTP berarti satu boot aplikasi.
        $this->app['auth']->forgetGuards();
        $this->app['tymon.jwt']->unsetToken();

        return ['Authorization' => 'Bearer '.JWTAuth::fromUser($user)];
    }

    private function item(string $group = 'Dokumen', string $title = 'KTP ibu dan suami', int $order = 10, bool $active = true): ChecklistItem
    {
        return ChecklistItem::create([
            'group_name' => $group,
            'title' => $title,
            'order_index' => $order,
            'is_active' => $active,
        ]);
    }

    public function test_guest_cannot_access_checklist(): void
    {
        $this->getJson('/api/v1/checklist')->assertStatus(401);
    }

    public function test_all_five_groups_are_returned_even_when_empty(): void
    {
        $user = User::factory()->create();

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/checklist');

        $response->assertOk();
        $groupNames = array_column($response->json('data.groups'), 'name');

        $this->assertSame([...ChecklistItem::GROUPS, ChecklistItem::CUSTOM_GROUP], $groupNames);
    }

    public function test_items_are_grouped_and_unchecked_by_default(): void
    {
        $user = User::factory()->create();
        $this->item('Dokumen', 'Buku KIA', 20);
        $this->item('Perlengkapan Bayi', 'Popok bayi', 10);

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/checklist');

        $response->assertOk();
        $this->assertSame('Buku KIA', $response->json('data.groups.0.items.0.title'));
        $this->assertSame('template', $response->json('data.groups.0.items.0.type'));
        $this->assertFalse($response->json('data.groups.0.items.0.is_checked'));
        $this->assertSame('Popok bayi', $response->json('data.groups.2.items.0.title'));
        $this->assertSame(0, $response->json('data.summary.progress_percent'));
    }

    public function test_inactive_items_are_hidden_from_users(): void
    {
        $user = User::factory()->create();
        $this->item(active: false);

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/checklist');

        $response->assertOk();
        $this->assertSame(0, $response->json('data.summary.total'));
    }

    public function test_checking_an_item_persists_progress_and_updates_percentages(): void
    {
        $user = User::factory()->create();
        $item = $this->item();
        $this->item('Dokumen', 'Kartu Keluarga', 20);

        $response = $this->withHeaders($this->authHeader($user))
            ->patchJson("/api/v1/checklist/{$item->id}", ['is_checked' => true]);

        $response->assertOk();
        $this->assertTrue($response->json('data.groups.0.items.0.is_checked'));
        $this->assertSame(50, $response->json('data.groups.0.progress_percent'));
        $this->assertSame(50, $response->json('data.summary.progress_percent'));

        $this->assertDatabaseHas('user_checklist_progress', [
            'user_id' => $user->id,
            'checklist_item_id' => $item->id,
            'is_checked' => true,
        ]);
        $this->assertNotNull(UserChecklistProgress::first()->checked_at);
    }

    public function test_unchecking_an_item_clears_checked_at(): void
    {
        $user = User::factory()->create();
        $item = $this->item();

        $headers = $this->authHeader($user);
        $this->withHeaders($headers)->patchJson("/api/v1/checklist/{$item->id}", ['is_checked' => true]);
        $response = $this->withHeaders($headers)->patchJson("/api/v1/checklist/{$item->id}", ['is_checked' => false]);

        $response->assertOk();
        $this->assertFalse($response->json('data.groups.0.items.0.is_checked'));
        $this->assertNull(UserChecklistProgress::first()->checked_at);
        // Tetap satu baris — batasan UNIQUE(user_id, checklist_item_id) terjaga.
        $this->assertSame(1, UserChecklistProgress::count());
    }

    public function test_checking_an_inactive_item_is_rejected(): void
    {
        $user = User::factory()->create();
        $item = $this->item(active: false);

        $this->withHeaders($this->authHeader($user))
            ->patchJson("/api/v1/checklist/{$item->id}", ['is_checked' => true])
            ->assertStatus(404);
    }

    /**
     * Invarian utama F-11 (PRD §9, BUSINESS_FLOWS §8): template berubah,
     * progres pengguna tidak ikut ter-reset.
     */
    public function test_new_admin_item_appears_without_resetting_existing_progress(): void
    {
        $user = User::factory()->create();
        $existing = $this->item();

        $headers = $this->authHeader($user);
        $this->withHeaders($headers)->patchJson("/api/v1/checklist/{$existing->id}", ['is_checked' => true]);

        // Admin menambah item baru setelah pengguna sudah mencentang item lama.
        $this->item('Dokumen', 'Kartu BPJS', 20);

        $response = $this->withHeaders($headers)->getJson('/api/v1/checklist');

        $response->assertOk();
        $items = $response->json('data.groups.0.items');
        $this->assertCount(2, $items);
        $this->assertTrue($items[0]['is_checked'], 'Progres lama seharusnya tetap tercentang');
        $this->assertFalse($items[1]['is_checked'], 'Item baru seharusnya belum tercentang');
        $this->assertSame(50, $response->json('data.summary.progress_percent'));
    }

    public function test_progress_is_scoped_per_user(): void
    {
        $item = $this->item();
        $ana = User::factory()->create();
        $budi = User::factory()->create();

        $this->withHeaders($this->authHeader($ana))
            ->patchJson("/api/v1/checklist/{$item->id}", ['is_checked' => true]);

        $response = $this->withHeaders($this->authHeader($budi))->getJson('/api/v1/checklist');

        $response->assertOk();
        $this->assertFalse($response->json('data.groups.0.items.0.is_checked'));
    }

    public function test_user_can_add_a_custom_item(): void
    {
        $user = User::factory()->create();

        $response = $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/checklist/custom', ['title' => 'Siapkan bantal menyusui']);

        $response->assertCreated();
        $customGroup = $response->json('data.groups.5');
        $this->assertSame(ChecklistItem::CUSTOM_GROUP, $customGroup['name']);
        $this->assertTrue($customGroup['is_custom']);
        $this->assertSame('Siapkan bantal menyusui', $customGroup['items'][0]['title']);
        $this->assertSame('custom', $customGroup['items'][0]['type']);
    }

    public function test_custom_item_requires_a_title(): void
    {
        $user = User::factory()->create();

        $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/checklist/custom', ['title' => ''])
            ->assertStatus(422)
            ->assertJsonValidationErrors('title');
    }

    public function test_custom_items_count_toward_the_total_progress(): void
    {
        $user = User::factory()->create();
        $this->item();
        $headers = $this->authHeader($user);

        $created = $this->withHeaders($headers)
            ->postJson('/api/v1/checklist/custom', ['title' => 'Item pribadi']);
        $customId = $created->json('data.groups.5.items.0.id');

        $response = $this->withHeaders($headers)
            ->patchJson("/api/v1/checklist/custom/{$customId}", ['is_checked' => true]);

        $response->assertOk();
        $this->assertSame(2, $response->json('data.summary.total'));
        $this->assertSame(50, $response->json('data.summary.progress_percent'));
        $this->assertSame(100, $response->json('data.groups.5.progress_percent'));
    }

    public function test_user_can_delete_their_custom_item(): void
    {
        $user = User::factory()->create();
        $headers = $this->authHeader($user);

        $created = $this->withHeaders($headers)
            ->postJson('/api/v1/checklist/custom', ['title' => 'Item pribadi']);
        $customId = $created->json('data.groups.5.items.0.id');

        $response = $this->withHeaders($headers)->deleteJson("/api/v1/checklist/custom/{$customId}");

        $response->assertOk();
        $this->assertSame(0, $response->json('data.summary.total'));
        $this->assertDatabaseMissing('user_checklist_progress', ['id' => $customId]);
    }

    public function test_custom_item_of_another_user_is_not_reachable(): void
    {
        $ana = User::factory()->create();
        $budi = User::factory()->create();

        $created = $this->withHeaders($this->authHeader($ana))
            ->postJson('/api/v1/checklist/custom', ['title' => 'Milik Ana']);
        $customId = $created->json('data.groups.5.items.0.id');

        $budiHeaders = $this->authHeader($budi);
        $this->withHeaders($budiHeaders)
            ->patchJson("/api/v1/checklist/custom/{$customId}", ['is_checked' => true])
            ->assertStatus(404);
        $this->withHeaders($budiHeaders)
            ->deleteJson("/api/v1/checklist/custom/{$customId}")
            ->assertStatus(404);
    }

    /**
     * Baris progres item template tidak boleh bisa dialamatkan lewat rute
     * `/checklist/custom/{id}` — jalur itu khusus item pribadi.
     */
    public function test_template_progress_row_cannot_be_deleted_as_a_custom_item(): void
    {
        $user = User::factory()->create();
        $item = $this->item();
        $headers = $this->authHeader($user);

        $this->withHeaders($headers)->patchJson("/api/v1/checklist/{$item->id}", ['is_checked' => true]);
        $progressId = UserChecklistProgress::first()->id;

        $this->withHeaders($headers)
            ->deleteJson("/api/v1/checklist/custom/{$progressId}")
            ->assertStatus(404);
    }
}
