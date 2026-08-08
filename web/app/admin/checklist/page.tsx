"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

import { ChecklistItemFormDialog } from "@/components/admin/checklist-item-form-dialog";
import { ChecklistItemRow } from "@/components/admin/checklist-item-row";
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
import { apiDelete, apiGetWithMeta, apiPatch, ApiRequestError } from "@/lib/api-client";
import type { AdminChecklistItem } from "@/lib/types";
import { CHECKLIST_GROUPS } from "@/lib/validations/checklist";

/**
 * Kelola template checklist persiapan — PRD §8 (`/admin/checklist`), §9 F-11.
 *
 * Urutan hanya bermakna di dalam satu kelompok, jadi tiap kelompok punya
 * `DndContext`-nya sendiri dan mengirim `group_name` saat menyimpan urutan.
 */
export default function ChecklistAdminPage() {
  const [items, setItems] = useState<AdminChecklistItem[] | null>(null);
  const [groups, setGroups] = useState<readonly string[]>(CHECKLIST_GROUPS);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminChecklistItem | null>(null);
  const [defaultGroup, setDefaultGroup] = useState<string>(CHECKLIST_GROUPS[0]);

  const [deleteTarget, setDeleteTarget] = useState<AdminChecklistItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const { data, meta } = await apiGetWithMeta<AdminChecklistItem[], { groups?: string[] }>(
        "/admin/checklist-items"
      );
      setItems(data);
      if (meta?.groups?.length) {
        setGroups(meta.groups);
      }
    } catch (err) {
      setLoadError(
        err instanceof ApiRequestError ? err.message : "Gagal memuat template checklist."
      );
      setItems([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // Backend sudah mengurutkan per kelompok lalu `order_index`; pengelompokan
  // di sini hanya memotong daftar itu, bukan mengurutkan ulang.
  const itemsByGroup = useMemo(() => {
    const map = new Map<string, AdminChecklistItem[]>(groups.map((group) => [group, []]));
    for (const item of items ?? []) {
      map.get(item.group_name)?.push(item);
    }
    return map;
  }, [items, groups]);

  async function handleDragEnd(groupName: string, event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !items) return;

    const groupItems = itemsByGroup.get(groupName) ?? [];
    const oldIndex = groupItems.findIndex((item) => item.id === active.id);
    const newIndex = groupItems.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(groupItems, oldIndex, newIndex);
    const snapshot = items;

    setReorderError(null);
    setItems(mergeGroup(items, groupName, reordered));

    try {
      const result = await apiPatch<AdminChecklistItem[]>("/admin/checklist-items/reorder", {
        group_name: groupName,
        ids: reordered.map((item) => item.id),
      });
      setItems(result);
    } catch (err) {
      setItems(snapshot);
      setReorderError(err instanceof ApiRequestError ? err.message : "Gagal menyimpan urutan.");
    }
  }

  function handleSaved() {
    toast.success(editing ? "Item checklist diperbarui" : "Item checklist dibuat");
    setDialogOpen(false);
    setEditing(null);
    // Menyimpan bisa mengubah kelompok dan `order_index` item lain, jadi
    // daftar dimuat ulang dari server alih-alih ditambal di klien.
    load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiDelete<null>(`/admin/checklist-items/${deleteTarget.id}`);
      toast.success("Item checklist dihapus");
      setItems((prev) => (prev ?? []).filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof ApiRequestError ? err.message : "Gagal menghapus item.");
    } finally {
      setDeleting(false);
    }
  }

  function openCreate(group: string) {
    setEditing(null);
    setDefaultGroup(group);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">
            Checklist Persiapan
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Template ini muncul di checklist semua pengguna. Item baru otomatis tampil tanpa
            menghapus progres yang sudah tersimpan. Seret ikon di kiri tiap kartu untuk mengubah
            urutan dalam satu kelompok.
          </p>
        </div>
        <Button
          type="button"
          className="gap-1.5 rounded-full bg-primary text-white hover:bg-[#EC4899]"
          onClick={() => openCreate(groups[0])}
        >
          <Plus className="size-4" />
          Tambah Item
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

      {items === null ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Memuat data...
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => {
            const groupItems = itemsByGroup.get(group) ?? [];

            return (
              <section key={group}>
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-lg font-bold text-foreground">
                    {group}{" "}
                    <span className="text-sm font-semibold text-muted-foreground">
                      ({groupItems.length})
                    </span>
                  </h2>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => openCreate(group)}
                  >
                    <Plus className="size-4" />
                    Tambah di kelompok ini
                  </Button>
                </div>

                {groupItems.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    Belum ada item pada kelompok ini.
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleDragEnd(group, event)}
                  >
                    <SortableContext
                      items={groupItems.map((item) => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {groupItems.map((item) => (
                          <ChecklistItemRow
                            key={item.id}
                            item={item}
                            onEdit={() => {
                              setEditing(item);
                              setDialogOpen(true);
                            }}
                            onDelete={() => {
                              setDeleteTarget(item);
                              setDeleteError(null);
                            }}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </section>
            );
          })}
        </div>
      )}

      <ChecklistItemFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editing}
        groups={groups}
        defaultGroup={defaultGroup}
        onSaved={handleSaved}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus item checklist?</DialogTitle>
            <DialogDescription>
              &quot;{deleteTarget?.title}&quot; akan dihapus permanen beserta progres pengguna atas
              item ini. Untuk sekadar menyembunyikannya, gunakan Edit lalu hapus centang
              &quot;Tampilkan item ini&quot;.
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

/** Ganti isi satu kelompok tanpa mengubah urutan kelompok lain di daftar. */
function mergeGroup(
  items: AdminChecklistItem[],
  groupName: string,
  reordered: AdminChecklistItem[]
): AdminChecklistItem[] {
  let cursor = 0;

  return items.map((item) => (item.group_name === groupName ? reordered[cursor++] : item));
}
