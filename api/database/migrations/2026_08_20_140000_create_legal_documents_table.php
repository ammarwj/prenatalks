<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Syarat & Ketentuan dan Kebijakan Privasi (PRD §12.3, Lampiran C
     * "Kebijakan privasi & syarat ketentuan terpublikasi").
     *
     * Tabelnya tidak ada di skema PRD §10 — sebelumnya kedua dokumen ini
     * tidak ada sama sekali, dan tautan ke keduanya di footer maupun di
     * checkbox persetujuan halaman daftar menunjuk `href="#"`. Bentuk
     * kolomnya meniru `articles` (isi HTML dari editor yang sama), jauh
     * lebih ramping karena tidak butuh kategori, cover, atau penjadwalan.
     */
    public function up(): void
    {
        Schema::create('legal_documents', function (Blueprint $table) {
            $table->id();

            // Dikunci ke daftar di `LegalDocument::SLUGS`, tidak diisi admin.
            $table->string('slug', 60)->unique();

            $table->string('title', 150);
            $table->longText('body');

            // "Berlaku sejak" — diisi manual setelah teksnya ditinjau, jadi
            // sekaligus penanda bahwa dokumen masih draf selama kosong.
            $table->date('effective_date')->nullable();

            $table->boolean('is_published')->default(false);

            // Dokumen legal mengikat: siapa yang terakhir menyuntingnya perlu
            // terlihat di panel tanpa harus membuka audit log lebih dulu.
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('legal_documents');
    }
};
