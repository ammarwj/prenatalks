<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('risk_assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('pregnancy_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('questionnaire_id')->constrained()->restrictOnDelete();
            $table->integer('questionnaire_version');
            $table->integer('total_score')->default(0);
            $table->foreignId('risk_level_id')->nullable()->constrained()->nullOnDelete();
            $table->boolean('has_danger_sign')->default(false);
            $table->enum('status', ['in_progress', 'completed'])->default('in_progress');
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('risk_assessments');
    }
};
