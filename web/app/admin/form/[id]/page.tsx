"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { FormBuilderForm } from "@/components/admin/form-builder-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiGet, ApiRequestError } from "@/lib/api-client";
import type { AdminForm } from "@/lib/types";

export default function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [form, setForm] = useState<AdminForm | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    setNotFound(false);
    try {
      const data = await apiGet<AdminForm>(`/admin/forms/${id}`);
      setForm(data);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 404) {
        setNotFound(true);
      } else {
        setLoadError(err instanceof ApiRequestError ? err.message : "Gagal memuat form.");
      }
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function handleSaved(result: AdminForm) {
    toast.success("Form diperbarui");
    setForm(result);
  }

  if (notFound) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>Form tidak ditemukan. Mungkin sudah dihapus.</AlertDescription>
        </Alert>
        <Link href="/admin/form" className="text-sm font-semibold text-primary-text underline">
          Kembali ke daftar form
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-foreground">Edit Form</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Perubahan field akan menggantikan seluruh struktur field form ini.
        </p>
      </div>

      {loadError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {form === null && !loadError ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Memuat data...
        </div>
      ) : form ? (
        <FormBuilderForm key={form.updated_at} initialData={form} onSaved={handleSaved} />
      ) : null}
    </div>
  );
}
