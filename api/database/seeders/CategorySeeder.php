<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Kategori awal artikel — F-08 tidak meminta CRUD kategori terpisah di
 * panel admin (lihat sitemap PRD §8, tak ada `/admin/kategori`), jadi
 * kategori disiapkan lewat seeder dan dipilih admin saat menulis artikel.
 */
class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            'Nutrisi Kehamilan',
            'Kesehatan Ibu',
            'Perkembangan Janin',
            'Persiapan Persalinan',
            'Tanda Bahaya',
            'Nifas & Menyusui',
        ];

        foreach ($categories as $index => $name) {
            Category::firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name, 'type' => 'article', 'order_index' => ($index + 1) * 10]
            );
        }
    }
}
