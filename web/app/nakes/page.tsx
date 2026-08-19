"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, KeyRound, Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiGet, apiPost, ApiRequestError } from "@/lib/api-client";
import { accessCodeSchema } from "@/lib/validations/consent";
import type { HealthWorkerPatient, HealthWorkerPatientDetail } from "@/lib/types";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Beranda tenaga kesehatan — PRD §9 F-15, BUSINESS_FLOWS §9.
 *
 * Daftar pasien di sini bukan pengganti kode tautan: sebuah nama hanya bisa
 * masuk ke daftar setelah kodenya ditukar sekali, dan langsung hilang begitu
 * izinnya dicabut. Jalur utama kode adalah email pemberitahuan izin; kolom
 * tempel kode tetap ada untuk tautan yang sampai lewat jalur lain.
 */
export default function NakesPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<HealthWorkerPatient[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setPatients(await apiGet<HealthWorkerPatient[]>("/health-worker/patients"));
    } catch (err) {
      setLoadError(err instanceof ApiRequestError ? err.message : "Gagal memuat daftar pasien.");
      setPatients([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleRedeem(event: React.FormEvent) {
    event.preventDefault();

    const parsed = accessCodeSchema.safeParse({ code });
    if (!parsed.success) {
      setCodeError(parsed.error.issues[0]?.message ?? "Kode tautan tidak valid");
      return;
    }

    setCodeError(null);
    setIsRedeeming(true);
    try {
      const detail = await apiPost<HealthWorkerPatientDetail>("/health-worker/access", {
        code: parsed.data.code,
      });
      router.push(`/nakes/pasien/${detail.consent_id}`);
    } catch (err) {
      setCodeError(
        err instanceof ApiRequestError ? err.message : "Gagal membuka tautan, coba lagi."
      );
    } finally {
      setIsRedeeming(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-foreground">Akses Pasien</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hasil cek risiko hanya terbuka selama pasien mengizinkannya. Setiap kali Anda membukanya,
          aksesnya tercatat dan dapat dilihat pengelola.
        </p>
      </div>

      <Card className="rounded-3xl border border-border shadow-soft">
        <CardContent className="px-6 py-5">
          <form onSubmit={handleRedeem} noValidate className="space-y-2">
            <label htmlFor="access-code" className="text-sm font-semibold text-foreground">
              Buka dengan kode tautan
            </label>
            <p className="text-xs text-muted-foreground">
              Tautan akses dikirim ke email Anda begitu pasien memberi izin. Kolom ini untuk kode
              yang Anda terima lewat jalur lain, mis. disalin pasien dari layarnya.
            </p>
            <div className="flex flex-wrap items-start gap-2">
              <div className="min-w-48 flex-1">
                <Input
                  id="access-code"
                  autoComplete="off"
                  placeholder="Tempel kode dari tautan yang dikirim pasien"
                  className="h-11 rounded-xl font-mono"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                />
                {codeError && <p className="mt-1 text-xs font-medium text-danger">{codeError}</p>}
              </div>
              <Button
                type="submit"
                disabled={isRedeeming}
                className="h-11 gap-1.5 rounded-full bg-primary text-white hover:bg-[#EC4899]"
              >
                {isRedeeming ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <KeyRound className="size-4" />
                )}
                Buka
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {loadError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        <h2 className="font-display text-base font-bold text-foreground">Pasien dengan izin aktif</h2>

        {patients === null ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Memuat daftar pasien...
          </div>
        ) : patients.length === 0 ? (
          <Card className="rounded-3xl border border-dashed border-border">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Belum ada pasien yang memberi izin. Mintalah pasien membagikan tautan akses dari
              halaman Privasi & Akses di akun mereka.
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {patients.map((patient) => (
              <li key={patient.consent_id}>
                <Link
                  href={`/nakes/pasien/${patient.consent_id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-white px-5 py-4 shadow-soft transition hover:bg-muted/50"
                >
                  <div>
                    <p className="font-semibold text-foreground">
                      {patient.patient_name ?? "Pasien"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Izin sejak {formatDate(patient.granted_at)}
                      {patient.expires_at ? ` · berakhir ${formatDate(patient.expires_at)}` : ""}
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
