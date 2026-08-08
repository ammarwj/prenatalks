<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminArticleRequest;
use App\Http\Resources\Admin\AdminArticleResource;
use App\Models\Article;
use App\Services\CoverImageService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * CRUD artikel — admin/super_admin (PRD §9 F-08, §5 RBAC).
 */
class ArticleController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly CoverImageService $coverImageService) {}

    public function index(Request $request)
    {
        $articles = Article::with(['category', 'author'])
            ->orderByDesc('created_at')
            ->paginate((int) $request->integer('per_page', 20));

        return $this->success(
            AdminArticleResource::collection($articles),
            meta: [
                'current_page' => $articles->currentPage(),
                'per_page' => $articles->perPage(),
                'total' => $articles->total(),
            ]
        );
    }

    public function store(AdminArticleRequest $request)
    {
        $data = $request->validated();
        $user = $request->user('api');

        $article = DB::transaction(function () use ($data, $request, $user) {
            $coverPath = $request->hasFile('cover')
                ? $this->coverImageService->store($request->file('cover'))
                : null;

            return Article::create([
                'title' => $data['title'],
                'slug' => $this->uniqueSlug($data['slug'] ?? $data['title']),
                'excerpt' => $data['excerpt'] ?? null,
                'content' => $data['content'],
                'cover_path' => $coverPath,
                'category_id' => $data['category_id'] ?? null,
                'trimester' => $data['trimester'] ?? null,
                'author_id' => $user->id,
                'life_stage' => $data['life_stage'] ?? 'pregnancy',
                'source_reference' => $data['source_reference'],
                'reviewed_at' => $data['reviewed_at'],
                'reviewed_by' => $user->id,
                'status' => $data['status'],
                'published_at' => $this->resolvePublishedAt($data),
                'reading_minutes' => $this->estimateReadingMinutes($data['content']),
                'meta_title' => $data['meta_title'] ?? null,
                'meta_description' => $data['meta_description'] ?? null,
            ]);
        });

        return $this->success(
            new AdminArticleResource($article->load(['category', 'author'])),
            'Artikel dibuat',
            status: 201
        );
    }

    public function show(Article $article)
    {
        $article->load(['category', 'author']);

        return $this->success(new AdminArticleResource($article));
    }

    public function update(AdminArticleRequest $request, Article $article)
    {
        $data = $request->validated();
        $user = $request->user('api');

        DB::transaction(function () use ($data, $request, $article, $user) {
            $coverPath = $article->cover_path;
            if ($request->hasFile('cover')) {
                $this->coverImageService->delete($article->cover_path);
                $coverPath = $this->coverImageService->store($request->file('cover'));
            } elseif ($request->boolean('remove_cover')) {
                $this->coverImageService->delete($article->cover_path);
                $coverPath = null;
            }

            $article->update([
                'title' => $data['title'],
                'slug' => isset($data['slug']) ? $this->uniqueSlug($data['slug'], $article->id) : $article->slug,
                'excerpt' => $data['excerpt'] ?? null,
                'content' => $data['content'],
                'cover_path' => $coverPath,
                'category_id' => $data['category_id'] ?? null,
                'trimester' => $data['trimester'] ?? null,
                'life_stage' => $data['life_stage'] ?? 'pregnancy',
                'source_reference' => $data['source_reference'],
                'reviewed_at' => $data['reviewed_at'],
                'reviewed_by' => $user->id,
                'status' => $data['status'],
                'published_at' => $this->resolvePublishedAt($data, $article),
                'reading_minutes' => $this->estimateReadingMinutes($data['content']),
                'meta_title' => $data['meta_title'] ?? null,
                'meta_description' => $data['meta_description'] ?? null,
            ]);
        });

        return $this->success(
            new AdminArticleResource($article->fresh(['category', 'author'])),
            'Artikel diperbarui'
        );
    }

    public function destroy(Article $article)
    {
        $this->coverImageService->delete($article->cover_path);
        $article->delete();

        return $this->success(null, 'Artikel dihapus');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function resolvePublishedAt(array $data, ?Article $article = null): ?string
    {
        if ($data['status'] !== 'published') {
            return null;
        }

        if (! empty($data['published_at'])) {
            return $data['published_at'];
        }

        return $article?->published_at ?? now();
    }

    private function estimateReadingMinutes(string $content): int
    {
        $wordCount = str_word_count(strip_tags($content));

        return max(1, (int) ceil($wordCount / 200));
    }

    private function uniqueSlug(string $base, ?int $ignoreId = null): string
    {
        $slug = Str::slug($base) ?: 'artikel';
        $original = $slug;
        $suffix = 2;

        while (
            Article::withTrashed()
                ->where('slug', $slug)
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = "{$original}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
