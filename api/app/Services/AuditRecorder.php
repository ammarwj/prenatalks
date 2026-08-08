<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Throwable;

/**
 * Menulis satu baris `audit_logs` — PRD §9 F-14.
 *
 * Dipanggil dari trait `Auditable`, bukan dari controller, supaya perubahan
 * tercatat lewat jalur mana pun dan tidak bisa terlewat karena lupa dipanggil
 * saat menambah endpoint baru.
 */
class AuditRecorder
{
    /**
     * Kolom yang tidak pernah boleh masuk ke `changes` untuk model apa pun.
     *
     * @var list<string>
     */
    private const GLOBAL_REDACTED = ['password_hash', 'remember_token'];

    /**
     * @param  array<string, mixed>|null  $changes
     */
    public static function record(string $action, Model $model, ?array $changes): void
    {
        $actor = self::actor();

        // Tanpa pelaku yang login, perubahan berasal dari seeder, migrasi,
        // atau perintah artisan — mencatatnya hanya membanjiri log dengan
        // baris yang tidak menjawab pertanyaan "siapa mengubah apa".
        if (! $actor) {
            return;
        }

        AuditLog::create([
            'user_id' => $actor->id,
            'action' => $action,
            'model_type' => class_basename($model),
            'model_id' => $model->getKey(),
            'changes' => $changes,
            'ip' => request()->ip(),
        ]);
    }

    /**
     * Atribut yang berubah, dalam bentuk `kolom => [sebelum, sesudah]`.
     * Mengembalikan null bila tidak ada perubahan yang layak dicatat.
     *
     * @param  list<string>  $ignored
     * @return array<string, array{from: mixed, to: mixed}>|null
     */
    public static function diff(Model $model, array $ignored = []): ?array
    {
        $skip = array_merge(self::GLOBAL_REDACTED, $ignored, ['updated_at', 'created_at']);
        $changes = [];

        foreach ($model->getChanges() as $key => $newValue) {
            if (in_array($key, $skip, true)) {
                continue;
            }

            $changes[$key] = [
                'from' => self::normalize($model->getOriginal($key)),
                'to' => self::normalize($newValue),
            ];
        }

        return $changes === [] ? null : $changes;
    }

    /**
     * Ringkasan atribut saat dibuat/dihapus — kolom sensitif dibuang.
     *
     * @param  list<string>  $ignored
     * @return array<string, mixed>
     */
    public static function snapshot(Model $model, array $ignored = []): array
    {
        $skip = array_merge(self::GLOBAL_REDACTED, $ignored);

        return collect($model->getAttributes())
            ->except($skip)
            ->map(fn ($value) => self::normalize($value))
            ->all();
    }

    /**
     * Nilai kolom `jsonb` datang sebagai string JSON mentah; di-decode supaya
     * `changes` terbaca sebagai struktur, bukan string yang di-escape berlapis.
     *
     * Hanya string yang diawali `{`, `[`, atau `"` yang dicoba — pembatas ini
     * mencegah teks biasa ikut ter-decode dan berubah tipe (judul "123" tidak
     * boleh berubah jadi angka, "null" tidak boleh berubah jadi null).
     */
    private static function normalize(mixed $value): mixed
    {
        if (! is_string($value) || ! in_array($value[0] ?? '', ['{', '[', '"'], true)) {
            return $value;
        }

        $decoded = json_decode($value, true);

        return json_last_error() === JSON_ERROR_NONE ? $decoded : $value;
    }

    private static function actor(): ?User
    {
        try {
            return auth('api')->user();
        } catch (Throwable) {
            // Token tidak ada/kedaluwarsa — perlakukan seperti tanpa pelaku.
            return null;
        }
    }
}
