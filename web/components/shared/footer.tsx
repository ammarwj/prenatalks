import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import { RISK_DISCLAIMER_TEXT } from "@/components/shared/risk-disclaimer";
import { SocialLinks } from "@/components/shared/social-links";
import { apiServerGet } from "@/lib/api-server";
import { telHref } from "@/lib/contact";
import { NAV_ITEMS } from "@/lib/nav-items";
import { PUBLIC_SETTINGS_TAG } from "@/lib/public-cache";
import type { ContactSettings, SocialSettings } from "@/lib/types";

const ABOUT_LINKS = [
  { label: "Tentang PrenaTalks", href: "/tentang" },
  { label: "Tim Ahli", href: "/tentang" },
  { label: "Kebijakan Privasi", href: "/kebijakan-privasi" },
  { label: "Syarat & Ketentuan", href: "/syarat-ketentuan" },
];

const HELP_LINKS = [
  { label: "FAQ", href: "/faq" },
  { label: "Komunitas", href: "/komunitas" },
  { label: "Panduan Penggunaan", href: "/panduan" },
  { label: "Hubungi Kami", href: "/kontak" },
];

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

  return (
    <footer className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo withTagline={false} />
          <p className="text-sm text-muted-foreground max-w-xs">
            Teman Ibu Hamil untuk Persalinan Aman
          </p>
          <SocialLinks settings={settings} className="pt-1" />
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

        <div>
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
                    <a href={telHref(phone)} className="hover:text-primary-text transition-colors">
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

      {/*
        Disclaimer medis PRD §12.4 wajib tampil di footer. Teksnya diambil dari
        konstanta yang sama dengan yang dipakai halaman hasil risiko dan
        kalkulator, dan sengaja tetap di kode — bukan di `settings` — supaya
        tidak bisa terhapus dari panel admin, mengikuti perlakuan yang sama
        untuk catatan keselamatan di halaman komunitas.
      */}
      <div className="bg-brand-purple">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-[11px] leading-relaxed text-white/80 sm:text-xs">
            {RISK_DISCLAIMER_TEXT}
          </p>
          <p className="mt-3 border-t border-white/20 pt-3 text-center text-xs text-white/90">
            &copy; {new Date().getFullYear()} PrenaTalks. Sejak 2020. Seluruh hak
            cipta dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}
