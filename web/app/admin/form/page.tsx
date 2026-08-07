"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
import type { AdminForm, FormStatus } from "@/lib/types";

const STATUS_LABEL: Record<FormStatus, string> = {
  draft: "Draf",
  published: "Terbit",
  closed: "Tutup",
};

export default function FormListPage() {
  const [forms, setForms] = useState<AdminForm[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminForm | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await apiGet<AdminForm[]>("/admin/forms");
      setForms(data);
    } catch (err) {
      setLoadError(err instanceof ApiRequestError ? err.message : "Gagal memuat daftar form.");
      setForms([]);
    }
  }, []);

  useEffect(() => {
    // Fetch saat mount — setState terjadi setelah await, di luar eksekusi
    // sinkron efek ini, sama seperti pola di admin/kuesioner/page.tsx.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiDelete<null>(`/admin/forms/${deleteTarget.id}`);
      toast.success("Form dihapus");
      setForms((prev) => (prev ?? []).filter((f) => f.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof ApiRequestError ? err.message : "Gagal menghapus form.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">Form & Survei</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola form dan survei dinamis — atur field, validasi, dan periode aktif.
          </p>
        </div>
        <Link
          href="/admin/form/baru"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-[#EC4899]"
        >
          <Plus className="size-4" />
          Buat Form Baru
        </Link>
      </div>

      {loadError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {forms === null ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Memuat data...
        </div>
      ) : forms.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          Belum ada form. Buat form atau survei pertama untuk memulai.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms.map((form) => (
                <TableRow key={form.id}>
                  <TableCell className="font-medium">{form.title}</TableCell>
                  <TableCell className="capitalize">{form.type === "survey" ? "Survei" : "Form"}</TableCell>
                  <TableCell>
                    <Badge variant={form.status === "published" ? "default" : "outline"}>
                      {STATUS_LABEL[form.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm" className="rounded-full">
                        <Link href={`/admin/form/${form.id}/respon`}>Respon</Link>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="rounded-full">
                        <Link href={`/admin/form/${form.id}`}>Edit</Link>
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="rounded-full"
                        onClick={() => {
                          setDeleteTarget(form);
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
            <DialogTitle>Hapus form?</DialogTitle>
            <DialogDescription>
              Form &quot;{deleteTarget?.title}&quot; akan dihapus permanen. Tindakan ini tidak bisa
              dibatalkan.
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
