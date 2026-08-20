const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
};

/**
 * Fetch sisi server untuk halaman publik (Server Component) — dipakai
 * dengan Next.js ISR (`revalidate`) sesuai PRD §6.1, terpisah dari
 * `lib/api-client.ts` yang bergantung pada sesi Zustand (hanya untuk
 * browser).
 */
export async function apiServerGet<T>(
  path: string,
  revalidate: number | false = 300,
  /**
   * Tag cache opsional, supaya panel admin bisa membatalkan cache-nya lebih
   * cepat daripada menunggu `revalidate` habis — lihat
   * `app/api/revalidate-public/route.ts`.
   */
  tags?: string[]
): Promise<{ data: T | null; meta?: Record<string, unknown>; status: number }> {
  const response = await fetch(`${API_URL}${path}`, {
    next: revalidate === false ? (tags ? { tags } : undefined) : { revalidate, tags },
  });

  if (!response.ok) {
    return { data: null, meta: undefined, status: response.status };
  }

  const payload: ApiSuccess<T> = await response.json();

  return { data: payload.data, meta: payload.meta, status: response.status };
}
