<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Testimoni landing page (PRD §9 F-01: "carousel 3 kartu berisi avatar,
     * kutipan, rating bintang, nama + usia kehamilan"). Tabelnya tidak ada di
     * skema PRD §10 — sebelumnya isinya array yang ditulis mati di
     * `web/components/landing/testimonials.tsx`, jadi tidak bisa diubah tanpa
     * deploy ulang. Bentuk kolomnya mengikuti `team_members` (F-16): daftar
     * berurut, bisa disembunyikan, foto opsional.
     */
    public function up(): void
    {
        Schema::create('testimonials', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80);

            // Teks bebas ("28 minggu"), bukan angka: yang tampil di kartu
            // memang kalimat apa adanya, dan usia kehamilan penulisnya beku
            // pada saat testimoni diberikan — bukan nilai yang ikut berjalan.
            $table->string('pregnancy_age', 40);

            $table->text('quote');
            $table->unsignedTinyInteger('rating')->default(5);
            $table->string('photo_path')->nullable();
            $table->integer('order_index')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            $table->index(['is_published', 'order_index']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('testimonials');
    }
};
