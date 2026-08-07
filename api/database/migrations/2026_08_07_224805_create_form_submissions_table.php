<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('form_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('form_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('submitted_at');
            $table->string('ip_hash', 64)->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamps();

            $table->index(['form_id', 'submitted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('form_submissions');
    }
};
