"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Menu } from "lucide-react";

import { AuthNavButton } from "@/components/shared/auth-nav-button";
import { Logo } from "@/components/shared/logo";
import { PublicNav } from "@/components/shared/public-nav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

/**
 * Satu header untuk seluruh area publik, termasuk landing page.
 *
 * Sebelumnya ada tiga: `Navbar` (landing), `PublicPageHeader` (halaman
 * publik), dan salinan tulisan tangan di dalam `app/kalkulator/page.tsx`.
 * Ketiganya mengerjakan hal yang sama dengan tinggi, lebar, dan gaya logo
 * yang berbeda-beda tanpa alasan.
 *
 * `backHref` hanya dikirim halaman detail, dan tautannya sengaja cuma
 * tampil di layar sempit: di sana menu bersembunyi di balik drawer,
 * sementara di layar lebar ia redundan dengan menu ("Kembali ke Video"
 * sama saja dengan menu "Video").
 */
export function PublicHeader({
  backHref,
  backLabel,
}: {
  backHref?: string;
  backLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/90 backdrop-blur supports-backdrop-filter:bg-white/70">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-8">
        <Logo href="/" />

        <div className="hidden items-center gap-7 md:flex">
          <PublicNav />
          <AuthNavButton />
        </div>

        <div className="flex items-center gap-1 md:hidden">
          {backHref && (
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">{backLabel}</span>
            </Link>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Buka menu navigasi">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="px-4 pt-4">
                <Logo withTagline={false} href="/" />
              </SheetTitle>
              <div className="space-y-3 px-4">
                <PublicNav variant="stack" onNavigate={() => setOpen(false)} />
                <AuthNavButton className="w-full" onNavigate={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
