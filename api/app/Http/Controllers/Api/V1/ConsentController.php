<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\HealthWorker\StoreConsentRequest;
use App\Http\Resources\HealthWorker\ConsentResource;
use App\Http\Resources\HealthWorker\HealthWorkerDirectoryResource;
use App\Http\Resources\HealthWorker\NoteResource;
use App\Models\HealthWorkerConsent;
use App\Models\User;
use App\Services\HealthWorkerConsentService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

/**
 * Sisi pemberi izin — PRD §9 F-15, BUSINESS_FLOWS §9.
 *
 * Semua rute di sini milik pengguna biasa: ia yang memberi, melihat, dan
 * mencabut izin atas datanya sendiri. Kepemilikan dicek per-baris
 * (`guardOwnership`) dan bukan lewat middleware peran, karena yang membatasi
 * bukan "peran apa Anda" melainkan "baris ini milik siapa".
 */
class ConsentController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly HealthWorkerConsentService $consents) {}

    public function index(Request $request)
    {
        $consents = HealthWorkerConsent::query()
            ->where('user_id', $request->user('api')->id)
            ->with('healthWorker')
            ->withCount('notes')
            // Izin yang masih hidup di atas, riwayat yang sudah dicabut di
            // bawah — yang bisa ditindaklanjuti pengguna adalah yang aktif.
            ->orderByRaw('revoked_at IS NULL DESC')
            ->orderByDesc('created_at')
            ->get();

        return $this->success(ConsentResource::collection($consents));
    }

    /**
     * Pencarian dengan email **persis**, bukan pencarian sebagian seperti
     * daftar pengguna di panel admin. Pencocokan sebagian akan mengubah
     * endpoint ini jadi direktori tenaga kesehatan yang bisa disisir siapa
     * pun yang punya akun; dengan email persis, pemanggil harus sudah tahu
     * siapa yang dicarinya — dan memang begitu alurnya: bidan memberi
     * emailnya kepada pasien, bukan sebaliknya.
     */
    public function healthWorkers(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        $healthWorker = User::query()
            ->where('role', 'health_worker')
            ->where('is_active', true)
            ->where('email', $validated['email'])
            ->first();

        return $this->success(
            $healthWorker ? [new HealthWorkerDirectoryResource($healthWorker)] : [],
            $healthWorker ? 'Tenaga kesehatan ditemukan' : 'Tidak ada tenaga kesehatan dengan email tersebut'
        );
    }

    /**
     * Kode tautan hanya dikembalikan di sini dan di `regenerate` — setelah
     * itu yang tersimpan tinggal hash-nya, jadi tidak ada endpoint yang bisa
     * menampilkannya lagi.
     */
    public function store(StoreConsentRequest $request)
    {
        $user = $request->user('api');
        $healthWorker = User::findOrFail($request->validated('health_worker_id'));

        if ($healthWorker->id === $user->id) {
            return $this->error('Anda tidak perlu memberi izin kepada akun Anda sendiri', [
                'health_worker_id' => ['Pilih akun tenaga kesehatan lain'],
            ]);
        }

        $existing = HealthWorkerConsent::query()
            ->active()
            ->where('user_id', $user->id)
            ->where('health_worker_id', $healthWorker->id)
            ->first();

        // Indeks unik parsial di DB sudah menjaga hal yang sama, tapi
        // dijawab di sini supaya pengguna dapat pesan yang bisa
        // ditindaklanjuti ("buat ulang kodenya") alih-alih 500 dari DB.
        if ($existing) {
            return $this->error('Anda sudah memberi izin kepada tenaga kesehatan ini', [
                'health_worker_id' => ['Cabut izin lama atau buat ulang kode tautannya'],
            ]);
        }

        [$code, $consent] = $this->consents->issue($user, $healthWorker, $request->validated('expires_at'));

        return $this->success([
            'consent' => new ConsentResource($consent->load('healthWorker')),
            'access_code' => $code,
            'access_link' => $this->consents->linkFor($code),
        ], 'Izin diberikan — bagikan tautan ini hanya kepada tenaga kesehatan tersebut', status: 201);
    }

    public function regenerate(Request $request, HealthWorkerConsent $consent)
    {
        $this->guardOwnership($request, $consent);

        abort_if(
            ! $consent->isActive(),
            422,
            'Izin ini sudah tidak aktif — berikan izin baru bila masih dibutuhkan'
        );

        $code = $this->consents->regenerate($consent);

        return $this->success([
            'consent' => new ConsentResource($consent->load('healthWorker')),
            'access_code' => $code,
            'access_link' => $this->consents->linkFor($code),
        ], 'Kode tautan baru dibuat — tautan lama tidak berlaku lagi');
    }

    /**
     * Pencabutan menulis `revoked_at`, bukan menghapus baris: jejak "pernah
     * diberikan lalu dicabut" bagian dari yang ingin diaudit (PRD §9 F-15),
     * dan catatan edukasi yang sudah ditulis tetap bisa dibaca pengguna.
     */
    public function destroy(Request $request, HealthWorkerConsent $consent)
    {
        $this->guardOwnership($request, $consent);

        $consent->revoke();

        return $this->success(
            new ConsentResource($consent->load('healthWorker')),
            'Izin dicabut — tautan yang sudah dibagikan langsung tidak berlaku'
        );
    }

    /** Catatan edukasi tetap terbaca pemiliknya meski izinnya sudah dicabut. */
    public function notes(Request $request, HealthWorkerConsent $consent)
    {
        $this->guardOwnership($request, $consent);

        $notes = $consent->notes()->with('healthWorker')->orderByDesc('created_at')->get();

        return $this->success(NoteResource::collection($notes));
    }

    /**
     * 404, bukan 403: izin milik orang lain tidak boleh bisa dipastikan
     * keberadaannya dengan menebak id.
     */
    private function guardOwnership(Request $request, HealthWorkerConsent $consent): void
    {
        abort_unless($consent->user_id === $request->user('api')->id, 404);
    }
}
