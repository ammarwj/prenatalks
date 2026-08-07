import { authRefresh } from "@/lib/auth";
import { useAuthStore } from "@/lib/stores/auth-store";

export { ApiRequestError } from "@/lib/api-error";
import { ApiRequestError } from "@/lib/api-error";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
};

type ApiError = {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
};

/**
 * Bentuk respons backend mengikuti PRD §11.1. Menyertakan header
 * Authorization otomatis bila ada sesi tersimpan (lib/stores/auth-store.ts).
 *
 * Saat menerima 401 dari request yang terautentikasi, coba refresh sekali
 * lewat /api/auth/refresh lalu ulangi request — PRD §6.1 langkah 4. Bila
 * refresh juga gagal, sesi lokal dihapus dan pengguna diarahkan ke /masuk.
 */
async function apiRequestRaw<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  isRetry = false
): Promise<ApiSuccess<T>> {
  const { accessToken } = useAuthStore.getState();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiRequestError("Tidak dapat terhubung ke server. Periksa koneksi Anda dan coba lagi.", 0);
  }

  if (response.status === 401 && !isRetry && accessToken) {
    try {
      const refreshed = await authRefresh();
      useAuthStore.getState().setSession(refreshed.access_token, refreshed.user);
      return apiRequestRaw<T>(method, path, body, true);
    } catch {
      // clearSession() men-trigger guard reaktif di dashboard/admin layout
      // (accessToken jadi null → redirect ke /masuk), tidak perlu navigasi manual di sini.
      useAuthStore.getState().clearSession();
      throw new ApiRequestError("Sesi Anda berakhir, silakan masuk kembali.", 401);
    }
  }

  let payload: ApiSuccess<T> | ApiError | null = null;
  try {
    payload = await response.json();
  } catch {
    // respons bukan JSON (mis. 404 default Laravel) — ditangani di bawah
  }

  if (!response.ok || !payload || payload.success === false) {
    const message = payload?.message ?? `Permintaan gagal (${response.status})`;
    const fieldErrors = payload && "errors" in payload ? payload.errors : undefined;
    throw new ApiRequestError(message, response.status, fieldErrors);
  }

  return payload;
}

async function apiRequest<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
  const payload = await apiRequestRaw<T>(method, path, body);
  return payload.data;
}

export const apiGet = <T>(path: string) => apiRequest<T>("GET", path);

/**
 * Sama seperti `apiGet`, tapi ikut mengembalikan `meta` (mis. pagination,
 * ringkasan respon) yang dibuang oleh `apiGet` — dibutuhkan halaman yang
 * memakai bagian `meta` dari amplop respons standar (PRD §11.1).
 */
export const apiGetWithMeta = async <T, M = Record<string, unknown>>(
  path: string
): Promise<{ data: T; meta?: M }> => {
  const payload = await apiRequestRaw<T>("GET", path);
  return { data: payload.data, meta: payload.meta as M | undefined };
};
export const apiPost = <T>(path: string, body?: unknown) => apiRequest<T>("POST", path, body);
export const apiPut = <T>(path: string, body?: unknown) => apiRequest<T>("PUT", path, body);
export const apiPatch = <T>(path: string, body?: unknown) => apiRequest<T>("PATCH", path, body);
export const apiDelete = <T>(path: string) => apiRequest<T>("DELETE", path);

/**
 * Submit form/survei publik (`POST /forms/{slug}/submit`) — perlu `FormData`
 * (bukan JSON) karena bisa memuat field unggah berkas, jadi tidak lewat
 * `apiRequest`. Header Authorization tetap disertakan bila ada sesi (form
 * bisa saja wajib login), tapi tanpa retry-refresh 401 seperti `apiRequest`
 * karena 401 di sini berarti aturan form itu sendiri ("wajib login"), bukan
 * token kedaluwarsa yang perlu diperbarui otomatis.
 */
export async function apiPostForm<T>(path: string, formData: FormData): Promise<T> {
  const { accessToken } = useAuthStore.getState();
  const headers: Record<string, string> = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { method: "POST", headers, body: formData });
  } catch {
    throw new ApiRequestError("Tidak dapat terhubung ke server. Periksa koneksi Anda dan coba lagi.", 0);
  }

  let payload: ApiSuccess<T> | ApiError | null = null;
  try {
    payload = await response.json();
  } catch {
    // respons bukan JSON — ditangani di bawah
  }

  if (!response.ok || !payload || payload.success === false) {
    const message = payload?.message ?? `Permintaan gagal (${response.status})`;
    const fieldErrors = payload && "errors" in payload ? payload.errors : undefined;
    throw new ApiRequestError(message, response.status, fieldErrors);
  }

  return payload.data;
}

/**
 * Endpoint PDF (`GET /assessments/{id}/pdf`) mengembalikan berkas biner, bukan
 * amplop JSON standar, jadi tidak lewat `apiRequest` — tapi tetap perlu header
 * Authorization yang sama karena rutenya di balik `auth:api`.
 */
export async function apiDownload(path: string, filename: string): Promise<void> {
  const { accessToken } = useAuthStore.getState();
  const response = await fetch(`${API_URL}${path}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });

  if (!response.ok) {
    let message = `Gagal mengunduh berkas (${response.status})`;
    try {
      const payload = (await response.json()) as ApiError;
      message = payload.message ?? message;
    } catch {
      // respons bukan JSON — pertahankan pesan generik di atas
    }
    throw new ApiRequestError(message, response.status);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
