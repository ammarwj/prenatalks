import { cn } from "@/lib/utils";

/**
 * Blok pengganti konten selama data dimuat.
 *
 * Dasarnya `--muted` dengan sapuan kilau bernuansa merek (lihat
 * `.skeleton-shimmer` di `app/globals.css`). Dibanding `animate-pulse`,
 * kilau ini tidak menurunkan opasitas seluruh blok sehingga susunan
 * halaman tetap terbaca sebagai kerangka, bukan sekadar kedipan abu-abu.
 *
 * Selalu beri tinggi/lebar yang meniru konten aslinya supaya tidak ada
 * pergeseran tata letak saat data datang.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("skeleton-shimmer rounded-md bg-muted", className)}
      {...props}
    />
  );
}

/**
 * Sebaris teks palsu. `width` memakai persentase supaya baris terakhir
 * paragraf bisa dibuat lebih pendek — meniru ritme teks sungguhan.
 */
function SkeletonText({
  className,
  width,
  style,
  ...props
}: React.ComponentProps<"div"> & { width?: string }) {
  return (
    <Skeleton
      className={cn("h-4 rounded-full", className)}
      style={width ? { width, ...style } : style}
      {...props}
    />
  );
}

/** Lingkaran untuk avatar/ikon. */
function SkeletonCircle({ className, ...props }: React.ComponentProps<"div">) {
  return <Skeleton className={cn("size-10 shrink-0 rounded-full", className)} {...props} />;
}

export { Skeleton, SkeletonText, SkeletonCircle };
