import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import {
  FacebookIcon,
  InstagramIcon,
  TiktokIcon,
  YoutubeIcon,
} from "@/components/shared/social-icons";
import { apiServerGet } from "@/lib/api-server";
import { NAV_ITEMS } from "@/lib/nav-items";
import { PUBLIC_SETTINGS_TAG } from "@/lib/public-cache";
import type { ContactSettings, SocialSettings } from "@/lib/types";

const ABOUT_LINKS = [
  { label: "Tentang PrenaTalks", href: "/tentang" },
  { label: "Tim Ahli", href: "/tentang" },
  { label: "Kebijakan Privasi", href: "#" },
  { label: "Syarat & Ketentuan", href: "#" },
];

const HELP_LINKS = [
  { label: "FAQ", href: "/faq" },
  { label: "Komunitas", href: "/komunitas" },
  { label: "Panduan Penggunaan", href: "#" },
  { label: "Hubungi Kami", href: "#kontak" },
];

/**
 * Ikon tiap platform tetap di kode — komponen SVG tidak bisa disimpan di
 * database. Yang datang dari `settings` hanya URL-nya, dan platform yang
 * URL-nya kosong tidak dirender sama sekali (sebelumnya keempatnya dirender
 * sebagai tautan mati `href="#"`).
 */
const SOCIALS = [
  { key: "social_instagram_url", label: "Instagram", Icon: InstagramIcon },
  { key: "social_facebook_url", label: "Facebook", Icon: FacebookIcon },
  { key: "social_youtube_url", label: "YouTube", Icon: YoutubeIcon },
  { key: "social_tiktok_url", label: "TikTok", Icon: TiktokIcon },
] as const;

type FooterSettings = ContactSettings & SocialSettings;

/**
 * Kontak & sosial media dibaca dari `GET /settings` (PRD §9 F-01), disunting
 * super admin lewat `/admin/pengaturan`. Kegagalan API tidak boleh
 * menjatuhkan halaman yang memuat footer — sama seperti `getBrand()` di root
 * layout, galatnya ditelan dan blok yang datanya kosong ikut disembunyikan.
 */
async function getFooterSettings(): Promise<FooterSettings | null> {
  try {
    const { data } = await apiServerGet<FooterSettings>("/settings", 300, [PUBLIC_SETTINGS_TAG]);
    return data;
  } catch {
    return null;
  }
}

export async function Footer() {
  const settings = await getFooterSettings();

  const phone = settings?.contact_phone ?? null;
  const email = settings?.contact_email ?? null;
  const address = settings?.contact_address ?? null;

  const socials = SOCIALS.flatMap(({ key, label, Icon }) => {
    const href = settings?.[key];
    return href ? [{ label, Icon, href }] : [];
  });

  return (
    <footer className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo withTagline={false} />
          <p className="text-sm text-muted-foreground max-w-xs">
            Teman Ibu Hamil untuk Persalinan Aman
          </p>
          {socials.length > 0 && (
            <div className="flex items-center gap-3 pt-1">
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
          )}
        </div>

        <div>
          <h3 className="font-display text-sm font-bold text-foreground mb-4">
            Menu
          </h3>
          <ul className="space-y-2.5">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-muted-foreground hover:text-primary-text transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold text-foreground mb-4">
            Tentang Kami
          </h3>
          <ul className="space-y-2.5">
            {ABOUT_LINKS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="text-sm text-muted-foreground hover:text-primary-text transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div id="kontak">
          <h3 className="font-display text-sm font-bold text-foreground mb-4">
            Bantuan
          </h3>
          <ul className="space-y-2.5 mb-6">
            {HELP_LINKS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="text-sm text-muted-foreground hover:text-primary-text transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          {(phone || email || address) && (
            <>
              <h3 className="font-display text-sm font-bold text-foreground mb-4">
                Kontak
              </h3>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {phone && (
                  <li className="flex items-center gap-2">
                    <Phone className="size-4 text-brand-purple shrink-0" />
                    {/* Nomor dan email jadi tautan yang bisa langsung dipakai
                        dari ponsel — sebelumnya keduanya teks polos. */}
                    <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="hover:text-primary-text transition-colors">
                      {phone}
                    </a>
                  </li>
                )}
                {email && (
                  <li className="flex items-center gap-2">
                    <Mail className="size-4 text-brand-purple shrink-0" />
                    <a href={`mailto:${email}`} className="hover:text-primary-text transition-colors">
                      {email}
                    </a>
                  </li>
                )}
                {address && (
                  <li className="flex items-center gap-2">
                    <MapPin className="size-4 text-brand-purple shrink-0" />
                    {address}
                  </li>
                )}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="bg-brand-purple">
        <p className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 text-center text-xs text-white/90">
          &copy; {new Date().getFullYear()} PrenaTalks. Sejak 2020. Seluruh hak
          cipta dilindungi.
        </p>
      </div>
    </footer>
  );
}
