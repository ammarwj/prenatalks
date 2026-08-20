"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { ArticleForm } from "@/components/admin/article-form";
import { FormSkeleton } from "@/components/shared/loading-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiGet, ApiRequestError } from "@/lib/api-client";
import type { AdminArticle } from "@/lib/types";

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [article, setArticle] = useState<AdminArticle | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    setNotFound(false);
    try {
      const data = await apiGet<AdminArticle>(`/admin/articles/${id}`);
      setArticle(data);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 404) {
        setNotFound(true);
      } else {
        setLoadError(err instanceof ApiRequestError ? err.message : "Gagal memuat artikel.");
      }
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function handleSaved(result: AdminArticle) {
    toast.success("Artikel diperbarui");
    setArticle(result);
  }

  if (notFound) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>Artikel tidak ditemukan. Mungkin sudah dihapus.</AlertDescription>
        </Alert>
        <Link href="/admin/artikel" className="text-sm font-semibold text-primary-text underline">
          Kembali ke daftar artikel
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-foreground">Edit Artikel</h1>
        <p className="mt-1 text-sm text-muted-foreground">Perbarui isi, cover, atau status terbit artikel ini.</p>
      </div>

      {loadError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {article === null && !loadError ? (
        <FormSkeleton fields={4} withTextarea />
      ) : article ? (
        <ArticleForm key={article.updated_at} initialData={article} onSaved={handleSaved} />
      ) : null}
    </div>
  );
}
