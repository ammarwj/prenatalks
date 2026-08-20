"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { VideoForm } from "@/components/admin/video-form";
import { FormSkeleton } from "@/components/shared/loading-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiGet, ApiRequestError } from "@/lib/api-client";
import type { AdminVideo } from "@/lib/types";

export default function EditVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [video, setVideo] = useState<AdminVideo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    setNotFound(false);
    try {
      const data = await apiGet<AdminVideo>(`/admin/videos/${id}`);
      setVideo(data);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 404) {
        setNotFound(true);
      } else {
        setLoadError(err instanceof ApiRequestError ? err.message : "Gagal memuat video.");
      }
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function handleSaved(result: AdminVideo) {
    toast.success("Video diperbarui");
    setVideo(result);
  }

  if (notFound) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>Video tidak ditemukan. Mungkin sudah dihapus.</AlertDescription>
        </Alert>
        <Link href="/admin/video" className="text-sm font-semibold text-primary-text underline">
          Kembali ke daftar video
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-foreground">Edit Video</h1>
        <p className="mt-1 text-sm text-muted-foreground">Perbarui info, thumbnail, atau status terbit video ini.</p>
      </div>

      {loadError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {video === null && !loadError ? (
        <FormSkeleton fields={4} withTextarea />
      ) : video ? (
        <VideoForm key={video.updated_at} initialData={video} onSaved={handleSaved} />
      ) : null}
    </div>
  );
}
