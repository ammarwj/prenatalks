<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\CalculatorRequest;
use App\Services\PregnancyCalculator;
use App\Traits\ApiResponse;
use Carbon\CarbonImmutable;

class CalculatorController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly PregnancyCalculator $calculator) {}

    public function __invoke(CalculatorRequest $request)
    {
        $lmpDate = CarbonImmutable::createFromFormat('Y-m-d', $request->validated('lmp_date'));

        return $this->success(
            $this->calculator->calculate($lmpDate),
            'Perhitungan berhasil',
        );
    }
}
