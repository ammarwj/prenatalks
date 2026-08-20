"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { ConsentCard } from "@/components/dashboard/consent-card";
import { ConsentGrantDialog } from "@/components/dashboard/consent-grant-dialog";
import { ConsentLinkDialog } from "@/components/dashboard/consent-link-dialog";
import { ConsentNotesDialog } from "@/components/dashboard/consent-notes-dialog";
import { ListSkeleton } from "@/components/shared/loading-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiDelete, apiGet, apiPost, ApiRequestError } from "@/lib/api-client";
import type { Consent, ConsentIssued } from "@/lib/types";

/**
 * Pengaturan privasi — akses tenaga kesehatan (PRD §9 F-15,
 * BUSINESS_FLOWS §9).
 *
 * Semua status berasal dari satu `GET /consents`; tiap aksi memuat ulang
 * daftar itu alih-alih menambal state lokal, karena satu aksi bisa mengubah
 * lebih dari satu kolom baris (mis. mencabut izin juga membekukan
 * `last_accessed_at`) dan daftarnya pendek.
 */
export default function PrivasiPage() {
  const [consents, setConsents] = useState<Consent[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [grantOpen, setGrantOpen] = useState(false);
  const [issued, setIssued] = useState<ConsentIssued | null>(null);
  const [notesTarget, setNotesTarget] = useState<Consent | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<Consent | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setConsents(await apiGet<Consent[]>("/consents"));
    } catch (err) {
      setLoadError(err instanceof ApiRequestError ? err.message : "Gagal memuat daftar izin.");
      setConsents([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleRegenerate(consent: Consent) {
    setBusyId(consent.id);
    try {
      setIssued(await apiPost<ConsentIssued>(`/consents/${consent.id}/regenerate`));
      await load();
    } catch (err) {
      toast.error(
        err instanceof ApiRequestError ? err.message : "Gagal membuat ulang tautan, coba lagi."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleRevoke(consent: Consent) {
    setBusyId(consent.id);
    try {
      await apiDelete(`/consents/${consent.id}`);
      setRevokeTarget(null);
      toast.success("Izin dicabut — tautan yang sudah dibagikan langsung tidak berlaku.");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Gagal mencabut izin, coba lagi.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">Privasi & Akses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Atur siapa yang boleh melihat hasil cek risiko Anda.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setGrantOpen(true)}
          className="gap-1.5 rounded-full bg-primary text-white shadow-soft hover:bg-[#EC4899]"
        >
          <Plus className="size-4" />
          Beri Izin
        </Button>
      </div>

      <Card className="rounded-3xl border border-brand-purple/20 bg-brand-purple-soft shadow-none">
        <CardContent className="flex gap-3 px-6 py-5">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand-purple" />
          <div className="space-y-1 text-sm text-foreground">
            <p className="font-semibold">Tidak ada yang bisa melihat data Anda tanpa izin ini.</p>
            <p className="text-muted-foreground">
              Tenaga kesehatan yang Anda beri izin dapat melihat hasil cek risiko dan usia kehamilan
              Anda, serta menulis catatan edukasi. Setiap kali mereka membukanya, aksesnya tercatat.
              Anda dapat mencabut izin kapan saja — pencabutan berlaku seketika, tidak menunggu
              tautannya kedaluwarsa.
            </p>
          </div>
        </CardContent>
      </Card>

      {loadError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {consents === null ? (
        <ListSkeleton rows={3} framed={false} withAvatar label="Memuat daftar izin" />
      ) : consents.length === 0 ? (
        <Card className="rounded-3xl border border-dashed border-border">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Anda belum memberi izin kepada siapa pun. Hasil cek risiko Anda hanya terlihat oleh Anda
            sendiri.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {consents.map((consent) => (
            <ConsentCard
              key={consent.id}
              consent={consent}
              isBusy={busyId === consent.id}
              onRegenerate={() => handleRegenerate(consent)}
              onRevoke={() => setRevokeTarget(consent)}
              onOpenNotes={() => setNotesTarget(consent)}
            />
          ))}
        </div>
      )}

      <ConsentGrantDialog
        open={grantOpen}
        onOpenChange={setGrantOpen}
        onIssued={(next) => {
          setGrantOpen(false);
          setIssued(next);
          load();
        }}
      />

      <ConsentLinkDialog issued={issued} onOpenChange={(open) => !open && setIssued(null)} />

      <ConsentNotesDialog
        consent={notesTarget}
        onOpenChange={(open) => !open && setNotesTarget(null)}
      />

      <Dialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cabut izin akses?</DialogTitle>
            <DialogDescription>
              {revokeTarget?.health_worker.name ?? "Tenaga kesehatan ini"} tidak akan bisa membuka
              hasil cek risiko Anda lagi, mulai saat ini juga. Catatan edukasi yang sudah ditulis
              tetap dapat Anda baca.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRevokeTarget(null)}>
              Batal
            </Button>
            <Button
              type="button"
              onClick={() => revokeTarget && handleRevoke(revokeTarget)}
              disabled={busyId !== null}
              className="gap-1.5 rounded-full bg-danger text-white hover:bg-danger/90"
            >
              {busyId !== null && <Loader2 className="size-4 animate-spin" />}
              Cabut izin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
