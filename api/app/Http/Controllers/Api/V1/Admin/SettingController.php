<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminSettingsRequest;
use App\Models\Setting;
use App\Services\BrandAssetService;
use App\Traits\ApiResponse;

/**
 * Pengaturan situs — admin/super_admin (PRD §8 `/admin/pengaturan`, §11.2).
 *
 * Saat ini berisi pengaturan komunitas (F-12). Pengaturan situs lain dan
 * audit log menyusul di F-14, memakai kunci baru di `Setting::KEYS`.
 */
class SettingController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly BrandAssetService $brand) {}

    public function index()
    {
        return $this->success(
            $this->allValues(),
            meta: ['public_groups' => Setting::PUBLIC_GROUPS]
        );
    }

    public function update(AdminSettingsRequest $request)
    {
        Setting::putMany($request->validated());

        return $this->success($this->allValues(), 'Pengaturan disimpan');
    }

    /**
     * Seluruh kelompok, dengan aset merek sudah berbentuk URL siap pakai —
     * berkasnya sendiri diunggah lewat `POST /admin/brand/{asset}`, bukan
     * dari sini, tapi panel tetap membacanya dari satu tempat yang sama.
     *
     * @return array<string, mixed>
     */
    private function allValues(): array
    {
        $groups = array_values(array_unique(array_values(Setting::KEYS)));

        return array_replace(Setting::valuesForGroups($groups), $this->brand->payload());
    }
}
