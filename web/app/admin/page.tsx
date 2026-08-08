import Link from "next/link";
import {
  CheckSquare,
  ClipboardList,
  HelpCircle,
  ListChecks,
  Newspaper,
  Settings,
  Video,
} from "lucide-react";

export default function AdminHomePage() {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-foreground">Panel Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fitur panel admin (F-14) belum dibangun. Halaman ini hanya menyiapkan pola guard rute
            untuk peran admin/super_admin.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/artikel"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-soft hover:bg-muted"
          >
            <Newspaper className="size-4" />
            Artikel
          </Link>
          <Link
            href="/admin/video"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-soft hover:bg-muted"
          >
            <Video className="size-4" />
            Video
          </Link>
          <Link
            href="/admin/faq"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-soft hover:bg-muted"
          >
            <HelpCircle className="size-4" />
            FAQ
          </Link>
          <Link
            href="/admin/kuesioner"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-soft hover:bg-muted"
          >
            <ListChecks className="size-4" />
            Checklist Risiko
          </Link>
          <Link
            href="/admin/checklist"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-soft hover:bg-muted"
          >
            <CheckSquare className="size-4" />
            Checklist Persiapan
          </Link>
          <Link
            href="/admin/form"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-soft hover:bg-muted"
          >
            <ClipboardList className="size-4" />
            Form & Survei
          </Link>
          <Link
            href="/admin/pengaturan"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-soft hover:bg-muted"
          >
            <Settings className="size-4" />
            Pengaturan
          </Link>
        </div>
      </div>
    </div>
  );
}
