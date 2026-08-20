"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ChecklistCustomForm } from "@/components/dashboard/checklist-custom-form";
import { ChecklistGroupCard } from "@/components/dashboard/checklist-group-card";
import { CircularProgress } from "@/components/shared/circular-progress";
import { CardGridSkeleton } from "@/components/shared/loading-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { apiDelete, apiGet, apiPatch, apiPost, ApiRequestError } from "@/lib/api-client";
import { applyChecklistToggle, checklistItemKey } from "@/lib/checklist";
import type { ChecklistItem, ChecklistOverview } from "@/lib/types";

/**
 * Checklist persiapan melahirkan — PRD §9 F-11, sitemap §8
 * (`/dashboard/persiapan`).
 *
 * Setiap mutasi mengembalikan seluruh ringkasan checklist dari server, jadi
 * state selalu diselaraskan ulang setelah aksi berhasil. Centang diterapkan
 * optimistis lebih dulu supaya kotak centang terasa langsung merespons.
 */
export default function PersiapanPage() {
  const [overview, setOverview] = useState<ChecklistOverview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingKeys, setPendingKeys] = useState<ReadonlySet<string>>(new Set());

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setOverview(await apiGet<ChecklistOverview>("/checklist"));
    } catch (err) {
      setLoadError(
        err instanceof ApiRequestError ? err.message : "Gagal memuat checklist persiapan."
      );
    }
  }, []);

  useEffect(() => {
    // Fetch saat mount — setState terjadi setelah await, di luar eksekusi
    // sinkron efek ini, bukan pola derived-state yang diincar aturan lint ini.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function markPending(key: string, isPending: boolean) {
    setPendingKeys((prev) => {
      const next = new Set(prev);
      if (isPending) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  }

  async function handleToggle(item: ChecklistItem, isChecked: boolean) {
    if (!overview) return;

    const key = checklistItemKey(item);
    const snapshot = overview;

    setActionError(null);
    markPending(key, true);
    setOverview(applyChecklistToggle(overview, item, isChecked));

    try {
      const path =
        item.type === "custom" ? `/checklist/custom/${item.id}` : `/checklist/${item.id}`;
      setOverview(await apiPatch<ChecklistOverview>(path, { is_checked: isChecked }));
    } catch (err) {
      setOverview(snapshot);
      setActionError(
        err instanceof ApiRequestError ? err.message : "Gagal menyimpan perubahan checklist."
      );
    } finally {
      markPending(key, false);
    }
  }

  async function handleAddCustom(title: string) {
    setActionError(null);
    try {
      setOverview(await apiPost<ChecklistOverview>("/checklist/custom", { title }));
      toast.success("Item pribadi ditambahkan");
    } catch (err) {
      setActionError(
        err instanceof ApiRequestError ? err.message : "Gagal menambahkan item pribadi."
      );
      throw err;
    }
  }

  async function handleRemoveCustom(item: ChecklistItem) {
    const key = checklistItemKey(item);

    setActionError(null);
    markPending(key, true);
    try {
      setOverview(await apiDelete<ChecklistOverview>(`/checklist/custom/${item.id}`));
      toast.success("Item pribadi dihapus");
    } catch (err) {
      setActionError(
        err instanceof ApiRequestError ? err.message : "Gagal menghapus item pribadi."
      );
    } finally {
      markPending(key, false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-foreground">
          Persiapan Melahirkan
        </h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Yuk, siapkan bersama-sama. Centang setiap hal yang sudah Anda siapkan — progresnya
          tersimpan otomatis dan bisa Anda lanjutkan kapan saja.
        </p>
      </div>

      {loadError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}
      {actionError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      {overview === null ? (
        !loadError && (
          <div className="space-y-6">
            <section className="flex flex-col items-center gap-5 rounded-3xl border border-border bg-primary-soft p-6 sm:flex-row">
              <Skeleton className="size-32 shrink-0 rounded-full bg-primary/15" />
              <div className="w-full space-y-2.5">
                <Skeleton className="h-5 w-48 rounded-lg bg-primary/15" />
                <Skeleton className="h-3.5 w-3/5 rounded-full bg-primary/15" />
                <Skeleton className="h-3.5 w-4/5 rounded-full bg-primary/15" />
              </div>
            </section>
            <CardGridSkeleton count={3} columns={1} lines={3} withIcon label="Memuat checklist" />
          </div>
        )
      ) : (
        <>
          <section className="flex flex-col items-center gap-5 rounded-3xl border border-border bg-primary-soft p-6 text-center sm:flex-row sm:text-left">
            <CircularProgress
              percent={overview.summary.progress_percent}
              // Toska dipakai untuk status "selesai" (PRD §1.4) — merah muda
              // tetap jadi warna aksi, bukan warna capaian.
              color="var(--success)"
              size={128}
              strokeWidth={10}
            >
              <span className="font-display text-2xl font-extrabold tabular-nums text-brand-teal-text">
                {overview.summary.progress_percent}%
              </span>
            </CircularProgress>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Progres Keseluruhan</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {overview.summary.checked} dari {overview.summary.total} item sudah Anda siapkan.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Daftar ini mengikuti anjuran Buku KIA. Bila bidan Anda menyarankan hal lain,
                tambahkan sebagai item pribadi di bagian bawah.
              </p>
            </div>
          </section>

          <div className="space-y-5">
            {overview.groups.map((group) => (
              <ChecklistGroupCard
                key={group.name}
                group={group}
                pendingKeys={pendingKeys}
                onToggle={handleToggle}
                onRemoveCustom={handleRemoveCustom}
                footer={group.is_custom ? <ChecklistCustomForm onAdd={handleAddCustom} /> : null}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
