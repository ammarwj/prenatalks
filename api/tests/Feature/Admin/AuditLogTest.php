<?php

namespace Tests\Feature\Admin;

use App\Models\AuditLog;
use App\Models\Faq;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuditLogTest extends TestCase
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
     * Perubahan dari seeder/artisan tidak punya pelaku yang login, jadi
     * sengaja tidak dicatat — kalau tidak, log dibanjiri baris yang tidak
     * menjawab "siapa mengubah apa".
     */
    public function test_changes_without_a_logged_in_actor_are_not_recorded(): void
    {
        Faq::create(['question' => 'Tanpa pelaku', 'answer' => 'Jawaban', 'order_index' => 10]);

        $this->assertSame(0, AuditLog::count());
    }

    public function test_admin_create_is_recorded_with_a_snapshot(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->withHeaders($this->authHeader($admin))->postJson('/api/v1/admin/faqs', [
            'question' => 'Apakah PrenaTalks gratis?',
            'answer' => 'Ya, gratis.',
            'is_published' => true,
        ])->assertCreated();

        $log = AuditLog::where('model_type', 'Faq')->firstOrFail();
        $this->assertSame('created', $log->action);
        $this->assertSame($admin->id, $log->user_id);
        $this->assertSame('Apakah PrenaTalks gratis?', $log->changes['question']);
    }

    public function test_admin_update_records_before_and_after_of_changed_fields_only(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);

        $created = $this->withHeaders($headers)->postJson('/api/v1/admin/faqs', [
            'question' => 'Judul lama', 'answer' => 'Jawaban', 'is_published' => false,
        ]);
        $faqId = $created->json('data.id');

        $this->withHeaders($headers)->putJson("/api/v1/admin/faqs/{$faqId}", [
            'question' => 'Judul baru', 'answer' => 'Jawaban', 'is_published' => false,
        ])->assertOk();

        $log = AuditLog::where('action', 'updated')->where('model_type', 'Faq')->firstOrFail();
        $this->assertSame(['question'], array_keys($log->changes));
        $this->assertSame('Judul lama', $log->changes['question']['from']);
        $this->assertSame('Judul baru', $log->changes['question']['to']);
    }

    public function test_admin_delete_is_recorded(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);

        $created = $this->withHeaders($headers)->postJson('/api/v1/admin/faqs', [
            'question' => 'Akan dihapus', 'answer' => 'Jawaban', 'is_published' => false,
        ]);

        $this->withHeaders($headers)
            ->deleteJson("/api/v1/admin/faqs/{$created->json('data.id')}")
            ->assertOk();

        $this->assertSame(1, AuditLog::where('action', 'deleted')->where('model_type', 'Faq')->count());
    }

    public function test_settings_changes_are_recorded_with_readable_json_values(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Setting::putMany(['community_heading' => 'Judul lama']);

        $this->withHeaders($this->authHeader($admin))
            ->putJson('/api/v1/admin/settings', ['community_heading' => 'Judul baru'])
            ->assertOk();

        $log = AuditLog::where('model_type', 'Setting')->where('action', 'updated')->firstOrFail();
        // Kolom jsonb datang sebagai string JSON mentah; harus sudah ter-decode.
        $this->assertSame('Judul lama', $log->changes['value']['from']);
        $this->assertSame('Judul baru', $log->changes['value']['to']);
    }

    /**
     * `password_hash` tidak boleh pernah muncul di audit log, bahkan dalam
     * bentuk hash — log ini dibaca manusia dan diekspor.
     */
    public function test_sensitive_columns_are_never_recorded(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $target = User::factory()->create(['role' => 'user']);

        $this->withHeaders($this->authHeader($superAdmin))
            ->putJson("/api/v1/admin/users/{$target->id}", ['role' => 'admin'])
            ->assertOk();

        $log = AuditLog::where('model_type', 'User')->firstOrFail();
        $this->assertArrayNotHasKey('password_hash', $log->changes);
        $this->assertSame('user', $log->changes['role']['from']);
        $this->assertSame('admin', $log->changes['role']['to']);
    }

    /**
     * Login memperbarui `last_login_at`; itu tidak boleh menghasilkan baris
     * audit yang menenggelamkan perubahan role/status yang sesungguhnya.
     */
    public function test_login_timestamp_updates_are_not_audited(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'email' => 'admin@prenatalks.test',
            'password_hash' => 'RahasiaKuat1',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@prenatalks.test',
            'password' => 'RahasiaKuat1',
        ])->assertOk();

        $this->assertSame(0, AuditLog::where('model_type', 'User')->count());
        $this->assertNotNull($admin->fresh()->last_login_at);
    }

    public function test_only_super_admin_can_read_the_audit_log(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create(['role' => 'user']);

        $this->getJson('/api/v1/admin/audit-logs')->assertStatus(401);
        $this->withHeaders($this->authHeader($user))->getJson('/api/v1/admin/audit-logs')->assertStatus(403);
        $this->withHeaders($this->authHeader($admin))->getJson('/api/v1/admin/audit-logs')->assertStatus(403);

        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $this->withHeaders($this->authHeader($superAdmin))->getJson('/api/v1/admin/audit-logs')->assertOk();
    }

    public function test_audit_log_can_be_filtered_by_action_and_model(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $headers = $this->authHeader($superAdmin);

        $created = $this->withHeaders($headers)->postJson('/api/v1/admin/faqs', [
            'question' => 'Pertanyaan', 'answer' => 'Jawaban', 'is_published' => false,
        ]);
        $this->withHeaders($headers)->putJson("/api/v1/admin/faqs/{$created->json('data.id')}", [
            'question' => 'Pertanyaan diubah', 'answer' => 'Jawaban', 'is_published' => false,
        ]);

        $response = $this->withHeaders($headers)
            ->getJson('/api/v1/admin/audit-logs?action=updated&model_type=Faq');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertSame('Diubah', $response->json('data.0.action_label'));
        $this->assertSame('FAQ', $response->json('data.0.model_label'));
        $this->assertSame($superAdmin->name, $response->json('data.0.user.name'));
    }

    public function test_audit_log_rejects_unknown_filter_values(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $this->withHeaders($this->authHeader($superAdmin))
            ->getJson('/api/v1/admin/audit-logs?model_type=Pregnancy')
            ->assertStatus(422)
            ->assertJsonValidationErrors('model_type');
    }

    public function test_audit_log_is_newest_first_and_paginated(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $headers = $this->authHeader($superAdmin);

        foreach (['Pertama', 'Kedua'] as $question) {
            $this->withHeaders($headers)->postJson('/api/v1/admin/faqs', [
                'question' => $question, 'answer' => 'Jawaban', 'is_published' => false,
            ]);
        }

        $response = $this->withHeaders($headers)->getJson('/api/v1/admin/audit-logs');

        $response->assertOk();
        $this->assertSame('Kedua', $response->json('data.0.changes.question'));
        $this->assertSame(25, $response->json('meta.per_page'));
        $this->assertSame(2, $response->json('meta.total'));
    }
}
