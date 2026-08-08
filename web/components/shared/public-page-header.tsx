import Link from "next/link";

import { Logo } from "@/components/shared/logo";

export function PublicPageHeader({
  backHref = "/",
  backLabel = "Kembali ke Beranda",
}: {
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo withTagline={false} />
        <Link href={backHref} className="text-sm font-semibold text-muted-foreground hover:text-foreground">
          {backLabel}
        </Link>
      </div>
    </header>
  );
}
