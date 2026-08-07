<?php

namespace Tests\Feature;

use App\Models\Form;
use App\Models\FormAnswer;
use App\Models\FormSubmission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class FormSubmissionTest extends TestCase
{
    use RefreshDatabase;

    private function authHeader(User $user): array
    {
        return ['Authorization' => 'Bearer '.JWTAuth::fromUser($user)];
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createForm(array $overrides = []): Form
    {
        $form = Form::create(array_merge([
            'title' => 'Survei Uji',
            'slug' => 'survei-uji',
            'type' => 'survey',
            'is_public' => true,
            'requires_login' => false,
            'is_anonymous' => false,
            'one_response_per_user' => false,
            'status' => 'published',
        ], $overrides));

        $form->fields()->create([
            'label' => 'Nama', 'type' => 'text', 'is_required' => true, 'order_index' => 10,
        ]);
        $form->fields()->create([
            'label' => 'Kepuasan', 'type' => 'radio', 'is_required' => true,
            'options' => ['Puas', 'Kurang puas'], 'order_index' => 20,
        ]);
        $form->fields()->create([
            'label' => 'Topik favorit', 'type' => 'checkbox', 'is_required' => false,
            'options' => ['Kehamilan', 'Persalinan', 'Nifas'], 'order_index' => 30,
        ]);

        return $form;
    }

    private function answers(Form $form, array $overrides = []): array
    {
        $fields = $form->fields()->orderBy('order_index')->get();

        return array_merge([
            "field_{$fields[0]->id}" => 'Siti',
            "field_{$fields[1]->id}" => 'Puas',
            "field_{$fields[2]->id}" => ['Kehamilan', 'Nifas'],
        ], $overrides);
    }

    public function test_guest_can_view_a_public_form_without_login(): void
    {
        $this->createForm();

        $response = $this->getJson('/api/v1/forms/survei-uji');

        $response->assertOk()->assertJson([
            'data' => ['title' => 'Survei Uji', 'is_open' => true],
        ]);
        $this->assertCount(3, $response->json('data.fields'));
    }

    public function test_non_public_form_returns_404(): void
    {
        $this->createForm(['is_public' => false]);

        $this->getJson('/api/v1/forms/survei-uji')->assertStatus(404);
    }

    public function test_draft_form_returns_404(): void
    {
        $this->createForm(['status' => 'draft']);

        $this->getJson('/api/v1/forms/survei-uji')->assertStatus(404);
    }

    public function test_closed_form_is_visible_but_marked_not_open(): void
    {
        $this->createForm(['status' => 'closed']);

        $response = $this->getJson('/api/v1/forms/survei-uji');

        $response->assertOk()->assertJson(['data' => ['is_open' => false]]);
    }

    public function test_form_requiring_login_returns_401_for_guest(): void
    {
        $this->createForm(['requires_login' => true]);

        $this->getJson('/api/v1/forms/survei-uji')->assertStatus(401);
        $this->postJson('/api/v1/forms/survei-uji/submit', [])->assertStatus(401);
    }

    public function test_authenticated_user_can_view_form_that_requires_login(): void
    {
        $form = $this->createForm(['requires_login' => true]);
        $user = User::factory()->create();

        $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/forms/survei-uji')
            ->assertOk();
        $this->assertNotNull($form);
    }

    public function test_guest_can_submit_to_a_public_form(): void
    {
        $form = $this->createForm();

        $response = $this->postJson('/api/v1/forms/survei-uji/submit', $this->answers($form));

        $response->assertCreated();
        $this->assertSame(1, FormSubmission::count());
        $submission = FormSubmission::first();
        $this->assertNull($submission->user_id);
        $this->assertCount(3, $submission->answers);
    }

    public function test_checkbox_answer_is_stored_as_json_array(): void
    {
        $form = $this->createForm();
        $this->postJson('/api/v1/forms/survei-uji/submit', $this->answers($form))->assertCreated();

        $checkboxField = $form->fields()->where('type', 'checkbox')->first();
        $answer = FormAnswer::where('field_id', $checkboxField->id)->first();

        $this->assertSame(['Kehamilan', 'Nifas'], $answer->value_json);
        $this->assertNull($answer->value);
    }

    public function test_submission_requires_required_fields(): void
    {
        $form = $this->createForm();
        $fields = $form->fields()->orderBy('order_index')->get();

        $response = $this->postJson('/api/v1/forms/survei-uji/submit', [
            "field_{$fields[1]->id}" => 'Puas',
        ]);

        $response->assertStatus(422);
        $this->assertArrayHasKey("field_{$fields[0]->id}", $response->json('errors'));
    }

    public function test_submission_rejects_option_not_in_choices(): void
    {
        $form = $this->createForm();

        $response = $this->postJson('/api/v1/forms/survei-uji/submit', $this->answers($form, [
            'field_'.$form->fields()->where('type', 'radio')->first()->id => 'Sangat puas sekali',
        ]));

        $response->assertStatus(422);
    }

    public function test_submit_is_rejected_when_form_is_closed(): void
    {
        $form = $this->createForm(['status' => 'closed']);

        $this->postJson('/api/v1/forms/survei-uji/submit', $this->answers($form))
            ->assertStatus(422);
    }

    public function test_one_response_per_user_blocks_duplicate_for_authenticated_user(): void
    {
        $form = $this->createForm(['one_response_per_user' => true]);
        $user = User::factory()->create();
        $headers = $this->authHeader($user);

        $this->withHeaders($headers)->postJson('/api/v1/forms/survei-uji/submit', $this->answers($form))
            ->assertCreated();

        $this->withHeaders($headers)->postJson('/api/v1/forms/survei-uji/submit', $this->answers($form))
            ->assertStatus(422);
    }

    public function test_one_response_per_user_blocks_duplicate_guest_by_ip(): void
    {
        $form = $this->createForm(['one_response_per_user' => true]);

        $this->postJson('/api/v1/forms/survei-uji/submit', $this->answers($form))->assertCreated();
        $this->postJson('/api/v1/forms/survei-uji/submit', $this->answers($form))->assertStatus(422);
    }

    public function test_anonymous_form_does_not_store_user_id_even_when_logged_in(): void
    {
        $form = $this->createForm(['is_anonymous' => true]);
        $user = User::factory()->create();

        $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/forms/survei-uji/submit', $this->answers($form))
            ->assertCreated();

        $this->assertNull(FormSubmission::first()->user_id);
    }

    public function test_file_field_upload_is_stored_and_answer_records_the_path(): void
    {
        Storage::fake('local');
        $form = $this->createForm();
        $fileField = $form->fields()->create([
            'label' => 'Berkas Pendukung', 'type' => 'file', 'is_required' => false, 'order_index' => 40,
        ]);
        $file = UploadedFile::fake()->create('bukti.pdf', 500, 'application/pdf');

        $response = $this->post('/api/v1/forms/survei-uji/submit', array_merge(
            $this->answers($form),
            ["field_{$fileField->id}" => $file],
        ));

        $response->assertCreated();
        $answer = FormAnswer::where('field_id', $fileField->id)->first();
        Storage::disk('local')->assertExists($answer->value);
    }
}
