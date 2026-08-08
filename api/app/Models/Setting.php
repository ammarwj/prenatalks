<?php

namespace App\Models;

use App\Traits\Auditable;
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
    use Auditable;

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

        // Halaman Tentang seksi 1–5 (PRD §9 F-16 kriteria terima). Seksi 6
        // (profil tim) punya tabelnya sendiri, seksi 7 (CTA) statis.
        'about_name_philosophy' => 'about',
        'about_history_intro' => 'about',
        'about_milestones' => 'about',
        'about_commitment_heading' => 'about',
        'about_commitment_body' => 'about',
        'about_logo_philosophy' => 'about',
        'about_color_purple_meaning' => 'about',
        'about_color_teal_meaning' => 'about',
    ];

    /**
     * Kelompok yang boleh dibaca tanpa login lewat `GET /settings`.
     * Kelompok baru tidak otomatis publik — harus didaftarkan di sini.
     *
     * @var list<string>
     */
    public const PUBLIC_GROUPS = ['community', 'about'];

    /**
     * Kode warna merek sengaja **tidak** disimpan di `settings`: PRD §1.4
     * menyatakan ungu dan toska adalah warna resmi logo yang tidak boleh
     * diubah. Yang bisa disunting admin hanya teks maknanya.
     *
     * @var array<string, string>
     */
    public const BRAND_COLORS = [
        'purple' => '#7C3AED',
        'teal' => '#14B8A6',
    ];

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

            // Teks awal seksi 1–5 halaman Tentang, diambil dari PRD §1
            // (identitas merek) supaya halaman langsung berisi dan admin
            // tinggal menyunting, bukan mengarang dari nol.
            'about_name_philosophy' => [
                ['term' => 'Pre', 'meaning' => 'Sebelum — masa persiapan yang menentukan, jauh sebelum hari kelahiran tiba.'],
                ['term' => 'Natal', 'meaning' => 'Kelahiran, atau kehidupan baru yang sedang Anda tumbuhkan.'],
                ['term' => 'Talks', 'meaning' => 'Percakapan. PrenaTalks adalah ruang berbincang, bukan sekadar pustaka artikel.'],
            ],
            'about_history_intro' => 'PrenaTalks berawal dari kepedulian terhadap keterbatasan akses perempuan dan ibu '
                .'pada informasi kesehatan yang akurat, di tengah derasnya arus informasi yang belum tentu benar.',
            'about_milestones' => [
                ['year' => '2020', 'title' => 'PrenaTalks lahir', 'description' => 'Didirikan pada 28 Agustus 2020 sebagai ruang belajar dan berbagi seputar kehamilan.'],
                ['year' => '2022', 'title' => 'Fokus pada edukasi berbasis bukti', 'description' => 'Setiap materi mulai wajib mencantumkan sumber rujukan dan tanggal tinjauan.'],
                ['year' => '2026', 'title' => 'Platform digital PrenaTalks', 'description' => 'Cek risiko kehamilan, kalkulator, dan checklist persiapan hadir dalam satu tempat.'],
            ],
            'about_commitment_heading' => "Empowerment Women's Health",
            'about_commitment_body' => 'Memberdayakan perempuan melalui edukasi kesehatan berbasis bukti, demi keluarga '
                .'yang lebih sehat dan berkualitas. Kami percaya setiap perempuan berhak punya kesempatan yang sama '
                .'untuk memahami, menjaga, dan mengambil keputusan terbaik bagi kesehatan dirinya, anak, dan keluarganya. '
                .'Karena itu setiap artikel kesehatan di sini mencantumkan sumber rujukan dan tanggal tinjauan terakhir.',
            'about_logo_philosophy' => 'Logo PrenaTalks menampilkan siluet ibu, ayah, dan anak yang menyatu dalam satu '
                .'lingkaran. Ibu sebagai pusat pengasuhan, ayah sebagai pendamping dan pelindung, anak sebagai harapan '
                .'masa depan. Lingkarannya merepresentasikan pendekatan family-centered care dan keberlanjutan setiap '
                .'tahap kehidupan — dari persiapan, kehamilan, persalinan, hingga pengasuhan.',
            'about_color_purple_meaning' => 'Kepedulian, kebijaksanaan, empati, dan profesionalisme. Ungu dipakai pada '
                .'penanda kredibilitas: badge sumber ilmiah, ikon keamanan, dan profil tenaga kesehatan.',
            'about_color_teal_meaning' => 'Kehidupan, pertumbuhan, keseimbangan, dan keharmonisan. Toska menandai '
                .'kondisi sehat, aman, dan hal-hal yang sudah Anda selesaikan.',
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
