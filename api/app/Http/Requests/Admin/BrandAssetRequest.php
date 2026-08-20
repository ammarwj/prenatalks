<?php

namespace App\Http\Requests\Admin;

use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;

/**
 * Payload `POST /admin/brand/{asset}` — satu berkas gambar.
 *
 * Aturannya berbeda per aset dan dipilih dari segmen rute, bukan dari input
 * klien. Batas ukuran dan dimensinya ditulis dengan angka yang sama seperti
 * yang tertera di panel, supaya admin tidak menemukan penolakan yang tidak
 * pernah disebutkan di layar.
 *
 * **SVG tidak diterima.** Dua alasan: GD tidak bisa membaca vektor, jadi
 * Intervention tidak punya apa pun untuk diolah; dan menyimpannya mentah lalu
 * menyajikannya dari domain sendiri membuka jalan XSS karena SVG boleh memuat
 * `<script>`.
 */
class BrandAssetRequest extends FormRequest
{
    /**
     * Batas per aset: [maks KB, min sisi px].
     */
    private const LIMITS = [
        'logo' => [2048, 128],
        'favicon' => [1024, 128],
        'hero' => [5120, 800],
    ];

    /** Toleransi rasio favicon — 1%, supaya crop meleset sepiksel tidak ditolak. */
    private const SQUARE_TOLERANCE = 0.01;

    public function authorize(): bool
    {
        return true;
    }

    public function asset(): string
    {
        return (string) $this->route('asset');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        [$maxKilobytes, $minSide] = self::LIMITS[$this->asset()] ?? self::LIMITS['logo'];

        $rules = [
            'required',
            'image',
            'mimes:png,jpg,jpeg,webp',
            "max:{$maxKilobytes}",
            "dimensions:min_width={$minSide},min_height={$minSide}",
        ];

        if ($this->asset() === 'favicon') {
            $rules[] = $this->squareRule();
        }

        return ['file' => $rules];
    }

    /**
     * Aturan `dimensions:ratio=1` bawaan Laravel membandingkan nyaris persis,
     * sehingga gambar 512×511 pun ditolak — padahal itu tetap layak jadi
     * favicon. Di sini toleransinya dilonggarkan 1%.
     */
    private function squareRule(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail): void {
            if (! $value instanceof UploadedFile) {
                return;
            }

            $dimensions = @getimagesize($value->getRealPath());

            if ($dimensions === false) {
                return; // aturan `image` yang akan melaporkannya
            }

            [$width, $height] = $dimensions;

            if ($height === 0 || abs(($width / $height) - 1) > self::SQUARE_TOLERANCE) {
                $fail("Favicon harus berbentuk persegi. Berkas Anda {$width}×{$height} piksel.");
            }
        };
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        [$maxKilobytes, $minSide] = self::LIMITS[$this->asset()] ?? self::LIMITS['logo'];
        $maxMegabytes = round($maxKilobytes / 1024, 1);

        return [
            'file.required' => 'Pilih berkas gambar lebih dulu',
            'file.image' => 'Berkas harus berupa gambar',
            'file.mimes' => 'Format yang didukung: PNG, JPG, atau WebP',
            'file.max' => "Ukuran berkas maksimal {$maxMegabytes} MB",
            'file.dimensions' => "Gambar minimal {$minSide}×{$minSide} piksel",
        ];
    }
}
