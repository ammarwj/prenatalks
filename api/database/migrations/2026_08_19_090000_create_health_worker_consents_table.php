<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Izin pengguna kepada satu tenaga kesehatan tertentu — PRD §9 F-15,
 * BUSINESS_FLOWS §9.
 *
 * Tabel ini tidak ada di skema PRD §10 (F-15 ditulis sebagai satu paragraf
 * tanpa DDL), jadi bentuknya diturunkan dari kalimat fiturnya: "consent
 * eksplisit, dapat dicabut" → `revoked_at`; "akses berbasis kode tautan" →
 * `access_code_hash`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('health_worker_consents', function (Blueprint $table) {
            $table->id();

            // Pemberi izin (ibu hamil) dan penerimanya. Keduanya cascade:
            // izin tidak punya arti tanpa salah satu pihak, dan menyimpan
            // baris yatim berarti menyimpan penunjuk ke data kesehatan yang
            // pemiliknya sudah tidak ada (minimalisasi data, PRD §12.3).
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('health_worker_id')->constrained('users')->cascadeOnDelete();

            // Kode tautan disimpan sebagai hash, tidak pernah sebagai teks
            // biasa — pola yang sama dengan `refresh_tokens.token_hash`
            // (PRD §15, mitigasi "kebocoran data kesehatan"). Konsekuensinya
            // kode hanya bisa dilihat sekali saat dibuat; bila pengguna
            // kehilangannya, ia membuat ulang kode, bukan menampilkan ulang.
            $table->string('access_code_hash', 64)->unique();

            // Kedaluwarsa opsional. Pencabutan (`revoked_at`) berlaku
            // seketika dan tidak menunggu kolom ini — BUSINESS_FLOWS §9.
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('revoked_at')->nullable();

            // Untuk ditampilkan ke pemberi izin: "terakhir dibuka kapan".
            $table->timestamp('last_accessed_at')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'revoked_at']);
            $table->index(['health_worker_id', 'revoked_at']);
        });

        // Satu izin aktif per pasangan (pengguna, tenaga kesehatan). Dibuat
        // sebagai indeks parsial lewat SQL mentah karena Schema builder tidak
        // punya API `where` untuk indeks; sintaks ini didukung PostgreSQL
        // (produksi) maupun SQLite (pengujian). Izin yang sudah dicabut tetap
        // tersimpan sebagai riwayat, jadi indeks penuh akan salah menolaknya.
        DB::statement(
            'CREATE UNIQUE INDEX health_worker_consents_active_unique
             ON health_worker_consents (user_id, health_worker_id)
             WHERE revoked_at IS NULL'
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('health_worker_consents');
    }
};
