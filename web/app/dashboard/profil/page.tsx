"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, MailWarning } from "lucide-react";

import { ChangePasswordForm } from "@/components/dashboard/change-password-form";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { FormSkeleton } from "@/components/shared/loading-state";
import { apiGet } from "@/lib/api-client";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { Consent } from "@/lib/types";

/**
 * Profil & keamanan akun — PRD §8 (`/dashboard/profil`).
 *
 * Email ditampilkan tapi tidak bisa diubah: mengganti alamat menuntut alur
 * verifikasi ulang, dan sampai itu ada, alamat lama adalah satu-satunya
 * jalur pemulihan akun. Backend pun menolak field itu.
 */
export default function ProfilPage() {
  const user = useAuthStore((state) => state.user);
  const [activeConsents, setActiveConsents] = useState<number | null>(null);

  const loadConsents = useCallback(async () => {
    try {
      const consents = await apiGet<Consent[]>("/consents");
      setActiveConsents(consents.filter((consent) => consent.is_active).length);
    } catch {
      // Ringkasan izin adalah pelengkap; kegagalannya tidak boleh menutupi
      // form profil yang jadi alasan utama halaman ini dibuka.
      setActiveConsents(null);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConsents();
  }, [loadConsents]);

  if (!user) {
    return (
      <FormSkeleton fields={4} label="Memuat profil" className="mx-auto max-w-2xl" />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-foreground">Profil Saya</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola data diri dan keamanan akun Anda.
        </p>
      </div>

      {/* Email berdiri sendiri di atas, di luar form: ia informasi, bukan
          sesuatu yang bisa diubah di sini. Menaruhnya sebagai input yang
          dinonaktifkan hanya akan mengundang percobaan yang gagal. */}
      <section className="rounded-3xl border border-border bg-white p-5 shadow-soft sm:p-6">
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          Email
        </p>
        <p className="mt-1 font-display text-base font-bold break-all text-foreground">
          {user.email}
        </p>

        {user.email_verified_at ? (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-teal-soft px-3 py-1 text-xs font-semibold text-brand-teal-text">
            <BadgeCheck className="size-3.5" />
            Terverifikasi
          </p>
        ) : (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-feature-amber-soft px-3 py-1 text-xs font-semibold text-warning">
            <MailWarning className="size-3.5" />
            Belum terverifikasi
          </p>
        )}

        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Email belum bisa diganti sendiri. Hubungi tim kami bila alamat ini sudah tidak Anda
          gunakan.
        </p>
      </section>

      <ProfileForm user={user} />

      <ChangePasswordForm />

      <Link
        href="/dashboard/privasi"
        className="group flex items-center gap-4 rounded-3xl border border-border bg-white p-5 shadow-soft transition-colors hover:bg-muted/60 sm:p-6"
      >
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-bold text-foreground">Privasi & Akses</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeConsents === null
              ? "Atur siapa saja yang boleh melihat hasil cek risiko Anda."
              : activeConsents === 0
                ? "Belum ada tenaga kesehatan yang Anda beri akses."
                : `${activeConsents} tenaga kesehatan punya akses ke hasil cek risiko Anda.`}
          </p>
        </div>
        <ArrowRight className="size-5 shrink-0 text-primary-text transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
