<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminTeamMemberRequest;
use App\Http\Resources\Admin\AdminTeamMemberResource;
use App\Models\TeamMember;
use App\Services\CoverImageService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * CRUD profil tim — admin/super_admin (PRD §9 F-16 kriteria terima).
 *
 * Foto memakai ulang `CoverImageService` (dibangun di F-08) dengan direktori
 * berbeda, jadi konversi WebP-nya sama tanpa menduplikasi kode.
 */
class TeamMemberController extends Controller
{
    use ApiResponse;

    private const PHOTO_DIRECTORY = 'team';

    public function __construct(private readonly CoverImageService $photoService) {}

    public function index()
    {
        return $this->success(
            AdminTeamMemberResource::collection(TeamMember::ordered()->get())
        );
    }

    public function store(AdminTeamMemberRequest $request)
    {
        $data = $request->validated();

        $member = TeamMember::create([
            'name' => $data['name'],
            'role_title' => $data['role_title'],
            'credential' => $data['credential'] ?? null,
            'description' => $data['description'] ?? null,
            'is_published' => $data['is_published'] ?? true,
            'photo_path' => $request->hasFile('photo')
                ? $this->photoService->store($request->file('photo'), self::PHOTO_DIRECTORY)
                : null,
            'order_index' => (int) TeamMember::max('order_index') + 10,
        ]);

        return $this->success(new AdminTeamMemberResource($member), 'Profil tim dibuat', status: 201);
    }

    public function show(TeamMember $teamMember)
    {
        return $this->success(new AdminTeamMemberResource($teamMember));
    }

    public function update(AdminTeamMemberRequest $request, TeamMember $teamMember)
    {
        $data = $request->validated();

        $photoPath = $teamMember->photo_path;
        if ($request->hasFile('photo')) {
            $this->photoService->delete($teamMember->photo_path);
            $photoPath = $this->photoService->store($request->file('photo'), self::PHOTO_DIRECTORY);
        } elseif ($request->boolean('remove_photo')) {
            $this->photoService->delete($teamMember->photo_path);
            $photoPath = null;
        }

        $teamMember->update([
            'name' => $data['name'],
            'role_title' => $data['role_title'],
            'credential' => $data['credential'] ?? null,
            'description' => $data['description'] ?? null,
            'is_published' => $data['is_published'] ?? false,
            'photo_path' => $photoPath,
        ]);

        return $this->success(new AdminTeamMemberResource($teamMember->fresh()), 'Profil tim diperbarui');
    }

    public function destroy(TeamMember $teamMember)
    {
        $this->photoService->delete($teamMember->photo_path);
        $teamMember->delete();

        return $this->success(null, 'Profil tim dihapus');
    }

    /**
     * Persist urutan hasil drag & drop — pola yang sama dengan FAQ (F-10)
     * dan item checklist (F-11).
     */
    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:team_members,id'],
        ]);

        DB::transaction(function () use ($validated) {
            foreach (array_values($validated['ids']) as $index => $id) {
                TeamMember::where('id', $id)->update(['order_index' => ($index + 1) * 10]);
            }
        });

        return $this->success(
            AdminTeamMemberResource::collection(TeamMember::ordered()->get()),
            'Urutan profil tim diperbarui'
        );
    }
}
