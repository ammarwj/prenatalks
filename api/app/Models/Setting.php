<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * Pengaturan situs berbentuk key-value — PRD §10 (`settings`).
 *
 * Kunci yang dikenal sistem didaftarkan di `KEYS` beserta kelompoknya, dan
 * nilai awalnya di `defaults()`. Keduanya jadi satu sumber kebenaran: seeder
 * mengisi baris awal dari sana, dan pembacaan tetap jatuh ke nilai bawaan
 * bila barisnya belum ada — jadi halaman publik tidak pernah tampil kosong
 * hanya karena seeder belum dijalankan.
 */
#[Fillable(['key', 'value', 'group_name'])]
class Setting extends Model
{
    /**
     * Kunci yang dikenal sistem → kelompoknya. Kunci di luar daftar ini
     * diabaikan saat menyimpan, supaya panel admin tidak bisa dipakai
     * menanam data sembarangan ke tabel pengaturan.
     *
     * @var array<string, string>
     */
    public const KEYS = [
        'community_heading' => 'community',
        'community_description' => 'community',
        'community_rules' => 'community',
        'community_whatsapp_url' => 'community',
        'community_telegram_url' => 'community',
    ];

    /**
     * Kelompok yang boleh dibaca tanpa login lewat `GET /settings`.
     * Kelompok baru tidak otomatis publik — harus didaftarkan di sini.
     *
     * @var list<string>
     */
    public const PUBLIC_GROUPS = ['community'];

    protected function casts(): array
    {
        return [
            'value' => 'json',
        ];
    }

    /**
     * Nilai bawaan tiap kunci. Teks komunitas ditulis dengan nada bicara
     * PRD §1.5 dan bisa disunting admin lewat `/admin/pengaturan`.
     *
     * @return array<string, mixed>
     */
    public static function defaults(): array
    {
        return [
            'community_heading' => 'Komunitas PrenaTalks',
            'community_description' => 'Yuk, bergabung dengan ruang berbagi sesama ibu hamil dan keluarga. '
                .'Di sini Anda bisa bertanya, berbagi pengalaman, dan mendapat pengingat seputar kehamilan '
                .'dari sesama anggota serta bidan pendamping. Semua informasi kesehatan yang dibagikan tetap '
                .'mengacu pada sumber berbasis bukti.',
            'community_rules' => [
                'Saling menghormati. Setiap ibu punya kondisi dan pilihan yang berbeda.',
                'Jaga privasi. Jangan membagikan data pribadi atau hasil pemeriksaan orang lain.',
                'Sertakan sumber bila membagikan informasi kesehatan.',
                'Tidak ada promosi, jual beli, atau penawaran produk kesehatan.',
                'Pertanyaan medis yang bersifat pribadi sebaiknya ditanyakan langsung ke bidan atau dokter Anda.',
            ],
            'community_whatsapp_url' => null,
            'community_telegram_url' => null,
        ];
    }

    /**
     * Nilai seluruh kunci pada satu atau beberapa kelompok, digabung dengan
     * nilai bawaan.
     *
     * @param  list<string>  $groups
     * @return array<string, mixed>
     */
    public static function valuesForGroups(array $groups): array
    {
        $keys = array_keys(array_filter(
            self::KEYS,
            fn (string $group) => in_array($group, $groups, true)
        ));

        $stored = self::whereIn('key', $keys)->pluck('value', 'key')->all();

        return array_replace(
            array_intersect_key(self::defaults(), array_flip($keys)),
            $stored
        );
    }

    /**
     * Simpan beberapa pengaturan sekaligus. Kunci tak dikenal diabaikan —
     * `group_name` selalu diambil dari `KEYS`, bukan dari input klien.
     *
     * @param  array<string, mixed>  $values
     */
    public static function putMany(array $values): void
    {
        foreach ($values as $key => $value) {
            if (! isset(self::KEYS[$key])) {
                continue;
            }

            self::updateOrCreate(
                ['key' => $key],
                ['value' => $value, 'group_name' => self::KEYS[$key]]
            );
        }
    }
}
