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
import type { AdminVideo } from "@/lib/types";

export default function VideoListPage() {
  const [videos, setVideos] = useState<AdminVideo[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminVideo | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await apiGet<AdminVideo[]>("/admin/videos");
      setVideos(data);
    } catch (err) {
      setLoadError(err instanceof ApiRequestError ? err.message : "Gagal memuat daftar video.");
      setVideos([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiDelete<null>(`/admin/videos/${deleteTarget.id}`);
      toast.success("Video dihapus");
      setVideos((prev) => (prev ?? []).filter((v) => v.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof ApiRequestError ? err.message : "Gagal menghapus video.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">Video Edukasi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola video edukasi kehamilan, persalinan, dan pengasuhan.
          </p>
        </div>
        <Link
          href="/admin/video/baru"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-[#EC4899]"
        >
          <Plus className="size-4" />
          Tambah Video
        </Link>
      </div>

      {loadError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {videos === null ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Memuat data...
        </div>
      ) : videos.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          Belum ada video. Tambah video pertama untuk memulai.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.map((video) => (
                <TableRow key={video.id}>
                  <TableCell className="font-medium">{video.title}</TableCell>
                  <TableCell>{video.category?.name ?? "—"}</TableCell>
                  <TableCell>
                    {video.status === "published" ? (
                      video.is_scheduled ? (
                        <Badge variant="secondary">Terjadwal</Badge>
                      ) : (
                        <Badge>Terbit</Badge>
                      )
                    ) : (
                      <Badge variant="outline">Draf</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm" className="rounded-full">
                        <Link href={`/admin/video/${video.id}`}>Edit</Link>
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="rounded-full"
                        onClick={() => {
                          setDeleteTarget(video);
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
            <DialogTitle>Hapus video?</DialogTitle>
            <DialogDescription>
              Video &quot;{deleteTarget?.title}&quot; akan dihapus. Tindakan ini bisa dipulihkan
              lewat basis data bila diperlukan.
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
