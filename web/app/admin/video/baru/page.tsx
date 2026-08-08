"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { VideoForm } from "@/components/admin/video-form";
import type { AdminVideo } from "@/lib/types";

export default function NewVideoPage() {
  const router = useRouter();

  function handleSaved(result: AdminVideo) {
    toast.success("Video dibuat");
    router.push(`/admin/video/${result.id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-foreground">Tambah Video Baru</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tempel tautan YouTube unlisted/privat dan lengkapi info video.
        </p>
      </div>
      <VideoForm onSaved={handleSaved} />
    </div>
  );
}
