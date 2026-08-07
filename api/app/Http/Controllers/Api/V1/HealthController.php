<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class HealthController extends Controller
{
    use ApiResponse;

    public function __invoke()
    {
        try {
            DB::connection()->getPdo();
            $database = 'connected';
        } catch (Throwable) {
            $database = 'unavailable';
        }

        return $this->success([
            'app' => config('app.name'),
            'database' => $database,
        ], 'PrenaTalks API menyala');
    }
}
