<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel ini tidak ada di skema PRD §10, tapi diminta kriteria terima
     * F-16: "Profil tim dikelola lewat panel admin (CRUD sederhana: foto,
     * nama, peran, deskripsi, urutan)".
     */
    public function up(): void
    {
        Schema::create('team_members', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('role_title', 120);

            // Kualifikasi yang membuat klaim "berbasis bukti" bisa
            // diverifikasi — nama profesi dan nomor STR bila relevan
            // (PRD §9 F-16 seksi 6). Kosong untuk anggota non-nakes.
            $table->string('credential', 150)->nullable();

            $table->text('description')->nullable();
            $table->string('photo_path')->nullable();
            $table->integer('order_index')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            $table->index(['is_published', 'order_index']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('team_members');
    }
};
