<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminSettingsRequest;
use App\Models\Setting;
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

    public function index()
    {
        $groups = array_values(array_unique(array_values(Setting::KEYS)));

        return $this->success(
            Setting::valuesForGroups($groups),
            meta: ['public_groups' => Setting::PUBLIC_GROUPS]
        );
    }

    public function update(AdminSettingsRequest $request)
    {
        Setting::putMany($request->validated());

        $groups = array_values(array_unique(array_values(Setting::KEYS)));

        return $this->success(Setting::valuesForGroups($groups), 'Pengaturan disimpan');
    }
}
