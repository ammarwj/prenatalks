<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Indeks GIN atas `to_tsvector` — PRD §10, hanya didukung PostgreSQL.
     * Dilewati di SQLite (dipakai saat testing, lihat phpunit.xml); pencarian
     * di sana jatuh ke `LIKE` biasa (lihat ArticleController::index()).
     */
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement(
            "CREATE INDEX idx_articles_search ON articles USING GIN (to_tsvector('indonesian', title || ' ' || coalesce(excerpt, '')))"
        );
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('DROP INDEX IF EXISTS idx_articles_search');
    }
};
