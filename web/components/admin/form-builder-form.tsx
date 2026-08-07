"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { ArrowDown, ArrowUp, Eye, Loader2, Plus, Trash2 } from "lucide-react";

import { FormPreviewDialog } from "@/components/admin/form-preview-dialog";
import { FormField } from "@/components/shared/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiPost, apiPut, ApiRequestError } from "@/lib/api-client";
import type { AdminForm } from "@/lib/types";
import {
  FIELD_TYPE_OPTIONS,
  FORM_STATUS_OPTIONS,
  defaultField,
  formBuilderSchema,
  toFormBuilderFormValues,
  toFormBuilderPayload,
  type FormBuilderInput,
} from "@/lib/validations/form-builder";

const inputClass = "h-11 rounded-xl";
const CHOICE_TYPES = ["radio", "checkbox", "select"];

export function FormBuilderForm({
  initialData,
  onSaved,
}: {
  initialData?: AdminForm;
  onSaved: (result: AdminForm) => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormBuilderInput>({
    resolver: zodResolver(formBuilderSchema),
    defaultValues: toFormBuilderFormValues(initialData),
  });

  const fieldsArray = useFieldArray({ control, name: "fields" });
  const previewValues = useWatch({ control });

  async function onSubmit(values: FormBuilderInput) {
    setServerError(null);
    try {
      const payload = toFormBuilderPayload(values);
      const result =
        isEditing && initialData
          ? await apiPut<AdminForm>(`/admin/forms/${initialData.id}`, payload)
          : await apiPost<AdminForm>("/admin/forms", payload);
      onSaved(result);
    } catch (err) {
      setServerError(
        err instanceof ApiRequestError ? err.message : "Terjadi kesalahan, coba lagi."
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {serverError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <Card className="rounded-3xl border border-border shadow-soft">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="font-display text-base">Info Form</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6">
          <FormField label="Judul" htmlFor="title" error={errors.title?.message}>
            <Input
              id="title"
              className={inputClass}
              aria-invalid={!!errors.title}
              {...register("title")}
            />
          </FormField>
          <FormField
            label="Slug"
            htmlFor="slug"
            error={errors.slug?.message}
            hint="Kosongkan untuk dibuat otomatis dari judul"
          >
            <Input id="slug" className={inputClass} placeholder="survei-kepuasan" {...register("slug")} />
          </FormField>
          <FormField label="Deskripsi" htmlFor="description" hint="Opsional">
            <Textarea id="description" {...register("description")} />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Tipe" htmlFor="type">
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="type" className={`w-full ${inputClass}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="form">Form</SelectItem>
                      <SelectItem value="survey">Survei</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField label="Status" htmlFor="status" error={errors.status?.message}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="status" className={`w-full ${inputClass}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORM_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField label="Buka mulai" htmlFor="opens_at" hint="Opsional">
              <Input id="opens_at" type="datetime-local" className={inputClass} {...register("opens_at")} />
            </FormField>
            <FormField
              label="Tutup pada"
              htmlFor="closes_at"
              error={errors.closes_at?.message}
              hint="Opsional"
            >
              <Input id="closes_at" type="datetime-local" className={inputClass} {...register("closes_at")} />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Controller
              name="requires_login"
              control={control}
              render={({ field }) => (
                <label className="flex items-center gap-2.5 text-sm text-foreground">
                  <Checkbox checked={field.value} onCheckedChange={(next) => field.onChange(next === true)} />
                  Wajib login untuk mengisi
                </label>
              )}
            />
            <Controller
              name="is_public"
              control={control}
              render={({ field }) => (
                <label className="flex items-center gap-2.5 text-sm text-foreground">
                  <Checkbox checked={field.value} onCheckedChange={(next) => field.onChange(next === true)} />
                  Dapat diakses publik
                </label>
              )}
            />
            <Controller
              name="one_response_per_user"
              control={control}
              render={({ field }) => (
                <label className="flex items-center gap-2.5 text-sm text-foreground">
                  <Checkbox checked={field.value} onCheckedChange={(next) => field.onChange(next === true)} />
                  Batasi 1 respon per pengguna
                </label>
              )}
            />
            <Controller
              name="is_anonymous"
              control={control}
              render={({ field }) => (
                <label className="flex items-center gap-2.5 text-sm text-foreground">
                  <Checkbox checked={field.value} onCheckedChange={(next) => field.onChange(next === true)} />
                  Respon anonim (identitas tidak disimpan)
                </label>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-border shadow-soft">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="font-display text-base">Field</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6">
          {typeof errors.fields?.message === "string" && (
            <p className="text-xs font-medium text-danger">{errors.fields.message}</p>
          )}
          {fieldsArray.fields.map((field, index) => (
            <FieldCard
              key={field.id}
              control={control}
              register={register}
              errors={errors}
              index={index}
              totalFields={fieldsArray.fields.length}
              onRemove={() => fieldsArray.remove(index)}
              onMoveUp={() => fieldsArray.move(index, index - 1)}
              onMoveDown={() => fieldsArray.move(index, index + 1)}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => fieldsArray.append(defaultField())}
          >
            <Plus className="size-4" />
            Tambah Field
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 rounded-full bg-primary px-8 text-base text-white shadow-soft hover:bg-[#EC4899]"
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isSubmitting ? "Menyimpan..." : isEditing ? "Simpan" : "Buat Form"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-full"
          onClick={() => setPreviewOpen(true)}
        >
          <Eye className="size-4" />
          Pratinjau
        </Button>
      </div>

      <FormPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={previewValues.title || "(Belum ada judul)"}
        description={previewValues.description}
        fields={(previewValues.fields ?? []) as FormBuilderInput["fields"]}
      />
    </form>
  );
}

function FieldCard({
  control,
  register,
  errors,
  index,
  totalFields,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  control: Control<FormBuilderInput>;
  register: UseFormRegister<FormBuilderInput>;
  errors: FieldErrors<FormBuilderInput>;
  index: number;
  totalFields: number;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const choicesArray = useFieldArray({ control, name: `fields.${index}.choices` });
  const type = useWatch({ control, name: `fields.${index}.type` });
  const fieldErrors = errors.fields?.[index];
  const isChoiceType = CHOICE_TYPES.includes(type);

  return (
    <div className="space-y-4 rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-muted-foreground">Field {index + 1}</span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={index === 0}
            onClick={onMoveUp}
            aria-label="Pindah ke atas"
          >
            <ArrowUp className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={index === totalFields - 1}
            onClick={onMoveDown}
            aria-label="Pindah ke bawah"
          >
            <ArrowDown className="size-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} aria-label="Hapus field">
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <FormField label="Label" htmlFor={`fields.${index}.label`} error={fieldErrors?.label?.message}>
        <Input id={`fields.${index}.label`} className={inputClass} {...register(`fields.${index}.label`)} />
      </FormField>

      <FormField label="Deskripsi" htmlFor={`fields.${index}.description`} hint="Opsional">
        <Textarea id={`fields.${index}.description`} {...register(`fields.${index}.description`)} />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Tipe field" htmlFor={`fields.${index}.type`}>
          <Controller
            name={`fields.${index}.type`}
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={`fields.${index}.type`} className={`w-full ${inputClass}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        {type !== "checkbox" && type !== "radio" && type !== "scale" && type !== "file" && (
          <FormField label="Placeholder" htmlFor={`fields.${index}.placeholder`} hint="Opsional">
            <Input
              id={`fields.${index}.placeholder`}
              className={inputClass}
              {...register(`fields.${index}.placeholder`)}
            />
          </FormField>
        )}
      </div>

      <Controller
        name={`fields.${index}.is_required`}
        control={control}
        render={({ field }) => (
          <label className="flex items-center gap-2.5 text-sm text-foreground">
            <Checkbox checked={field.value} onCheckedChange={(next) => field.onChange(next === true)} />
            Wajib diisi
          </label>
        )}
      />

      {isChoiceType && (
        <div className="space-y-3 rounded-xl bg-muted/40 p-3">
          <span className="text-xs font-semibold text-muted-foreground">Pilihan</span>
          {typeof fieldErrors?.choices?.message === "string" && (
            <p className="text-xs font-medium text-danger">{fieldErrors.choices.message}</p>
          )}
          {choicesArray.fields.map((choiceField, choiceIndex) => (
            <div key={choiceField.id} className="flex items-center gap-2">
              <Input
                className={inputClass}
                placeholder={`Pilihan ${choiceIndex + 1}`}
                {...register(`fields.${index}.choices.${choiceIndex}.value`)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => choicesArray.remove(choiceIndex)}
                aria-label="Hapus pilihan"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => choicesArray.append({ value: "" })}
          >
            <Plus className="size-4" />
            Tambah Pilihan
          </Button>
        </div>
      )}

      {type === "scale" && (
        <div className="grid grid-cols-2 gap-4 rounded-xl bg-muted/40 p-3">
          <FormField label="Skala minimum" htmlFor={`fields.${index}.scale_min`}>
            <Input
              id={`fields.${index}.scale_min`}
              type="number"
              className={inputClass}
              {...register(`fields.${index}.scale_min`)}
            />
          </FormField>
          <FormField
            label="Skala maksimum"
            htmlFor={`fields.${index}.scale_max`}
            error={fieldErrors?.scale_max?.message}
          >
            <Input
              id={`fields.${index}.scale_max`}
              type="number"
              className={inputClass}
              {...register(`fields.${index}.scale_max`)}
            />
          </FormField>
        </div>
      )}

      {(type === "text" || type === "textarea" || type === "number") && (
        <div className="grid grid-cols-1 gap-4 rounded-xl bg-muted/40 p-3 sm:grid-cols-2">
          <FormField
            label={type === "number" ? "Nilai minimum" : "Panjang minimum"}
            htmlFor={`fields.${index}.validation_min`}
            hint="Opsional"
          >
            <Input
              id={`fields.${index}.validation_min`}
              type="number"
              className={inputClass}
              {...register(`fields.${index}.validation_min`)}
            />
          </FormField>
          <FormField
            label={type === "number" ? "Nilai maksimum" : "Panjang maksimum"}
            htmlFor={`fields.${index}.validation_max`}
            error={fieldErrors?.validation_max?.message}
            hint="Opsional"
          >
            <Input
              id={`fields.${index}.validation_max`}
              type="number"
              className={inputClass}
              {...register(`fields.${index}.validation_max`)}
            />
          </FormField>
          {type === "text" && (
            <div className="sm:col-span-2">
              <FormField
                label="Pola regex"
                htmlFor={`fields.${index}.regex`}
                error={fieldErrors?.regex?.message}
                hint="Opsional — contoh: ^\d{5}$ untuk kode pos"
              >
                <Input
                  id={`fields.${index}.regex`}
                  className={inputClass}
                  {...register(`fields.${index}.regex`)}
                />
              </FormField>
            </div>
          )}
        </div>
      )}

      {type === "file" && (
        <div className="grid grid-cols-1 gap-4 rounded-xl bg-muted/40 p-3 sm:grid-cols-2">
          <FormField
            label="Ukuran maksimum (KB)"
            htmlFor={`fields.${index}.max_size_kb`}
            error={fieldErrors?.max_size_kb?.message}
            hint="Maksimal 2048 KB (2 MB)"
          >
            <Input
              id={`fields.${index}.max_size_kb`}
              type="number"
              className={inputClass}
              {...register(`fields.${index}.max_size_kb`)}
            />
          </FormField>
          <FormField
            label="Ekstensi diizinkan"
            htmlFor={`fields.${index}.allowed_extensions`}
            hint="Opsional, pisahkan koma — contoh: jpg,png,pdf"
          >
            <Input
              id={`fields.${index}.allowed_extensions`}
              className={inputClass}
              placeholder="jpg,png,pdf"
              {...register(`fields.${index}.allowed_extensions`)}
            />
          </FormField>
        </div>
      )}
    </div>
  );
}
