<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminFormRequest;
use App\Http\Resources\Admin\AdminFormResource;
use App\Http\Resources\Admin\AdminFormSubmissionResource;
use App\Models\Form;
use App\Models\FormAnswer;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Form & Survey Builder — admin/super_admin (PRD §9 F-06, §5 RBAC).
 */
class FormController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $forms = Form::orderByDesc('created_at')->get();

        return $this->success(AdminFormResource::collection($forms));
    }

    public function store(AdminFormRequest $request)
    {
        $data = $request->validated();

        $form = DB::transaction(function () use ($data, $request) {
            $form = Form::create([
                'title' => $data['title'],
                'slug' => $this->uniqueSlug($data['slug'] ?? $data['title']),
                'description' => $data['description'] ?? null,
                'type' => $data['type'] ?? 'form',
                'is_public' => $data['is_public'] ?? false,
                'requires_login' => $data['requires_login'] ?? true,
                'is_anonymous' => $data['is_anonymous'] ?? false,
                'one_response_per_user' => $data['one_response_per_user'] ?? false,
                'status' => $data['status'],
                'opens_at' => $data['opens_at'] ?? null,
                'closes_at' => $data['closes_at'] ?? null,
                'created_by' => $request->user('api')->id,
            ]);

            $this->syncFields($form, $data['fields']);

            return $form;
        });

        return $this->success(
            new AdminFormResource($form->load('fields')),
            'Form dibuat',
            status: 201
        );
    }

    public function show(Form $form)
    {
        $form->load('fields');

        return $this->success(new AdminFormResource($form));
    }

    public function update(AdminFormRequest $request, Form $form)
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $form) {
            $slug = isset($data['slug']) ? $this->uniqueSlug($data['slug'], $form->id) : $form->slug;

            $form->update([
                'title' => $data['title'],
                'slug' => $slug,
                'description' => $data['description'] ?? null,
                'type' => $data['type'] ?? $form->type,
                'is_public' => $data['is_public'] ?? false,
                'requires_login' => $data['requires_login'] ?? true,
                'is_anonymous' => $data['is_anonymous'] ?? false,
                'one_response_per_user' => $data['one_response_per_user'] ?? false,
                'status' => $data['status'],
                'opens_at' => $data['opens_at'] ?? null,
                'closes_at' => $data['closes_at'] ?? null,
            ]);

            $form->fields()->delete();
            $this->syncFields($form, $data['fields']);
        });

        return $this->success(
            new AdminFormResource($form->load('fields')),
            'Form diperbarui'
        );
    }

    public function destroy(Form $form)
    {
        if ($form->submissions()->exists()) {
            return $this->error(
                'Form ini sudah punya respon tersimpan dan tidak bisa dihapus',
                null,
                409
            );
        }

        $form->delete();

        return $this->success(null, 'Form dihapus');
    }

    /**
     * Daftar respon (berpaginasi) + ringkasan (jumlah responden, distribusi
     * jawaban per field pilihan) — PRD §9 F-07.
     */
    public function submissions(Request $request, Form $form)
    {
        $submissions = $form->submissions()
            ->with(['user:id,name', 'answers.field'])
            ->orderByDesc('submitted_at')
            ->paginate((int) $request->integer('per_page', 20));

        return $this->success(
            AdminFormSubmissionResource::collection($submissions),
            meta: [
                'current_page' => $submissions->currentPage(),
                'per_page' => $submissions->perPage(),
                'total' => $submissions->total(),
                'summary' => $this->buildSummary($form),
            ]
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function buildSummary(Form $form): array
    {
        $distribution = [];

        foreach ($form->fields as $field) {
            if (! in_array($field->type, ['radio', 'checkbox', 'select', 'scale'], true)) {
                continue;
            }

            $counts = [];
            FormAnswer::where('field_id', $field->id)->get(['value', 'value_json'])
                ->each(function (FormAnswer $answer) use (&$counts) {
                    foreach ($answer->value_json ?? [$answer->value] as $value) {
                        if ($value === null || $value === '') {
                            continue;
                        }
                        $value = (string) $value;
                        $counts[$value] = ($counts[$value] ?? 0) + 1;
                    }
                });

            $distribution[] = [
                'field_id' => $field->id,
                'label' => $field->label,
                'counts' => $counts,
            ];
        }

        return [
            'respondent_count' => $form->submissions()->count(),
            'distribution' => $distribution,
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $fields
     */
    private function syncFields(Form $form, array $fields): void
    {
        $order = 0;
        foreach ($fields as $fieldData) {
            $order += 10;
            $form->fields()->create([
                'label' => $fieldData['label'],
                'description' => $fieldData['description'] ?? null,
                'type' => $fieldData['type'],
                'placeholder' => $fieldData['placeholder'] ?? null,
                'options' => $fieldData['options'] ?? null,
                'validation' => $fieldData['validation'] ?? null,
                'is_required' => $fieldData['is_required'] ?? false,
                'order_index' => $order,
            ]);
        }
    }

    private function uniqueSlug(string $base, ?int $ignoreId = null): string
    {
        $slug = Str::slug($base) ?: 'form';
        $original = $slug;
        $suffix = 2;

        while (
            Form::where('slug', $slug)
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = "{$original}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
