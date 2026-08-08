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

import { AboutSettingsForm } from "@/components/admin/about-settings-form";
import { TeamMemberFormDialog } from "@/components/admin/team-member-form-dialog";
import { TeamMemberItem } from "@/components/admin/team-member-item";
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
import { apiDelete, apiGet, apiGetWithMeta, apiPatch, ApiRequestError } from "@/lib/api-client";
import type { AboutSettings, AdminTeamMember, BrandColors } from "@/lib/types";

const FALLBACK_BRAND: BrandColors = { purple: "#7C3AED", teal: "#14B8A6" };

/**
 * Kelola halaman Tentang — PRD §9 F-16.
 *
 * Seksi 1–5 (dari `settings`) dan profil tim (tabel sendiri) disatukan di satu
 * halaman: admin yang ingin mengubah halaman Tentang tidak perlu tahu bahwa
 * sebagian isinya "pengaturan" dan sebagian lagi "data". Halaman ini tidak ada
 * di sitemap §8 — ditambahkan karena `/admin/pengaturan` akan jadi terlalu
 * panjang bila menampung keduanya.
 */
export default function TentangAdminPage() {
  const [about, setAbout] = useState<AboutSettings | null>(null);
  const [brandColors, setBrandColors] = useState<BrandColors>(FALLBACK_BRAND);
  const [team, setTeam] = useState<AdminTeamMember[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminTeamMember | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AdminTeamMember | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [settings, members] = await Promise.all([
        // Warna merek datang lewat `meta` karena dikunci di kode (PRD §1.4),
        // bukan tersimpan sebagai setting yang bisa disunting.
        apiGetWithMeta<AboutSettings, { brand_colors?: BrandColors }>("/admin/settings"),
        apiGet<AdminTeamMember[]>("/admin/team-members"),
      ]);
      setAbout(settings.data);
      setBrandColors(settings.meta?.brand_colors ?? FALLBACK_BRAND);
      setTeam(members);
    } catch (err) {
      setLoadError(err instanceof ApiRequestError ? err.message : "Gagal memuat halaman Tentang.");
      setTeam([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !team) return;

    const oldIndex = team.findIndex((m) => m.id === active.id);
    const newIndex = team.findIndex((m) => m.id === over.id);
    const reordered = arrayMove(team, oldIndex, newIndex);
    const snapshot = team;

    setTeam(reordered);
    setReorderError(null);

    try {
      setTeam(
        await apiPatch<AdminTeamMember[]>("/admin/team-members/reorder", {
          ids: reordered.map((m) => m.id),
        })
      );
    } catch (err) {
      setTeam(snapshot);
      setReorderError(err instanceof ApiRequestError ? err.message : "Gagal menyimpan urutan.");
    }
  }

  function handleSaved(result: AdminTeamMember) {
    toast.success(editing ? "Profil tim diperbarui" : "Profil tim dibuat");
    setDialogOpen(false);
    setEditing(null);
    setTeam((prev) => {
      if (!prev) return prev;
      const exists = prev.some((m) => m.id === result.id);
      return exists ? prev.map((m) => (m.id === result.id ? result : m)) : [...prev, result];
    });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiDelete<null>(`/admin/team-members/${deleteTarget.id}`);
      toast.success("Profil tim dihapus");
      setTeam((prev) => (prev ?? []).filter((m) => m.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof ApiRequestError ? err.message : "Gagal menghapus profil.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">Halaman Tentang</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Isi seksi 1–5 dan profil tim. Perubahan tampil di halaman publik dalam beberapa menit —
            halaman itu di-cache untuk menghemat beban server.
          </p>
        </div>
        <Link
          href="/tentang"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-soft hover:bg-muted"
        >
          <ExternalLink className="size-4" />
          Lihat halaman publik
        </Link>
      </div>

      {loadError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {about === null ? (
        !loadError && (
          <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Memuat isi halaman...
          </div>
        )
      ) : (
        <AboutSettingsForm initialData={about} brandColors={brandColors} />
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">6 · Profil Tim</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Seret ikon di kiri tiap kartu untuk mengubah urutan tampil.
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
            Tambah Profil
          </Button>
        </div>

        {reorderError && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertDescription>{reorderError}</AlertDescription>
          </Alert>
        )}

        {team === null ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Memuat profil tim...
          </div>
        ) : team.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            Belum ada profil tim. Seksi ini disembunyikan di halaman publik selama daftarnya kosong.
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={team.map((m) => m.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {team.map((member) => (
                  <TeamMemberItem
                    key={member.id}
                    member={member}
                    onEdit={() => {
                      setEditing(member);
                      setDialogOpen(true);
                    }}
                    onDelete={() => {
                      setDeleteTarget(member);
                      setDeleteError(null);
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </section>

      <TeamMemberFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editing}
        onSaved={handleSaved}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus profil tim?</DialogTitle>
            <DialogDescription>
              Profil &quot;{deleteTarget?.name}&quot; beserta fotonya akan dihapus permanen. Untuk
              sekadar menyembunyikannya, gunakan Edit lalu hapus centang &quot;Tampilkan di halaman
              Tentang&quot;.
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
