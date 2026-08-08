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
import type { AdminArticle } from "@/lib/types";

export default function ArticleListPage() {
  const [articles, setArticles] = useState<AdminArticle[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminArticle | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await apiGet<AdminArticle[]>("/admin/articles");
      setArticles(data);
    } catch (err) {
      setLoadError(err instanceof ApiRequestError ? err.message : "Gagal memuat daftar artikel.");
      setArticles([]);
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
      await apiDelete<null>(`/admin/articles/${deleteTarget.id}`);
      toast.success("Artikel dihapus");
      setArticles((prev) => (prev ?? []).filter((a) => a.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof ApiRequestError ? err.message : "Gagal menghapus artikel.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">Artikel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola artikel edukasi kehamilan, persalinan, dan pengasuhan.
          </p>
        </div>
        <Link
          href="/admin/artikel/baru"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-[#EC4899]"
        >
          <Plus className="size-4" />
          Tulis Artikel
        </Link>
      </div>

      {loadError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {articles === null ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Memuat data...
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          Belum ada artikel. Tulis artikel pertama untuk memulai.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dilihat</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium">{article.title}</TableCell>
                  <TableCell>{article.category?.name ?? "—"}</TableCell>
                  <TableCell>
                    {article.status === "published" ? (
                      article.is_scheduled ? (
                        <Badge variant="secondary">Terjadwal</Badge>
                      ) : (
                        <Badge>Terbit</Badge>
                      )
                    ) : (
                      <Badge variant="outline">Draf</Badge>
                    )}
                  </TableCell>
                  <TableCell>{article.views_count}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm" className="rounded-full">
                        <Link href={`/admin/artikel/${article.id}`}>Edit</Link>
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="rounded-full"
                        onClick={() => {
                          setDeleteTarget(article);
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
            <DialogTitle>Hapus artikel?</DialogTitle>
            <DialogDescription>
              Artikel &quot;{deleteTarget?.title}&quot; akan dihapus. Tindakan ini bisa dipulihkan
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
