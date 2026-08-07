"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { QuestionnaireForm } from "@/components/admin/questionnaire-form";
import { SuperAdminRestricted, useSuperAdminGuard } from "@/components/admin/super-admin-guard";
import type { AdminQuestionnaire } from "@/lib/types";

export default function NewQuestionnairePage() {
  const { isSuperAdmin } = useSuperAdminGuard();
  const router = useRouter();

  if (!isSuperAdmin) return <SuperAdminRestricted />;

  function handleSaved(result: AdminQuestionnaire) {
    toast.success("Kuesioner dibuat");
    router.push(`/admin/kuesioner/${result.id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-foreground">
          Buat Kuesioner Baru
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Susun pertanyaan, opsi jawaban, dan level risiko untuk kuesioner cek risiko kehamilan.
        </p>
      </div>
      <QuestionnaireForm onSaved={handleSaved} />
    </div>
  );
}
