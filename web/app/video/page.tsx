import Link from "next/link";

import { VideoCard } from "@/components/videos/video-card";
import { Footer } from "@/components/shared/footer";
import { PublicHeader } from "@/components/shared/public-header";
import { cn } from "@/lib/utils";
import { apiServerGet } from "@/lib/api-server";
import type { VideoSummary } from "@/lib/types";

export const metadata = {
  title: "Video Edukasi — PrenaTalks",
  description: "Video edukasi kehamilan, persalinan, dan pengasuhan yang mudah dipahami.",
};

export default async function VideoGalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const query = page ? `?page=${page}` : "";
  const { data: videos, meta } = await apiServerGet<VideoSummary[]>(`/videos${query}`);

  const currentPage = Number(page ?? 1);
  const perPage = Number(meta?.per_page ?? 12);
  const total = Number(meta?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="min-h-screen bg-muted/40">
      <PublicHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">
            Video Edukasi
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Belajar lewat video pendek seputar kehamilan, persalinan, dan pengasuhan.
          </p>
        </div>

        {!videos || videos.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-16 text-center text-sm text-muted-foreground">
            Belum ada video yang diterbitkan.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-4" aria-label="Navigasi halaman video">
            <Link
              href={`/video?page=${Math.max(1, currentPage - 1)}`}
              aria-disabled={currentPage === 1}
              tabIndex={currentPage === 1 ? -1 : undefined}
              className={cn(
                "rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted",
                currentPage === 1 && "pointer-events-none opacity-40"
              )}
            >
              Sebelumnya
            </Link>
            <span className="text-sm text-muted-foreground">
              Halaman {currentPage} dari {totalPages}
            </span>
            <Link
              href={`/video?page=${Math.min(totalPages, currentPage + 1)}`}
              aria-disabled={currentPage === totalPages}
              tabIndex={currentPage === totalPages ? -1 : undefined}
              className={cn(
                "rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted",
                currentPage === totalPages && "pointer-events-none opacity-40"
              )}
            >
              Berikutnya
            </Link>
          </nav>
        )}
      </main>

      <Footer />
    </div>
  );
}
