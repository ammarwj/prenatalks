"use client";

import { useMemo, useState } from "react";
import { Loader2, Search, ShieldCheck } from "lucide-react";

import { FormField } from "@/components/shared/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiGet, apiPost, ApiRequestError } from "@/lib/api-client";
import { addDays, today, toIsoDate } from "@/lib/date-utils";
import { healthWorkerLookupSchema } from "@/lib/validations/consent";
import type { ConsentIssued, HealthWorkerDirectoryEntry } from "@/lib/types";

/**
 * Memberi izin ke satu tenaga kesehatan — PRD §9 F-15.
 *
 * Dua langkah dan bukan satu form: pengguna mencari dulu lewat email, lalu
 * mengonfirmasi nama yang muncul. Konfirmasi itu bagian dari "consent
 * eksplisit" — memberi izin kepada id yang tak pernah dilihat namanya bukan
 * persetujuan yang berarti.
 */
export function ConsentGrantDialog({
  open,
  onOpenChange,
  onIssued,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIssued: (issued: ConsentIssued) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Beri Izin Tenaga Kesehatan</DialogTitle>
          <DialogDescription>
            Masukkan alamat email akun PrenaTalks milik bidan atau dokter Anda.
          </DialogDescription>
        </DialogHeader>
        {/* Di-mount ulang tiap kali dibuka supaya sisa pencarian sebelumnya
            tidak terbawa — pola yang sama dengan dialog admin. */}
        {open && <ConsentGrantForm onCancel={() => onOpenChange(false)} onIssued={onIssued} />}
      </DialogContent>
    </Dialog>
  );
}

function ConsentGrantForm({
  onCancel,
  onIssued,
}: {
  onCancel: () => void;
  onIssued: (issued: ConsentIssued) => void;
}) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [found, setFound] = useState<HealthWorkerDirectoryEntry | null>(null);
  const [expiresAt, setExpiresAt] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    setServerError(null);

    const parsed = healthWorkerLookupSchema.safeParse({ email: email.trim() });
    if (!parsed.success) {
      setEmailError(parsed.error.issues[0]?.message ?? "Email tidak valid");
      return;
    }

    setEmailError(null);
    setIsSearching(true);
    try {
      const results = await apiGet<HealthWorkerDirectoryEntry[]>(
        `/consents/health-workers?email=${encodeURIComponent(parsed.data.email)}`
      );
      setFound(results[0] ?? null);
      setSearched(true);
    } catch (err) {
      setServerError(
        err instanceof ApiRequestError ? err.message : "Gagal mencari tenaga kesehatan, coba lagi."
      );
    } finally {
      setIsSearching(false);
    }
  }

  async function handleGrant() {
    if (!found) {
      return;
    }
    setServerError(null);
    setIsSaving(true);
    try {
      const issued = await apiPost<ConsentIssued>("/consents", {
        health_worker_id: found.id,
        // Tanggal saja; backend menerima apa pun yang bisa diurai sebagai
        // tanggal dan menyimpannya sebagai batas kedaluwarsa.
        expires_at: expiresAt || null,
      });
      onIssued(issued);
    } catch (err) {
      setServerError(
        err instanceof ApiRequestError ? err.message : "Gagal memberi izin, coba lagi."
      );
    } finally {
      setIsSaving(false);
    }
  }

  // Batas bawah kalender: besok. Backend menolak `expires_at` yang tidak
  // lebih dari sekarang (`after:now`), jadi memilih hari ini akan gagal 422.
  const tomorrow = useMemo(() => toIsoDate(addDays(today(), 1)), []);

  return (
    <div className="space-y-4">
      {serverError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSearch} noValidate className="space-y-4">
        <FormField
          label="Email tenaga kesehatan"
          htmlFor="health-worker-email"
          error={emailError ?? undefined}
          hint="Alamat email harus ditulis lengkap dan persis seperti yang mereka pakai mendaftar."
        >
          <div className="flex gap-2">
            <Input
              id="health-worker-email"
              type="email"
              inputMode="email"
              autoComplete="off"
              placeholder="bidan@contoh.com"
              className="h-11 rounded-xl"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setFound(null);
                setSearched(false);
              }}
            />
            <Button
              type="submit"
              variant="outline"
              disabled={isSearching}
              className="h-11 gap-1.5 rounded-xl"
            >
              {isSearching ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              Cari
            </Button>
          </div>
        </FormField>
      </form>

      {searched && !found && (
        <Alert className="rounded-xl">
          <AlertDescription>
            Tidak ada akun tenaga kesehatan terverifikasi dengan email tersebut. Pastikan mereka
            sudah mendaftar di PrenaTalks dan akunnya telah diverifikasi admin.
          </AlertDescription>
        </Alert>
      )}

      {found && (
        <div className="space-y-4 rounded-2xl border border-border bg-muted/40 p-4">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand-teal-text" />
            <div>
              <p className="text-sm font-semibold text-foreground">{found.name}</p>
              <p className="text-xs text-muted-foreground">{found.email}</p>
            </div>
          </div>

          <FormField
            label="Berakhir otomatis pada (opsional)"
            htmlFor="consent-expires-at"
            hint="Kosongkan bila izin berlaku sampai Anda mencabutnya sendiri."
          >
            <DatePicker
              id="consent-expires-at"
              value={expiresAt}
              min={tomorrow}
              onChange={setExpiresAt}
              placeholder="Tanpa batas waktu"
              className="h-11 rounded-xl"
            />
          </FormField>

          <p className="text-xs text-muted-foreground">
            Dengan memberi izin, {found.name} dapat melihat hasil cek risiko dan usia kehamilan Anda
            serta menulis catatan edukasi. Data lain — berat badan, golongan darah, riwayat
            penyakit, dan kontak Anda — tetap tidak terlihat.
          </p>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button
          type="button"
          onClick={handleGrant}
          disabled={!found || isSaving}
          className="gap-1.5 rounded-full bg-primary text-white hover:bg-[#EC4899]"
        >
          {isSaving && <Loader2 className="size-4 animate-spin" />}
          {isSaving ? "Memberi izin..." : "Beri izin"}
        </Button>
      </DialogFooter>
    </div>
  );
}
