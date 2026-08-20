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

import { GuideFormDialog } from "@/components/admin/guide-form-dialog";
import { GuideItem } from "@/components/admin/guide-item";
import { SuperAdminRestricted, useSuperAdminGuard } from "@/components/admin/super-admin-guard";
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
import { GUIDES_TAG, revalidatePublicCache } from "@/lib/public-cache";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { AdminGuide } from "@/lib/types";

/**
 * Kelola panduan penggunaan yang tampil di `/panduan`.
 *
 * Dibatasi super admin lewat middleware `role:super_admin` di backend, sejajar
 * dengan halaman legal: keduanya teks resmi situs yang ditautkan dari footer
 * setiap halaman, bukan konten editorial biasa seperti artikel dan FAQ.
 * Urutannya bermakna — pembaca melihatnya sebagai langkah bernomor.
 */
export default function PanduanAdminPage() {
  const { isSuperAdmin } = useSuperAdminGuard();
  const [guides, setGuides] = useState<AdminGuide[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminGuide | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AdminGuide | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = useCallback(async () => {
    if (!isSuperAdmin) return;
    setLoadError(null);
    try {
      setGuides(await apiGet<AdminGuide[]>("/admin/guides"));
    } catch (err) {
      setLoadError(err instanceof ApiRequestError ? err.message : "Gagal memuat daftar panduan.");
      setGuides([]);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !guides) return;

    const oldIndex = guides.findIndex((g) => g.id === active.id);
    const newIndex = guides.findIndex((g) => g.id === over.id);
    const reordered = arrayMove(guides, oldIndex, newIndex);
    const snapshot = guides;

    setGuides(reordered);
    setReorderError(null);

    try {
      setGuides(
        await apiPatch<AdminGuide[]>("/admin/guides/reorder", {
          ids: reordered.map((g) => g.id),
        })
      );
      await revalidatePublicCache([GUIDES_TAG], accessToken);
    } catch (err) {
      setGuides(snapshot);
      setReorderError(err instanceof ApiRequestError ? err.message : "Gagal menyimpan urutan.");
    }
  }

  async function handleSaved(result: AdminGuide) {
    toast.success(editing ? "Panduan diperbarui" : "Panduan dibuat");
    setDialogOpen(false);
    setEditing(null);
    setGuides((prev) => {
      if (!prev) return prev;
      const exists = prev.some((g) => g.id === result.id);
      return exists ? prev.map((g) => (g.id === result.id ? result : g)) : [...prev, result];
    });
    await revalidatePublicCache([GUIDES_TAG], accessToken);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiDelete<null>(`/admin/guides/${deleteTarget.id}`);
      toast.success("Panduan dihapus");
      setGuides((prev) => (prev ?? []).filter((g) => g.id !== deleteTarget.id));
      setDeleteTarget(null);
      await revalidatePublicCache([GUIDES_TAG], accessToken);
    } catch (err) {
      setDeleteError(err instanceof ApiRequestError ? err.message : "Gagal menghapus panduan.");
    } finally {
      setDeleting(false);
    }
  }

  if (!isSuperAdmin) {
    return (
      <SuperAdminRestricted description="Panduan penggunaan ditautkan dari footer setiap halaman, jadi pengelolaannya hanya bisa diakses oleh peran Super Admin." />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">
            Panduan Penggunaan
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Langkah-langkah memakai PrenaTalks yang tampil di halaman /panduan. Seret ikon di kiri
            tiap kartu untuk mengubah nomor langkahnya.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/panduan"
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
            Tambah Panduan
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

      {guides === null ? (
        <ListSkeleton rows={5} framed={false} withHandle label="Memuat panduan" />
      ) : guides.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          Belum ada panduan. Tambah langkah pertama untuk memulai.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={guides.map((g) => g.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {guides.map((guide, index) => (
                <GuideItem
                  key={guide.id}
                  guide={guide}
                  step={index + 1}
                  onEdit={() => {
                    setEditing(guide);
                    setDialogOpen(true);
                  }}
                  onDelete={() => {
                    setDeleteTarget(guide);
                    setDeleteError(null);
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <GuideFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editing}
        onSaved={handleSaved}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus panduan?</DialogTitle>
            <DialogDescription>
              Panduan &quot;{deleteTarget?.title}&quot; akan dihapus permanen dan langkah
              sesudahnya bergeser naik. Tindakan ini tidak bisa dibatalkan.
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
