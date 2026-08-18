"use client";

import { useState } from "react";
import { Check, Copy, ShieldAlert } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ConsentIssued } from "@/lib/types";

/**
 * Menampilkan tautan akses — PRD §9 F-15.
 *
 * Dialog ini muncul tepat sekali per kode: backend hanya menyimpan hash
 * kodenya, jadi begitu dialog ditutup tautan itu tidak bisa ditampilkan
 * ulang oleh endpoint mana pun. Kalimat peringatannya bukan basa-basi —
 * satu-satunya jalan memulihkan tautan yang hilang adalah membuat kode baru.
 */
export function ConsentLinkDialog({
  issued,
  onOpenChange,
}: {
  issued: ConsentIssued | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [isCopied, setIsCopied] = useState(false);

  async function handleCopy() {
    if (!issued) {
      return;
    }
    try {
      await navigator.clipboard.writeText(issued.access_link);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Peramban tanpa izin clipboard: tautannya tetap terlihat dan bisa
      // disalin manual, jadi tidak ada yang perlu dilaporkan sebagai galat.
    }
  }

  return (
    <Dialog
      open={!!issued}
      onOpenChange={(open) => {
        setIsCopied(false);
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tautan Akses Siap Dibagikan</DialogTitle>
          <DialogDescription>
            {issued
              ? `Untuk ${issued.consent.health_worker.name ?? "tenaga kesehatan"} · ${
                  issued.consent.health_worker.email ?? ""
                }`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <Alert className="rounded-xl border-warning/30 bg-feature-amber-soft">
          <ShieldAlert className="size-4 text-warning" />
          <AlertDescription className="text-warning">
            Tautan ini hanya ditampilkan sekarang. Simpan atau kirimkan dulu sebelum menutup jendela
            ini — bila hilang, Anda perlu membuat kode baru.
          </AlertDescription>
        </Alert>

        <div className="rounded-xl border border-border bg-muted/50 px-3 py-2.5">
          <p className="break-all font-mono text-xs text-foreground">{issued?.access_link}</p>
        </div>

        <p className="text-xs text-muted-foreground">
          Tautan hanya bisa dibuka oleh tenaga kesehatan yang Anda pilih dengan akunnya sendiri —
          orang lain yang menerima tautan ini tidak bisa melihat apa pun. Anda dapat mencabut izin
          kapan saja, dan pencabutan berlaku seketika.
        </p>

        <DialogFooter>
          <Button
            type="button"
            onClick={handleCopy}
            className="gap-1.5 rounded-full bg-primary text-white hover:bg-[#EC4899]"
          >
            {isCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {isCopied ? "Tersalin" : "Salin tautan"}
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
