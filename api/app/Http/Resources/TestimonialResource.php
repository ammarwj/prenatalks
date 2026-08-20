<?php

namespace App\Http\Resources;

use App\Models\Testimonial;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Testimonial */
class TestimonialResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'pregnancy_age' => $this->pregnancy_age,
            'quote' => $this->quote,
            'rating' => $this->rating,
            'photo_url' => $this->photoUrl(),
        ];
    }
}
