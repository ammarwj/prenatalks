<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Kategori awal artikel & FAQ — F-08/F-10 tidak meminta CRUD kategori
 * terpisah di panel admin (lihat sitemap PRD §8, tak ada `/admin/kategori`),
 * jadi kategori disiapkan lewat seeder dan dipilih admin saat menulis
 * artikel/FAQ. Nama antar tipe sengaja tidak tumpang tindih karena `slug`
 * unik secara global di tabel `categories`, bukan per-`type`.
 */
class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categoriesByType = [
            'article' => [
                'Nutrisi Kehamilan',
                'Kesehatan Ibu',
                'Perkembangan Janin',
                'Persiapan Persalinan',
                'Tanda Bahaya',
                'Nifas & Menyusui',
            ],
            'faq' => [
                'Umum',
                'Akun & Keamanan',
                'Cek Risiko',
                'Form & Survei',
            ],
        ];

        foreach ($categoriesByType as $type => $categories) {
            foreach ($categories as $index => $name) {
                Category::firstOrCreate(
                    ['slug' => Str::slug($name)],
                    ['name' => $name, 'type' => $type, 'order_index' => ($index + 1) * 10]
                );
            }
        }
    }
}
