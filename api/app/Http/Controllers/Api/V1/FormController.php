<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PublicFormResource;
use App\Models\Form;
use App\Models\User;
use App\Services\FormFieldRuleBuilder;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Throwable;

/**
 * Akses publik ke form/survei — PRD §9 F-06/F-07, §11.2.
 */
class FormController extends Controller
{
    use ApiResponse;

    public function show(Request $request, Form $form)
    {
        if ($blocked = $this->guardVisibility($form, $request)) {
            return $blocked;
        }

        return $this->success(new PublicFormResource($form->load('fields')));
    }

    /**
     * Tidak memakai FormRequest terpisah: validasi jawaban dinamis dibangun
     * dari struktur field form ini (lihat FormFieldRuleBuilder), dan HARUS
     * dijalankan setelah guard visibilitas/login/status di bawah — bukan
     * lebih dulu seperti yang terjadi kalau memakai FormRequest otomatis
     * (validasi FormRequest jalan saat dependency-injection, sebelum body
     * method ini sempat mengecek requires_login/isOpenForSubmission).
     */
    public function submit(Request $request, Form $form)
    {
        if ($blocked = $this->guardVisibility($form, $request)) {
            return $blocked;
        }

        if (! $form->isOpenForSubmission()) {
            return $this->error('Form ini belum atau sudah tidak menerima respon', null, 422);
        }

        $user = $this->resolveUser($request);
        $ipHash = hash('sha256', (string) $request->ip());

        if ($form->one_response_per_user && $this->hasAlreadyResponded($form, $user, $ipHash)) {
            return $this->error('Anda sudah pernah mengisi form ini', null, 422);
        }

        $validated = Validator::make(
            $request->all(),
            FormFieldRuleBuilder::buildForFields($form->fields)
        )->validate();

        DB::transaction(function () use ($form, $request, $user, $ipHash, $validated) {
            $submission = $form->submissions()->create([
                'user_id' => ($user && ! $form->is_anonymous) ? $user->id : null,
                'submitted_at' => now(),
                'ip_hash' => $ipHash,
                'user_agent' => substr((string) $request->userAgent(), 0, 255),
            ]);

            foreach ($form->fields as $field) {
                $key = "field_{$field->id}";

                if ($field->type === 'file') {
                    if ($request->hasFile($key)) {
                        $path = $request->file($key)->store("form-uploads/{$form->id}", 'local');
                        $submission->answers()->create(['field_id' => $field->id, 'value' => $path]);
                    }

                    continue;
                }

                if (! array_key_exists($key, $validated)) {
                    continue;
                }

                $value = $validated[$key];
                $submission->answers()->create(is_array($value)
                    ? ['field_id' => $field->id, 'value_json' => $value]
                    : ['field_id' => $field->id, 'value' => (string) $value]);
            }
        });

        return $this->success(null, 'Respon berhasil disimpan', status: 201);
    }

    /**
     * `is_public=false` diperlakukan seperti form tidak ada sama sekali —
     * mencegah pihak luar menebak-nebak keberadaan form internal lewat slug.
     * Draf juga belum boleh terlihat publik walau is_public true (baru
     * benar-benar publik setelah diterbitkan).
     */
    private function guardVisibility(Form $form, Request $request): ?JsonResponse
    {
        if (! $form->is_public || $form->status === 'draft') {
            abort(404);
        }

        if ($form->requires_login && ! $this->resolveUser($request)) {
            return $this->error('Form ini memerlukan login untuk diakses', null, 401);
        }

        return null;
    }

    private function hasAlreadyResponded(Form $form, ?User $user, string $ipHash): bool
    {
        $query = $form->submissions();

        return ($user && ! $form->is_anonymous)
            ? $query->where('user_id', $user->id)->exists()
            : $query->where('ip_hash', $ipHash)->exists();
    }

    /**
     * Rute ini tidak dijaga middleware `auth:api` (tamu boleh mengakses form
     * publik) — guard JWT tetap bisa mem-parsing token bila terlampir, jadi
     * kita coba resolve manual dan anggap tamu bila token tidak ada/invalid.
     */
    private function resolveUser(Request $request): ?User
    {
        try {
            return $request->user('api');
        } catch (Throwable) {
            return null;
        }
    }
}
