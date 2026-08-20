import {
  FacebookIcon,
  InstagramIcon,
  TiktokIcon,
  YoutubeIcon,
} from "@/components/shared/social-icons";
import { cn } from "@/lib/utils";
import type { SocialSettings } from "@/lib/types";

/**
 * Ikon tiap platform tetap di kode — komponen SVG tidak bisa disimpan di
 * database. Yang datang dari `settings` hanya URL-nya, dan platform yang
 * URL-nya kosong tidak dirender sama sekali (sebelumnya keempatnya dirender
 * sebagai tautan mati `href="#"`).
 *
 * Dipakai bersama oleh footer dan halaman `/kontak` supaya keduanya tidak bisa
 * berbeda pendapat soal platform mana yang ada dan bagaimana yang kosong
 * diperlakukan.
 */
export const SOCIALS = [
  { key: "social_instagram_url", label: "Instagram", Icon: InstagramIcon },
  { key: "social_facebook_url", label: "Facebook", Icon: FacebookIcon },
  { key: "social_youtube_url", label: "YouTube", Icon: YoutubeIcon },
  { key: "social_tiktok_url", label: "TikTok", Icon: TiktokIcon },
] as const;

export function resolveSocialLinks(settings: Partial<SocialSettings> | null | undefined) {
  return SOCIALS.flatMap(({ key, label, Icon }) => {
    const href = settings?.[key];
    return href ? [{ label, Icon, href }] : [];
  });
}

/** Merender nol tautan bila belum satu pun URL sosial diisi di pengaturan. */
export function SocialLinks({
  settings,
  className,
}: {
  settings: Partial<SocialSettings> | null | undefined;
  className?: string;
}) {
  const socials = resolveSocialLinks(settings);

  if (socials.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {socials.map(({ label, Icon, href }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-brand-purple-soft hover:text-brand-purple"
        >
          <Icon className="size-4" />
        </a>
      ))}
    </div>
  );
}
