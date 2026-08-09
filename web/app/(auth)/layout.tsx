import { Logo } from "@/components/shared/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#FFF1F6] via-[#FDF2F8] to-[#F5F3FF]">
      {/* Logo ikut di dalam kolom terpusat, bukan menempel di pojok kiri
          viewport — supaya ia sesumbu dengan kartu form di bawahnya. */}
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12 sm:py-16">
        {/* `#beranda` bawaan Logo hanya ada di landing page — di halaman auth
            anchor itu tidak menunjuk apa pun, jadi arahkan ke rutenya. */}
        <Logo href="/" />
        {children}
      </main>
    </div>
  );
}
