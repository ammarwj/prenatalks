<?php

namespace Database\Seeders;

use App\Models\LegalDocument;
use Illuminate\Database\Seeder;

/**
 * Draf awal kedua dokumen legal.
 *
 * Isinya bukan karangan: Kebijakan Privasi disusun dari PRD §12.3 (UU PDP
 * No. 27/2022 — persetujuan eksplisit, minimalisasi data, hak unduh & hapus
 * akun, anonimisasi survei, akses nakes lewat consent), dan Syarat &
 * Ketentuan dari §12.4 beserta batasan layanan yang sudah dinyatakan PRD.
 *
 * Diterbitkan langsung (`is_published = true`) karena form pendaftaran
 * mewajibkan pengguna menyetujui kedua dokumen ini — menautkannya ke halaman
 * "belum tersedia" lebih buruk daripada menampilkan draf yang isinya memang
 * kebijakan proyek ini sendiri. Status drafnya ditandai lewat
 * `effective_date` yang sengaja dibiarkan kosong: panel admin menampilkan
 * badge "Perlu ditinjau" selama tanggal itu belum diisi.
 *
 * `firstOrCreate` per slug supaya aman dijalankan ulang dan tidak menimpa
 * teks yang sudah disunting admin lewat `/admin/legal`.
 *
 * Markup dibatasi ke tag yang lolos `sanitizeRichTextHtml()` di frontend
 * (h2, h3, p, ol, ul, li, strong, a) — tabel, `hr`, dan anchor `id` dibuang
 * saat render, jadi tidak dipakai di sini.
 */
class LegalDocumentSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->documents() as $slug => $body) {
            LegalDocument::firstOrCreate(
                ['slug' => $slug],
                [
                    'title' => LegalDocument::SLUGS[$slug],
                    'body' => $body,
                    'effective_date' => null,
                    'is_published' => true,
                ]
            );
        }
    }

    /**
     * @return array<string, string>
     */
    private function documents(): array
    {
        return [
            'kebijakan-privasi' => <<<'HTML'
                <p>PrenaTalks adalah platform edukasi kehamilan. Kebijakan ini menjelaskan data apa yang kami kumpulkan, untuk apa dipakai, dan hak apa yang Anda miliki atasnya.</p>

                <h2>1. Data yang kami kumpulkan</h2>
                <p>Kami hanya mengumpulkan data yang benar-benar dipakai oleh fitur yang Anda gunakan:</p>
                <ul>
                  <li><strong>Data akun</strong> — nama, alamat email, dan nomor telepon bila Anda mengisinya.</li>
                  <li><strong>Data kehamilan</strong> — hari pertama haid terakhir, riwayat kehamilan, tinggi dan berat badan, golongan darah, riwayat penyakit, serta kontak fasilitas kesehatan bila Anda mengisinya.</li>
                  <li><strong>Hasil cek risiko</strong> — jawaban kuesioner, skor, dan tingkat risiko yang dihitung dari jawaban tersebut.</li>
                  <li><strong>Jawaban form dan survei</strong> yang Anda kirimkan.</li>
                </ul>

                <h2>2. Dasar hukum dan persetujuan</h2>
                <p>Data kehamilan dan hasil cek risiko tergolong <strong>data pribadi spesifik</strong> menurut Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi. Karena itu pengumpulannya memerlukan persetujuan eksplisit dari Anda, yang Anda berikan saat mendaftar dengan mencentang pernyataan persetujuan. Anda berhak menarik persetujuan itu kapan saja dengan menghapus akun Anda.</p>

                <h2>3. Minimalisasi data</h2>
                <p>Kami menerapkan prinsip minimalisasi: data yang tidak dibutuhkan oleh satu fitur tidak dikumpulkan, dan tidak dibagikan ke fitur lain yang tidak memerlukannya. Anda tidak wajib mengisi seluruh isian profil untuk dapat memakai layanan ini.</p>

                <h2>4. Akses tenaga kesehatan</h2>
                <p>Bidan atau tenaga kesehatan hanya dapat melihat data Anda bila Anda memberikan izin secara khusus kepada mereka. Setiap pembukaan data oleh pemegang izin tercatat di catatan audit kami. Izin dapat Anda cabut sewaktu-waktu.</p>
                <p>Yang dibagikan pun dibatasi: nama Anda, usia kehamilan, hasil cek risiko, dan catatan edukasi. Berat badan, golongan darah, riwayat penyakit, kontak fasilitas kesehatan, email, dan nomor telepon Anda <strong>tidak</strong> ikut dibagikan.</p>
                <p>Anda dapat mengelola dan mencabut izin ini kapan saja di halaman <a href="/dashboard/privasi">Privasi &amp; Akses</a> pada akun Anda.</p>

                <h2>5. Hak Anda atas data</h2>
                <ul>
                  <li>Meminta salinan data pribadi Anda.</li>
                  <li>Memperbaiki data yang tidak akurat lewat halaman profil.</li>
                  <li>Menghapus akun beserta seluruh data Anda.</li>
                  <li>Mencabut izin akses tenaga kesehatan.</li>
                </ul>

                <h2>6. Penyimpanan dan penghapusan</h2>
                <p>Bila Anda menghapus akun, data Anda dihapus permanen paling lambat 30 hari sejak permintaan penghapusan.</p>
                <p>Jawaban survei yang ditandai anonim dianonimkan lebih dulu sebelum diolah atau diekspor untuk keperluan penelitian, sehingga tidak dapat ditelusuri kembali ke Anda.</p>

                <h2>7. Keamanan</h2>
                <p>Kata sandi disimpan dalam bentuk terenkripsi satu arah dan tidak dapat dibaca oleh siapa pun, termasuk pengelola. Akses pengelola ke data pengguna dibatasi menurut peran dan tercatat di catatan audit.</p>

                <h2>8. Perubahan kebijakan</h2>
                <p>Bila kebijakan ini berubah, tanggal berlaku dan tanggal pembaruan di halaman ini ikut diperbarui. Perubahan yang bersifat mendasar akan kami sampaikan lewat kanal resmi PrenaTalks.</p>

                <h2>9. Menghubungi kami</h2>
                <p>Pertanyaan mengenai kebijakan ini atau permintaan terkait data pribadi Anda dapat disampaikan lewat kontak yang tercantum di bagian bawah situs.</p>
                HTML,

            'syarat-ketentuan' => <<<'HTML'
                <p>Dengan membuat akun atau menggunakan layanan PrenaTalks, Anda menyatakan telah membaca, memahami, dan menyetujui syarat berikut.</p>

                <h2>1. Penerimaan syarat</h2>
                <p>Syarat ini berlaku bagi seluruh pengguna PrenaTalks, baik yang memiliki akun maupun yang hanya membaca konten publik. Bila Anda tidak menyetujuinya, mohon tidak menggunakan layanan ini.</p>

                <h2>2. Sifat layanan</h2>
                <p><strong>Informasi di PrenaTalks bersifat edukatif dan bukan pengganti pemeriksaan, diagnosis, atau nasihat tenaga kesehatan.</strong> Hasil cek risiko adalah penilaian mandiri berbasis skor, bukan diagnosis medis.</p>
                <p>Bila Anda mengalami tanda bahaya seperti perdarahan, nyeri hebat, demam tinggi, atau berkurangnya gerakan janin, segera hubungi bidan, dokter, atau fasilitas kesehatan terdekat. Jangan menunda pertolongan karena hasil yang Anda baca di sini.</p>

                <h2>3. Akun dan keamanan</h2>
                <ul>
                  <li>Anda bertanggung jawab menjaga kerahasiaan kata sandi akun Anda.</li>
                  <li>Data yang Anda masukkan harus benar dan merupakan data Anda sendiri.</li>
                  <li>Satu akun ditujukan untuk satu orang; jangan membagikan akses akun kepada orang lain.</li>
                  <li>Segera beri tahu kami bila Anda menduga akun Anda diakses pihak lain.</li>
                </ul>

                <h2>4. Penggunaan yang tidak diperbolehkan</h2>
                <ul>
                  <li>Mengunggah atau menyebarkan informasi kesehatan yang menyesatkan.</li>
                  <li>Membagikan data pribadi atau hasil pemeriksaan orang lain tanpa izin mereka.</li>
                  <li>Menggunakan layanan untuk promosi, jual beli, atau penawaran produk kesehatan.</li>
                  <li>Mencoba mengakses data pengguna lain atau mengganggu jalannya layanan.</li>
                </ul>

                <h2>5. Konten edukasi</h2>
                <p>Materi kesehatan di PrenaTalks mencantumkan sumber rujukan dan tanggal tinjauan terakhir. Meski disusun dengan hati-hati, ilmu kesehatan terus berkembang dan kondisi setiap orang berbeda — konsultasikan penerapannya dengan tenaga kesehatan Anda.</p>

                <h2>6. Batasan tanggung jawab</h2>
                <p>PrenaTalks tidak bertanggung jawab atas keputusan medis yang diambil semata-mata berdasarkan informasi di layanan ini tanpa berkonsultasi dengan tenaga kesehatan. Layanan disediakan sebagaimana adanya dan dapat mengalami gangguan teknis sewaktu-waktu.</p>

                <h2>7. Data pribadi</h2>
                <p>Pengumpulan dan penggunaan data pribadi Anda diatur dalam <a href="/kebijakan-privasi">Kebijakan Privasi</a> yang merupakan bagian tidak terpisahkan dari syarat ini.</p>

                <h2>8. Perubahan syarat</h2>
                <p>Syarat ini dapat diperbarui sewaktu-waktu. Tanggal berlaku dan tanggal pembaruan di halaman ini akan ikut disesuaikan. Penggunaan layanan setelah perubahan berlaku berarti Anda menyetujui syarat yang telah diperbarui.</p>

                <h2>9. Penutupan akun</h2>
                <p>Anda dapat menghapus akun kapan saja. Kami dapat menonaktifkan akun yang melanggar syarat ini, dengan pemberitahuan bila keadaan memungkinkan.</p>

                <h2>10. Hukum yang berlaku</h2>
                <p>Syarat ini tunduk pada hukum yang berlaku di Republik Indonesia.</p>

                <h2>11. Menghubungi kami</h2>
                <p>Pertanyaan mengenai syarat ini dapat disampaikan lewat kontak yang tercantum di bagian bawah situs.</p>
                HTML,
        ];
    }
}
