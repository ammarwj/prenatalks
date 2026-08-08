import Image from "next/image";
import Link from "next/link";

/**
 * `href` default menunjuk anchor beranda landing page. Area yang bukan
 * landing (mis. panel admin) mengopernya sendiri supaya logonya menautkan
 * ke akar area itu, bukan ke anchor yang tidak ada di halaman tersebut.
 */
export function Logo({
  withTagline = true,
  href = "#beranda",
}: {
  withTagline?: boolean;
  href?: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-2.5 shrink-0">
      <Image
        src="/brand/logo.png"
        alt="Logo PrenaTalks"
        width={40}
        height={40}
        className="h-9 w-9 sm:h-10 sm:w-10 object-contain"
        priority
      />
      <span className="flex flex-col leading-none">
        <span className="font-display font-extrabold text-lg sm:text-xl tracking-tight">
          <span className="text-[#EC4899]">Prena</span>
          <span className="text-brand-purple">Talks</span>
        </span>
        {withTagline && (
          <span className="text-[11px] text-muted-foreground font-medium mt-0.5 hidden sm:block">
            Teman Ibu Hamil untuk Persalinan Aman
          </span>
        )}
      </span>
    </Link>
  );
}
