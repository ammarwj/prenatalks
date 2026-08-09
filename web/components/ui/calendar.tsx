"use client";

import * as React from "react";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import {
  MONTH_NAMES_ID,
  WEEKDAY_LONG_ID,
  WEEKDAY_SHORT_ID,
  addDays,
  addMonths,
  isSameDay,
  parseIsoDate,
  toIsoDate,
  today,
} from "@/lib/date-utils";
import { cn } from "@/lib/utils";

export type CalendarPreset = { label: string; value: string };

/** 6 baris × 7 kolom selalu dirender agar tinggi popover tidak melompat saat ganti bulan. */
const GRID_CELLS = 42;

const cellLabelFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function firstOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function lastOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function Calendar({
  value,
  onSelect,
  min,
  max,
  presets,
  footer,
  autoFocus = false,
  className,
}: {
  /** Tanggal terpilih, format `YYYY-MM-DD`. */
  value?: string;
  onSelect: (isoDate: string) => void;
  /** Batas bawah inklusif, `YYYY-MM-DD`. */
  min?: string;
  /** Batas atas inklusif, `YYYY-MM-DD`. */
  max?: string;
  presets?: CalendarPreset[];
  footer?: React.ReactNode;
  /** Fokuskan tanggal aktif saat mount — dipakai ketika kalender dibuka di popover. */
  autoFocus?: boolean;
  className?: string;
}) {
  const minDate = React.useMemo(() => parseIsoDate(min), [min]);
  const maxDate = React.useMemo(() => parseIsoDate(max), [max]);

  const isDisabled = React.useCallback(
    (date: Date) => Boolean((minDate && date < minDate) || (maxDate && date > maxDate)),
    [minDate, maxDate]
  );

  const clampToRange = React.useCallback(
    (date: Date) => {
      if (minDate && date < minDate) return minDate;
      if (maxDate && date > maxDate) return maxDate;
      return date;
    },
    [minDate, maxDate]
  );

  const initialDate = React.useMemo(
    () => parseIsoDate(value) ?? clampToRange(today()),
    // Hanya untuk nilai awal; sinkronisasi lanjutan ditangani efek di bawah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [viewMonth, setViewMonth] = React.useState(() => firstOfMonth(initialDate));
  const [focusedDate, setFocusedDate] = React.useState(initialDate);

  const gridRef = React.useRef<HTMLDivElement>(null);
  const shouldRestoreFocus = React.useRef(false);

  // Nilai bisa berubah dari luar (reset form, preset, prefill) — ikuti tampilannya.
  // Menyesuaikan state saat render, bukan di efek: react.dev/learn/you-might-not-need-an-effect
  const [lastValue, setLastValue] = React.useState(value);

  if (value !== lastValue) {
    setLastValue(value);

    const parsed = parseIsoDate(value);
    if (parsed) {
      setViewMonth(firstOfMonth(parsed));
      setFocusedDate(parsed);
    }
  }

  // Pindahkan fokus DOM hanya setelah navigasi keyboard, bukan setiap render.
  React.useEffect(() => {
    if (!shouldRestoreFocus.current) return;
    shouldRestoreFocus.current = false;

    gridRef.current
      ?.querySelector<HTMLButtonElement>(`[data-day="${toIsoDate(focusedDate)}"]`)
      ?.focus();
  }, [focusedDate]);

  React.useEffect(() => {
    if (!autoFocus) return;

    // rAF agar berjalan setelah Radix Popover selesai mengatur fokus awalnya.
    const frame = requestAnimationFrame(() => {
      gridRef.current?.querySelector<HTMLButtonElement>('[data-day][tabindex="0"]')?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [autoFocus]);

  const days = React.useMemo(() => {
    const gridStart = addDays(viewMonth, -viewMonth.getDay());

    return Array.from({ length: GRID_CELLS }, (_, offset) => addDays(gridStart, offset));
  }, [viewMonth]);

  const years = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const start = minDate ? minDate.getFullYear() : currentYear - 10;
    const end = Math.max(maxDate ? maxDate.getFullYear() : currentYear + 5, start);

    return Array.from({ length: end - start + 1 }, (_, offset) => start + offset);
  }, [minDate, maxDate]);

  const canGoPrev = !(minDate && lastOfMonth(addMonths(viewMonth, -1)) < minDate);
  const canGoNext = !(maxDate && firstOfMonth(addMonths(viewMonth, 1)) > maxDate);

  function shiftMonth(amount: number) {
    setViewMonth((current) => firstOfMonth(addMonths(current, amount)));
  }

  function moveFocus(target: Date, { clamp = false } = {}) {
    const next = clamp ? clampToRange(target) : target;
    if (isDisabled(next)) return;

    shouldRestoreFocus.current = true;
    setFocusedDate(next);
    setViewMonth(firstOfMonth(next));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const handlers: Record<string, () => void> = {
      ArrowLeft: () => moveFocus(addDays(focusedDate, -1)),
      ArrowRight: () => moveFocus(addDays(focusedDate, 1)),
      ArrowUp: () => moveFocus(addDays(focusedDate, -7)),
      ArrowDown: () => moveFocus(addDays(focusedDate, 7)),
      PageUp: () => moveFocus(addMonths(focusedDate, -1), { clamp: true }),
      PageDown: () => moveFocus(addMonths(focusedDate, 1), { clamp: true }),
      Home: () => moveFocus(addDays(focusedDate, -focusedDate.getDay())),
      End: () => moveFocus(addDays(focusedDate, 6 - focusedDate.getDay())),
    };

    const handler = handlers[event.key];
    if (!handler) return;

    event.preventDefault();
    handler();
  }

  const now = today();
  const selectedDate = parseIsoDate(value);

  const selectClass =
    "cursor-pointer appearance-none rounded-lg bg-transparent py-1 pr-6 pl-2 font-display text-sm font-bold text-foreground transition-colors outline-none hover:bg-primary-soft focus-visible:ring-3 focus-visible:ring-ring/50";
  const navButtonClass =
    "inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-primary-soft hover:text-primary-text focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-30";

  return (
    <div className={cn("w-fit p-3", className)}>
      <div className="mb-2 flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          disabled={!canGoPrev}
          aria-label="Bulan sebelumnya"
          className={navButtonClass}
        >
          <ChevronLeftIcon className="size-4" />
        </button>

        <div className="flex items-center gap-0.5">
          <div className="relative flex items-center">
            <select
              value={viewMonth.getMonth()}
              onChange={(e) => setViewMonth(new Date(viewMonth.getFullYear(), Number(e.target.value), 1))}
              aria-label="Pilih bulan"
              className={selectClass}
            >
              {MONTH_NAMES_ID.map((name, monthIndex) => {
                const monthStart = new Date(viewMonth.getFullYear(), monthIndex, 1);
                const monthEnd = new Date(viewMonth.getFullYear(), monthIndex + 1, 0);

                return (
                  <option
                    key={name}
                    value={monthIndex}
                    disabled={Boolean((maxDate && monthStart > maxDate) || (minDate && monthEnd < minDate))}
                  >
                    {name}
                  </option>
                );
              })}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-1.5 size-3.5 text-muted-foreground" />
          </div>

          <div className="relative flex items-center">
            <select
              value={viewMonth.getFullYear()}
              onChange={(e) => setViewMonth(new Date(Number(e.target.value), viewMonth.getMonth(), 1))}
              aria-label="Pilih tahun"
              className={selectClass}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-1.5 size-3.5 text-muted-foreground" />
          </div>
        </div>

        <button
          type="button"
          onClick={() => shiftMonth(1)}
          disabled={!canGoNext}
          aria-label="Bulan berikutnya"
          className={navButtonClass}
        >
          <ChevronRightIcon className="size-4" />
        </button>
      </div>

      <span aria-live="polite" className="sr-only">
        {MONTH_NAMES_ID[viewMonth.getMonth()]} {viewMonth.getFullYear()}
      </span>

      {presets && presets.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onSelect(preset.value)}
              disabled={isDisabled(parseIsoDate(preset.value) ?? now)}
              className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors outline-none hover:bg-primary-soft hover:text-primary-text focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      <div ref={gridRef} role="grid" onKeyDown={handleKeyDown}>
        <div role="row" className="grid grid-cols-7">
          {WEEKDAY_SHORT_ID.map((weekday, index) => (
            <div
              key={weekday}
              role="columnheader"
              aria-label={WEEKDAY_LONG_ID[index]}
              className="flex size-9 items-center justify-center text-[0.7rem] font-semibold text-muted-foreground"
            >
              {weekday}
            </div>
          ))}
        </div>

        <div role="rowgroup">
          {Array.from({ length: GRID_CELLS / 7 }, (_, week) => (
            <div key={week} role="row" className="grid grid-cols-7">
              {days.slice(week * 7, week * 7 + 7).map((day) => {
                const iso = toIsoDate(day);
                const disabled = isDisabled(day);
                const isSelected = Boolean(selectedDate && isSameDay(day, selectedDate));
                const isToday = isSameDay(day, now);
                const isOutside = day.getMonth() !== viewMonth.getMonth();

                return (
                  <button
                    key={iso}
                    type="button"
                    role="gridcell"
                    data-day={iso}
                    tabIndex={isSameDay(day, focusedDate) ? 0 : -1}
                    disabled={disabled}
                    aria-selected={isSelected}
                    aria-label={cellLabelFormatter.format(day)}
                    onClick={() => onSelect(iso)}
                    onFocus={() => setFocusedDate(day)}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full text-sm transition-colors outline-none",
                      "hover:bg-primary-soft hover:text-primary-text",
                      "focus-visible:ring-3 focus-visible:ring-ring/50",
                      "disabled:pointer-events-none disabled:text-muted-foreground/40",
                      isOutside && "text-muted-foreground/60",
                      isToday && !isSelected && "font-semibold text-primary-text ring-1 ring-primary/40",
                      isSelected &&
                        "bg-primary font-semibold text-white shadow-soft hover:bg-primary hover:text-white"
                    )}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {footer && <div className="mt-2 border-t border-border pt-2">{footer}</div>}
    </div>
  );
}
