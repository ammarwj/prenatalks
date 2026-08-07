<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pregnancy\StorePregnancyRequest;
use App\Http\Requests\Pregnancy\UpdatePregnancyRequest;
use App\Http\Resources\PregnancyResource;
use App\Models\Pregnancy;
use App\Services\PregnancyCalculator;
use App\Traits\ApiResponse;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PregnancyController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly PregnancyCalculator $calculator) {}

    public function index(Request $request)
    {
        $pregnancies = $request->user('api')->pregnancies()->latest()->get();

        return $this->success(PregnancyResource::collection($pregnancies));
    }

    public function store(StorePregnancyRequest $request)
    {
        $user = $request->user('api');
        $data = $this->withComputedEdd($request->validated());

        $pregnancy = DB::transaction(function () use ($data, $user) {
            // Hanya satu status=active per user (PRD §9 F-03 kriteria terima) —
            // memulai data kehamilan baru berarti yang lama sudah tidak berjalan.
            $user->pregnancies()->where('status', 'active')->update(['status' => 'completed']);

            return $user->pregnancies()->create($data);
        });

        // status punya DEFAULT di level DB ('active'), tidak dikirim lewat $data —
        // refresh supaya nilainya ikut termuat di objek yang dikembalikan.
        $pregnancy->refresh();

        return $this->success(new PregnancyResource($pregnancy), 'Data kehamilan tersimpan', status: 201);
    }

    public function show(Request $request, Pregnancy $pregnancy)
    {
        $this->authorizeOwnership($request, $pregnancy);

        return $this->success(new PregnancyResource($pregnancy));
    }

    public function update(UpdatePregnancyRequest $request, Pregnancy $pregnancy)
    {
        $this->authorizeOwnership($request, $pregnancy);

        $pregnancy->update($this->withComputedEdd($request->validated()));

        return $this->success(new PregnancyResource($pregnancy->fresh()), 'Data kehamilan diperbarui');
    }

    /**
     * HPL otomatis dari HPHT (rumus Naegele), kecuali client mengirim edd_date
     * secara eksplisit (ditimpa manual) — PRD §9 F-03 kriteria terima.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function withComputedEdd(array $data): array
    {
        if (! empty($data['edd_date'])) {
            $data['edd_overridden'] = true;

            return $data;
        }

        $data['edd_date'] = $this->calculator
            ->estimatedDueDate(CarbonImmutable::parse($data['lmp_date']))
            ->toDateString();
        $data['edd_overridden'] = false;

        return $data;
    }

    private function authorizeOwnership(Request $request, Pregnancy $pregnancy): void
    {
        abort_unless($pregnancy->user_id === $request->user('api')->id, 404);
    }
}
