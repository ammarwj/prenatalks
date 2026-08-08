<?php

namespace Database\Seeders;

use App\Models\ChecklistItem;
use Illuminate\Database\Seeder;

/**
 * Template awal checklist persiapan melahirkan — PRD §9 F-11.
 *
 * Isinya mengikuti anjuran Buku KIA (Kemenkes) tentang persiapan persalinan:
 * dokumen, perlengkapan ibu & bayi, transportasi dan calon pendonor darah,
 * serta rencana persalinan. Ini titik awal yang bisa disunting admin lewat
 * `/admin/checklist`, bukan daftar yang dikunci di kode.
 *
 * `firstOrCreate` per (kelompok, judul) supaya seeder aman dijalankan ulang
 * tanpa menggandakan item — dan tanpa menyentuh progres pengguna.
 */
class ChecklistItemSeeder extends Seeder
{
    public function run(): void
    {
        $itemsByGroup = [
            'Dokumen' => [
                ['KTP ibu dan suami', 'Siapkan asli beserta 3 lembar fotokopi.'],
                ['Kartu Keluarga', 'Fotokopi 3 lembar untuk pendaftaran faskes dan akta kelahiran.'],
                ['Buku KIA (Kesehatan Ibu dan Anak)', 'Selalu dibawa setiap kontrol dan saat persalinan.'],
                ['Kartu BPJS atau asuransi kesehatan', 'Pastikan status kepesertaan aktif jauh sebelum HPL.'],
                ['Buku nikah', 'Fotokopi untuk pengurusan akta kelahiran bayi.'],
                ['Surat rujukan dari bidan atau puskesmas', 'Bila persalinan direncanakan di rumah sakit rujukan.'],
            ],
            'Perlengkapan Ibu' => [
                ['Baju berkancing depan (3–4 set)', 'Memudahkan menyusui setelah melahirkan.'],
                ['Pembalut nifas', 'Sediakan minimal satu bungkus besar.'],
                ['Celana dalam ganti (minimal 6)', null],
                ['Bra menyusui dan breast pad', null],
                ['Kain jarik atau sarung (2–3 lembar)', null],
                ['Perlengkapan mandi dan handuk', 'Sabun, sikat gigi, sisir, dan handuk pribadi.'],
                ['Sandal, kaus kaki, dan jilbab/penutup kepala', 'Sesuaikan dengan kebiasaan Anda.'],
            ],
            'Perlengkapan Bayi' => [
                ['Baju bayi lengan panjang dan pendek (4–6 set)', null],
                ['Popok bayi', 'Kain atau sekali pakai, sesuai pilihan Anda.'],
                ['Bedong atau selimut bayi (3–4 lembar)', null],
                ['Topi, sarung tangan, dan kaus kaki bayi', 'Menjaga bayi tetap hangat setelah lahir.'],
                ['Waslap dan handuk bayi', null],
                ['Perlengkapan mandi bayi dan minyak telon', null],
                ['Tas khusus perlengkapan bayi', 'Siapkan sejak usia kehamilan 36 minggu agar tinggal dibawa.'],
            ],
            'Persiapan Transportasi & Donor Darah' => [
                ['Tentukan kendaraan yang siap 24 jam', 'Pastikan ada alternatif bila kendaraan utama tidak tersedia.'],
                ['Simpan nomor ambulans desa atau layanan gawat darurat', null],
                ['Catat rute dan perkiraan waktu tempuh ke faskes', 'Termasuk rute alternatif bila jalan utama macet atau banjir.'],
                ['Siapkan minimal 2 calon pendonor darah', 'Golongan darahnya sesuai dan bersedia dihubungi sewaktu-waktu.'],
                ['Simpan nomor kontak calon pendonor darah', null],
                ['Siapkan dana persalinan dan biaya transportasi darurat', null],
            ],
            'Rencana Persalinan' => [
                ['Tentukan tempat persalinan dan penolong persalinan', 'Bidan, dokter, atau faskes rujukan sesuai hasil cek risiko Anda.'],
                ['Tentukan pendamping persalinan', 'Suami atau anggota keluarga yang siap mendampingi.'],
                ['Rencanakan siapa yang menjaga rumah dan anak', 'Terutama bila Anda perlu menginap di faskes.'],
                ['Diskusikan rencana persalinan dengan bidan atau dokter', 'Bahas saat pemeriksaan kehamilan (ANC) rutin.'],
                ['Kenali tanda persalinan dan tanda bahaya bersama pendamping', 'Agar pendamping tahu kapan harus segera membawa Anda ke faskes.'],
                ['Siapkan rencana IMD dan ASI eksklusif', 'Inisiasi Menyusu Dini dilakukan pada satu jam pertama setelah lahir.'],
            ],
        ];

        foreach ($itemsByGroup as $groupName => $items) {
            foreach ($items as $index => [$title, $description]) {
                ChecklistItem::firstOrCreate(
                    ['group_name' => $groupName, 'title' => $title],
                    [
                        'description' => $description,
                        // Kelipatan 10 menyisakan ruang bila admin menyisipkan
                        // item baru di tengah — pola yang sama dipakai F-05/F-10.
                        'order_index' => ($index + 1) * 10,
                        'is_active' => true,
                    ]
                );
            }
        }
    }
}
