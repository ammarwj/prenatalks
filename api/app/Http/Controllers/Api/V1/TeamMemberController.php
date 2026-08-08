<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\TeamMemberResource;
use App\Models\TeamMember;
use App\Traits\ApiResponse;

/**
 * Profil tim untuk halaman Tentang — PRD §9 F-16 seksi 6.
 */
class TeamMemberController extends Controller
{
    use ApiResponse;

    public function index()
    {
        return $this->success(
            TeamMemberResource::collection(TeamMember::published()->ordered()->get())
        );
    }
}
