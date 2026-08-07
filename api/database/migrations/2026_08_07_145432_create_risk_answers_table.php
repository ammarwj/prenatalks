<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('risk_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assessment_id')->constrained('risk_assessments')->cascadeOnDelete();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->foreignId('option_id')->nullable()->constrained('question_options')->nullOnDelete();
            $table->decimal('value_number', 10, 2)->nullable();
            $table->text('value_text')->nullable();
            $table->integer('score')->default(0);
            $table->timestamps();

            $table->unique(['assessment_id', 'question_id', 'option_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('risk_answers');
    }
};
