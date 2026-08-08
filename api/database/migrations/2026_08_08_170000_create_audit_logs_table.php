<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();

            // nullOnDelete, bukan cascade: menghapus akun admin tidak boleh
            // ikut menghapus jejak apa yang pernah ia ubah — itu justru saat
            // audit log paling dibutuhkan.
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            $table->string('action', 30);
            $table->string('model_type', 100);
            $table->unsignedBigInteger('model_id')->nullable();
            $table->jsonb('changes')->nullable();
            $table->string('ip', 45)->nullable();

            // Hanya created_at — catatan audit tidak pernah disunting
            // (skema PRD §10 juga hanya menyebut created_at).
            $table->timestamp('created_at')->nullable();

            $table->index(['created_at']);
            $table->index(['model_type', 'model_id']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
