<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

/**
 * Unggah cover artikel + konversi WebP (PRD §9 F-08) — disk `public` (dilink
 * lewat `storage:link`) supaya bisa diakses langsung oleh halaman publik.
 */
class CoverImageService
{
    private const MAX_WIDTH = 1600;

    private const QUALITY = 82;

    public function __construct(private readonly ImageManager $manager = new ImageManager(new Driver)) {}

    public function store(UploadedFile $file, string $directory = 'covers'): string
    {
        $image = $this->manager->read($file->getRealPath());
        $image->scaleDown(width: self::MAX_WIDTH);
        $encoded = $image->toWebp(quality: self::QUALITY);

        $filename = "{$directory}/".Str::uuid()->toString().'.webp';
        Storage::disk('public')->put($filename, (string) $encoded);

        return $filename;
    }

    public function delete(?string $path): void
    {
        if ($path) {
            Storage::disk('public')->delete($path);
        }
    }
}
