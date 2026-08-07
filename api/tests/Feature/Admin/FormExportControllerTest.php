<?php

namespace Tests\Feature\Admin;

use App\Jobs\ExportSubmissionsJob;
use App\Models\Form;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class FormExportControllerTest extends TestCase
{
    use RefreshDatabase;

    private function authHeader(User $user): array
    {
        return ['Authorization' => 'Bearer '.JWTAuth::fromUser($user)];
    }

    private function createFormWithSubmissions(int $count = 2, array $formOverrides = []): Form
    {
        $form = Form::create(array_merge([
            'title' => 'Survei Ekspor',
            'slug' => 'survei-ekspor',
            'type' => 'survey',
            'is_public' => true,
            'requires_login' => false,
            'is_anonymous' => false,
            'status' => 'published',
        ], $formOverrides));

        $field = $form->fields()->create([
            'label' => 'Nama', 'type' => 'text', 'is_required' => true, 'order_index' => 10,
        ]);

        for ($i = 0; $i < $count; $i++) {
            $user = User::factory()->create();
            $submission = $form->submissions()->create([
                'user_id' => $form->is_anonymous ? null : $user->id,
                'submitted_at' => now(),
            ]);
            $submission->answers()->create(['field_id' => $field->id, 'value' => "Jawaban {$i}"]);
        }

        return $form;
    }

    public function test_non_admin_cannot_trigger_export(): void
    {
        $form = $this->createFormWithSubmissions();
        $user = User::factory()->create(['role' => 'user']);

        $this->withHeaders($this->authHeader($user))
            ->postJson("/api/v1/admin/forms/{$form->id}/export?format=csv")
            ->assertStatus(403);
    }

    public function test_invalid_format_is_rejected(): void
    {
        Storage::fake('local');
        $form = $this->createFormWithSubmissions();
        $admin = User::factory()->create(['role' => 'admin']);

        $this->withHeaders($this->authHeader($admin))
            ->postJson("/api/v1/admin/forms/{$form->id}/export?format=json")
            ->assertStatus(422);
    }

    public function test_admin_can_export_csv_synchronously_and_download_it(): void
    {
        Storage::fake('local');
        $form = $this->createFormWithSubmissions(2);
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);

        $response = $this->withHeaders($headers)->postJson("/api/v1/admin/forms/{$form->id}/export?format=csv");

        $response->assertStatus(202)->assertJson(['data' => ['status' => 'completed', 'format' => 'csv']]);
        $this->assertNotNull($response->json('data.download_url'));

        $download = $this->withHeaders($headers)
            ->get("/api/v1/admin/forms/{$form->id}/export/{$response->json('data.id')}/download");

        $download->assertOk();
        $content = $download->streamedContent();
        $this->assertStringStartsWith("\xEF\xBB\xBF", $content);
        $this->assertStringContainsString('Responden', $content);
        $this->assertStringContainsString('Nama', $content);
    }

    public function test_admin_can_export_xlsx_synchronously_and_download_it(): void
    {
        Storage::fake('local');
        $form = $this->createFormWithSubmissions(2);
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);

        $response = $this->withHeaders($headers)->postJson("/api/v1/admin/forms/{$form->id}/export?format=xlsx");
        $response->assertStatus(202)->assertJson(['data' => ['status' => 'completed', 'format' => 'xlsx']]);

        $download = $this->withHeaders($headers)
            ->get("/api/v1/admin/forms/{$form->id}/export/{$response->json('data.id')}/download");

        $download->assertOk();
        // Berkas XLSX adalah arsip ZIP — dua byte pertama "PK" menandakan format valid.
        $this->assertStringStartsWith('PK', $download->streamedContent());
    }

    public function test_export_omits_respondent_column_for_anonymous_form(): void
    {
        Storage::fake('local');
        $form = $this->createFormWithSubmissions(1, ['is_anonymous' => true]);
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);

        $response = $this->withHeaders($headers)->postJson("/api/v1/admin/forms/{$form->id}/export?format=csv");
        $download = $this->withHeaders($headers)
            ->get("/api/v1/admin/forms/{$form->id}/export/{$response->json('data.id')}/download");

        $this->assertStringNotContainsString('Responden', $download->streamedContent());
    }

    public function test_export_over_threshold_dispatches_a_queued_job_instead_of_running_sync(): void
    {
        Bus::fake();
        $form = $this->createFormWithSubmissions(1);

        $rows = [];
        for ($i = 0; $i < 1001; $i++) {
            $rows[] = ['form_id' => $form->id, 'submitted_at' => now()];
        }
        DB::table('form_submissions')->insert($rows);

        $admin = User::factory()->create(['role' => 'admin']);
        $response = $this->withHeaders($this->authHeader($admin))
            ->postJson("/api/v1/admin/forms/{$form->id}/export?format=csv");

        $response->assertStatus(202)->assertJson(['data' => ['status' => 'processing']]);
        $this->assertNull($response->json('data.download_url'));
        Bus::assertDispatched(ExportSubmissionsJob::class);
    }

    public function test_download_returns_410_when_export_has_expired(): void
    {
        Storage::fake('local');
        $form = $this->createFormWithSubmissions(1);
        Storage::disk('local')->put('exports/expired.csv', 'a,b,c');
        $export = $form->exports()->create([
            'format' => 'csv',
            'status' => 'completed',
            'file_path' => 'exports/expired.csv',
            'expires_at' => now()->subHour(),
        ]);
        $admin = User::factory()->create(['role' => 'admin']);

        $this->withHeaders($this->authHeader($admin))
            ->get("/api/v1/admin/forms/{$form->id}/export/{$export->id}/download")
            ->assertStatus(410);
    }

    public function test_export_is_throttled_to_three_per_hour(): void
    {
        Storage::fake('local');
        $form = $this->createFormWithSubmissions(1);
        $admin = User::factory()->create(['role' => 'admin']);
        $headers = $this->authHeader($admin);

        for ($i = 0; $i < 3; $i++) {
            $this->withHeaders($headers)
                ->postJson("/api/v1/admin/forms/{$form->id}/export?format=csv")
                ->assertStatus(202);
        }

        $this->withHeaders($headers)
            ->postJson("/api/v1/admin/forms/{$form->id}/export?format=csv")
            ->assertStatus(429);
    }
}
