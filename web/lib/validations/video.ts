import { z } from "zod";

import { optionalFileSchema } from "@/lib/validations/file";

import type { AdminVideo, ArticleStatus, LifeStage } from "@/lib/types";
import { ARTICLE_STATUS_OPTIONS, LIFE_STAGE_OPTIONS } from "@/lib/validations/article";

export { ARTICLE_STATUS_OPTIONS as VIDEO_STATUS_OPTIONS, LIFE_STAGE_OPTIONS };

export const videoSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(255, "Maksimal 255 karakter"),
  slug: z
    .string()
    .max(255, "Maksimal 255 karakter")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Hanya huruf kecil, angka, dan tanda hubung")
    .optional()
    .or(z.literal("")),
  description: z.string().optional(),
  youtubeUrl: z.string().min(1, "URL YouTube wajib diisi"),
  thumbnail: optionalFileSchema({ accept: "image/*", maxSizeKb: 4096 }),
  removeThumbnail: z.boolean(),
  categoryId: z.string().optional(),
  durationMinutes: z.string().optional(),
  durationSeconds: z.string().optional(),
  lifeStage: z.enum(["preconception", "pregnancy", "birth", "postpartum", "parenting"]),
  status: z.enum(["draft", "published"]),
  publishedAt: z.string().optional(),
});

export type VideoInput = z.infer<typeof videoSchema>;

function secondsToParts(totalSeconds: number | null): { minutes: string; seconds: string } {
  if (!totalSeconds) return { minutes: "", seconds: "" };
  return {
    minutes: String(Math.floor(totalSeconds / 60)),
    seconds: String(totalSeconds % 60).padStart(2, "0"),
  };
}

export function toVideoFormValues(video?: AdminVideo): VideoInput {
  if (!video) {
    return {
      title: "",
      slug: "",
      description: "",
      youtubeUrl: "",
      removeThumbnail: false,
      categoryId: "",
      durationMinutes: "",
      durationSeconds: "",
      lifeStage: "pregnancy",
      status: "draft",
      publishedAt: "",
    };
  }

  const { minutes, seconds } = secondsToParts(video.duration_seconds);

  return {
    title: video.title,
    slug: video.slug,
    description: video.description ?? "",
    youtubeUrl: `https://youtu.be/${video.youtube_id}`,
    removeThumbnail: false,
    categoryId: video.category_id ? String(video.category_id) : "",
    durationMinutes: minutes,
    durationSeconds: seconds,
    lifeStage: video.life_stage,
    status: video.status,
    publishedAt: video.published_at ? video.published_at.slice(0, 16) : "",
  };
}

export function toVideoFormData(values: VideoInput, isUpdate: boolean): FormData {
  const formData = new FormData();

  if (isUpdate) formData.append("_method", "PUT");
  formData.append("title", values.title);
  if (values.slug?.trim()) formData.append("slug", values.slug);
  if (values.description?.trim()) formData.append("description", values.description);
  formData.append("youtube_url", values.youtubeUrl);
  if (values.thumbnail) formData.append("thumbnail", values.thumbnail);
  if (values.removeThumbnail) formData.append("remove_thumbnail", "1");
  if (values.categoryId?.trim()) formData.append("category_id", values.categoryId);

  const minutes = Number(values.durationMinutes) || 0;
  const seconds = Number(values.durationSeconds) || 0;
  const totalSeconds = minutes * 60 + seconds;
  if (totalSeconds > 0) formData.append("duration_seconds", String(totalSeconds));

  formData.append("life_stage", values.lifeStage);
  formData.append("status", values.status);
  if (values.status === "published" && values.publishedAt?.trim()) {
    formData.append("published_at", values.publishedAt);
  }

  return formData;
}

export function formatDuration(totalSeconds: number | null): string | null {
  if (!totalSeconds) return null;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export type { ArticleStatus as VideoStatus, LifeStage };
