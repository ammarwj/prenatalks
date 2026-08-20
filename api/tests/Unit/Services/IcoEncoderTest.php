<?php

namespace Tests\Unit\Services;

use App\Services\IcoEncoder;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

/**
 * Struktur berkas `.ico` yang dihasilkan sendiri (Intervention v3 tidak
 * punya enkoder ICO). Yang diuji bentuk wadahnya, bukan isi gambarnya.
 */
class IcoEncoderTest extends TestCase
{
    private IcoEncoder $encoder;

    protected function setUp(): void
    {
        parent::setUp();
        $this->encoder = new IcoEncoder;
    }

    /** PNG sungguhan sekecil mungkin, dibuat GD supaya bita-nya sah. */
    private function png(int $size): string
    {
        $image = imagecreatetruecolor($size, $size);
        ob_start();
        imagepng($image);
        $png = (string) ob_get_clean();
        imagedestroy($image);

        return $png;
    }

    public function test_header_declares_icon_type_and_image_count(): void
    {
        $ico = $this->encoder->encode([16 => $this->png(16), 32 => $this->png(32)]);

        // reserved=0, type=1 (ikon), count=2 — semuanya little-endian.
        $this->assertSame("\x00\x00\x01\x00\x02\x00", substr($ico, 0, 6));
    }

    public function test_each_directory_entry_points_at_its_png_payload(): void
    {
        $sizes = [16, 32, 48];
        $pngBySize = [];
        foreach ($sizes as $size) {
            $pngBySize[$size] = $this->png($size);
        }

        $ico = $this->encoder->encode($pngBySize);

        foreach (array_values($sizes) as $index => $size) {
            $entry = unpack(
                'Cwidth/Cheight/Ccolors/Creserved/vplanes/vbpp/Vbytes/Voffset',
                substr($ico, 6 + ($index * 16), 16)
            );

            $this->assertSame($size, $entry['width'], "lebar entri {$size}px");
            $this->assertSame($size, $entry['height'], "tinggi entri {$size}px");
            $this->assertSame(1, $entry['planes']);
            $this->assertSame(32, $entry['bpp']);
            $this->assertSame(strlen($pngBySize[$size]), $entry['bytes']);

            // Inti pengujian: offset benar-benar mendarat di awal PNG-nya.
            $this->assertSame(
                "\x89PNG",
                substr($ico, $entry['offset'], 4),
                "offset entri {$size}px tidak menunjuk ke awal PNG"
            );
            $this->assertSame(
                $pngBySize[$size],
                substr($ico, $entry['offset'], $entry['bytes'])
            );
        }
    }

    public function test_entries_are_ordered_by_ascending_size(): void
    {
        $ico = $this->encoder->encode([
            48 => $this->png(48),
            16 => $this->png(16),
            32 => $this->png(32),
        ]);

        $widths = [];
        for ($index = 0; $index < 3; $index++) {
            $widths[] = ord($ico[6 + ($index * 16)]);
        }

        $this->assertSame([16, 32, 48], $widths);
    }

    /** Kolom lebar/tinggi hanya 1 byte; 0 adalah kode untuk 256. */
    public function test_size_256_is_written_as_zero(): void
    {
        $ico = $this->encoder->encode([256 => $this->png(256)]);

        $this->assertSame(0, ord($ico[6]));
        $this->assertSame(0, ord($ico[7]));
    }

    public function test_rejects_empty_input(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->encoder->encode([]);
    }

    public function test_rejects_size_beyond_ico_limit(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->encoder->encode([512 => $this->png(64)]);
    }
}
