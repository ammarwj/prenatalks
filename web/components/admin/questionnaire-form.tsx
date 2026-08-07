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
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";

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
import type { AdminQuestionnaire } from "@/lib/types";
import {
  QUESTION_TYPE_OPTIONS,
  defaultOption,
  defaultQuestion,
  defaultRiskLevel,
  questionnaireSchema,
  toQuestionnaireFormValues,
  toQuestionnairePayload,
  type QuestionnaireInput,
} from "@/lib/validations/questionnaire";

const inputClass = "h-11 rounded-xl";

export function QuestionnaireForm({
  initialData,
  onSaved,
}: {
  initialData?: AdminQuestionnaire;
  onSaved: (result: AdminQuestionnaire, isNewVersion: boolean) => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<QuestionnaireInput>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: toQuestionnaireFormValues(initialData),
  });

  const questionsArray = useFieldArray({ control, name: "questions" });
  const riskLevelsArray = useFieldArray({ control, name: "risk_levels" });

  async function onSubmit(values: QuestionnaireInput) {
    setServerError(null);
    try {
      const payload = toQuestionnairePayload(values);
      const result =
        isEditing && initialData
          ? await apiPut<AdminQuestionnaire>(`/admin/questionnaires/${initialData.id}`, payload)
          : await apiPost<AdminQuestionnaire>("/admin/questionnaires", payload);
      const isNewVersion = !!(isEditing && initialData && result.id !== initialData.id);
      onSaved(result, isNewVersion);
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
          <CardTitle className="font-display text-base">Info Kuesioner</CardTitle>
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
          <FormField label="Deskripsi" htmlFor="description" hint="Opsional">
            <Textarea id="description" {...register("description")} />
          </FormField>
          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <label className="flex items-center gap-2.5 text-sm text-foreground">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(next) => field.onChange(next === true)}
                />
                Aktifkan kuesioner ini (menonaktifkan kuesioner aktif lainnya)
              </label>
            )}
          />
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-border shadow-soft">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="font-display text-base">Pertanyaan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6">
          {typeof errors.questions?.message === "string" && (
            <p className="text-xs font-medium text-danger">{errors.questions.message}</p>
          )}
          {questionsArray.fields.map((field, index) => (
            <QuestionCard
              key={field.id}
              control={control}
              register={register}
              errors={errors}
              index={index}
              totalQuestions={questionsArray.fields.length}
              onRemove={() => questionsArray.remove(index)}
              onMoveUp={() => questionsArray.move(index, index - 1)}
              onMoveDown={() => questionsArray.move(index, index + 1)}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => questionsArray.append(defaultQuestion())}
          >
            <Plus className="size-4" />
            Tambah Pertanyaan
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-border shadow-soft">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="font-display text-base">Level Risiko</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6">
          {typeof errors.risk_levels?.message === "string" && (
            <p className="text-xs font-medium text-danger">{errors.risk_levels.message}</p>
          )}
          {riskLevelsArray.fields.map((field, index) => (
            <RiskLevelCard
              key={field.id}
              control={control}
              register={register}
              errors={errors}
              index={index}
              onRemove={() => riskLevelsArray.remove(index)}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => riskLevelsArray.append(defaultRiskLevel())}
          >
            <Plus className="size-4" />
            Tambah Level
          </Button>
        </CardContent>
      </Card>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-11 w-full rounded-full bg-primary text-base text-white shadow-soft hover:bg-[#EC4899] sm:w-auto sm:px-8"
      >
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        {isSubmitting ? "Menyimpan..." : isEditing ? "Simpan" : "Buat Kuesioner"}
      </Button>
    </form>
  );
}

function QuestionCard({
  control,
  register,
  errors,
  index,
  totalQuestions,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  control: Control<QuestionnaireInput>;
  register: UseFormRegister<QuestionnaireInput>;
  errors: FieldErrors<QuestionnaireInput>;
  index: number;
  totalQuestions: number;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const optionsArray = useFieldArray({ control, name: `questions.${index}.options` });
  const type = useWatch({ control, name: `questions.${index}.type` });
  const questionErrors = errors.questions?.[index];

  return (
    <div className="space-y-4 rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-muted-foreground">
          Pertanyaan {index + 1}
        </span>
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
            disabled={index === totalQuestions - 1}
            onClick={onMoveDown}
            aria-label="Pindah ke bawah"
          >
            <ArrowDown className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            aria-label="Hapus pertanyaan"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <FormField
        label="Teks pertanyaan"
        htmlFor={`questions.${index}.text`}
        error={questionErrors?.text?.message}
      >
        <Input
          id={`questions.${index}.text`}
          className={inputClass}
          {...register(`questions.${index}.text`)}
        />
      </FormField>

      <FormField label="Teks bantuan" htmlFor={`questions.${index}.help_text`} hint="Opsional">
        <Textarea id={`questions.${index}.help_text`} {...register(`questions.${index}.help_text`)} />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Tipe jawaban" htmlFor={`questions.${index}.type`}>
          <Controller
            name={`questions.${index}.type`}
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={`questions.${index}.type`} className={`w-full ${inputClass}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        <FormField
          label="Label kelompok"
          htmlFor={`questions.${index}.group_label`}
          hint="Contoh: Riwayat, Kondisi, Tanda Bahaya — dipakai mengelompokkan pertanyaan"
        >
          <Input
            id={`questions.${index}.group_label`}
            className={inputClass}
            {...register(`questions.${index}.group_label`)}
          />
        </FormField>
      </div>

      <Controller
        name={`questions.${index}.is_required`}
        control={control}
        render={({ field }) => (
          <label className="flex items-center gap-2.5 text-sm text-foreground">
            <Checkbox
              checked={field.value}
              onCheckedChange={(next) => field.onChange(next === true)}
            />
            Wajib dijawab
          </label>
        )}
      />

      {type !== "number" && (
        <div className="space-y-3 rounded-xl bg-muted/40 p-3">
          <span className="text-xs font-semibold text-muted-foreground">Opsi jawaban</span>
          {typeof questionErrors?.options?.message === "string" && (
            <p className="text-xs font-medium text-danger">{questionErrors.options.message}</p>
          )}
          {optionsArray.fields.map((optionField, optionIndex) => {
            const optionErrors = questionErrors?.options?.[optionIndex];

            return (
              <div
                key={optionField.id}
                className="flex flex-wrap items-start gap-2 rounded-lg border border-border bg-white p-3"
              >
                <div className="min-w-[160px] flex-1">
                  <FormField
                    label="Label"
                    htmlFor={`questions.${index}.options.${optionIndex}.label`}
                    error={optionErrors?.label?.message}
                  >
                    <Input
                      id={`questions.${index}.options.${optionIndex}.label`}
                      className={inputClass}
                      {...register(`questions.${index}.options.${optionIndex}.label`)}
                    />
                  </FormField>
                </div>
                <div className="w-24">
                  <FormField
                    label="Skor"
                    htmlFor={`questions.${index}.options.${optionIndex}.score`}
                    error={optionErrors?.score?.message}
                  >
                    <Input
                      id={`questions.${index}.options.${optionIndex}.score`}
                      type="number"
                      className={inputClass}
                      {...register(`questions.${index}.options.${optionIndex}.score`)}
                    />
                  </FormField>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Controller
                    name={`questions.${index}.options.${optionIndex}.is_danger_sign`}
                    control={control}
                    render={({ field }) => (
                      <label className="flex max-w-[220px] items-center gap-1.5 text-xs text-foreground">
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(next) => field.onChange(next === true)}
                        />
                        Tanda bahaya — memicu alert merah persisten untuk pengguna
                      </label>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => optionsArray.remove(optionIndex)}
                    aria-label="Hapus opsi"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => optionsArray.append(defaultOption())}
          >
            <Plus className="size-4" />
            Tambah Opsi
          </Button>
        </div>
      )}
    </div>
  );
}

function RiskLevelCard({
  control,
  register,
  errors,
  index,
  onRemove,
}: {
  control: Control<QuestionnaireInput>;
  register: UseFormRegister<QuestionnaireInput>;
  errors: FieldErrors<QuestionnaireInput>;
  index: number;
  onRemove: () => void;
}) {
  const levelErrors = errors.risk_levels?.[index];
  const colorValue = useWatch({ control, name: `risk_levels.${index}.color_hex` });

  return (
    <div className="space-y-4 rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-muted-foreground">
          Level {index + 1}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label="Hapus level risiko"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Nama" htmlFor={`risk_levels.${index}.name`} error={levelErrors?.name?.message}>
          <Input
            id={`risk_levels.${index}.name`}
            className={inputClass}
            placeholder="Risiko Rendah"
            {...register(`risk_levels.${index}.name`)}
          />
        </FormField>
        <FormField
          label="Warna badge"
          htmlFor={`risk_levels.${index}.color_hex`}
          error={levelErrors?.color_hex?.message}
          hint="Format #RRGGBB"
        >
          <div className="flex items-center gap-2">
            <span
              className="size-8 shrink-0 rounded-full border border-border"
              style={{ backgroundColor: colorValue || "transparent" }}
            />
            <Input
              id={`risk_levels.${index}.color_hex`}
              className={inputClass}
              placeholder="#E11D48"
              {...register(`risk_levels.${index}.color_hex`)}
            />
          </div>
        </FormField>
        <FormField
          label="Skor minimum"
          htmlFor={`risk_levels.${index}.min_score`}
          error={levelErrors?.min_score?.message}
        >
          <Input
            id={`risk_levels.${index}.min_score`}
            type="number"
            className={inputClass}
            {...register(`risk_levels.${index}.min_score`)}
          />
        </FormField>
        <FormField
          label="Skor maksimum"
          htmlFor={`risk_levels.${index}.max_score`}
          error={levelErrors?.max_score?.message}
          hint="Kosongkan untuk tingkat tertinggi tanpa batas atas"
        >
          <Input
            id={`risk_levels.${index}.max_score`}
            type="number"
            className={inputClass}
            {...register(`risk_levels.${index}.max_score`)}
          />
        </FormField>
      </div>

      <FormField
        label="Rekomendasi"
        htmlFor={`risk_levels.${index}.recommendation`}
        error={levelErrors?.recommendation?.message}
      >
        <Textarea
          id={`risk_levels.${index}.recommendation`}
          {...register(`risk_levels.${index}.recommendation`)}
        />
      </FormField>
    </div>
  );
}
