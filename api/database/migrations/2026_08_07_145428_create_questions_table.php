<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('questionnaire_id')->constrained()->cascadeOnDelete();
            $table->string('text');
            $table->text('help_text')->nullable();
            $table->enum('type', ['single_choice', 'multiple_choice', 'boolean', 'number']);
            $table->boolean('is_required')->default(true);
            $table->integer('order_index')->default(0);
            $table->string('group_label')->nullable();
            $table->timestamps();

            $table->index(['questionnaire_id', 'order_index']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};
