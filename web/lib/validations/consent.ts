import { z } from "zod";

/**
 * PRD §9 F-15 — pemberian izin akses ke tenaga kesehatan.
 *
 * Pencarian memakai email **persis** karena begitulah endpointnya bekerja
 * (`GET /consents/health-workers?email=`): pencocokan sebagian akan
 * mengubahnya jadi direktori tenaga kesehatan yang bisa disisir siapa pun.
 */
export const healthWorkerLookupSchema = z.object({
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
});

export type HealthWorkerLookupInput = z.infer<typeof healthWorkerLookupSchema>;

/** Catatan edukasi — batasnya sama dengan StoreNoteRequest di backend. */
export const healthWorkerNoteSchema = z.object({
  body: z
    .string()
    .trim()
    .min(5, "Catatan edukasi terlalu pendek")
    .max(2000, "Catatan edukasi maksimal 2000 karakter"),
});

export type HealthWorkerNoteInput = z.infer<typeof healthWorkerNoteSchema>;

/** Kode tautan yang ditempel manual di `/nakes` bila tautannya tidak diklik. */
export const accessCodeSchema = z.object({
  code: z.string().trim().min(1, "Kode tautan wajib diisi").max(100, "Kode tautan tidak valid"),
});

export type AccessCodeInput = z.infer<typeof accessCodeSchema>;
