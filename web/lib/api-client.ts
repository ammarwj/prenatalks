const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

type ApiError = {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
};

export class ApiRequestError extends Error {
  fieldErrors?: Record<string, string[]>;
  status: number;

  constructor(message: string, status: number, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Bentuk respons backend mengikuti PRD §11.1. Endpoint /auth/* belum tersedia
 * di backend (lihat IMPLEMENTATION_CHECKLIST.md, bagian F-02 · Backend) —
 * pemanggilan berikut akan gagal dengan pesan yang jelas sampai endpoint itu ada.
 */
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiRequestError("Tidak dapat terhubung ke server. Periksa koneksi Anda dan coba lagi.", 0);
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

  return payload.data;
}
