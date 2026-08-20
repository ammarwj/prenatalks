<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guides', function (Blueprint $table) {
            $table->id();
            $table->string('title', 150);
            // Ringkasan satu baris yang tampil di bawah judul pada halaman
            // publik — opsional, karena tidak semua langkah perlu penjelasan
            // tambahan sebelum accordion-nya dibuka.
            $table->string('summary', 255)->nullable();
            $table->longText('body');
            $table->integer('order_index')->default(0);
            $table->boolean('is_published')->default(false);
            $table->timestamps();

            $table->index(['is_published', 'order_index']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guides');
    }
};
