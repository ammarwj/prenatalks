import Image from "next/image";
import Link from "next/link";
import { PlayCircle } from "lucide-react";

import { formatDuration } from "@/lib/validations/video";
import type { VideoSummary } from "@/lib/types";

export function VideoCard({ video }: { video: VideoSummary }) {
  const duration = formatDuration(video.duration_seconds);

  return (
    <Link
      href={`/video/${video.slug}`}
      className="group block overflow-hidden rounded-3xl border border-border bg-white shadow-soft transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <Image
          src={video.thumbnail_url}
          alt=""
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized={video.thumbnail_url.includes("img.youtube.com")}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity group-hover:opacity-100">
          <PlayCircle className="size-12 text-white drop-shadow" />
        </div>
        {duration && (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
            {duration}
          </span>
        )}
      </div>
      <div className="space-y-1.5 p-5">
        {video.category && (
          <span className="text-xs font-semibold uppercase tracking-wide text-primary-text">
            {video.category.name}
          </span>
        )}
        <h3 className="line-clamp-2 font-display text-base font-bold text-foreground">{video.title}</h3>
      </div>
    </Link>
  );
}
