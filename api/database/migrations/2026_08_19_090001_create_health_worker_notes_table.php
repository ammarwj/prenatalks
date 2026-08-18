<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Catatan edukasi yang ditulis tenaga kesehatan — PRD §9 F-15.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('health_worker_notes', function (Blueprint $table) {
            $table->id();

            $table->foreignId('consent_id')
                ->constrained('health_worker_consents')
                ->cascadeOnDelete();

            // nullOnDelete, sama alasannya dengan `audit_logs.user_id`:
            // menghapus akun penulis tidak boleh menghapus catatan yang
            // sudah dibaca pengguna.
            $table->foreignId('health_worker_id')->nullable()->constrained('users')->nullOnDelete();

            // Catatan biasanya menanggapi satu hasil cek risiko, tapi boleh
            // juga berdiri sendiri (catatan umum) — karena itu nullable.
            $table->foreignId('risk_assessment_id')->nullable()
                ->constrained('risk_assessments')
                ->nullOnDelete();

            $table->text('body');
            $table->timestamps();

            $table->index(['consent_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('health_worker_notes');
    }
};
