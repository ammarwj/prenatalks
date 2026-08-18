"use client";

import { Loader2, MessageSquareText, RefreshCw, ShieldOff, Stethoscope } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Consent } from "@/lib/types";

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Satu izin di halaman privasi — PRD §9 F-15.
 *
 * Izin yang sudah dicabut tetap ditampilkan (tanpa tombol aksi): pengguna
 * berhak tahu siapa pernah punya akses dan kapan itu berakhir, dan catatan
 * edukasi yang sudah ditulis tetap bisa dibuka dari sini.
 */
export function ConsentCard({
  consent,
  isBusy,
  onRegenerate,
  onRevoke,
  onOpenNotes,
}: {
  consent: Consent;
  isBusy: boolean;
  onRegenerate: () => void;
  onRevoke: () => void;
  onOpenNotes: () => void;
}) {
  const isExpired = !consent.is_active && !consent.revoked_at;

  return (
    <Card className="rounded-3xl border border-border shadow-soft">
      <CardContent className="space-y-4 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-teal-soft">
              <Stethoscope className="size-4 text-brand-teal-text" />
            </span>
            <div>
              <p className="font-semibold text-foreground">
                {consent.health_worker.name ?? "Tenaga kesehatan"}
              </p>
              <p className="text-xs text-muted-foreground">{consent.health_worker.email}</p>
            </div>
          </div>

          {consent.is_active ? (
            <Badge className="bg-brand-teal-soft text-brand-teal-text">Aktif</Badge>
          ) : (
            <Badge variant="secondary">{isExpired ? "Kedaluwarsa" : "Dicabut"}</Badge>
          )}
        </div>

        <dl className="grid gap-x-6 gap-y-1.5 text-xs text-muted-foreground sm:grid-cols-2">
          <div className="flex justify-between gap-2 sm:justify-start sm:gap-1.5">
            <dt>Diberikan</dt>
            <dd className="font-medium text-foreground">{formatDate(consent.created_at)}</dd>
          </div>
          <div className="flex justify-between gap-2 sm:justify-start sm:gap-1.5">
            <dt>Berakhir otomatis</dt>
            <dd className="font-medium text-foreground">
              {consent.expires_at ? formatDate(consent.expires_at) : "Tidak dibatasi"}
            </dd>
          </div>
          <div className="flex justify-between gap-2 sm:justify-start sm:gap-1.5">
            <dt>Terakhir dibuka</dt>
            <dd className="font-medium text-foreground">
              {consent.last_accessed_at ? formatDateTime(consent.last_accessed_at) : "Belum pernah"}
            </dd>
          </div>
          {consent.revoked_at && (
            <div className="flex justify-between gap-2 sm:justify-start sm:gap-1.5">
              <dt>Dicabut</dt>
              <dd className="font-medium text-foreground">{formatDate(consent.revoked_at)}</dd>
            </div>
          )}
        </dl>

        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={onOpenNotes}
            disabled={!consent.notes_count}
          >
            <MessageSquareText className="size-4" />
            {consent.notes_count
              ? `Catatan edukasi (${consent.notes_count})`
              : "Belum ada catatan edukasi"}
          </Button>

          {consent.is_active && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-full"
                onClick={onRegenerate}
                disabled={isBusy}
              >
                {isBusy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                Buat ulang tautan
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-danger hover:bg-danger/10 hover:text-danger"
                onClick={onRevoke}
                disabled={isBusy}
              >
                <ShieldOff className="size-4" />
                Cabut izin
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
