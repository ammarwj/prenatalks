<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $categories = Category::query()
            ->when($request->query('type'), fn ($query, $type) => $query->where('type', $type))
            ->orderBy('order_index')
            ->get();

        return $this->success(CategoryResource::collection($categories));
    }
}
