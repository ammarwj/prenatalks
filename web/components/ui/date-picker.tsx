"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";

import { Calendar, type CalendarPreset } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatLongDate, parseIsoDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

export type DatePickerProps = {
  id?: string;
  name?: string;
  /** Tanggal terpilih, format `YYYY-MM-DD`. */
  value?: string;
  onChange: (isoDate: string) => void;
  /** Batas bawah inklusif, `YYYY-MM-DD`. */
  min?: string;
  /** Batas atas inklusif, `YYYY-MM-DD`. */
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  presets?: CalendarPreset[];
  /** Dirender di bawah grid kalender — mis. pratinjau usia kehamilan. */
  footer?: React.ReactNode;
  className?: string;
  onBlur?: () => void;
};

export function DatePicker({
  id,
  name,
  value,
  onChange,
  min,
  max,
  placeholder = "Pilih tanggal",
  disabled,
  presets,
  footer,
  className,
  onBlur,
  ...ariaProps
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const hasValue = Boolean(parseIsoDate(value));

  function handleSelect(isoDate: string) {
    onChange(isoDate);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        name={name}
        type="button"
        disabled={disabled}
        onBlur={onBlur}
        // Gaya disamakan dengan components/ui/input.tsx agar sebaris dengan field lain.
        className={cn(
          "flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-input bg-transparent px-3 py-1 text-left text-base transition-colors outline-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
          "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
          "md:text-sm",
          className
        )}
        {...ariaProps}
      >
        <span className={cn("truncate", !hasValue && "text-muted-foreground")}>
          {hasValue ? formatLongDate(value as string) : placeholder}
        </span>
        <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>

      <PopoverContent
        // max-h membuat kalender menyusut-dan-scroll saat ruang vertikal sempit,
        // bukan terpotong di luar viewport.
        className="max-h-(--radix-popover-content-available-height) w-auto overflow-y-auto rounded-2xl border-border p-0 shadow-soft"
        collisionPadding={12}
        // Kalender memfokuskan tanggal aktifnya sendiri (lihat prop autoFocus).
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Calendar
          autoFocus
          value={value}
          onSelect={handleSelect}
          min={min}
          max={max}
          presets={presets}
          footer={footer}
        />
      </PopoverContent>
    </Popover>
  );
}
