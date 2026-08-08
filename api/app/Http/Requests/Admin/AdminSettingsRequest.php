<?php

namespace App\Http\Requests\Admin;

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
    public function authorize(): bool
    {
        return true;
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

        foreach (['community_whatsapp_url', 'community_telegram_url'] as $key) {
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
        ];
    }
}
