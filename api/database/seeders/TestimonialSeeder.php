<?php

namespace Database\Seeders;

use App\Models\Testimonial;
use Illuminate\Database\Seeder;

/**
 * Tiga testimoni awal — persis yang sebelumnya ditulis mati di
 * `web/components/landing/testimonials.tsx`, supaya landing page tidak
 * mendadak kosong begitu komponennya beralih membaca database.
 *
 * `firstOrCreate` per nama agar aman dijalankan ulang dan tidak menimpa
 * suntingan admin lewat `/admin/testimoni`.
 */
class TestimonialSeeder extends Seeder
{
    public function run(): void
    {
        $testimonials = [
            [
                'name' => 'Siti',
                'pregnancy_age' => '28 minggu',
                'quote' => 'Informasinya lengkap dan mudah dipahami. Saya jadi lebih siap menghadapi persalinan.',
            ],
            [
                'name' => 'Rina',
                'pregnancy_age' => '32 minggu',
                'quote' => 'Fitur cek risiko sangat membantu saya mengetahui kondisi kehamilan saya saat ini.',
            ],
            [
                'name' => 'Dwi',
                'pregnancy_age' => '24 minggu',
                'quote' => 'Bidan di PrenaTalks ramah dan selalu cepat menjawab pertanyaan saya.',
            ],
        ];

        foreach ($testimonials as $index => $testimonial) {
            Testimonial::firstOrCreate(
                ['name' => $testimonial['name']],
                [
                    ...$testimonial,
                    'rating' => 5,
                    'is_published' => true,
                    'order_index' => ($index + 1) * 10,
                ]
            );
        }
    }
}
