import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Calendar, ExternalLink } from "lucide-react";

import { PublicHeader } from "@/components/shared/public-header";
import { apiServerGet } from "@/lib/api-server";
import { formatDuration } from "@/lib/validations/video";
import type { VideoDetail } from "@/lib/types";

async function getVideo(slug: string): Promise<VideoDetail | null> {
  const { data, status } = await apiServerGet<VideoDetail>(`/videos/${slug}`);
  if (status === 404 || !data) return null;
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const video = await getVideo(slug);
  if (!video) return { title: "Video tidak ditemukan — PrenaTalks" };

  return {
    title: `${video.title} — PrenaTalks`,
    description: video.description ?? undefined,
    openGraph: {
      title: video.title,
      description: video.description ?? undefined,
      type: "video.other",
      images: [video.thumbnail_url],
    },
  };
}

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const video = await getVideo(slug);
  if (!video) notFound();

  const publishedDate = video.published_at ? new Date(video.published_at) : null;
  const duration = formatDuration(video.duration_seconds);
  const watchUrl = `https://www.youtube.com/watch?v=${video.embed_url.split("/embed/")[1]}`;

  return (
    <div className="min-h-screen bg-muted/40">
      <PublicHeader backHref="/video" backLabel="Kembali ke Video" />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <article className="rounded-3xl border border-border bg-white p-6 shadow-soft sm:p-10">
          {video.category && (
            <span className="text-xs font-semibold uppercase tracking-wide text-primary-text">
              {video.category.name}
            </span>
          )}
          <h1 className="mt-2 font-display text-2xl font-extrabold text-foreground sm:text-3xl">
            {video.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {publishedDate && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-4" />
                {publishedDate.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
            {duration && <span>{duration}</span>}
          </div>

          <div className="relative mt-6 aspect-video w-full overflow-hidden rounded-2xl bg-black">
            <iframe
              src={video.embed_url}
              title={video.title}
              className="absolute inset-0 size-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Video tidak tampil di atas? Video mungkin bersifat privat, sudah dihapus, atau
            koneksi Anda memblokir YouTube.{" "}
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-primary-text hover:underline"
            >
              Tonton langsung di YouTube
              <ExternalLink className="size-3" />
            </a>
          </p>

          {video.description && (
            <p className="mt-6 whitespace-pre-line text-sm text-foreground sm:text-base">
              {video.description}
            </p>
          )}
        </article>
      </main>
    </div>
  );
}
