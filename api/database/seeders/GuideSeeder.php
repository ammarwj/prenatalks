<?php

namespace Database\Seeders;

use App\Models\Guide;
use Illuminate\Database\Seeder;

/**
 * Langkah-langkah awal panduan penggunaan `/panduan`.
 *
 * Isinya menggambarkan alur yang benar-benar ada di aplikasi ini (daftar &
 * verifikasi email, isi profil kehamilan, cek risiko, kalkulator, checklist
 * persiapan, berbagi hasil ke bidan lewat izin akses) — bukan teks contoh,
 * supaya halamannya langsung berguna sebelum admin menyuntingnya.
 *
 * Diterbitkan langsung (`is_published = true`) karena tautannya ada di footer
 * setiap halaman: mengantar pembaca ke halaman kosong lebih buruk daripada
 * menampilkan draf yang isinya memang alur produk ini sendiri.
 *
 * `firstOrCreate` per judul supaya aman dijalankan ulang dan tidak menimpa
 * teks yang sudah disunting super admin lewat `/admin/panduan`.
 *
 * Markup dibatasi ke tag yang lolos `sanitizeRichTextHtml()` di frontend
 * (p, ol, ul, li, strong, a, h3) — `h1`, `img`, tabel, dan `hr` dibuang saat
 * render, jadi tidak dipakai di sini.
 */
class GuideSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->guides() as $index => $guide) {
            Guide::firstOrCreate(
                ['title' => $guide['title']],
                [
                    'summary' => $guide['summary'],
                    'body' => $guide['body'],
                    'order_index' => ($index + 1) * 10,
                    'is_published' => true,
                ]
            );
        }
    }

    /**
     * @return list<array{title: string, summary: string, body: string}>
     */
    private function guides(): array
    {
        return [
            [
                'title' => 'Membuat Akun dan Masuk',
                'summary' => 'Daftar dengan email, verifikasi, lalu masuk ke dashboard Anda.',
                'body' => <<<'HTML'
                    <p>Sebagian fitur PrenaTalks — cek risiko, checklist persiapan, dan riwayat kehamilan — hanya tersedia setelah Anda punya akun. Artikel, video, kalkulator, dan FAQ tetap bisa dibaca tanpa masuk.</p>
                    <ol>
                      <li>Buka halaman <a href="/daftar">Daftar</a>, lalu isi nama, email, dan kata sandi.</li>
                      <li>Centang pernyataan persetujuan setelah membaca <a href="/syarat-ketentuan">Syarat &amp; Ketentuan</a> dan <a href="/kebijakan-privasi">Kebijakan Privasi</a>. Persetujuan ini wajib karena data kehamilan tergolong data pribadi spesifik.</li>
                      <li>Buka email dari kami dan klik tautan verifikasi. Bila tidak ada di kotak masuk, periksa folder spam.</li>
                      <li>Masuk lewat halaman <a href="/masuk">Masuk</a>.</li>
                    </ol>
                    <p><strong>Lupa kata sandi?</strong> Gunakan tautan "Lupa password" di halaman masuk — tautan penggantian akan dikirim ke email Anda.</p>
                    HTML,
            ],
            [
                'title' => 'Melengkapi Profil Kehamilan',
                'summary' => 'Isi HPHT dan data dasar agar usia kehamilan serta pengingat menjadi akurat.',
                'body' => <<<'HTML'
                    <p>Data kehamilan adalah dasar dari hampir semua perhitungan di PrenaTalks. Tanpa hari pertama haid terakhir (HPHT), usia kehamilan dan perkiraan hari lahir tidak bisa ditampilkan.</p>
                    <ol>
                      <li>Masuk ke <a href="/dashboard/kehamilan">Data Kehamilan</a> di dashboard Anda.</li>
                      <li>Isi <strong>HPHT</strong> — tanggal hari pertama menstruasi terakhir sebelum kehamilan ini.</li>
                      <li>Lengkapi data pendukung bila Anda mengetahuinya: tinggi dan berat badan, golongan darah, riwayat kehamilan sebelumnya, dan riwayat penyakit.</li>
                      <li>Simpan. Usia kehamilan dan perkiraan hari lahir akan langsung tampil di dashboard.</li>
                    </ol>
                    <p>Anda tidak wajib mengisi seluruh isian. Yang tidak diisi hanya membuat sebagian penilaian risiko dilewati, bukan menghalangi Anda memakai layanan ini.</p>
                    HTML,
            ],
            [
                'title' => 'Mengisi Cek Risiko Kehamilan',
                'summary' => 'Jawab kuesioner terpandu untuk mengetahui tingkat risiko dan tindak lanjutnya.',
                'body' => <<<'HTML'
                    <p>Cek risiko membantu Anda mengenali tanda yang perlu dibicarakan dengan bidan atau dokter. Hasilnya berupa skor dan tingkat risiko, <strong>bukan diagnosis medis</strong>.</p>
                    <ol>
                      <li>Buka <a href="/dashboard/cek-risiko">Cek Risiko</a> dari dashboard.</li>
                      <li>Jawab pertanyaan satu per satu. Jawablah apa adanya — jawaban yang dilebihkan atau dikurangi hanya membuat hasilnya menyesatkan.</li>
                      <li>Kirim jawaban, lalu baca halaman hasil beserta anjuran tindak lanjutnya.</li>
                      <li>Seluruh pengisian tersimpan di <a href="/dashboard/cek-risiko/riwayat">Riwayat</a>, sehingga perubahan kondisi dari waktu ke waktu bisa Anda bandingkan.</li>
                    </ol>
                    <p>Ulangi pengisian setiap kali kondisi Anda berubah atau setelah pemeriksaan kehamilan rutin.</p>
                    <p><strong>Penting:</strong> bila Anda mengalami perdarahan, nyeri hebat, demam tinggi, atau gerakan janin berkurang, segera hubungi fasilitas kesehatan terdekat tanpa menunggu hasil cek risiko.</p>
                    HTML,
            ],
            [
                'title' => 'Memakai Kalkulator Kehamilan',
                'summary' => 'Hitung usia kehamilan dan perkiraan hari lahir dari HPHT, tanpa perlu masuk.',
                'body' => <<<'HTML'
                    <p>Kalkulator di halaman <a href="/kalkulator">Kalkulator</a> bisa dipakai siapa saja, termasuk tanpa akun.</p>
                    <ol>
                      <li>Pilih tanggal HPHT pada pemilih tanggal.</li>
                      <li>Hasilnya muncul seketika: usia kehamilan dalam minggu dan hari, perkiraan hari lahir, dan trimester saat ini.</li>
                    </ol>
                    <p>Bila Anda sudah masuk dan mengisi HPHT di profil, angka yang sama juga tampil otomatis di dashboard tanpa perlu menghitung ulang setiap kali.</p>
                    <p>Perkiraan hari lahir adalah perkiraan, bukan kepastian. Hasil pemeriksaan USG dari bidan atau dokter Anda lebih akurat dan sebaiknya menjadi acuan utama.</p>
                    HTML,
            ],
            [
                'title' => 'Memakai Checklist Persiapan Persalinan',
                'summary' => 'Tandai persiapan yang sudah selesai dan pantau sisanya menjelang hari lahir.',
                'body' => <<<'HTML'
                    <p>Checklist persiapan mengumpulkan hal-hal yang perlu disiapkan sebelum persalinan — dokumen, tas bersalin, rencana transportasi, hingga kesiapan pendonor darah.</p>
                    <ol>
                      <li>Buka <a href="/dashboard/persiapan">Persiapan Persalinan</a> di dashboard.</li>
                      <li>Centang item yang sudah Anda selesaikan. Perubahan tersimpan otomatis.</li>
                      <li>Pantau indikator kemajuan di bagian atas untuk melihat berapa banyak yang tersisa.</li>
                    </ol>
                    <p>Mulailah mencentang sejak trimester ketiga agar tidak ada persiapan yang tertinggal saat persalinan datang lebih awal dari perkiraan.</p>
                    HTML,
            ],
            [
                'title' => 'Berbagi Hasil dengan Bidan atau Tenaga Kesehatan',
                'summary' => 'Beri izin akses terbatas, pantau siapa yang membuka, dan cabut kapan saja.',
                'body' => <<<'HTML'
                    <p>Anda dapat memberi bidan atau tenaga kesehatan akses ke hasil cek risiko Anda tanpa perlu mengirim tangkapan layar.</p>
                    <ol>
                      <li>Buka <a href="/dashboard/privasi">Privasi &amp; Akses</a> di dashboard.</li>
                      <li>Buat izin akses baru. Sistem menghasilkan kode tautan yang Anda berikan kepada tenaga kesehatan tersebut.</li>
                      <li>Tenaga kesehatan memasukkan kode itu di halaman akses mereka untuk melihat data Anda.</li>
                      <li>Cabut izin kapan saja dari halaman yang sama.</li>
                    </ol>
                    <p><strong>Yang dibagikan dibatasi:</strong> nama, usia kehamilan, hasil cek risiko, dan catatan edukasi. Berat badan, golongan darah, riwayat penyakit, kontak fasilitas kesehatan, email, dan nomor telepon Anda tidak ikut dibagikan.</p>
                    <p>Setiap pembukaan data oleh pemegang izin tercatat, sehingga Anda selalu bisa memeriksa siapa yang mengaksesnya dan kapan.</p>
                    HTML,
            ],
        ];
    }
}
