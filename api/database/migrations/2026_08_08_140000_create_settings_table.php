<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key', 100)->unique();

            // JSONB sesuai skema PRD §10 — bukan kolom teks, karena sebagian
            // pengaturan bernilai majemuk (mis. `community_rules` adalah daftar
            // aturan komunitas) sedangkan tautan hanyalah string.
            $table->jsonb('value')->nullable();

            $table->string('group_name', 50)->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
