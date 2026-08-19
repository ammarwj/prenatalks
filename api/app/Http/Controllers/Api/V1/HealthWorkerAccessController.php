<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\HealthWorker\StoreNoteRequest;
use App\Http\Resources\HealthWorker\NoteResource;
use App\Http\Resources\RiskAssessmentResource;
use App\Models\HealthWorkerConsent;
use App\Models\HealthWorkerNote;
use App\Models\RiskAssessment;
use App\Notifications\HealthWorkerNoteReceivedNotification;
use App\Services\AuditRecorder;
use App\Services\HealthWorkerConsentService;
use App\Services\HealthWorkerPatientService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

/**
 * Sisi tenaga kesehatan — PRD §9 F-15, BUSINESS_FLOWS §9.
 *
 * Dua lapis penjagaan, dan keduanya memang diperlukan:
 *
 * 1. Peran `health_worker` (middleware di route). Kode tautan saja tidak
 *    cukup — F-15 menjanjikan akses untuk tenaga kesehatan **terverifikasi**,
 *    dan verifikasi itu adalah peran yang diberikan super admin.
 * 2. Izin yang masih aktif dan memang menunjuk akun ini (`guardConsent`).
 *    Karena itu tautan yang bocor atau diteruskan tidak membuka apa pun bagi
 *    penerimanya — ia bukan kredensial pembawa (bearer).
 *
 * Konsekuensi yang disengaja dari lapis kedua: pencabutan berlaku pada
 * permintaan berikutnya, bukan menunggu kode kedaluwarsa (BUSINESS_FLOWS §9).
 */
class HealthWorkerAccessController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly HealthWorkerConsentService $consents,
        private readonly HealthWorkerPatientService $patients,
    ) {}

    /**
     * Menukar kode tautan dengan izinnya — langkah "Tenaga kesehatan buka
     * tautan" pada BUSINESS_FLOWS §9.
     *
     * Kode dikirim di body, bukan sebagai segmen URL, supaya tidak ikut
     * tercatat di access log Nginx dan riwayat peramban.
     */
    public function redeem(Request $request)
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:100'],
        ]);

        $consent = $this->consents->findActiveByCode($validated['code']);

        // Satu pesan untuk semua kegagalan: kode salah, izin dicabut, izin
        // kedaluwarsa, dan izin milik tenaga kesehatan lain tidak dibedakan.
        // Membedakannya akan memberi tahu penebak kode bahwa tebakannya
        // mengenai izin yang benar-benar ada.
        if (! $consent || $consent->health_worker_id !== $request->user('api')->id) {
            return $this->error('Tautan tidak berlaku — kode salah atau izinnya sudah dicabut', null, 404);
        }

        $this->recordAccess($consent, 'redeem');

        return $this->success(
            $this->patients->detail($consent->load('user')),
            'Akses dibuka'
        );
    }

    /**
     * Daftar pemberi izin. Tanpa ini tenaga kesehatan harus menyimpan sendiri
     * tautan tiap pasien; kode tautan tetap satu-satunya cara izin masuk ke
     * daftar ini.
     */
    public function patients(Request $request)
    {
        $consents = HealthWorkerConsent::query()
            ->active()
            ->where('health_worker_id', $request->user('api')->id)
            ->with('user')
            ->orderByDesc('last_accessed_at')
            ->orderByDesc('created_at')
            ->get();

        return $this->success($consents->map(fn ($consent) => $this->patients->listItem($consent))->all());
    }

    public function show(Request $request, HealthWorkerConsent $consent)
    {
        $this->guardConsent($request, $consent);
        $this->recordAccess($consent, 'patient_summary');

        return $this->success($this->patients->detail($consent->load('user')));
    }

    /**
     * Rincian satu hasil cek risiko — termasuk faktor penyumbang skor, sama
     * seperti yang dilihat pemiliknya di `/dashboard/cek-risiko/hasil`.
     */
    public function assessment(Request $request, HealthWorkerConsent $consent, RiskAssessment $assessment)
    {
        $this->guardConsent($request, $consent);

        // Hasil harus milik pemberi izin ini. Tanpa cek ini, satu izin yang
        // sah akan membuka seluruh tabel `risk_assessments` lewat id di URL.
        abort_unless($assessment->user_id === $consent->user_id, 404);
        abort_if($assessment->status !== 'completed', 404);

        $this->recordAccess($consent, 'assessment', $assessment->id);

        return $this->success(
            new RiskAssessmentResource($assessment->load(['riskLevel', 'answers.question', 'answers.option']))
        );
    }

    public function storeNote(StoreNoteRequest $request, HealthWorkerConsent $consent)
    {
        $this->guardConsent($request, $consent);

        $assessmentId = $request->validated('risk_assessment_id');

        if ($assessmentId !== null) {
            abort_unless(
                RiskAssessment::where('id', $assessmentId)->where('user_id', $consent->user_id)->exists(),
                404
            );
        }

        // Penulisan catatan tercatat di `audit_logs` lewat trait Auditable
        // pada model HealthWorkerNote — tidak perlu dicatat ulang di sini.
        $note = HealthWorkerNote::create([
            'consent_id' => $consent->id,
            'health_worker_id' => $request->user('api')->id,
            'risk_assessment_id' => $assessmentId,
            'body' => $request->validated('body'),
        ]);

        // Tanpa kabar ini catatan hanya ditemukan pengguna yang kebetulan
        // membuka halaman privasinya — padahal isinya justru sering menuntut
        // tindak lanjut cepat.
        $consent->user?->notify(new HealthWorkerNoteReceivedNotification($request->user('api')->name));

        return $this->success(
            new NoteResource($note->load('healthWorker')),
            'Catatan edukasi tersimpan',
            status: 201
        );
    }

    /**
     * Pembacaan tidak mengubah baris apa pun, jadi trait Auditable tidak
     * akan menangkapnya — padahal justru pembacaan inilah yang wajib punya
     * jejak pada fitur ini (BUSINESS_FLOWS §9: "Lihat hasil assessment" →
     * "Tercatat di audit_logs"). Karena itu dicatat eksplisit di sini.
     */
    private function recordAccess(HealthWorkerConsent $consent, string $via, ?int $assessmentId = null): void
    {
        AuditRecorder::record('accessed', $consent, array_filter([
            'via' => $via,
            'risk_assessment_id' => $assessmentId,
        ], fn ($value) => $value !== null));

        // saveQuietly() tidak dipakai: event `updated` boleh jalan, tapi
        // `last_accessed_at` ada di auditIgnore() model sehingga diff-nya
        // kosong dan tidak ada baris audit kedua yang tertulis.
        $consent->last_accessed_at = now();
        $consent->save();
    }

    /**
     * 404 untuk izin milik tenaga kesehatan lain — alasannya sama dengan
     * ConsentController::guardOwnership. Izin yang tidak lagi aktif juga
     * 404, bukan 403: setelah dicabut, tidak ada yang perlu dikonfirmasi
     * keberadaannya kepada bekas pemegangnya.
     */
    private function guardConsent(Request $request, HealthWorkerConsent $consent): void
    {
        abort_unless($consent->health_worker_id === $request->user('api')->id, 404);
        abort_unless($consent->isActive(), 404);
    }
}
