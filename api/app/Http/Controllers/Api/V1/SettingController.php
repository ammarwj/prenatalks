<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Traits\ApiResponse;

/**
 * Pengaturan yang boleh dibaca publik — dipakai halaman `/komunitas`
 * (PRD §9 F-12) yang di-render statis dengan ISR.
 *
 * PRD §11.2 hanya mendaftarkan `GET/PUT /admin/settings`; endpoint publik ini
 * tambahan yang dibutuhkan agar halaman publik bisa membaca tautan komunitas
 * tanpa login. Yang keluar dibatasi ke `Setting::PUBLIC_GROUPS`, bukan seluruh
 * isi tabel, supaya pengaturan yang ditambahkan fitur lain tidak ikut bocor.
 */
class SettingController extends Controller
{
    use ApiResponse;

    public function index()
    {
        return $this->success(Setting::valuesForGroups(Setting::PUBLIC_GROUPS));
    }
}
