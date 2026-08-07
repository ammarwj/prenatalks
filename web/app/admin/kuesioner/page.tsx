"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { SuperAdminRestricted, useSuperAdminGuard } from "@/components/admin/super-admin-guard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiDelete, apiGet, ApiRequestError } from "@/lib/api-client";
import type { AdminQuestionnaire } from "@/lib/types";

export default function QuestionnaireListPage() {
  const { isSuperAdmin } = useSuperAdminGuard();
  const [questionnaires, setQuestionnaires] = useState<AdminQuestionnaire[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminQuestionnaire | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await apiGet<AdminQuestionnaire[]>("/admin/questionnaires");
      setQuestionnaires(data);
    } catch (err) {
      setLoadError(
        err instanceof ApiRequestError ? err.message : "Gagal memuat daftar kuesioner."
      );
      setQuestionnaires([]);
    }
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) return;
    // Fetch saat mount — setState terjadi setelah await, di luar eksekusi
    // sinkron efek ini, sama seperti pola di dashboard/kehamilan/page.tsx.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [isSuperAdmin, load]);

  if (!isSuperAdmin) return <SuperAdminRestricted />;

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiDelete<null>(`/admin/questionnaires/${deleteTarget.id}`);
      toast.success("Kuesioner dihapus");
      setQuestionnaires((prev) => (prev ?? []).filter((q) => q.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(
        err instanceof ApiRequestError ? err.message : "Gagal menghapus kuesioner."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">
            Checklist Risiko
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola pertanyaan, opsi jawaban, dan level risiko kuesioner cek risiko kehamilan.
          </p>
        </div>
        <Link
          href="/admin/kuesioner/baru"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-[#EC4899]"
        >
          <Plus className="size-4" />
          Buat Kuesioner Baru
        </Link>
      </div>

      {loadError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {questionnaires === null ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Memuat data...
        </div>
      ) : questionnaires.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          Belum ada kuesioner. Buat kuesioner pertama untuk memulai cek risiko.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead>Versi</TableHead>
                <TableHead>Status</TableHead>
                {/*
                  Kolom "Jumlah Pertanyaan" sengaja tidak ditampilkan di sini:
                  GET /admin/questionnaires (index) tidak menyertakan relasi
                  `questions` — hanya show/store/update yang memuatnya (lihat
                  AdminQuestionnaireResource::whenLoaded) — jadi tidak ada
                  angka yang bisa ditampilkan tanpa request tambahan per baris.
                */}
                <TableHead>Riwayat</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questionnaires.map((questionnaire) => (
                <TableRow key={questionnaire.id}>
                  <TableCell className="font-medium">{questionnaire.title}</TableCell>
                  <TableCell>v{questionnaire.version}</TableCell>
                  <TableCell>
                    <Badge variant={questionnaire.is_active ? "default" : "outline"}>
                      {questionnaire.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {questionnaire.has_history ? (
                      <Badge variant="secondary">Punya riwayat</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm" className="rounded-full">
                        <Link href={`/admin/kuesioner/${questionnaire.id}`}>Edit</Link>
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="rounded-full"
                        onClick={() => {
                          setDeleteTarget(questionnaire);
                          setDeleteError(null);
                        }}
                      >
                        <Trash2 className="size-4" />
                        Hapus
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus kuesioner?</DialogTitle>
            <DialogDescription>
              Kuesioner &quot;{deleteTarget?.title}&quot; akan dihapus permanen. Tindakan ini
              tidak bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button type="button" variant="destructive" disabled={deleting} onClick={handleDelete}>
              {deleting && <Loader2 className="size-4 animate-spin" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
