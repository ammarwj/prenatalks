<?php

namespace App\Services;

use InvalidArgumentException;

/**
 * Pembungkus berkas `.ico` — Intervention Image v3 tidak menyediakannya
 * (lihat `vendor/intervention/image/src/Encoders/`: hanya Avif, Bmp, Gif,
 * Heic, Jpeg, Jpeg2000, Png, Tiff, Webp).
 *
 * ICO sebenarnya cuma wadah: satu header, satu entri direktori per ukuran,
 * lalu muatan gambarnya berurutan. Muatan itu boleh berupa PNG utuh —
 * didukung semua browser sejak Windows Vista — jadi tidak perlu menulis
 * enkoder BMP sendiri, cukup menitipkan PNG yang sudah dihasilkan GD.
 *
 * Tata letaknya (semua bilangan little-endian):
 *
 *   ICONDIR       6 byte    reserved=0 · type=1 · jumlah gambar
 *   ICONDIRENTRY  16 byte   lebar · tinggi · warna · reserved
 *                           · plane=1 · bpp=32 · ukuran data · offset data
 *   ...sebanyak jumlah gambar
 *   muatan        bita PNG apa adanya, berurutan
 */
class IcoEncoder
{
    private const ICONDIR_SIZE = 6;

    private const ICONDIRENTRY_SIZE = 16;

    /**
     * Ukuran di atas 256 tidak muat: kolom lebar/tinggi hanya 1 byte, dan
     * nilai 0 di sana sudah dipesan artinya "256".
     */
    private const MAX_DIMENSION = 256;

    /**
     * @param  array<int, string>  $pngBySize  ukuran sisi (piksel) => bita PNG
     */
    public function encode(array $pngBySize): string
    {
        if ($pngBySize === []) {
            throw new InvalidArgumentException('Berkas ICO harus memuat minimal satu gambar.');
        }

        // Diurutkan menaik supaya pemilih ikon browser membaca yang terkecil
        // lebih dulu — urutan yang lazim dan memudahkan inspeksi manual.
        ksort($pngBySize);

        $header = pack('vvv', 0, 1, count($pngBySize));

        // Muatan pertama dimulai tepat setelah header dan seluruh entri
        // direktori, jadi offsetnya sudah bisa dihitung sebelum satu bita
        // muatan pun ditulis.
        $offset = self::ICONDIR_SIZE + (count($pngBySize) * self::ICONDIRENTRY_SIZE);

        $entries = '';
        $payloads = '';

        foreach ($pngBySize as $size => $png) {
            if ($size < 1 || $size > self::MAX_DIMENSION) {
                throw new InvalidArgumentException("Ukuran ikon {$size}px di luar rentang 1–256.");
            }

            $bytes = strlen($png);

            $entries .= pack(
                'CCCCvvVV',
                $size === self::MAX_DIMENSION ? 0 : $size, // lebar (0 = 256)
                $size === self::MAX_DIMENSION ? 0 : $size, // tinggi (0 = 256)
                0,       // jumlah warna palet — 0 untuk gambar >= 8bpp
                0,       // reserved
                1,       // color plane
                32,      // bit per piksel
                $bytes,
                $offset,
            );

            $payloads .= $png;
            $offset += $bytes;
        }

        return $header.$entries.$payloads;
    }
}
