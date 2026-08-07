<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('risk_levels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('questionnaire_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->integer('min_score');
            $table->integer('max_score')->nullable(); // null = tanpa batas atas
            $table->string('color_hex', 7);
            $table->text('recommendation');
            $table->integer('order_index')->default(0);
            $table->timestamps();

            $table->index(['questionnaire_id', 'order_index']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('risk_levels');
    }
};
