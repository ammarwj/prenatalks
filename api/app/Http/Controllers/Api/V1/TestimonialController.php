<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\TestimonialResource;
use App\Models\Testimonial;
use App\Traits\ApiResponse;

/**
 * Testimoni untuk landing page — PRD §9 F-01.
 */
class TestimonialController extends Controller
{
    use ApiResponse;

    public function index()
    {
        return $this->success(
            TestimonialResource::collection(Testimonial::published()->ordered()->get())
        );
    }
}
