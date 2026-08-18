"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiGet, ApiRequestError } from "@/lib/api-client";
import type { Consent, HealthWorkerNote } from "@/lib/types";

/**
 * Catatan edukasi yang diterima pengguna — PRD §9 F-15.
 *
 * Dimuat saat dibuka, bukan ikut `GET /consents`: daftar izin hanya membawa
 * jumlah catatan, dan isi catatan tidak perlu ada di memori halaman sampai
 * pengguna memintanya.
 */
export function ConsentNotesDialog({
  consent,
  onOpenChange,
}: {
  consent: Consent | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!consent} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Catatan Edukasi</DialogTitle>
          <DialogDescription>
            {consent ? `Dari ${consent.health_worker.name ?? "tenaga kesehatan"}` : ""}
          </DialogDescription>
        </DialogHeader>
        {consent && <ConsentNotesList key={consent.id} consentId={consent.id} />}
      </DialogContent>
    </Dialog>
  );
}

function ConsentNotesList({ consentId }: { consentId: number }) {
  const [notes, setNotes] = useState<HealthWorkerNote[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setNotes(await apiGet<HealthWorkerNote[]>(`/consents/${consentId}/notes`));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Gagal memuat catatan edukasi.");
      setNotes([]);
    }
  }, [consentId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  if (error) {
    return (
      <Alert variant="destructive" className="rounded-xl">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (notes === null) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Memuat catatan...
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Belum ada catatan edukasi dari tenaga kesehatan ini.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {notes.map((note) => (
        <li key={note.id} className="rounded-2xl border border-border bg-muted/40 p-4">
          <p className="whitespace-pre-wrap text-sm text-foreground">{note.body}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {note.health_worker_name ?? "Tenaga kesehatan"} ·{" "}
            {new Date(note.created_at).toLocaleString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {note.risk_assessment_id ? " · menanggapi satu hasil cek risiko" : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
