import { Skeleton, SkeletonCircle, SkeletonText } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Kumpulan kerangka (skeleton) untuk keadaan "sedang memuat".
 *
 * Aturan pakai: pilih kerangka yang bentuknya paling menyerupai konten
 * yang akan menggantikannya. Kerangka yang meniru tata letak asli membuat
 * perpindahan ke data sungguhan nyaris tanpa pergeseran, sekaligus memberi
 * tahu pengguna *apa* yang sedang dimuat — sesuatu yang tidak bisa
 * dilakukan spinner tunggal di tengah halaman.
 *
 * Semua komponen di sini menandai dirinya `aria-busy` + `role="status"`
 * dengan label yang bisa dibaca pembaca layar, sementara blok visualnya
 * `aria-hidden` supaya tidak dibacakan satu per satu.
 */

/** Pembungkus umum: satu titik pengumuman untuk pembaca layar. */
function LoadingRegion({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={cn("skeleton-enter", className)}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Layar penuh — dipakai layout saat sesi masih dihidrasi              */
/* ------------------------------------------------------------------ */

/**
 * Pemuat layar penuh bernuansa merek untuk gerbang autentikasi
 * (layout tiap area). Tiga titik yang berdenyut bergantian terbaca
 * sebagai "sedang menyiapkan", bukan sebagai halaman yang macet.
 */
export function FullPageLoader({ label = "Memuat sesi" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-6"
    >
      <span className="relative flex size-16 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/20 [animation-duration:1.8s]" />
        <span className="absolute inset-2 rounded-full bg-primary-soft" />
        <span className="relative flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1.5 rounded-full bg-primary"
              style={{
                animation: "skeleton-breathe 1.1s ease-in-out infinite",
                animationDelay: `${i * 0.16}s`,
              }}
            />
          ))}
        </span>
      </span>
      <p className="text-sm font-medium text-muted-foreground">{label}...</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Potongan kecil                                                      */
/* ------------------------------------------------------------------ */

/** Indikator sebaris untuk area sempit (di dalam kartu, baris tabel, dialog). */
export function InlineLoader({
  label = "Memuat",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}
    >
      <span aria-hidden="true" className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 rounded-full bg-primary/70"
            style={{
              animation: "skeleton-breathe 1.1s ease-in-out infinite",
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </span>
      {label}...
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tabel                                                               */
/* ------------------------------------------------------------------ */

/**
 * Kerangka tabel dalam bingkai yang sama dengan tabel asli
 * (`rounded-3xl border shadow-soft`), lengkap dengan baris kepala.
 *
 * `widths` memberi lebar berbeda tiap kolom supaya tidak terlihat seperti
 * kisi seragam; bila tak diisi, dipakai pola lebar bawaan yang bervariasi.
 */
export function TableSkeleton({
  columns = 4,
  rows = 5,
  widths,
  lastColumnAction = true,
  className,
}: {
  columns?: number;
  rows?: number;
  widths?: string[];
  lastColumnAction?: boolean;
  className?: string;
}) {
  const fallback = ["60%", "45%", "35%", "50%", "40%", "55%"];
  const colWidth = (i: number) => widths?.[i] ?? fallback[i % fallback.length];

  return (
    <LoadingRegion
      label="Memuat data tabel"
      className={cn("overflow-hidden rounded-3xl border border-border bg-card shadow-soft", className)}
    >
      <div className="border-b border-border bg-muted/40 px-4 py-3.5">
        <div className="flex items-center gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="min-w-0 flex-1">
              <SkeletonText className="h-3.5 bg-muted-foreground/15" width={colWidth(i)} />
            </div>
          ))}
        </div>
      </div>

      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-0"
          style={{ opacity: 1 - r * (0.5 / Math.max(rows, 1)) }}
        >
          {Array.from({ length: columns }).map((_, c) => {
            const isAction = lastColumnAction && c === columns - 1;
            return (
              <div key={c} className={cn("min-w-0 flex-1", isAction && "flex justify-end")}>
                {isAction ? (
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-16 rounded-full" />
                    <Skeleton className="h-8 w-16 rounded-full" />
                  </div>
                ) : (
                  <SkeletonText width={c === 0 ? "80%" : colWidth(c)} />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </LoadingRegion>
  );
}

/* ------------------------------------------------------------------ */
/* Kartu                                                               */
/* ------------------------------------------------------------------ */

/** Satu kartu: judul, dua baris teks, dan (opsional) baris aksi. */
export function CardSkeleton({
  lines = 2,
  withIcon = false,
  withAction = false,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  lines?: number;
  withIcon?: boolean;
  withAction?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("rounded-3xl border border-border bg-card p-5 shadow-soft", className)}
      {...props}
    >
      <div className="flex items-center gap-3">
        {withIcon && <SkeletonCircle className="size-11" />}
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonText className="h-4.5" width="55%" />
          <SkeletonText className="h-3.5" width="35%" />
        </div>
      </div>
      {lines > 0 && (
        <div className="mt-4 space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <SkeletonText key={i} className="h-3.5" width={i === lines - 1 ? "60%" : "100%"} />
          ))}
        </div>
      )}
      {withAction && (
        <div className="mt-5 flex gap-2">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
      )}
    </div>
  );
}

/** Kisi kartu. `columns` mengikuti breakpoint yang lazim dipakai di proyek. */
export function CardGridSkeleton({
  count = 6,
  columns = 3,
  lines = 2,
  withIcon = false,
  withAction = false,
  label = "Memuat data",
  className,
}: {
  count?: number;
  columns?: 1 | 2 | 3 | 4;
  lines?: number;
  withIcon?: boolean;
  withAction?: boolean;
  label?: string;
  className?: string;
}) {
  const grid = {
    1: "grid-cols-1",
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <LoadingRegion label={label} className={cn("grid gap-4", grid, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton
          key={i}
          lines={lines}
          withIcon={withIcon}
          withAction={withAction}
          style={{ opacity: 1 - i * (0.45 / Math.max(count, 1)) }}
        />
      ))}
    </LoadingRegion>
  );
}

/** Kartu angka besar (dasbor admin / ringkasan). */
export function StatCardsSkeleton({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <LoadingRegion label="Memuat statistik" className={cn("space-y-5", className)}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <SkeletonCircle className="size-11" />
              <SkeletonText className="h-3.5" width="60%" />
            </div>
            <Skeleton className="mt-3 h-8 w-24 rounded-lg" />
            <SkeletonText className="mt-2 h-3.5" width="85%" />
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6">
        <SkeletonText className="h-4.5" width="40%" />
        <SkeletonText className="mt-2 h-3.5" width="60%" />
        <div className="mt-5 space-y-3.5">
          {["78%", "55%", "34%"].map((w, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <SkeletonText className="h-3.5" width="30%" />
                <SkeletonText className="h-3.5 w-10" />
              </div>
              <Skeleton className="h-2.5 rounded-full" style={{ width: w }} />
            </div>
          ))}
        </div>
      </div>
    </LoadingRegion>
  );
}

/**
 * Ringkasan dashboard ibu hamil: kartu usia kehamilan yang lebar, tiga
 * kartu ringkasan sejajar, lalu kartu rekomendasi artikel — persis
 * susunan `app/dashboard/page.tsx`.
 */
export function OverviewSkeleton({ className }: { className?: string }) {
  return (
    <LoadingRegion label="Memuat ringkasan" className={cn("space-y-6", className)}>
      <div className="flex flex-col items-center gap-6 rounded-3xl border border-border bg-primary-soft p-6 sm:flex-row sm:p-8">
        <Skeleton className="size-28 shrink-0 rounded-full bg-primary/15" />
        <div className="w-full space-y-2.5 text-center sm:text-left">
          <SkeletonText className="mx-auto h-3.5 bg-primary/15 sm:mx-0" width="28%" />
          <Skeleton className="mx-auto h-7 w-52 rounded-lg bg-primary/15 sm:mx-0" />
          <SkeletonText className="mx-auto h-3.5 bg-primary/15 sm:mx-0" width="45%" />
          <Skeleton className="mt-4 h-16 rounded-2xl bg-white shadow-soft" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-col rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6"
            style={{ opacity: 1 - i * 0.12 }}
          >
            <div className="flex items-center gap-3">
              <SkeletonCircle className="size-11" />
              <SkeletonText className="h-4" width="50%" />
            </div>
            <div className="mt-4 flex-1 space-y-2.5">
              <SkeletonText className="h-3.5" width="100%" />
              <SkeletonText className="h-3.5" width="80%" />
              <SkeletonText className="h-3.5" width="55%" />
            </div>
            <SkeletonText className="mt-4 h-3.5" width="40%" />
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6">
        <div className="flex items-center gap-3">
          <SkeletonCircle className="size-11" />
          <SkeletonText className="h-4" width="35%" />
        </div>
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-14 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonText className="h-3.5" width={`${55 + ((i * 17) % 30)}%`} />
                <SkeletonText className="h-3" width="30%" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </LoadingRegion>
  );
}

/* ------------------------------------------------------------------ */
/* Daftar & formulir                                                   */
/* ------------------------------------------------------------------ */

/**
 * Daftar baris (FAQ, checklist, izin, dokumen, dsb).
 *
 * `framed` mengikuti bentuk daftar aslinya: `true` untuk satu bingkai berisi
 * baris bergaris pemisah, `false` untuk tumpukan kartu terpisah seperti
 * daftar yang bisa diseret-urutkan.
 */
export function ListSkeleton({
  rows = 4,
  withAvatar = false,
  withAction = true,
  withHandle = false,
  framed = true,
  label = "Memuat daftar",
  className,
}: {
  rows?: number;
  withAvatar?: boolean;
  withAction?: boolean;
  withHandle?: boolean;
  framed?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <LoadingRegion
      label={label}
      className={cn(
        framed
          ? "overflow-hidden rounded-3xl border border-border bg-card shadow-soft"
          : "space-y-3",
        className,
      )}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex items-center gap-4 p-4 sm:p-5",
            framed
              ? "border-b border-border last:border-0"
              : "rounded-2xl border border-border bg-card shadow-soft",
          )}
          style={{ opacity: 1 - i * (0.5 / Math.max(rows, 1)) }}
        >
          {withHandle && <Skeleton className="h-5 w-4 shrink-0 rounded-sm" />}
          {withAvatar && <SkeletonCircle />}
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonText className="h-4" width="45%" />
            <SkeletonText className="h-3.5" width="75%" />
          </div>
          {withAction && (
            <div className="flex shrink-0 gap-2">
              <Skeleton className="h-9 w-16 rounded-full" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          )}
        </div>
      ))}
    </LoadingRegion>
  );
}

/**
 * Daftar yang dikelompokkan per seksi berjudul (mis. checklist per tahap
 * kehamilan). Judul seksi ikut jadi kerangka karena nama grupnya pun
 * datang dari server.
 */
export function GroupedListSkeleton({
  groups = 2,
  rowsPerGroup = 3,
  label = "Memuat daftar",
  className,
}: {
  groups?: number;
  rowsPerGroup?: number;
  label?: string;
  className?: string;
}) {
  return (
    <LoadingRegion label={label} className={cn("space-y-8", className)}>
      {Array.from({ length: groups }).map((_, g) => (
        <section key={g} style={{ opacity: 1 - g * 0.25 }}>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <Skeleton className="h-5 w-44 rounded-lg" />
            <Skeleton className="h-8 w-28 rounded-full" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: rowsPerGroup }).map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft"
              >
                <Skeleton className="mt-0.5 h-5 w-4 shrink-0 rounded-sm" />
                <div className="min-w-0 flex-1 space-y-2">
                  <SkeletonText className="h-4" width={`${40 + ((i * 13) % 30)}%`} />
                  <SkeletonText className="h-3.5" width="70%" />
                </div>
                <div className="flex shrink-0 gap-1">
                  <Skeleton className="size-8 rounded-full" />
                  <Skeleton className="size-8 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </LoadingRegion>
  );
}

/** Formulir pengaturan: beberapa pasang label + input, ditutup tombol simpan. */
export function FormSkeleton({
  fields = 4,
  withTextarea = false,
  inCard = true,
  label = "Memuat formulir",
  className,
}: {
  fields?: number;
  withTextarea?: boolean;
  inCard?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <LoadingRegion
      label={label}
      className={cn(
        "space-y-5",
        inCard && "rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6",
        className,
      )}
    >
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonText className="h-3.5" width={`${28 + ((i * 9) % 22)}%`} />
          <Skeleton className="h-10 rounded-xl" />
        </div>
      ))}
      {withTextarea && (
        <div className="space-y-2">
          <SkeletonText className="h-3.5" width="24%" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      )}
      <Skeleton className="h-10 w-32 rounded-full" />
    </LoadingRegion>
  );
}

/* ------------------------------------------------------------------ */
/* Halaman rincian                                                     */
/* ------------------------------------------------------------------ */

/** Rincian satu entitas: judul, meta, lalu blok paragraf. */
export function DetailSkeleton({
  paragraphs = 3,
  withHero = false,
  label = "Memuat rincian",
  className,
}: {
  paragraphs?: number;
  withHero?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <LoadingRegion label={label} className={cn("space-y-6", className)}>
      <div className="space-y-3">
        <Skeleton className="h-7 w-3/5 rounded-lg" />
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-6 w-20 rounded-full" />
          <SkeletonText className="h-3.5 w-32" />
        </div>
      </div>

      {withHero && <Skeleton className="aspect-[16/7] w-full rounded-3xl" />}

      <div className="space-y-6">
        {Array.from({ length: paragraphs }).map((_, p) => (
          <div key={p} className="space-y-2.5" style={{ opacity: 1 - p * 0.16 }}>
            {[0, 1, 2, 3].map((l) => (
              <SkeletonText
                key={l}
                className="h-3.5"
                width={l === 3 ? `${45 + ((p * 13) % 25)}%` : "100%"}
              />
            ))}
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}

/** Kerangka kuesioner/survei: kartu pertanyaan berurutan. */
export function QuestionnaireSkeleton({
  questions = 3,
  label = "Memuat kuesioner",
  className,
}: {
  questions?: number;
  label?: string;
  className?: string;
}) {
  return (
    <LoadingRegion label={label} className={cn("space-y-5", className)}>
      <div className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6">
        <Skeleton className="h-6 w-2/5 rounded-lg" />
        <SkeletonText className="h-3.5" width="80%" />
        <Skeleton className="mt-2 h-2 rounded-full" />
      </div>

      {Array.from({ length: questions }).map((_, q) => (
        <div
          key={q}
          className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6"
          style={{ opacity: 1 - q * 0.18 }}
        >
          <SkeletonText className="h-4" width={`${60 + ((q * 11) % 30)}%`} />
          <div className="space-y-2.5">
            {[0, 1, 2].map((o) => (
              <div key={o} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <SkeletonCircle className="size-5" />
                <SkeletonText className="h-3.5" width={`${35 + ((o * 17) % 40)}%`} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </LoadingRegion>
  );
}
