<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BrandAssetRequest;
use App\Services\BrandAssetService;
use App\Traits\ApiResponse;

/**
 * Aset identitas situs — logo, favicon, gambar hero (PRD §1.4).
 *
 * Dibatasi `role:super_admin`, bukan `admin`: mengganti logo dan favicon
 * mengubah wajah seluruh situs sekaligus, sekelas dengan mengelola pengguna
 * dan membaca audit log.
 *
 * Keduanya mengembalikan payload merek **utuh**, bukan hanya aset yang baru
 * disentuh, supaya panel bisa menyegarkan seluruh pratinjaunya dari satu
 * respons tanpa permintaan susulan.
 */
class BrandController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly BrandAssetService $assets) {}

    public function store(BrandAssetRequest $request, string $asset)
    {
        $this->assets->store($asset, $request->file('file'));

        return $this->success($this->assets->payload(), 'Aset tersimpan');
    }

    public function destroy(string $asset)
    {
        $this->assets->delete($asset);

        return $this->success($this->assets->payload(), 'Aset dikembalikan ke bawaan');
    }
}
