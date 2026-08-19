"use client";

import { LogOut } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Inisial dari nama: satu huruf bila satu kata, huruf depan kata pertama dan
 * terakhir bila lebih.
 *
 * `Array.from` dipakai alih-alih indeks string supaya huruf di luar BMP
 * (mis. emoji yang kadang ikut tertulis di nama) tidak terpotong separuh
 * jadi karakter rusak.
 */
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "?";
  }

  const first = Array.from(words[0])[0] ?? "";

  if (words.length === 1) {
    return first.toUpperCase();
  }

  return (first + (Array.from(words[words.length - 1])[0] ?? "")).toUpperCase();
}

/**
 * Kaki sidebar: identitas pemilik sesi dan tombol keluar. Dipakai area ibu
 * hamil dan panel admin.
 *
 * Sebelumnya blok ini ditulis dua kali dengan padding yang tidak seragam —
 * teks nama `px-2` tapi tombol keluar `px-3` — sehingga ketiga barisnya
 * terlihat seperti tiga hal yang tidak berhubungan. Sekarang avatar dan ikon
 * keluar berbagi tepi kiri yang sama dengan ikon menu di atasnya, jadi satu
 * garis vertikal menembus seluruh sidebar.
 *
 * `accentClassName` yang membedakan kedua area: merah muda untuk ibu hamil,
 * ungu untuk admin — mengikuti warna penanda menu aktif masing-masing.
 */
export function SidebarUserFooter({
  name,
  secondary,
  accentClassName,
  onLogout,
}: {
  name: string;
  /** Baris kedua di bawah nama — email di area ibu hamil, peran di admin. */
  secondary: string;
  accentClassName: string;
  onLogout: () => void;
}) {
  // Akun bernama persis seperti perannya ("Super Admin") akan menampilkan
  // baris yang sama dua kali — baris kedua tidak menambah apa pun di situ.
  const showSecondary = secondary !== "" && secondary !== name;

  return (
    <div className="shrink-0 border-t border-border p-3">
      <div className="flex items-center gap-2.5 px-3 py-2">
        <Avatar>
          <AvatarFallback
            className={cn("font-display text-xs font-bold", accentClassName)}
          >
            {initialsOf(name)}
          </AvatarFallback>
        </Avatar>

        {/* min-w-0 wajib: tanpa itu flex item menolak menyusut dan `truncate`
            pada anaknya tidak pernah aktif — nama panjang akan melebarkan
            sidebar alih-alih terpotong. */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground" title={name}>
            {name}
          </p>
          {showSecondary && (
            <p className="truncate text-xs text-muted-foreground" title={secondary}>
              {secondary}
            </p>
          )}
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onLogout}
        className="mt-0.5 w-full justify-start gap-2.5 rounded-xl px-3 font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <LogOut className="size-4" />
        Keluar
      </Button>
    </div>
  );
}
