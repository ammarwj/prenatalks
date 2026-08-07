<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('form_exports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('form_id')->constrained()->cascadeOnDelete();
            $table->enum('format', ['csv', 'xlsx']);
            $table->enum('status', ['processing', 'completed', 'failed'])->default('processing');
            $table->string('file_path')->nullable();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['form_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('form_exports');
    }
};
