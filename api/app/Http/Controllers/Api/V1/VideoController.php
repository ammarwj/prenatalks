<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\VideoResource;
use App\Http\Resources\VideoSummaryResource;
use App\Models\Video;
use App\Traits\ApiResponse;

/**
 * Galeri & detail video publik — PRD §9 F-09, §11.2.
 */
class VideoController extends Controller
{
    use ApiResponse;

    private const PER_PAGE = 12;

    public function index()
    {
        $videos = Video::query()->with('category')->published()
            ->orderByDesc('published_at')
            ->paginate(self::PER_PAGE);

        return $this->success(
            VideoSummaryResource::collection($videos),
            meta: [
                'current_page' => $videos->currentPage(),
                'per_page' => $videos->perPage(),
                'total' => $videos->total(),
            ]
        );
    }

    public function show(string $slug)
    {
        $video = Video::with('category')->where('slug', $slug)->published()->first();

        if (! $video) {
            return $this->error('Video tidak ditemukan', null, 404);
        }

        return $this->success(new VideoResource($video));
    }
}
