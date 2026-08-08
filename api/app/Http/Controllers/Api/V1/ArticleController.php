<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ArticleResource;
use App\Http\Resources\ArticleSummaryResource;
use App\Models\Article;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

/**
 * Daftar & detail artikel publik — PRD §9 F-08, §11.2.
 */
class ArticleController extends Controller
{
    use ApiResponse;

    private const PER_PAGE = 12;

    private const RELATED_LIMIT = 3;

    public function index(Request $request)
    {
        $query = Article::query()->with('category')->published();

        if ($lifeStage = $request->query('life_stage')) {
            $query->where('life_stage', $lifeStage);
        }

        if ($categorySlug = $request->query('category')) {
            $query->whereHas('category', fn (Builder $q) => $q->where('slug', $categorySlug));
        }

        if ($trimester = $request->query('trimester')) {
            $query->where('trimester', (int) $trimester);
        }

        if ($search = $request->query('search')) {
            $this->applySearch($query, $search);
        }

        $articles = $query->orderByDesc('published_at')->paginate(self::PER_PAGE);

        return $this->success(
            ArticleSummaryResource::collection($articles),
            meta: [
                'current_page' => $articles->currentPage(),
                'per_page' => $articles->perPage(),
                'total' => $articles->total(),
            ]
        );
    }

    public function show(string $slug)
    {
        $article = Article::with(['category', 'author'])
            ->where('slug', $slug)
            ->published()
            ->first();

        if (! $article) {
            return $this->error('Artikel tidak ditemukan', null, 404);
        }

        $article->increment('views_count');

        $related = Article::with('category')
            ->published()
            ->where('id', '!=', $article->id)
            ->where(fn (Builder $q) => $q->where('category_id', $article->category_id)
                ->orWhere('life_stage', $article->life_stage))
            ->orderByDesc('published_at')
            ->limit(self::RELATED_LIMIT)
            ->get();

        $article->setRelation('related', $related);

        return $this->success(new ArticleResource($article));
    }

    /**
     * GIN full-text index (migrasi F-08) hanya dibuat di PostgreSQL; di
     * SQLite (dipakai saat testing) jatuh ke `LIKE` biasa.
     */
    private function applySearch(Builder $query, string $search): void
    {
        if ($query->getModel()->getConnection()->getDriverName() === 'pgsql') {
            $query->whereRaw(
                "to_tsvector('indonesian', title || ' ' || coalesce(excerpt, '')) @@ plainto_tsquery('indonesian', ?)",
                [$search]
            );

            return;
        }

        $query->where(fn (Builder $q) => $q->where('title', 'like', "%{$search}%")
            ->orWhere('excerpt', 'like', "%{$search}%"));
    }
}
