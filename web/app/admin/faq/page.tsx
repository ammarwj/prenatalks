"use client";

import { useCallback, useEffect, useState } from "react";
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
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { FaqFormDialog } from "@/components/admin/faq-form-dialog";
import { FaqItem } from "@/components/admin/faq-item";
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
import type { AdminFaq } from "@/lib/types";

export default function FaqAdminPage() {
  const [faqs, setFaqs] = useState<AdminFaq[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminFaq | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AdminFaq | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await apiGet<AdminFaq[]>("/admin/faqs");
      setFaqs(data);
    } catch (err) {
      setLoadError(err instanceof ApiRequestError ? err.message : "Gagal memuat daftar FAQ.");
      setFaqs([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !faqs) return;

    const oldIndex = faqs.findIndex((f) => f.id === active.id);
    const newIndex = faqs.findIndex((f) => f.id === over.id);
    const reordered = arrayMove(faqs, oldIndex, newIndex);

    setFaqs(reordered);
    setReorderError(null);

    try {
      const result = await apiPatch<AdminFaq[]>("/admin/faqs/reorder", {
        ids: reordered.map((f) => f.id),
      });
      setFaqs(result);
    } catch (err) {
      setFaqs(faqs);
      setReorderError(err instanceof ApiRequestError ? err.message : "Gagal menyimpan urutan.");
    }
  }

  function handleSaved(result: AdminFaq) {
    toast.success(editing ? "FAQ diperbarui" : "FAQ dibuat");
    setDialogOpen(false);
    setFaqs((prev) => {
      if (!prev) return prev;
      const exists = prev.some((f) => f.id === result.id);
      return exists ? prev.map((f) => (f.id === result.id ? result : f)) : [...prev, result];
    });
    setEditing(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiDelete<null>(`/admin/faqs/${deleteTarget.id}`);
      toast.success("FAQ dihapus");
      setFaqs((prev) => (prev ?? []).filter((f) => f.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof ApiRequestError ? err.message : "Gagal menghapus FAQ.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">FAQ</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola pertanyaan umum. Seret ikon di kiri tiap kartu untuk mengubah urutan.
          </p>
        </div>
        <Button
          type="button"
          className="gap-1.5 rounded-full bg-primary text-white hover:bg-[#EC4899]"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          Tambah FAQ
        </Button>
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

      {faqs === null ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Memuat data...
        </div>
      ) : faqs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          Belum ada FAQ. Tambah FAQ pertama untuk memulai.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={faqs.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <FaqItem
                  key={faq.id}
                  faq={faq}
                  onEdit={() => {
                    setEditing(faq);
                    setDialogOpen(true);
                  }}
                  onDelete={() => {
                    setDeleteTarget(faq);
                    setDeleteError(null);
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <FaqFormDialog open={dialogOpen} onOpenChange={setDialogOpen} initialData={editing} onSaved={handleSaved} />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus FAQ?</DialogTitle>
            <DialogDescription>
              FAQ &quot;{deleteTarget?.question}&quot; akan dihapus permanen. Tindakan ini tidak
              bisa dibatalkan.
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
