"use client";

import { use, useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Lock, SearchX } from "lucide-react";
import { toast } from "sonner";

import { DynamicFormField } from "@/components/public/dynamic-form-field";
import { Logo } from "@/components/shared/logo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { apiGet, apiPostForm, ApiRequestError } from "@/lib/api-client";
import type { PublicForm } from "@/lib/types";
import { buildAnswerSchema, toSubmitFormData, type AnswerValues } from "@/lib/validations/form-submit";

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4 sm:px-6">
          <Logo withTagline={false} />
          <Link href="/" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
            Kembali ke Beranda
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">{children}</main>
    </div>
  );
}

export default function PublicSurveyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [form, setForm] = useState<PublicForm | null>(null);
  const [loadError, setLoadError] = useState<{ status: number; message: string } | null>(null);
  const [answers, setAnswers] = useState<AnswerValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await apiGet<PublicForm>(`/forms/${slug}`);
      setForm(data);
      // Setiap field diberi key eksplisit (nilai undefined) alih-alih
      // dibiarkan tidak ada sama sekali di objek — Zod's preprocess/refine
      // di buildAnswerSchema tidak divalidasi kalau key-nya benar-benar
      // absen dari objek yang di-parse (baru divalidasi kalau key ada tapi
      // bernilai undefined), jadi field wajib yang belum disentuh pengguna
      // harus tetap punya key ini supaya validasi wajib-isi berjalan.
      setAnswers(Object.fromEntries(data.fields.map((field) => [`field_${field.id}`, undefined])));
    } catch (err) {
      setLoadError(
        err instanceof ApiRequestError
          ? { status: err.status, message: err.message }
          : { status: 0, message: "Gagal memuat form. Periksa koneksi Anda dan coba lagi." }
      );
    }
  }, [slug]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form) return;

    setSubmitError(null);

    const result = buildAnswerSchema(form.fields).safeParse(answers);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      await apiPostForm(`/forms/${slug}/submit`, toSubmitFormData(form.fields, answers));
      setSubmitted(true);
      toast.success("Respon berhasil dikirim");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setSubmitError(err.message);
        if (err.fieldErrors) {
          const mapped: Record<string, string> = {};
          for (const [key, messages] of Object.entries(err.fieldErrors)) {
            mapped[key] = messages[0];
          }
          setErrors(mapped);
        }
      } else {
        setSubmitError("Terjadi kesalahan, coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError?.status === 404) {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <SearchX className="size-10 text-muted-foreground" />
          <h1 className="font-display text-xl font-extrabold text-foreground">
            Form tidak ditemukan
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Form ini mungkin belum diterbitkan, sudah dihapus, atau tautannya salah.
          </p>
        </div>
      </PageShell>
    );
  }

  if (loadError?.status === 401) {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Lock className="size-10 text-muted-foreground" />
          <h1 className="font-display text-xl font-extrabold text-foreground">
            Perlu masuk untuk mengisi
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Form ini hanya bisa diisi oleh pengguna yang sudah masuk ke akun PrenaTalks.
          </p>
          <Button asChild className="mt-2 rounded-full bg-primary text-white hover:bg-[#EC4899]">
            <Link href={`/masuk?redirect=/survei/${slug}`}>Masuk untuk melanjutkan</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  if (loadError) {
    return (
      <PageShell>
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{loadError.message}</AlertDescription>
        </Alert>
      </PageShell>
    );
  }

  if (!form) {
    return (
      <PageShell>
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Memuat form...
        </div>
      </PageShell>
    );
  }

  if (submitted) {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-white p-10 text-center shadow-soft">
          <CheckCircle2 className="size-10 text-success" />
          <h1 className="font-display text-xl font-extrabold text-foreground">Terima kasih!</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Respon Anda untuk &quot;{form.title}&quot; sudah tersimpan. Masukan Anda membantu
            PrenaTalks menjadi lebih baik.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-text">
          {form.type === "survey" ? "Survei" : "Form"}
        </p>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-foreground sm:text-3xl">
          {form.title}
        </h1>
        {form.description && (
          <p className="mt-2 text-sm text-muted-foreground">{form.description}</p>
        )}
        {form.is_anonymous && (
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-purple-soft px-3 py-1 text-xs font-medium text-brand-purple">
            Respon anonim — identitas Anda tidak disimpan
          </span>
        )}
      </div>

      {!form.is_open ? (
        <Alert className="rounded-2xl border-border">
          <AlertTitle>Form ini belum atau sudah tidak menerima respon</AlertTitle>
          <AlertDescription>
            Silakan hubungi pengelola bila Anda memerlukan informasi lebih lanjut.
          </AlertDescription>
        </Alert>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-5 rounded-3xl border border-border bg-white p-6 shadow-soft sm:p-8"
        >
          {submitError && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {form.fields.map((field) => (
            <DynamicFormField
              key={field.id}
              field={field}
              value={answers[`field_${field.id}`]}
              onChange={(value) =>
                setAnswers((prev) => ({ ...prev, [`field_${field.id}`]: value }))
              }
              error={errors[`field_${field.id}`]}
            />
          ))}

          <Button
            type="submit"
            disabled={submitting}
            className="h-11 w-full rounded-full bg-primary text-base text-white shadow-soft hover:bg-[#EC4899]"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitting ? "Mengirim..." : "Kirim Respon"}
          </Button>
        </form>
      )}
    </PageShell>
  );
}
