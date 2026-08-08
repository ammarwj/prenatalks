"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { ImageOff, Loader2, X } from "lucide-react";

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
import type { AdminVideo, Category } from "@/lib/types";
import {
  LIFE_STAGE_OPTIONS,
  VIDEO_STATUS_OPTIONS,
  toVideoFormData,
  toVideoFormValues,
  videoSchema,
  type VideoInput,
} from "@/lib/validations/video";

const inputClass = "h-11 rounded-xl";

export function VideoForm({
  initialData,
  onSaved,
}: {
  initialData?: AdminVideo;
  onSaved: (result: AdminVideo) => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    initialData?.thumbnail_url ?? null
  );
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VideoInput>({
    resolver: zodResolver(videoSchema),
    defaultValues: toVideoFormValues(initialData),
  });

  const status = useWatch({ control, name: "status" });

  useEffect(() => {
    apiGet<Category[]>("/categories?type=video")
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  async function onSubmit(values: VideoInput) {
    setServerError(null);
    try {
      const formData = toVideoFormData(values, isEditing);
      const result = isEditing && initialData
        ? await apiPostForm<AdminVideo>(`/admin/videos/${initialData.id}`, formData)
        : await apiPostForm<AdminVideo>("/admin/videos", formData);
      onSaved(result);
    } catch (err) {
      setServerError(err instanceof ApiRequestError ? err.message : "Terjadi kesalahan, coba lagi.");
    }
  }

  function handleThumbnailChange(file: File | undefined) {
    setValue("thumbnail", file, { shouldDirty: true });
    if (file) {
      setValue("removeThumbnail", false);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  }

  function handleRemoveThumbnail() {
    setValue("thumbnail", undefined);
    setValue("removeThumbnail", true, { shouldDirty: true });
    setThumbnailPreview(null);
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
          <CardTitle className="font-display text-base">Info Video</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6">
          <FormField label="Judul" htmlFor="title" error={errors.title?.message}>
            <Input id="title" className={inputClass} aria-invalid={!!errors.title} {...register("title")} />
          </FormField>
          <FormField label="Slug" htmlFor="slug" error={errors.slug?.message} hint="Kosongkan untuk dibuat otomatis">
            <Input id="slug" className={inputClass} {...register("slug")} />
          </FormField>
          <FormField label="Deskripsi" htmlFor="description" hint="Opsional">
            <Textarea id="description" {...register("description")} />
          </FormField>
          <FormField
            label="URL YouTube"
            htmlFor="youtubeUrl"
            error={errors.youtubeUrl?.message}
            hint="Gunakan tautan unlisted/privat, mis. https://youtu.be/... — akan disematkan lewat youtube-nocookie.com"
          >
            <Input
              id="youtubeUrl"
              className={inputClass}
              placeholder="https://youtu.be/dQw4w9WgXcQ"
              {...register("youtubeUrl")}
            />
          </FormField>

          <FormField label="Thumbnail" htmlFor="thumbnail" hint="Opsional — kosongkan untuk pakai thumbnail bawaan YouTube">
            <div className="flex items-center gap-4">
              {thumbnailPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbnailPreview} alt="" className="h-20 w-32 rounded-xl object-cover" />
              ) : (
                <div className="flex h-20 w-32 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <ImageOff className="size-6" />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Input
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  className={inputClass}
                  onChange={(e) => handleThumbnailChange(e.target.files?.[0])}
                />
                {thumbnailPreview && (
                  <Button type="button" variant="ghost" size="sm" className="w-fit gap-1.5" onClick={handleRemoveThumbnail}>
                    <X className="size-3.5" />
                    Hapus thumbnail
                  </Button>
                )}
              </div>
            </div>
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          </div>

          <div className="grid grid-cols-2 gap-4 sm:w-1/2">
            <FormField label="Durasi (menit)" htmlFor="durationMinutes" hint="Opsional">
              <Input id="durationMinutes" type="number" min={0} className={inputClass} {...register("durationMinutes")} />
            </FormField>
            <FormField label="Durasi (detik)" htmlFor="durationSeconds" hint="Opsional">
              <Input id="durationSeconds" type="number" min={0} max={59} className={inputClass} {...register("durationSeconds")} />
            </FormField>
          </div>
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
                      {VIDEO_STATUS_OPTIONS.map((option) => (
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
        </CardContent>
      </Card>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-11 w-full rounded-full bg-primary text-base text-white shadow-soft hover:bg-[#EC4899] sm:w-auto sm:px-8"
      >
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        {isSubmitting ? "Menyimpan..." : isEditing ? "Simpan" : "Tambah Video"}
      </Button>
    </form>
  );
}
