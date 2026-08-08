"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ArticleForm } from "@/components/admin/article-form";
import type { AdminArticle } from "@/lib/types";

export default function NewArticlePage() {
  const router = useRouter();

  function handleSaved(result: AdminArticle) {
    toast.success("Artikel dibuat");
    router.push(`/admin/artikel/${result.id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-foreground">Tulis Artikel Baru</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lengkapi isi, sumber rujukan, dan tanggal tinjauan sebelum menerbitkan.
        </p>
      </div>
      <ArticleForm onSaved={handleSaved} />
    </div>
  );
}
