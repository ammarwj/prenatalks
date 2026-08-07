<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('question_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->integer('score')->default(0);
            $table->boolean('is_danger_sign')->default(false);
            $table->integer('order_index')->default(0);
            $table->timestamps();

            $table->index(['question_id', 'order_index']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_options');
    }
};
