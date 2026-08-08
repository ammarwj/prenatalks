<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('videos', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('youtube_id', 20);
            $table->string('thumbnail_path')->nullable();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('duration_seconds')->nullable();
            $table->enum('life_stage', ['preconception', 'pregnancy', 'birth', 'postpartum', 'parenting'])
                ->default('pregnancy');
            $table->enum('status', ['draft', 'published'])->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'published_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('videos');
    }
};
