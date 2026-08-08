import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

import { Logo } from "@/components/shared/logo";
import {
  FacebookIcon,
  InstagramIcon,
  TiktokIcon,
  YoutubeIcon,
} from "@/components/shared/social-icons";
import { NAV_ITEMS } from "@/lib/nav-items";

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

const SOCIALS = [
  { label: "Instagram", Icon: InstagramIcon, href: "#" },
  { label: "Facebook", Icon: FacebookIcon, href: "#" },
  { label: "YouTube", Icon: YoutubeIcon, href: "#" },
  { label: "TikTok", Icon: TiktokIcon, href: "#" },
];

export function Footer() {
  return (
    <footer className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo withTagline={false} />
          <p className="text-sm text-muted-foreground max-w-xs">
            Teman Ibu Hamil untuk Persalinan Aman
          </p>
          <div className="flex items-center gap-3 pt-1">
            {SOCIALS.map(({ label, Icon, href }) => (
              <Link
                key={label}
                href={href}
                aria-label={label}
                className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-brand-purple-soft hover:text-brand-purple"
              >
                <Icon className="size-4" />
              </Link>
            ))}
          </div>
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
          <h3 className="font-display text-sm font-bold text-foreground mb-4">
            Kontak
          </h3>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Phone className="size-4 text-brand-purple shrink-0" />
              0812-3456-7890
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4 text-brand-purple shrink-0" />
              halo@prenatalks.id
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="size-4 text-brand-purple shrink-0" />
              Gresik, Jawa Timur
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-brand-purple">
        <p className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 text-center text-xs text-white/90">
          &copy; {new Date().getFullYear()} PrenaTalks. Sejak 2020. Seluruh
          hak cipta dilindungi.
        </p>
      </div>
    </footer>
  );
}
