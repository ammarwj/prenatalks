# Alur Kerja & Proses Bisnis — PrenaTalks

Pelengkap `PRD.md` dan `IMPLEMENTATION_CHECKLIST.md`. Setiap diagram menunjukkan titik keputusan sebenarnya (cabang, override, invarian data) yang dijalankan sistem, bukan sekadar mengulang langkah-langkah dari spesifikasi fitur dalam bentuk gambar.

Versi visual (rendered) tersedia sebagai artifact terpisah; dokumen ini adalah sumber teks yang disimpan bersama kode.

---

## 1. Registrasi & Verifikasi Akun

*Mengacu F-02.* Titik keputusan: apa yang boleh dilakukan pengguna sebelum email terverifikasi, dan apa yang terjadi bila tautan verifikasi kedaluwarsa.

```mermaid
flowchart TD
  A["Isi form daftar<br/>nama, email, no. HP, password, checkbox persetujuan"] --> B["POST /auth/register"]
  B --> C{"Validasi lolos?"}
  C -->|Tidak| C1["Tampilkan error per field (422)"] --> A
  C -->|Ya| D["Buat user<br/>email_verified_at = null"]
  D --> E["Kirim email verifikasi<br/>signed URL, TTL 60 menit"]
  E --> F{"Tautan diklik < 60 menit?"}
  F -->|Ya| G["POST /auth/verify-email/{id}/{hash}"] --> H["email_verified_at terisi"]
  F -->|Tidak| I["Tautan kedaluwarsa"] --> J["Minta kirim ulang verifikasi"] --> E
  D --> K["Pengguna tetap bisa login sebelum verifikasi"]
  K --> L["Banner pengingat tampil di dashboard"]
  L --> M{"Coba simpan hasil assessment?"}
  M -->|Ya, belum verifikasi| N["Ditolak — arahkan verifikasi dulu"]
  H --> O["Akses penuh: assessment tersimpan"]
```

- Login **tidak** diblokir oleh status verifikasi — yang diblokir hanya penyimpanan hasil assessment.
- Tautan kedaluwarsa tidak mengulang seluruh registrasi, hanya mengirim ulang email verifikasi.

---

## 2. Login & Refresh Token (JWT)

*Mengacu F-02, alur JWT.* Yang menjaga keamanan bukan login itu sendiri, melainkan rotasi refresh token dan tempat penyimpanan tiap jenis token.

```mermaid
sequenceDiagram
  participant B as Browser (access_token di memory)
  participant N as Next.js Route Handler
  participant L as Laravel API

  B->>L: POST /auth/login (email, password)
  L-->>B: access_token (TTL 60m) + refresh_token (TTL 14h)
  B->>N: teruskan refresh_token
  N-->>B: Set-Cookie httpOnly; Secure; SameSite=Lax
  Note over B: access_token TIDAK pernah masuk localStorage

  B->>L: Request API — Authorization: Bearer access_token
  alt access_token masih valid
    L-->>B: 200 + data
  else access_token kedaluwarsa (401)
    B->>N: minta refresh (cookie httpOnly terkirim otomatis)
    N->>L: POST /auth/refresh
    L-->>L: refresh_token lama masuk denylist
    L-->>N: access_token baru + refresh_token baru (dirotasi)
    N-->>B: access_token baru
    B->>L: ulangi request semula
    L-->>B: 200 + data
  end
```

- Refresh token lama masuk **denylist** setiap kali dipakai — mencegah token yang dicuri dipakai ulang setelah rotasi berikutnya.
- Bila refresh juga gagal, pengguna diarahkan ke `/masuk`.

---

## 3. Kalkulator Kehamilan

*Mengacu F-04.* Status sesi mengubah apakah hasil hanya ditampilkan atau juga disimpan sebagai acuan personalisasi.

```mermaid
flowchart TD
  A["Input HPHT"] --> B["POST /calculator (publik)"]
  B --> C["PregnancyCalculator: usia kehamilan, HPL (Naegele), trimester, progres"]
  C --> D{"Status sesi?"}
  D -->|Tamu| E["Tampilkan hasil"] --> F["Hasil TIDAK disimpan"]
  D -->|Login| G["Tampilkan hasil"] --> H["Simpan ke /pregnancies"]
  H --> I["Jadi acuan personalisasi konten & dashboard"]
  F --> J["Catatan: berbasis siklus 28 hari —<br/>untuk siklus tidak teratur, USG lebih akurat"]
  I --> J
```

- Perhitungan selalu di backend — jalur tamu maupun login memanggil endpoint yang sama, hanya penyimpanannya berbeda.

---

## 4. Cek Risiko (Risk Assessment) — Core Feature

*Mengacu F-05.* Tanda bahaya meng-override hasil skor, bukan menjadi salah satu komponen skor. Kedua jalur berjalan independen lalu bertemu di halaman hasil.

```mermaid
flowchart TD
  A["POST /assessments — mulai"] --> B["Isi kuesioner multi-langkah"]
  B --> C["PATCH /assessments/{id}/answers — autosave tiap langkah"]
  C --> D{"Opsi berpenanda is_danger_sign dipilih?"}
  D -->|Ya| E["Alert merah persisten tampil SEKARANG"]
  E --> F["Anjuran segera ke faskes terdekat"]
  D -->|Tidak| G["Lanjut langkah berikutnya"] --> C
  C --> H["POST /assessments/{id}/submit"]
  H --> I["RiskScoringService: jumlahkan skor jawaban"]
  I --> J{"Skor total masuk risk_levels mana?"}
  J -->|"2–6"| K["Risiko Rendah — toska"]
  J -->|"7–11"| L["Risiko Sedang — amber"]
  J -->|"≥ 12"| M["Risiko Tinggi — merah"]
  K --> N["Badge + skor + rekomendasi + disclaimer"]
  L --> N
  M --> N
  F -.-> N
  N --> O["Tersimpan sbg riwayat, tertaut questionnaire_version saat pengisian"]
  O --> P["Grafik tren skor di /dashboard/riwayat"]
```

- Alert tanda bahaya tampil **terlepas dari total skor** — bisa muncul bahkan bila skor akhirnya masuk kategori rendah.
- Hasil tidak pernah memakai kata "diagnosis" atau nama kondisi medis (aturan konten, bukan aturan sistem).

---

## 5. Versioning Kuesioner Risiko

*Mengacu F-05, struktur data.* Bukan alur pengguna, melainkan invarian data: menyunting kuesioner tidak boleh mengubah makna hasil assessment yang sudah tersimpan.

```mermaid
flowchart TD
  A["Kuesioner aktif — versi N — dipakai pengguna"] --> B["Admin/Super Admin ubah pertanyaan, opsi, atau bobot skor"]
  B --> C["Sistem membuat questionnaire versi N+1"]
  C --> D["Assessment BARU memakai versi N+1"]
  A --> E["Assessment LAMA tetap tertaut ke versi N"]
  E --> F["Riwayat & grafik tren skor lama tidak berubah"]
  D --> G["Skor & ambang level baru berlaku mulai versi N+1"]
```

- Tanpa aturan ini, mengedit satu bobot pertanyaan bisa diam-diam mengubah kategori risiko riwayat lama seorang pengguna.

---

## 6. Pengelolaan Artikel

*Mengacu F-08, siklus tinjauan tahunan di 14.5.* Dua cabang penting: jadwal terbit otomatis, dan artikel lama yang harus ditinjau ulang tiap 12 bulan.

```mermaid
flowchart TD
  A["Admin buat draft artikel"] --> B["Isi source_reference (wajib)"]
  B --> C["Isi reviewed_at (wajib)"]
  C --> D{"Terbitkan sekarang atau jadwalkan?"}
  D -->|Sekarang| E["status = published"]
  D -->|Jadwalkan| F["published_at di masa depan"]
  F --> G["Job terjadwal set published saat published_at tercapai"]
  E --> H["Tampil di /artikel — filter life_stage, kategori, trimester"]
  G --> H
  H --> I{"12 bulan berlalu sejak reviewed_at?"}
  I -->|Ya, perlu update| B
  I -->|Belum / masih akurat| H
```

- `source_reference` dan `reviewed_at` adalah field wajib — ini yang mewujudkan janji "berbasis bukti" di level data.

---

## 7. Form Builder, Survei & Export

*Mengacu F-06, F-07.* Tiga cabang yang saling memengaruhi: batas satu respon per pengguna, mode anonim, dan ambang volume yang menentukan export sinkron vs antrian.

```mermaid
flowchart TD
  A["Admin buat form/survei"] --> B["Atur field, validasi, status, periode aktif"]
  B --> C{"type"}
  C -->|form| D["Ikuti requires_login sesuai konfigurasi"]
  C -->|survey| E["Bisa publik di /survei/{slug}"]
  D --> F["Pengguna isi & submit"]
  E --> F
  F --> G{"one_response_per_user aktif & sudah pernah isi?"}
  G -->|Ya| H["Submission ditolak"]
  G -->|Tidak| I["Simpan form_submissions + form_answers"]
  I --> J{"is_anonymous?"}
  J -->|Ya| K["user_id TIDAK disimpan bersama jawaban"]
  J -->|Tidak| L["user_id tersimpan"]
  K --> M["Admin lihat ringkasan respon"]
  L --> M
  M --> N{"Baris data > 1.000?"}
  N -->|Ya| O["Export via queue — job ExportSubmissions"]
  N -->|Tidak| P["Export langsung"]
  O --> Q["Tautan unduh 24 jam, BOM UTF-8"]
  P --> Q
```

- ID responden hanya ikut dalam export bila survei **tidak** anonim — konsisten dengan aturan privasi di bagian 12.3 PRD.

---

## 8. Checklist Persiapan Melahirkan

*Mengacu F-11.* Template dikelola terpusat oleh admin, tapi progres tiap pengguna tidak boleh ikut ter-reset saat template berubah.

```mermaid
flowchart TD
  A["Admin kelola template checklist_items per kategori"] --> B["Tambah / ubah item"]
  B --> C["Pengguna buka /dashboard/persiapan"]
  C --> D{"Item ini baru dari admin?"}
  D -->|Ya| E["Muncul otomatis, is_checked = false"]
  D -->|Tidak, sudah ada progres| F["Progres lama tetap dipertahankan"]
  C --> G["Pengguna bisa tambah item pribadi — POST /checklist/custom"]
  E --> H["Pengguna centang item — PATCH /checklist/{itemId}"]
  F --> H
  G --> H
  H --> I["Progress bar per kategori + total"]
```

- Item pribadi pengguna hidup berdampingan dengan item template admin di tabel progres yang sama.

---

## 9. Akses Tenaga Kesehatan (P2 — pasca-rilis)

*Mengacu F-15.* Seluruh alur bergantung pada satu syarat yang bisa berubah kapan saja: status consent — dapat dicabut kapan pun oleh pengguna.

```mermaid
flowchart TD
  A["Pengguna buka pengaturan privasi"] --> B["Beri consent eksplisit ke tenaga kesehatan tertentu"]
  B --> C["Sistem buat kode tautan akses"]
  C --> D["Tercatat di audit_logs"]
  D --> E["Tenaga kesehatan buka tautan"]
  E --> F{"Consent masih aktif?"}
  F -->|Ya| G["Lihat hasil assessment + tulis catatan edukasi"]
  F -->|Tidak, sudah dicabut| H["Akses ditolak"]
  B --> I["Pengguna dapat mencabut consent kapan saja"]
  I --> H
  G --> D
```

- Pencabutan consent berlaku seketika — bukan menunggu kode tautan kedaluwarsa.

---

## Catatan Penggunaan

- Dokumen ini turunan dari `PRD.md` — bila spesifikasi fitur berubah di PRD, perbarui diagram yang relevan di sini juga.
- Untuk task implementasi per fitur, lihat `IMPLEMENTATION_CHECKLIST.md`.
