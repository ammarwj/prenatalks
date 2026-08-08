import { z } from "zod";

import type { AdminArticle, ArticleStatus, LifeStage } from "@/lib/types";

export const LIFE_STAGE_OPTIONS: { value: LifeStage; label: string }[] = [
  { value: "preconception", label: "Prakonsepsi" },
  { value: "pregnancy", label: "Kehamilan" },
  { value: "birth", label: "Persalinan" },
  { value: "postpartum", label: "Nifas & Menyusui" },
  { value: "parenting", label: "Pengasuhan" },
];

export const ARTICLE_STATUS_OPTIONS: { value: ArticleStatus; label: string }[] = [
  { value: "draft", label: "Draf" },
  { value: "published", label: "Terbit" },
];

function isContentEmpty(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").trim().length === 0;
}

export const articleSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(255, "Maksimal 255 karakter"),
  slug: z
    .string()
    .max(255, "Maksimal 255 karakter")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Hanya huruf kecil, angka, dan tanda hubung")
    .optional()
    .or(z.literal("")),
  excerpt: z.string().max(500, "Maksimal 500 karakter").optional(),
  content: z.string().refine((v) => !isContentEmpty(v), "Isi artikel wajib diisi"),
  cover: z.instanceof(File).optional(),
  removeCover: z.boolean(),
  categoryId: z.string().optional(),
  trimester: z.string().optional(),
  lifeStage: z.enum(["preconception", "pregnancy", "birth", "postpartum", "parenting"]),
  sourceReference: z.string().min(1, "Sumber rujukan wajib diisi"),
  reviewedAt: z
    .string()
    .min(1, "Tanggal tinjauan wajib diisi")
    .refine((v) => new Date(v) <= new Date(), "Tanggal tinjauan tidak boleh di masa depan"),
  status: z.enum(["draft", "published"]),
  publishedAt: z.string().optional(),
  metaTitle: z.string().max(255, "Maksimal 255 karakter").optional(),
  metaDescription: z.string().max(255, "Maksimal 255 karakter").optional(),
});

export type ArticleInput = z.infer<typeof articleSchema>;

export function toArticleFormValues(article?: AdminArticle): ArticleInput {
  if (!article) {
    return {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      removeCover: false,
      categoryId: "",
      trimester: "",
      lifeStage: "pregnancy",
      sourceReference: "",
      reviewedAt: new Date().toISOString().slice(0, 10),
      status: "draft",
      publishedAt: "",
      metaTitle: "",
      metaDescription: "",
    };
  }

  return {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt ?? "",
    content: article.content,
    removeCover: false,
    categoryId: article.category_id ? String(article.category_id) : "",
    trimester: article.trimester ? String(article.trimester) : "",
    lifeStage: article.life_stage,
    sourceReference: article.source_reference,
    reviewedAt: article.reviewed_at,
    status: article.status,
    publishedAt: article.published_at ? article.published_at.slice(0, 16) : "",
    metaTitle: article.meta_title ?? "",
    metaDescription: article.meta_description ?? "",
  };
}

export function toArticleFormData(values: ArticleInput, isUpdate: boolean): FormData {
  const formData = new FormData();

  if (isUpdate) formData.append("_method", "PUT");
  formData.append("title", values.title);
  if (values.slug?.trim()) formData.append("slug", values.slug);
  if (values.excerpt?.trim()) formData.append("excerpt", values.excerpt);
  formData.append("content", values.content);
  if (values.cover) formData.append("cover", values.cover);
  if (values.removeCover) formData.append("remove_cover", "1");
  if (values.categoryId?.trim()) formData.append("category_id", values.categoryId);
  if (values.trimester?.trim()) formData.append("trimester", values.trimester);
  formData.append("life_stage", values.lifeStage);
  formData.append("source_reference", values.sourceReference);
  formData.append("reviewed_at", values.reviewedAt);
  formData.append("status", values.status);
  if (values.status === "published" && values.publishedAt?.trim()) {
    formData.append("published_at", values.publishedAt);
  }
  if (values.metaTitle?.trim()) formData.append("meta_title", values.metaTitle);
  if (values.metaDescription?.trim()) formData.append("meta_description", values.metaDescription);

  return formData;
}
