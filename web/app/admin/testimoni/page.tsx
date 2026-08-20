"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ExternalLink, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { TestimonialFormDialog } from "@/components/admin/testimonial-form-dialog";
import { TestimonialItem } from "@/components/admin/testimonial-item";
import { ListSkeleton } from "@/components/shared/loading-state";
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
import { apiDelete, apiGet, apiPatch, ApiRequestError } from "@/lib/api-client";
import { revalidatePublicCache, TESTIMONIALS_TAG } from "@/lib/public-cache";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { AdminTestimonial } from "@/lib/types";

/**
 * Kelola testimoni landing page — PRD §9 F-01.
 *
 * Sebelumnya tiga testimoni ini ditulis mati di
 * `components/landing/testimonials.tsx`, jadi mengganti satu kalimat pun
 * menuntut deploy ulang. Halaman ini tidak ada di sitemap §8 — ditambahkan
 * karena `/admin/pengaturan` menampung pengaturan bernilai tunggal, sedangkan
 * testimoni adalah daftar dengan urutan dan foto sendiri.
 */
export default function TestimoniAdminPage() {
  const [testimonials, setTestimonials] = useState<AdminTestimonial[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminTestimonial | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AdminTestimonial | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setTestimonials(await apiGet<AdminTestimonial[]>("/admin/testimonials"));
    } catch (err) {
      setLoadError(err instanceof ApiRequestError ? err.message : "Gagal memuat testimoni.");
      setTestimonials([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !testimonials) return;

    const oldIndex = testimonials.findIndex((t) => t.id === active.id);
    const newIndex = testimonials.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(testimonials, oldIndex, newIndex);
    const snapshot = testimonials;

    setTestimonials(reordered);
    setReorderError(null);

    try {
      setTestimonials(
        await apiPatch<AdminTestimonial[]>("/admin/testimonials/reorder", {
          ids: reordered.map((t) => t.id),
        })
      );
      await revalidatePublicCache([TESTIMONIALS_TAG], accessToken);
    } catch (err) {
      setTestimonials(snapshot);
      setReorderError(err instanceof ApiRequestError ? err.message : "Gagal menyimpan urutan.");
    }
  }

  async function handleSaved(result: AdminTestimonial) {
    toast.success(editing ? "Testimoni diperbarui" : "Testimoni dibuat");
    setDialogOpen(false);
    setEditing(null);
    setTestimonials((prev) => {
      if (!prev) return prev;
      const exists = prev.some((t) => t.id === result.id);
      return exists ? prev.map((t) => (t.id === result.id ? result : t)) : [...prev, result];
    });
    await revalidatePublicCache([TESTIMONIALS_TAG], accessToken);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiDelete<null>(`/admin/testimonials/${deleteTarget.id}`);
      toast.success("Testimoni dihapus");
      setTestimonials((prev) => (prev ?? []).filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
      await revalidatePublicCache([TESTIMONIALS_TAG], accessToken);
    } catch (err) {
      setDeleteError(err instanceof ApiRequestError ? err.message : "Gagal menghapus testimoni.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">Testimoni</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Kartu &quot;Apa Kata Ibu Hamil?&quot; di landing page. Seret ikon di kiri tiap kartu
            untuk mengubah urutan tampil.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-soft hover:bg-muted"
          >
            <ExternalLink className="size-4" />
            Lihat halaman publik
          </Link>
          <Button
            type="button"
            className="gap-1.5 rounded-full bg-primary text-white hover:bg-[#EC4899]"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            Tambah Testimoni
          </Button>
        </div>
      </div>

      {loadError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {reorderError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{reorderError}</AlertDescription>
        </Alert>
      )}

      {testimonials === null ? (
        !loadError && (
          <ListSkeleton rows={4} framed={false} withHandle withAvatar label="Memuat testimoni" />
        )
      ) : testimonials.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          Belum ada testimoni. Seksi ini disembunyikan di landing page selama daftarnya kosong.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={testimonials.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {testimonials.map((testimonial) => (
                <TestimonialItem
                  key={testimonial.id}
                  testimonial={testimonial}
                  onEdit={() => {
                    setEditing(testimonial);
                    setDialogOpen(true);
                  }}
                  onDelete={() => {
                    setDeleteTarget(testimonial);
                    setDeleteError(null);
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <TestimonialFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editing}
        onSaved={handleSaved}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus testimoni?</DialogTitle>
            <DialogDescription>
              Testimoni dari &quot;{deleteTarget?.name}&quot; beserta fotonya akan dihapus permanen.
              Untuk sekadar menyembunyikannya, gunakan Edit lalu hapus centang &quot;Tampilkan di
              landing page&quot;.
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
