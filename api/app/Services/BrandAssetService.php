<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;
use InvalidArgumentException;

/**
 * Aset identitas situs — logo, favicon, dan gambar hero (PRD §1.4, §7.1).
 *
 * Berbeda dari `CoverImageService` yang menamai berkasnya dengan UUID, aset
 * di sini memakai **nama tetap dan ditimpa di tempat**. Alasannya cache:
 * nginx menyajikan `/storage/` dengan `Cache-Control: public, immutable`
 * selama 30 hari (docker/nginx), jadi yang membedakan versi lama dan baru
 * adalah query `?v=N` pada URL — bukan nama berkasnya. Nomor versi disimpan
 * bersama path di tabel `settings` dan naik satu setiap kali diunggah ulang.
 *
 * Satu unggahan bisa menghasilkan lebih dari satu berkas: favicon juga
 * melahirkan apple-touch-icon, dan hero juga melahirkan gambar Open Graph.
 * Keduanya ikut nomor versi induknya.
 */
class BrandAssetService
{
    public const ASSETS = ['logo', 'favicon', 'hero'];

    private const DIRECTORY = 'brand';

    /** Ukuran yang ditanam ke dalam satu berkas `.ico`. */
    private const FAVICON_SIZES = [16, 32, 48];

    private const APPLE_TOUCH_SIZE = 180;

    private const LOGO_MAX_WIDTH = 512;

    private const HERO_MAX_WIDTH = 1200;

    private const OG_WIDTH = 1200;

    private const OG_HEIGHT = 630;

    /**
     * Berkas yang dihasilkan tiap aset — dipakai saat menghapus supaya
     * turunannya tidak tertinggal jadi sampah di disk.
     *
     * @var array<string, list<string>>
     */
    private const FILES = [
        'logo' => ['logo.webp'],
        'favicon' => ['favicon.ico', 'apple-touch-icon.png'],
        'hero' => ['hero.webp', 'og.jpg'],
    ];

    public function __construct(
        private readonly IcoEncoder $ico = new IcoEncoder,
        private readonly ImageManager $manager = new ImageManager(new Driver),
    ) {}

    /**
     * Olah dan simpan satu aset, lalu catat path + versi barunya ke settings.
     *
     * @return array<string, mixed> nilai yang tersimpan untuk aset ini
     */
    public function store(string $asset, UploadedFile $file): array
    {
        $this->assertKnown($asset);

        $stored = match ($asset) {
            'logo' => $this->storeLogo($file),
            'favicon' => $this->storeFavicon($file),
            'hero' => $this->storeHero($file),
        };

        $value = [
            ...$stored,
            'version' => $this->currentVersion($asset) + 1,
        ];

        Setting::putMany(["brand_{$asset}" => $value]);

        return $value;
    }

    /**
     * Kembalikan aset ke bawaan: hapus berkasnya dan kosongkan path-nya.
     *
     * **Nomor versi sengaja dipertahankan**, hanya `path` yang dikosongkan.
     * Nginx menyajikan `/storage/` sebagai `immutable` selama 30 hari, jadi
     * versi yang kembali ke 1 setelah dihapus akan membuat unggahan
     * berikutnya memakai URL yang persis sama dengan unggahan lama padahal
     * isinya berbeda — dan browser yang sudah menyimpan URL itu tidak akan
     * pernah mengambilnya lagi. Penghitung ini harus naik terus, selamanya.
     */
    public function delete(string $asset): void
    {
        $this->assertKnown($asset);

        foreach (self::FILES[$asset] as $file) {
            Storage::disk('public')->delete(self::DIRECTORY."/{$file}");
        }

        Setting::putMany([
            "brand_{$asset}" => ['path' => null, 'version' => $this->currentVersion($asset)],
        ]);
    }

    /**
     * Bentuk yang dikirim ke klien: URL absolut lengkap dengan `?v=`, bukan
     * path mentah. URL sengaja tidak ikut disimpan di tabel karena `APP_URL`
     * berbeda antar environment — nilai tersimpan harus tetap sah saat
     * database di-restore ke server lain.
     *
     * @return array<string, mixed>
     */
    public function payload(): array
    {
        $payload = [];

        foreach (self::ASSETS as $asset) {
            $value = $this->stored($asset);

            // `path` kosong berarti aset sudah dikembalikan ke bawaan —
            // barisnya masih ada semata-mata untuk menyimpan nomor versi
            // terakhir supaya penghitungnya tidak mengulang dari awal.
            if ($value === null || ($value['path'] ?? null) === null) {
                $payload["brand_{$asset}"] = null;

                continue;
            }

            $version = (int) ($value['version'] ?? 1);

            $payload["brand_{$asset}"] = match ($asset) {
                'logo' => [
                    'version' => $version,
                    'url' => $this->url('logo.webp', $version),
                    'width' => $value['width'] ?? null,
                    'height' => $value['height'] ?? null,
                ],
                'favicon' => [
                    'version' => $version,
                    'url' => $this->url('favicon.ico', $version),
                    'apple_touch_url' => $this->url('apple-touch-icon.png', $version),
                ],
                'hero' => [
                    'version' => $version,
                    'url' => $this->url('hero.webp', $version),
                    'og_url' => $this->url('og.jpg', $version),
                    'width' => $value['width'] ?? null,
                    'height' => $value['height'] ?? null,
                ],
            };
        }

        return $payload;
    }

    /**
     * Logo dipertahankan transparansinya — WebP mendukung alpha, dan logo
     * tanpa alpha akan tampil berlatar kotak hitam di atas header putih.
     *
     * @return array<string, mixed>
     */
    private function storeLogo(UploadedFile $file): array
    {
        $image = $this->manager->read($file->getRealPath());
        $image->scaleDown(width: self::LOGO_MAX_WIDTH);

        $this->put('logo.webp', (string) $image->toWebp(quality: 90));

        return [
            'path' => self::DIRECTORY.'/logo.webp',
            'width' => $image->width(),
            'height' => $image->height(),
        ];
    }

    /**
     * Satu unggahan jadi dua berkas: `.ico` multi-ukuran untuk tab browser,
     * dan PNG 180×180 untuk ikon layar utama iOS.
     *
     * @return array<string, mixed>
     */
    private function storeFavicon(UploadedFile $file): array
    {
        $pngBySize = [];

        foreach (self::FAVICON_SIZES as $size) {
            $pngBySize[$size] = (string) $this->manager
                ->read($file->getRealPath())
                ->cover($size, $size)
                ->toPng();
        }

        $this->put('favicon.ico', $this->ico->encode($pngBySize));

        // iOS mengabaikan alpha pada apple-touch-icon dan menggantinya hitam,
        // jadi transparansinya diratakan ke putih di sini — bukan dibiarkan
        // dan berharap perangkatnya berbaik hati.
        $appleTouch = $this->manager
            ->read($file->getRealPath())
            ->cover(self::APPLE_TOUCH_SIZE, self::APPLE_TOUCH_SIZE)
            ->blendTransparency('ffffff');

        $this->put('apple-touch-icon.png', (string) $appleTouch->toPng());

        return ['path' => self::DIRECTORY.'/favicon.ico'];
    }

    /**
     * Hero jadi WebP untuk situs, plus satu gambar Open Graph.
     *
     * OG sengaja **JPEG**, bukan WebP: scraper WhatsApp — kanal sebar utama
     * PrenaTalks — tidak menampilkan pratinjau bila `og:image` berformat
     * WebP. Alpha diratakan ke putih karena JPEG tidak mengenal transparansi.
     *
     * @return array<string, mixed>
     */
    private function storeHero(UploadedFile $file): array
    {
        $hero = $this->manager->read($file->getRealPath());
        $hero->scaleDown(width: self::HERO_MAX_WIDTH);

        $this->put('hero.webp', (string) $hero->toWebp(quality: 82));

        $og = $this->manager
            ->read($file->getRealPath())
            ->cover(self::OG_WIDTH, self::OG_HEIGHT)
            ->blendTransparency('ffffff');

        $this->put('og.jpg', (string) $og->toJpeg(quality: 82));

        return [
            'path' => self::DIRECTORY.'/hero.webp',
            'width' => $hero->width(),
            'height' => $hero->height(),
        ];
    }

    private function put(string $filename, string $contents): void
    {
        Storage::disk('public')->put(self::DIRECTORY."/{$filename}", $contents);
    }

    private function url(string $filename, int $version): string
    {
        return Storage::disk('public')->url(self::DIRECTORY."/{$filename}")."?v={$version}";
    }

    /** @return array<string, mixed>|null */
    private function stored(string $asset): ?array
    {
        $value = Setting::valuesForGroups(['brand'])["brand_{$asset}"] ?? null;

        return is_array($value) ? $value : null;
    }

    private function currentVersion(string $asset): int
    {
        return (int) ($this->stored($asset)['version'] ?? 0);
    }

    private function assertKnown(string $asset): void
    {
        if (! in_array($asset, self::ASSETS, true)) {
            throw new InvalidArgumentException("Aset merek tidak dikenal: {$asset}");
        }
    }
}
