<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\AdminUserResource;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Kelola pengguna & role — super_admin (PRD §5 RBAC, §8 `/admin/pengguna`,
 * §11.2 `GET/PUT /admin/users`).
 *
 * Tabel dengan pencarian, filter, sorting, dan paginasi **server-side**
 * (PRD §9 F-14) — daftar pengguna adalah satu-satunya tabel admin yang
 * pasti tumbuh sampai ribuan baris (target 1.000 pengguna, §3.2).
 */
class UserController extends Controller
{
    use ApiResponse;

    private const PER_PAGE = 15;

    /** Kolom yang boleh dipakai mengurutkan — bukan input bebas ke SQL. */
    private const SORTABLE = ['name', 'email', 'role', 'created_at', 'last_login_at'];

    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'role' => ['nullable', Rule::in(['user', 'health_worker', 'admin', 'super_admin'])],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
            'sort' => ['nullable', Rule::in(self::SORTABLE)],
            'direction' => ['nullable', Rule::in(['asc', 'desc'])],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = User::query();

        if ($search = $validated['search'] ?? null) {
            $query->where(fn (Builder $q) => $q->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%"));
        }

        if ($role = $validated['role'] ?? null) {
            $query->where('role', $role);
        }

        if ($status = $validated['status'] ?? null) {
            $query->where('is_active', $status === 'active');
        }

        $users = $query
            ->orderBy($validated['sort'] ?? 'created_at', $validated['direction'] ?? 'desc')
            ->paginate(self::PER_PAGE);

        return $this->success(
            AdminUserResource::collection($users),
            meta: [
                'current_page' => $users->currentPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
                'last_page' => $users->lastPage(),
            ]
        );
    }

    public function show(User $user)
    {
        return $this->success(new AdminUserResource($user));
    }

    /**
     * Hanya `role` dan `is_active` yang bisa diubah dari sini — nama, email,
     * dan password tetap milik pemilik akun (prinsip minimalisasi, §12.3).
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'role' => ['sometimes', 'required', Rule::in(['user', 'health_worker', 'admin', 'super_admin'])],
            'is_active' => ['sometimes', 'required', 'boolean'],
        ], [
            'role.in' => 'Peran tidak dikenali',
        ]);

        if ($guard = $this->guardSelfLockout($request, $user, $validated)) {
            return $guard;
        }

        if ($guard = $this->guardLastSuperAdmin($user, $validated)) {
            return $guard;
        }

        // `role` dan `is_active` sengaja tidak masuk `$fillable` di model User
        // (supaya registrasi tidak bisa menaikkan peran lewat mass assignment),
        // jadi perubahan di sini ditulis eksplisit.
        $user->forceFill($validated)->save();

        return $this->success(new AdminUserResource($user->fresh()), 'Pengguna diperbarui');
    }

    /**
     * Super admin tidak boleh menurunkan peran atau menonaktifkan dirinya
     * sendiri — sekali dilakukan, ia langsung kehilangan akses ke halaman
     * yang dipakai untuk membatalkannya.
     *
     * @param  array<string, mixed>  $validated
     */
    private function guardSelfLockout(Request $request, User $user, array $validated): mixed
    {
        if ($user->id !== $request->user('api')->id) {
            return null;
        }

        if (($validated['role'] ?? $user->role) !== 'super_admin') {
            return $this->error('Anda tidak dapat menurunkan peran akun Anda sendiri', [
                'role' => ['Minta super admin lain yang melakukannya'],
            ]);
        }

        if (($validated['is_active'] ?? $user->is_active) == false) {
            return $this->error('Anda tidak dapat menonaktifkan akun Anda sendiri', [
                'is_active' => ['Minta super admin lain yang melakukannya'],
            ]);
        }

        return null;
    }

    /**
     * Sistem harus selalu punya minimal satu super admin aktif; tanpa
     * penjaga ini, pengelolaan akun dan kuesioner risiko bisa terkunci
     * permanen tanpa jalan balik lewat antarmuka.
     *
     * @param  array<string, mixed>  $validated
     */
    private function guardLastSuperAdmin(User $user, array $validated): mixed
    {
        if ($user->role !== 'super_admin' || ! $user->is_active) {
            return null;
        }

        $stillSuperAdmin = ($validated['role'] ?? 'super_admin') === 'super_admin'
            && ($validated['is_active'] ?? true) == true;

        if ($stillSuperAdmin) {
            return null;
        }

        $others = User::where('role', 'super_admin')
            ->where('is_active', true)
            ->where('id', '!=', $user->id)
            ->count();

        return $others > 0
            ? null
            : $this->error('Harus ada minimal satu super admin aktif', [
                'role' => ['Tunjuk super admin lain lebih dulu'],
            ]);
    }
}
