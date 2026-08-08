"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  customChecklistItemSchema,
  type CustomChecklistItemInput,
} from "@/lib/validations/checklist";

/** Tambah item pribadi ke checklist (PRD §9 F-11). */
export function ChecklistCustomForm({ onAdd }: { onAdd: (title: string) => Promise<void> }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomChecklistItemInput>({
    resolver: zodResolver(customChecklistItemSchema),
    defaultValues: { title: "" },
  });

  async function onSubmit(values: CustomChecklistItemInput) {
    try {
      await onAdd(values.title.trim());
      reset({ title: "" });
    } catch {
      // Pesan galat ditampilkan halaman induk; teks yang sudah diketik
      // sengaja dipertahankan agar pengguna tidak perlu mengetik ulang.
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 border-t border-border pt-4">
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-48 flex-1">
          <Input
            aria-label="Judul item pribadi"
            placeholder="Mis. Siapkan bantal menyusui"
            className="h-11 rounded-xl"
            {...register("title")}
          />
          {errors.title && (
            <p className="mt-1 text-xs font-medium text-danger">{errors.title.message}</p>
          )}
        </div>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 gap-1.5 rounded-full bg-primary text-white hover:bg-[#EC4899]"
        >
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Tambah
        </Button>
      </div>
    </form>
  );
}
