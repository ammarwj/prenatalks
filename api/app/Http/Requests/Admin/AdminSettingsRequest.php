<?php

namespace App\Http\Requests\Admin;

use App\Models\Setting;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Payload `PUT /admin/settings` — peta datar `kunci => nilai`.
 *
 * Aturan ditulis eksplisit per kunci (bukan validasi generik atas JSON apa
 * pun) karena panelnya memang form berlabel, bukan editor key-value mentah:
 * admin yang bukan orang teknis harus mendapat pesan galat yang menyebut
 * "Tautan grup WhatsApp", bukan "settings.3.value tidak valid".
 */
class AdminSettingsRequest extends FormRequest
{
    /**
     * Rutenya terbuka untuk `admin` maupun `super_admin`, tapi sebagian
     * kelompok pengaturan bukan urusan admin konten: kontak resmi situs,
     * akun sosial media, dan angka yang dipajang di halaman depan.
     *
     * Penolakannya harus di sini, bukan di sidebar. Menyembunyikan formnya
     * hanya menyembunyikan tombol — siapa pun yang punya token `admin` tetap
     * bisa memanggil `PUT /admin/settings` langsung.
     */
    public function authorize(): bool
    {
        $restricted = array_keys(array_filter(
            Setting::KEYS,
            fn (string $group) => in_array($group, Setting::SUPER_ADMIN_GROUPS, true)
        ));

        if (! $this->hasAny($restricted)) {
            return true;
        }

        return (bool) $this->user('api')?->hasRole('super_admin');
    }

    /**
     * Admin lazim menempel tautan tanpa skema (`chat.whatsapp.com/...`).
     * Menolaknya sebagai "bukan URL" tidak membantu — lebih baik dilengkapi
     * di sini, sekaligus mengubah string kosong menjadi null (tombolnya
     * disembunyikan bila tautan belum diisi).
     */
    protected function prepareForValidation(): void
    {
        $normalized = [];

        $urlKeys = [
            'community_whatsapp_url',
            'community_telegram_url',
            'social_instagram_url',
            'social_facebook_url',
            'social_youtube_url',
            'social_tiktok_url',
        ];

        foreach ($urlKeys as $key) {
            if (! $this->has($key)) {
                continue;
            }

            $value = is_string($this->input($key)) ? trim($this->input($key)) : $this->input($key);

            if ($value === '' || $value === null) {
                $normalized[$key] = null;

                continue;
            }

            $normalized[$key] = is_string($value) && ! preg_match('#^https?://#i', $value)
                ? 'https://'.$value
                : $value;
        }

        $this->merge($normalized);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'community_heading' => ['sometimes', 'required', 'string', 'max:150'],
            'community_description' => ['sometimes', 'required', 'string', 'max:2000'],
            'community_rules' => ['sometimes', 'array', 'max:12'],
            'community_rules.*' => ['required', 'string', 'max:250'],
            'community_whatsapp_url' => ['sometimes', 'nullable', 'url', 'max:500'],
            'community_telegram_url' => ['sometimes', 'nullable', 'url', 'max:500'],

            // Halaman Tentang seksi 1–5 (PRD §9 F-16). Jumlah kartu filosofi
            // nama dikunci 3 karena memang pemecahan "pre · natal · talks".
            'about_name_philosophy' => ['sometimes', 'array', 'size:3'],
            'about_name_philosophy.*.term' => ['required', 'string', 'max:40'],
            'about_name_philosophy.*.meaning' => ['required', 'string', 'max:300'],

            'about_history_intro' => ['sometimes', 'required', 'string', 'max:1000'],
            'about_milestones' => ['sometimes', 'array', 'max:12'],
            'about_milestones.*.year' => ['required', 'string', 'max:20'],
            'about_milestones.*.title' => ['required', 'string', 'max:120'],
            'about_milestones.*.description' => ['nullable', 'string', 'max:400'],

            'about_commitment_heading' => ['sometimes', 'required', 'string', 'max:120'],
            'about_commitment_body' => ['sometimes', 'required', 'string', 'max:2000'],
            'about_logo_philosophy' => ['sometimes', 'required', 'string', 'max:2000'],
            'about_color_purple_meaning' => ['sometimes', 'required', 'string', 'max:600'],
            'about_color_teal_meaning' => ['sometimes', 'required', 'string', 'max:600'],

            // Kontak footer (PRD §9 F-01). Semuanya boleh dikosongkan —
            // barisnya ikut disembunyikan di footer bila kosong, lebih baik
            // daripada memajang placeholder yang tidak bisa dihubungi.
            'contact_phone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'contact_email' => ['sometimes', 'nullable', 'email', 'max:150'],
            'contact_address' => ['sometimes', 'nullable', 'string', 'max:200'],

            'social_instagram_url' => ['sometimes', 'nullable', 'url', 'max:500'],
            'social_facebook_url' => ['sometimes', 'nullable', 'url', 'max:500'],
            'social_youtube_url' => ['sometimes', 'nullable', 'url', 'max:500'],
            'social_tiktok_url' => ['sometimes', 'nullable', 'url', 'max:500'],

            // Angka statistik tidak ada di sini — dihitung dari database.
            'stats_enabled' => ['sometimes', 'boolean'],
            'stats_label_mothers' => ['sometimes', 'required', 'string', 'max:60'],
            'stats_label_contents' => ['sometimes', 'required', 'string', 'max:60'],
            'stats_label_assessments' => ['sometimes', 'required', 'string', 'max:60'],
            'stats_label_health_workers' => ['sometimes', 'required', 'string', 'max:60'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'community_heading.required' => 'Judul komunitas wajib diisi',
            'community_description.required' => 'Penjelasan komunitas wajib diisi',
            'community_rules.max' => 'Aturan komunitas maksimal 12 butir',
            'community_rules.*.required' => 'Butir aturan tidak boleh kosong',
            'community_rules.*.max' => 'Setiap butir aturan maksimal 250 karakter',
            'community_whatsapp_url.url' => 'Tautan grup WhatsApp tidak valid',
            'community_telegram_url.url' => 'Tautan grup Telegram tidak valid',
            'about_name_philosophy.size' => 'Filosofi nama harus tepat 3 kartu (pre · natal · talks)',
            'about_milestones.max' => 'Tonggak sejarah maksimal 12 butir',
            'about_milestones.*.year.required' => 'Tahun tonggak wajib diisi',
            'about_milestones.*.title.required' => 'Judul tonggak wajib diisi',
            'about_commitment_heading.required' => 'Judul komitmen wajib diisi',
            'about_commitment_body.required' => 'Penjelasan komitmen wajib diisi',
            'about_logo_philosophy.required' => 'Filosofi logo wajib diisi',
            'contact_email.email' => 'Alamat email tidak valid',
            'contact_phone.max' => 'Nomor telepon maksimal 40 karakter',
            'contact_address.max' => 'Alamat maksimal 200 karakter',
            'social_instagram_url.url' => 'Tautan Instagram tidak valid',
            'social_facebook_url.url' => 'Tautan Facebook tidak valid',
            'social_youtube_url.url' => 'Tautan YouTube tidak valid',
            'social_tiktok_url.url' => 'Tautan TikTok tidak valid',
            'stats_label_mothers.required' => 'Label kartu ibu hamil wajib diisi',
            'stats_label_contents.required' => 'Label kartu artikel & video wajib diisi',
            'stats_label_assessments.required' => 'Label kartu cek risiko wajib diisi',
            'stats_label_health_workers.required' => 'Label kartu tenaga kesehatan wajib diisi',
        ];
    }
}
