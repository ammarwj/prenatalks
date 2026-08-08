<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

/**
 * Baris awal tabel `settings` dari `Setting::defaults()`.
 *
 * `firstOrCreate` per kunci — dijalankan ulang tidak menimpa teks yang sudah
 * disunting admin lewat `/admin/pengaturan`.
 */
class SettingSeeder extends Seeder
{
    public function run(): void
    {
        foreach (Setting::defaults() as $key => $value) {
            Setting::firstOrCreate(
                ['key' => $key],
                ['value' => $value, 'group_name' => Setting::KEYS[$key]]
            );
        }
    }
}
