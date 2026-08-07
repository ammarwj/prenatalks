<?php

namespace Database\Seeders;

use App\Models\Questionnaire;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * Draf kuesioner cek risiko — mengacu Kartu Skor Poedji Rochjati (KSPR),
 * PRD §9 F-05 & Lampiran A. HARUS divalidasi ulang oleh bidan/dokter
 * penanggung jawab sebelum rilis (lihat PRD §15, risiko #1 dan #7).
 */
class QuestionnaireSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        if (Questionnaire::where('is_active', true)->exists()) {
            return;
        }

        $questionnaire = Questionnaire::create([
            'title' => 'Cek Risiko Kehamilan (Draf KSPR)',
            'description' => 'Draf kuesioner berbasis Kartu Skor Poedji Rochjati (KSPR). '
                .'Belum divalidasi tenaga kesehatan — lihat PRD §15 & §16.',
            'version' => 1,
            'is_active' => true,
            'published_at' => now(),
        ]);

        $order = 0;
        foreach ($this->questions() as $question) {
            $order += 10;
            $q = $questionnaire->questions()->create([
                'text' => $question['text'],
                'help_text' => $question['help_text'] ?? null,
                'type' => $question['type'],
                'is_required' => true,
                'order_index' => $order,
                'group_label' => $question['group'],
            ]);

            $optionOrder = 0;
            foreach ($question['options'] as $option) {
                $optionOrder += 10;
                $q->options()->create([
                    'label' => $option['label'],
                    'score' => $option['score'],
                    'is_danger_sign' => $option['danger'] ?? false,
                    'order_index' => $optionOrder,
                ]);
            }
        }

        $levelOrder = 0;
        foreach ($this->riskLevels() as $level) {
            $levelOrder += 10;
            $questionnaire->riskLevels()->create([...$level, 'order_index' => $levelOrder]);
        }
    }

    /**
     * @return array<int, array{text: string, type: string, group: string, options: array<int, array{label: string, score: int, danger?: bool}>, help_text?: string}>
     */
    private function questions(): array
    {
        return [
            [
                'text' => 'Berapa usia Anda saat ini?',
                'type' => 'single_choice',
                'group' => 'Riwayat',
                'options' => [
                    ['label' => 'Kurang dari 16 tahun', 'score' => 4],
                    ['label' => '16–34 tahun', 'score' => 0],
                    ['label' => '35 tahun atau lebih', 'score' => 4],
                ],
            ],
            [
                'text' => 'Berapa jarak dengan persalinan terakhir Anda?',
                'type' => 'single_choice',
                'group' => 'Riwayat',
                'options' => [
                    ['label' => 'Kurang dari 2 tahun', 'score' => 4],
                    ['label' => '2 tahun atau lebih', 'score' => 0],
                    ['label' => 'Belum pernah melahirkan', 'score' => 0],
                ],
            ],
            [
                'text' => 'Berapa jumlah anak yang pernah Anda lahirkan?',
                'type' => 'single_choice',
                'group' => 'Riwayat',
                'options' => [
                    ['label' => '4 anak atau lebih', 'score' => 4],
                    ['label' => 'Kurang dari 4 anak', 'score' => 0],
                ],
            ],
            [
                'text' => 'Apakah Anda pernah mengalami keguguran?',
                'type' => 'boolean',
                'group' => 'Riwayat',
                'options' => [
                    ['label' => 'Ya', 'score' => 4],
                    ['label' => 'Tidak', 'score' => 0],
                ],
            ],
            [
                'text' => 'Apakah Anda pernah menjalani operasi sesar?',
                'type' => 'boolean',
                'group' => 'Riwayat',
                'options' => [
                    ['label' => 'Ya', 'score' => 8],
                    ['label' => 'Tidak', 'score' => 0],
                ],
            ],
            [
                'text' => 'Apakah tinggi badan Anda kurang dari 145 cm?',
                'type' => 'boolean',
                'group' => 'Kondisi',
                'options' => [
                    ['label' => 'Ya', 'score' => 4],
                    ['label' => 'Tidak', 'score' => 0],
                ],
            ],
            [
                'text' => 'Apakah Anda memiliki salah satu kondisi berikut? (boleh pilih lebih dari satu)',
                'type' => 'multiple_choice',
                'group' => 'Kondisi',
                'help_text' => 'Anemia, hipertensi, dan diabetes masing-masing menambah skor bila dipilih.',
                'options' => [
                    ['label' => 'Anemia', 'score' => 4],
                    ['label' => 'Hipertensi (tekanan darah tinggi)', 'score' => 4],
                    ['label' => 'Diabetes', 'score' => 4],
                ],
            ],
            [
                'text' => 'Apakah posisi janin sungsang atau melintang (menurut pemeriksaan)?',
                'type' => 'boolean',
                'group' => 'Kondisi',
                'options' => [
                    ['label' => 'Ya', 'score' => 8],
                    ['label' => 'Tidak', 'score' => 0],
                ],
            ],
            [
                'text' => 'Apakah Anda mengalami perdarahan?',
                'type' => 'boolean',
                'group' => 'Tanda Bahaya',
                'options' => [
                    ['label' => 'Ya', 'score' => 8, 'danger' => true],
                    ['label' => 'Tidak', 'score' => 0],
                ],
            ],
            [
                'text' => 'Apakah Anda mengalami kejang atau pandangan kabur berat?',
                'type' => 'boolean',
                'group' => 'Tanda Bahaya',
                'options' => [
                    ['label' => 'Ya', 'score' => 8, 'danger' => true],
                    ['label' => 'Tidak', 'score' => 0],
                ],
            ],
            [
                'text' => 'Apakah air ketuban Anda keluar sebelum waktunya?',
                'type' => 'boolean',
                'group' => 'Tanda Bahaya',
                'options' => [
                    ['label' => 'Ya', 'score' => 8, 'danger' => true],
                    ['label' => 'Tidak', 'score' => 0],
                ],
            ],
            [
                'text' => 'Apakah gerakan janin Anda terasa berkurang?',
                'type' => 'boolean',
                'group' => 'Tanda Bahaya',
                'options' => [
                    ['label' => 'Ya', 'score' => 8, 'danger' => true],
                    ['label' => 'Tidak', 'score' => 0],
                ],
            ],
        ];
    }

    /**
     * @return array<int, array{name: string, min_score: int, max_score: int|null, color_hex: string, recommendation: string}>
     */
    private function riskLevels(): array
    {
        return [
            [
                'name' => 'Risiko Rendah',
                'min_score' => 2,
                'max_score' => 6,
                'color_hex' => '#0D9488',
                'recommendation' => 'Lanjutkan pemeriksaan kehamilan (ANC) rutin minimal 6 kali sesuai jadwal.',
            ],
            [
                'name' => 'Risiko Sedang',
                'min_score' => 7,
                'max_score' => 11,
                'color_hex' => '#D97706',
                'recommendation' => 'Periksa ke bidan atau dokter, dan rencanakan persalinan di fasilitas kesehatan.',
            ],
            [
                'name' => 'Risiko Tinggi',
                'min_score' => 12,
                'max_score' => null,
                'color_hex' => '#E11D48',
                'recommendation' => 'Segera rujuk ke dokter spesialis atau rumah sakit dengan fasilitas lengkap.',
            ],
        ];
    }
}
