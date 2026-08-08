import { Logo } from "@/components/shared/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#FFF1F6] via-[#FDF2F8] to-[#F5F3FF]">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {/* `#beranda` bawaan Logo hanya ada di landing page — di halaman auth
            anchor itu tidak menunjuk apa pun, jadi arahkan ke rutenya. */}
        <Logo href="/" />
      </div>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        {children}
      </main>
    </div>
  );
}
