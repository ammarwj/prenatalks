<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('form_fields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('form_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->text('description')->nullable();
            $table->enum('type', ['text', 'textarea', 'number', 'date', 'radio', 'checkbox', 'select', 'scale', 'file']);
            $table->string('placeholder')->nullable();
            $table->jsonb('options')->nullable();
            $table->jsonb('validation')->nullable();
            $table->boolean('is_required')->default(false);
            $table->integer('order_index')->default(0);
            $table->timestamps();

            $table->index(['form_id', 'order_index']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('form_fields');
    }
};
