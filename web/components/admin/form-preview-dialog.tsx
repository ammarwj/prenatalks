"use client";

import { useState } from "react";
import { Star } from "lucide-react";

import { FileUpload } from "@/components/shared/file-upload";
import { FormField } from "@/components/shared/form-field";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { acceptFromExtensions } from "@/lib/file-upload";
import { MAX_FILE_SIZE_KB, type FormBuilderFieldInput } from "@/lib/validations/form-builder";

const inputClass = "h-11 rounded-xl";

/**
 * Pratinjau lokal (PRD §9 F-06, "Pratinjau form sebelum terbit") — merender
 * field persis seperti yang akan dilihat pengguna, murni di sisi klien dari
 * nilai form yang sedang diisi admin. Tidak mengirim apa pun ke API: belum
 * ada endpoint submission publik (menyusul di F-07), jadi pratinjau ini
 * hanya simulasi tampilan + interaksi, bukan uji kirim sungguhan.
 */
export function FormPreviewDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FormBuilderFieldInput[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="space-y-5">
          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada field untuk dipratinjau.</p>
          ) : (
            fields.map((field, index) => (
              <PreviewField key={index} field={field} index={index} />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PreviewField({ field, index }: { field: FormBuilderFieldInput; index: number }) {
  const htmlFor = `preview-field-${index}`;
  const label = field.is_required ? `${field.label || "(Tanpa label)"} *` : field.label || "(Tanpa label)";
  const choices = field.choices.map((c) => c.value).filter(Boolean);

  return (
    <FormField label={label} htmlFor={htmlFor} hint={field.description}>
      <PreviewControl field={field} htmlFor={htmlFor} choices={choices} />
    </FormField>
  );
}

function PreviewControl({
  field,
  htmlFor,
  choices,
}: {
  field: FormBuilderFieldInput;
  htmlFor: string;
  choices: string[];
}) {
  const [selected, setSelected] = useState<string[]>([]);

  switch (field.type) {
    case "textarea":
      return <Textarea id={htmlFor} placeholder={field.placeholder} disabled />;

    case "number":
      return <Input id={htmlFor} type="number" className={inputClass} placeholder={field.placeholder} disabled />;

    case "date":
      return <DatePicker id={htmlFor} onChange={() => {}} placeholder={field.placeholder || "Pilih tanggal"} disabled />;

    case "file":
      // Zona yang sama dengan yang dilihat responden, dalam keadaan nonaktif —
      // pratinjau yang menampilkan kontrol berbeda dari halaman aslinya tidak
      // menjawab pertanyaan apa pun.
      return (
        <FileUpload
          id={htmlFor}
          // Bentuk field di builder masih datar (`allowed_extensions` sebagai
          // teks berkoma, `max_size_kb` sebagai string) — baru diubah jadi
          // objek `validation` saat dikirim ke API oleh `toFormBuilderPayload`.
          accept={acceptFromExtensions(
            field.allowed_extensions?.split(",").map((ext) => ext.trim()).filter(Boolean)
          )}
          maxSizeKb={Math.min(Number(field.max_size_kb) || MAX_FILE_SIZE_KB, MAX_FILE_SIZE_KB)}
          onChange={() => {}}
          disabled
        />
      );

    case "select":
      return (
        <Select disabled>
          <SelectTrigger id={htmlFor} className={`w-full ${inputClass}`}>
            <SelectValue placeholder={field.placeholder || "Pilih salah satu"} />
          </SelectTrigger>
          <SelectContent>
            {choices.map((choice) => (
              <SelectItem key={choice} value={choice}>
                {choice}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "radio":
      return (
        <RadioGroup>
          {choices.length === 0 && <p className="text-xs text-muted-foreground">Belum ada pilihan</p>}
          {choices.map((choice) => (
            <label key={choice} className="flex items-center gap-2 text-sm text-foreground">
              <RadioGroupItem value={choice} />
              {choice}
            </label>
          ))}
        </RadioGroup>
      );

    case "checkbox":
      return (
        <div className="space-y-2">
          {choices.length === 0 && <p className="text-xs text-muted-foreground">Belum ada pilihan</p>}
          {choices.map((choice) => (
            <label key={choice} className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={selected.includes(choice)}
                onCheckedChange={(next) =>
                  setSelected((prev) =>
                    next === true ? [...prev, choice] : prev.filter((c) => c !== choice)
                  )
                }
              />
              {choice}
            </label>
          ))}
        </div>
      );

    case "scale": {
      const min = Number(field.scale_min) || 1;
      const max = Number(field.scale_max) || 5;
      const steps = Array.from({ length: Math.max(max - min + 1, 0) }, (_, i) => min + i);
      return <ScaleControl steps={steps} />;
    }

    default:
      return <Input id={htmlFor} className={inputClass} placeholder={field.placeholder} disabled />;
  }
}

function ScaleControl({ steps }: { steps: number[] }) {
  const [value, setValue] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-2">
      {steps.map((step) => (
        <button
          key={step}
          type="button"
          onClick={() => setValue(step)}
          className={`flex size-10 items-center justify-center rounded-full border text-sm font-semibold transition-colors ${
            value === step
              ? "border-primary bg-primary text-white"
              : "border-border text-foreground hover:bg-muted"
          }`}
        >
          {step}
        </button>
      ))}
      {steps.length > 0 && (
        <Star className="size-4 text-star" aria-hidden />
      )}
    </div>
  );
}
