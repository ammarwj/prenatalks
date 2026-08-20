import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { Footer } from "@/components/shared/footer";
import { PublicHeader } from "@/components/shared/public-header";
import { resolveSocialLinks, SocialLinks } from "@/components/shared/social-links";
import { apiServerGet } from "@/lib/api-server";
import { telHref, whatsappHref } from "@/lib/contact";
import { PUBLIC_SETTINGS_TAG } from "@/lib/public-cache";
import type { ContactSettings, SocialSettings } from "@/lib/types";

export const metadata = {
  title: "Hubungi Kami — PrenaTalks",
  description: "Telepon, email, alamat, dan kanal sosial media resmi PrenaTalks.",
};

type ContactPageSettings = ContactSettings & SocialSettings;

/**
 * Sumber datanya `GET /settings` yang sama dengan footer — disunting super
 * admin lewat `/admin/pengaturan`, jadi halaman ini tidak butuh endpoint
 * sendiri. Galat API ditelan seperti `getFooterSettings()`: halaman tetap
 * tampil dengan keadaan kosong di bawah.
 */
async function getContactSettings(): Promise<ContactPageSettings | null> {
  try {
    const { data } = await apiServerGet<ContactPageSettings>("/settings", 300, [
      PUBLIC_SETTINGS_TAG,
    ]);
    return data;
  } catch {
    return null;
  }
}

export default async function KontakPage() {
  const settings = await getContactSettings();

  const phone = settings?.contact_phone ?? null;
  const email = settings?.contact_email ?? null;
  const address = settings?.contact_address ?? null;
  const whatsapp = phone ? whatsappHref(phone) : null;
  const hasContact = !!(phone || email || address);
  // Seksi "Ikuti Kami" digantungkan pada adanya tautan, bukan pada `settings`
  // yang berhasil dimuat: keempat URL sosial boleh kosong, dan judul tanpa isi
  // di bawahnya lebih buruk daripada seksinya tidak ada sama sekali.
  const hasSocials = resolveSocialLinks(settings).length > 0;

  return (
    <div className="min-h-screen bg-muted/40">
      <PublicHeader />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">
            Hubungi Kami
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Ada pertanyaan seputar layanan, konten, atau akun Anda? Hubungi kami lewat kanal di
            bawah ini.
          </p>
        </div>

        {hasContact ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {phone && (
                <ContactCard icon={<Phone className="size-5" />} label="Telepon">
                  <a href={telHref(phone)} className="hover:text-primary-text transition-colors">
                    {phone}
                  </a>
                </ContactCard>
              )}
              {email && (
                <ContactCard icon={<Mail className="size-5" />} label="Email">
                  <a
                    href={`mailto:${email}`}
                    className="break-all hover:text-primary-text transition-colors"
                  >
                    {email}
                  </a>
                </ContactCard>
              )}
              {address && (
                <ContactCard icon={<MapPin className="size-5" />} label="Alamat">
                  {address}
                </ContactCard>
              )}
            </div>

            {(whatsapp || email) && (
              <div className="mt-6 flex flex-wrap gap-3">
                {whatsapp && (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-[#EC4899]"
                  >
                    <MessageCircle className="size-4" />
                    Chat WhatsApp
                  </a>
                )}
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-semibold text-foreground shadow-soft transition-colors hover:bg-muted"
                  >
                    <Mail className="size-4" />
                    Kirim Email
                  </a>
                )}
              </div>
            )}
          </>
        ) : (
          /*
            Keadaan kosong tetap 200, bukan `notFound()`: tautannya ada di
            footer setiap halaman — alasan yang sama dipakai halaman legal dan
            `/panduan`.
          */
          <div className="rounded-3xl border border-dashed border-border bg-white p-10 text-center shadow-soft">
            <Phone className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              Informasi kontak sedang diperbarui. Sementara itu, jawaban seputar PrenaTalks bisa
              Anda baca di{" "}
              <Link href="/faq" className="font-semibold text-primary-text hover:underline">
                halaman FAQ
              </Link>
              .
            </p>
          </div>
        )}

        {hasSocials && (
          <section className="mt-8 rounded-3xl border border-border bg-white p-6 shadow-soft">
            <h2 className="font-display text-lg font-bold text-foreground">Ikuti Kami</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Kabar terbaru dan konten edukasi kehamilan juga kami bagikan di sini.
            </p>
            <SocialLinks settings={settings} className="mt-4" />
          </section>
        )}

        <section className="mt-4 rounded-3xl border border-border bg-white p-6 shadow-soft">
          <h2 className="font-display text-lg font-bold text-foreground">Sebelum Menghubungi</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Banyak pertanyaan sudah terjawab tanpa perlu menunggu balasan:
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/panduan" className="font-semibold text-primary-text hover:underline">
                Panduan Penggunaan
              </Link>{" "}
              — langkah demi langkah memakai setiap fitur.
            </li>
            <li>
              <Link href="/faq" className="font-semibold text-primary-text hover:underline">
                FAQ
              </Link>{" "}
              — jawaban singkat atas pertanyaan yang paling sering masuk.
            </li>
            <li>
              <Link href="/komunitas" className="font-semibold text-primary-text hover:underline">
                Komunitas
              </Link>{" "}
              — berbagi pengalaman dengan sesama ibu hamil.
            </li>
          </ul>
        </section>

        {/*
          Peringatan ini bukan hiasan: halaman "Hubungi Kami" adalah tempat
          orang mendarat justru saat sedang panik, dan balasan kami tidak
          seketika. PRD §12.4 menuntut batas layanan dinyatakan di titik
          seperti ini.
        */}
        <p className="mt-6 rounded-2xl bg-brand-purple-soft/60 px-5 py-4 text-sm text-primary-text">
          <strong>PrenaTalks bukan layanan gawat darurat.</strong> Bila Anda mengalami perdarahan,
          nyeri hebat, demam tinggi, atau gerakan janin berkurang, segera hubungi bidan, dokter,
          atau fasilitas kesehatan terdekat — jangan menunggu balasan dari kami.
        </p>
      </main>

      <Footer />
    </div>
  );
}

function ContactCard({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-border bg-white p-5 shadow-soft">
      <div className="flex size-10 items-center justify-center rounded-full bg-brand-purple-soft text-brand-purple">
        {icon}
      </div>
      <h2 className="mt-3 font-display text-sm font-bold text-foreground">{label}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
