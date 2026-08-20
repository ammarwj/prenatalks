"use client";

import { Check, Star } from "lucide-react";

import { FileUpload } from "@/components/shared/file-upload";
import { acceptFromExtensions } from "@/lib/file-upload";
import { FormField } from "@/components/shared/form-field";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { PublicFormField } from "@/lib/types";
import type { AnswerValue } from "@/lib/validations/form-submit";

const inputClass = "h-11 rounded-xl";

function RadioOptionCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition-colors",
        selected
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border bg-white text-foreground hover:bg-muted"
      )}
    >
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
          selected ? "border-primary bg-primary" : "border-input"
        )}
      >
        {selected && <span className="size-2 rounded-full bg-white" />}
      </span>
      {label}
    </button>
  );
}

function CheckboxOptionCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm font-medium transition-colors",
        selected
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border bg-white text-foreground hover:bg-muted"
      )}
    >
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-md border-2",
          selected ? "border-primary bg-primary text-white" : "border-input"
        )}
      >
        {selected && <Check className="size-3.5" />}
      </span>
      {label}
    </button>
  );
}

/** Merender satu field sesuai `type` + mengelola nilainya sebagai state terkontrol dari pemanggil. */
export function DynamicFormField({
  field,
  value,
  onChange,
  error,
}: {
  field: PublicFormField;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  error?: string;
}) {
  const htmlFor = `field-${field.id}`;
  const label = field.is_required ? `${field.label} *` : field.label;

  return (
    <FormField label={label} htmlFor={htmlFor} error={error} hint={field.description ?? undefined}>
      <FieldControl field={field} value={value} onChange={onChange} htmlFor={htmlFor} />
    </FormField>
  );
}

function FieldControl({
  field,
  value,
  onChange,
  htmlFor,
}: {
  field: PublicFormField;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  htmlFor: string;
}) {
  switch (field.type) {
    case "text":
      return (
        <Input
          id={htmlFor}
          className={inputClass}
          placeholder={field.placeholder ?? undefined}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "textarea":
      return (
        <Textarea
          id={htmlFor}
          placeholder={field.placeholder ?? undefined}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "number":
      return (
        <Input
          id={htmlFor}
          type="number"
          className={inputClass}
          placeholder={field.placeholder ?? undefined}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "date":
      return (
        <DatePicker
          id={htmlFor}
          value={(value as string) ?? ""}
          onChange={onChange}
          placeholder={field.placeholder || "Pilih tanggal"}
        />
      );

    case "select": {
      const options = (field.options as string[] | null) ?? [];
      return (
        <Select value={(value as string) ?? ""} onValueChange={onChange}>
          <SelectTrigger id={htmlFor} className={`w-full ${inputClass}`}>
            <SelectValue placeholder={field.placeholder || "Pilih salah satu"} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    case "radio": {
      const options = (field.options as string[] | null) ?? [];
      return (
        <div className="space-y-2.5">
          {options.map((option) => (
            <RadioOptionCard
              key={option}
              label={option}
              selected={value === option}
              onClick={() => onChange(option)}
            />
          ))}
        </div>
      );
    }

    case "checkbox": {
      const options = (field.options as string[] | null) ?? [];
      const selected = (value as string[] | undefined) ?? [];
      return (
        <div className="space-y-2.5">
          {options.map((option) => {
            const isSelected = selected.includes(option);
            return (
              <CheckboxOptionCard
                key={option}
                label={option}
                selected={isSelected}
                onClick={() =>
                  onChange(
                    isSelected ? selected.filter((s) => s !== option) : [...selected, option]
                  )
                }
              />
            );
          })}
        </div>
      );
    }

    case "scale": {
      const bounds = field.options as { min: number; max: number } | null;
      const min = bounds?.min ?? 1;
      const max = bounds?.max ?? 5;
      const steps = Array.from({ length: Math.max(max - min + 1, 0) }, (_, i) => min + i);
      return (
        <div className="flex flex-wrap items-center gap-2">
          {steps.map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => onChange(String(step))}
              className={cn(
                "flex size-11 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                String(value ?? "") === String(step)
                  ? "border-primary bg-primary text-white"
                  : "border-border text-foreground hover:bg-muted"
              )}
            >
              {step}
            </button>
          ))}
          <Star className="size-4 text-star" aria-hidden />
        </div>
      );
    }

    case "file":
      return (
        <FileUpload
          id={htmlFor}
          accept={acceptFromExtensions(field.validation?.allowed_extensions)}
          // Dibatasi 2048 sama seperti `FormFieldRuleBuilder` di backend, yang
          // memakai `min($validation['max_size_kb'] ?? 2048, 2048)` — nilai
          // admin di atas itu tetap ditolak server, jadi menampilkannya sebagai
          // batas yang berlaku hanya akan menyesatkan responden.
          maxSizeKb={Math.min(field.validation?.max_size_kb ?? 2048, 2048)}
          value={value instanceof File ? value : undefined}
          onChange={(file) => onChange(file)}
        />
      );

    default:
      return null;
  }
}
