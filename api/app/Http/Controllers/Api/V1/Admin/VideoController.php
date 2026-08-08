<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminVideoRequest;
use App\Http\Resources\Admin\AdminVideoResource;
use App\Models\Video;
use App\Services\CoverImageService;
use App\Services\YoutubeUrlParser;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * CRUD video edukasi — admin/super_admin (PRD §9 F-09, §5 RBAC).
 */
class VideoController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly CoverImageService $thumbnailService) {}

    public function index(Request $request)
    {
        $videos = Video::with(['category'])
            ->orderByDesc('created_at')
            ->paginate((int) $request->integer('per_page', 20));

        return $this->success(
            AdminVideoResource::collection($videos),
            meta: [
                'current_page' => $videos->currentPage(),
                'per_page' => $videos->perPage(),
                'total' => $videos->total(),
            ]
        );
    }

    public function store(AdminVideoRequest $request)
    {
        $data = $request->validated();

        $video = DB::transaction(function () use ($data, $request) {
            $thumbnailPath = $request->hasFile('thumbnail')
                ? $this->thumbnailService->store($request->file('thumbnail'), 'thumbnails')
                : null;

            return Video::create([
                'title' => $data['title'],
                'slug' => $this->uniqueSlug($data['slug'] ?? $data['title']),
                'description' => $data['description'] ?? null,
                'youtube_id' => YoutubeUrlParser::extractId($data['youtube_url']),
                'thumbnail_path' => $thumbnailPath,
                'category_id' => $data['category_id'] ?? null,
                'duration_seconds' => $data['duration_seconds'] ?? null,
                'life_stage' => $data['life_stage'] ?? 'pregnancy',
                'status' => $data['status'],
                'published_at' => $this->resolvePublishedAt($data),
            ]);
        });

        return $this->success(
            new AdminVideoResource($video->load('category')),
            'Video dibuat',
            status: 201
        );
    }

    public function show(Video $video)
    {
        $video->load('category');

        return $this->success(new AdminVideoResource($video));
    }

    public function update(AdminVideoRequest $request, Video $video)
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $request, $video) {
            $thumbnailPath = $video->thumbnail_path;
            if ($request->hasFile('thumbnail')) {
                $this->thumbnailService->delete($video->thumbnail_path);
                $thumbnailPath = $this->thumbnailService->store($request->file('thumbnail'), 'thumbnails');
            } elseif ($request->boolean('remove_thumbnail')) {
                $this->thumbnailService->delete($video->thumbnail_path);
                $thumbnailPath = null;
            }

            $video->update([
                'title' => $data['title'],
                'slug' => isset($data['slug']) ? $this->uniqueSlug($data['slug'], $video->id) : $video->slug,
                'description' => $data['description'] ?? null,
                'youtube_id' => YoutubeUrlParser::extractId($data['youtube_url']),
                'thumbnail_path' => $thumbnailPath,
                'category_id' => $data['category_id'] ?? null,
                'duration_seconds' => $data['duration_seconds'] ?? null,
                'life_stage' => $data['life_stage'] ?? 'pregnancy',
                'status' => $data['status'],
                'published_at' => $this->resolvePublishedAt($data, $video),
            ]);
        });

        return $this->success(
            new AdminVideoResource($video->fresh('category')),
            'Video diperbarui'
        );
    }

    public function destroy(Video $video)
    {
        $this->thumbnailService->delete($video->thumbnail_path);
        $video->delete();

        return $this->success(null, 'Video dihapus');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function resolvePublishedAt(array $data, ?Video $video = null): ?string
    {
        if ($data['status'] !== 'published') {
            return null;
        }

        if (! empty($data['published_at'])) {
            return $data['published_at'];
        }

        return $video?->published_at ?? now();
    }

    private function uniqueSlug(string $base, ?int $ignoreId = null): string
    {
        $slug = Str::slug($base) ?: 'video';
        $original = $slug;
        $suffix = 2;

        while (
            Video::withTrashed()
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
