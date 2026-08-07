"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { FormBuilderForm } from "@/components/admin/form-builder-form";
import type { AdminForm } from "@/lib/types";

export default function NewFormPage() {
  const router = useRouter();

  function handleSaved(result: AdminForm) {
    toast.success("Form dibuat");
    router.push(`/admin/form/${result.id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-foreground">Buat Form Baru</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Susun field, validasi, dan pengaturan periode aktif untuk form atau survei.
        </p>
      </div>
      <FormBuilderForm onSaved={handleSaved} />
    </div>
  );
}
