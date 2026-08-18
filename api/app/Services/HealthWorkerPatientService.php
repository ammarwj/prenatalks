<?php

namespace App\Services;

use App\Http\Resources\HealthWorker\NoteResource;
use App\Http\Resources\RiskAssessmentSummaryResource;
use App\Models\HealthWorkerConsent;
use App\Models\Pregnancy;
use Carbon\CarbonImmutable;

/**
 * Menyusun apa yang boleh dilihat pemegang izin — PRD §9 F-15.
 *
 * Batas cakupannya sengaja sempit dan didefinisikan di satu tempat ini:
 * nama pemberi izin, konteks usia kehamilan, hasil cek risiko, dan catatan
 * edukasi. Yang **tidak** ikut meski ada di `pregnancies`: berat badan,
 * golongan darah, riwayat penyakit, nama & kontak fasilitas, serta email
 * dan telepon pemberi izin. Bunyi F-15 hanya menjanjikan "melihat hasil
 * assessment", dan usia kehamilan ikut karena skor risiko nyaris tidak bisa
 * dibaca tanpanya — sisanya tidak dibutuhkan untuk itu (minimalisasi data,
 * PRD §12.3).
 */
class HealthWorkerPatientService
{
    public function __construct(private readonly PregnancyCalculator $calculator) {}

    /**
     * Ringkasan untuk halaman daftar pasien — tanpa hasil dan tanpa catatan.
     *
     * @return array<string, mixed>
     */
    public function listItem(HealthWorkerConsent $consent): array
    {
        return [
            'consent_id' => $consent->id,
            'patient_name' => $consent->user?->name,
            'is_active' => $consent->isActive(),
            'expires_at' => $consent->expires_at,
            'granted_at' => $consent->created_at,
            'last_accessed_at' => $consent->last_accessed_at,
        ];
    }

    /**
     * Halaman detail satu pemberi izin.
     *
     * @return array<string, mixed>
     */
    public function detail(HealthWorkerConsent $consent): array
    {
        $patient = $consent->user;

        $assessments = $patient
            ? $patient->riskAssessments()
                ->where('status', 'completed')
                ->with('riskLevel')
                ->orderByDesc('completed_at')
                ->get()
            : collect();

        $notes = $consent->notes()->with('healthWorker')->orderByDesc('created_at')->get();

        return [
            ...$this->listItem($consent),
            'pregnancy' => $patient ? $this->pregnancyContext($patient->id) : null,
            'assessments' => RiskAssessmentSummaryResource::collection($assessments),
            'notes' => NoteResource::collection($notes),
        ];
    }

    /**
     * Usia kehamilan & HPL saja — dihitung, bukan disalin dari baris
     * `pregnancies`, supaya tidak ada kolom lain yang ikut terbawa.
     *
     * @return array<string, mixed>|null
     */
    private function pregnancyContext(int $userId): ?array
    {
        /** @var Pregnancy|null $pregnancy */
        $pregnancy = Pregnancy::query()
            ->where('user_id', $userId)
            ->where('status', 'active')
            ->latest()
            ->first();

        if (! $pregnancy) {
            return null;
        }

        $computed = $this->calculator->calculate(
            CarbonImmutable::parse($pregnancy->lmp_date),
            null,
            $pregnancy->edd_overridden && $pregnancy->edd_date
                ? CarbonImmutable::parse($pregnancy->edd_date)
                : null,
        );

        return [
            'gestational_age' => $computed['gestational_age'],
            'trimester' => $computed['trimester'],
            'edd_date' => $computed['edd_date'],
            'days_remaining' => $computed['days_remaining'],
        ];
    }
}
