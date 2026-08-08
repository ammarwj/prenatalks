"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { ImageOff, Loader2, X } from "lucide-react";

import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { FormField } from "@/components/shared/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiGet, apiPostForm, ApiRequestError } from "@/lib/api-client";
import type { AdminArticle, Category } from "@/lib/types";
import {
  ARTICLE_STATUS_OPTIONS,
  LIFE_STAGE_OPTIONS,
  articleSchema,
  toArticleFormData,
  toArticleFormValues,
  type ArticleInput,
} from "@/lib/validations/article";

const inputClass = "h-11 rounded-xl";

export function ArticleForm({
  initialData,
  onSaved,
}: {
  initialData?: AdminArticle;
  onSaved: (result: AdminArticle) => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [coverPreview, setCoverPreview] = useState<string | null>(initialData?.cover_url ?? null);
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ArticleInput>({
    resolver: zodResolver(articleSchema),
    defaultValues: toArticleFormValues(initialData),
  });

  const status = useWatch({ control, name: "status" });
  const content = useWatch({ control, name: "content" });

  useEffect(() => {
    apiGet<Category[]>("/categories?type=article")
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  async function onSubmit(values: ArticleInput) {
    setServerError(null);
    try {
      const formData = toArticleFormData(values, isEditing);
      const result = isEditing && initialData
        ? await apiPostForm<AdminArticle>(`/admin/articles/${initialData.id}`, formData)
        : await apiPostForm<AdminArticle>('/admin/articles', formData);
      onSaved(result);
    } catch (err) {
      setServerError(err instanceof ApiRequestError ? err.message : "Terjadi kesalahan, coba lagi.");
    }
  }

  function handleCoverChange(file: File | undefined) {
    setValue("cover", file, { shouldDirty: true });
    if (file) {
      setValue("removeCover", false);
      setCoverPreview(URL.createObjectURL(file));
    }
  }

  function handleRemoveCover() {
    setValue("cover", undefined);
    setValue("removeCover", true, { shouldDirty: true });
    setCoverPreview(null);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {serverError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <Card className="rounded-3xl border border-border shadow-soft">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="font-display text-base">Info Artikel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6">
          <FormField label="Judul" htmlFor="title" error={errors.title?.message}>
            <Input id="title" className={inputClass} aria-invalid={!!errors.title} {...register("title")} />
          </FormField>
          <FormField label="Slug" htmlFor="slug" error={errors.slug?.message} hint="Kosongkan untuk dibuat otomatis">
            <Input id="slug" className={inputClass} {...register("slug")} />
          </FormField>
          <FormField label="Ringkasan" htmlFor="excerpt" error={errors.excerpt?.message} hint="Opsional, tampil di daftar artikel">
            <Textarea id="excerpt" {...register("excerpt")} />
          </FormField>

          <FormField label="Cover" htmlFor="cover" hint="Gambar akan dikonversi ke WebP otomatis, maks 4 MB">
            <div className="flex items-center gap-4">
              {coverPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverPreview} alt="" className="size-20 rounded-xl object-cover" />
              ) : (
                <div className="flex size-20 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <ImageOff className="size-6" />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Input
                  id="cover"
                  type="file"
                  accept="image/*"
                  className={inputClass}
                  onChange={(e) => handleCoverChange(e.target.files?.[0])}
                />
                {coverPreview && (
                  <Button type="button" variant="ghost" size="sm" className="w-fit gap-1.5" onClick={handleRemoveCover}>
                    <X className="size-3.5" />
                    Hapus cover
                  </Button>
                )}
              </div>
            </div>
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Kategori" htmlFor="categoryId">
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                    <SelectTrigger id="categoryId" className={`w-full ${inputClass}`}>
                      <SelectValue placeholder="Tanpa kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tanpa kategori</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField label="Tahap kehidupan" htmlFor="lifeStage">
              <Controller
                name="lifeStage"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="lifeStage" className={`w-full ${inputClass}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LIFE_STAGE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField label="Trimester" htmlFor="trimester" hint="Opsional">
              <Controller
                name="trimester"
                control={control}
                render={({ field }) => (
                  <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                    <SelectTrigger id="trimester" className={`w-full ${inputClass}`}>
                      <SelectValue placeholder="Semua trimester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Semua trimester</SelectItem>
                      <SelectItem value="1">Trimester 1</SelectItem>
                      <SelectItem value="2">Trimester 2</SelectItem>
                      <SelectItem value="3">Trimester 3</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-border shadow-soft">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="font-display text-base">Isi Artikel</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <RichTextEditor value={content} onChange={(html) => setValue("content", html, { shouldDirty: true })} error={errors.content?.message} />
          {errors.content && <p className="mt-1.5 text-xs font-medium text-danger">{errors.content.message}</p>}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-border shadow-soft">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="font-display text-base">Berbasis Bukti</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6">
          <FormField
            label="Sumber rujukan"
            htmlFor="sourceReference"
            error={errors.sourceReference?.message}
            hint="Mis. Kemenkes RI, WHO, Buku KIA — tampil di bawah isi artikel"
          >
            <Textarea id="sourceReference" {...register("sourceReference")} />
          </FormField>
          <FormField label="Tanggal tinjauan" htmlFor="reviewedAt" error={errors.reviewedAt?.message}>
            <Input id="reviewedAt" type="date" className={inputClass} {...register("reviewedAt")} />
          </FormField>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-border shadow-soft">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="font-display text-base">Publikasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Status" htmlFor="status">
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="status" className={`w-full ${inputClass}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ARTICLE_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            {status === "published" && (
              <FormField label="Jadwalkan terbit" htmlFor="publishedAt" hint="Kosongkan untuk terbit sekarang">
                <Input id="publishedAt" type="datetime-local" className={inputClass} {...register("publishedAt")} />
              </FormField>
            )}
          </div>

          <FormField label="Meta title" htmlFor="metaTitle" error={errors.metaTitle?.message} hint="Opsional, untuk SEO">
            <Input id="metaTitle" className={inputClass} {...register("metaTitle")} />
          </FormField>
          <FormField label="Meta description" htmlFor="metaDescription" error={errors.metaDescription?.message} hint="Opsional, untuk SEO">
            <Textarea id="metaDescription" {...register("metaDescription")} />
          </FormField>
        </CardContent>
      </Card>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-11 w-full rounded-full bg-primary text-base text-white shadow-soft hover:bg-[#EC4899] sm:w-auto sm:px-8"
      >
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        {isSubmitting ? "Menyimpan..." : isEditing ? "Simpan" : "Buat Artikel"}
      </Button>
    </form>
  );
}
