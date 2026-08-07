import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Question } from "@/lib/types";

export type QuestionAnswer =
  | { option_id: number }
  | { option_ids: number[] }
  | { value_number: number | undefined };

function OptionCard({
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

/**
 * Merender satu pertanyaan sesuai `type` — skor & `is_danger_sign` opsi
 * sengaja tidak dikirim ke halaman ini (lihat QuestionOptionResource di
 * backend), jadi tidak mungkin ditampilkan meski mau.
 */
export function RiskQuestionStep({
  question,
  answer,
  onChange,
}: {
  question: Question;
  answer: QuestionAnswer | undefined;
  onChange: (answer: QuestionAnswer) => void;
}) {
  if (question.type === "single_choice" || question.type === "boolean") {
    const selectedId = answer && "option_id" in answer ? answer.option_id : undefined;
    return (
      <div className="space-y-2.5">
        {question.options.map((option) => (
          <OptionCard
            key={option.id}
            label={option.label}
            selected={selectedId === option.id}
            onClick={() => onChange({ option_id: option.id })}
          />
        ))}
      </div>
    );
  }

  if (question.type === "multiple_choice") {
    const selectedIds = answer && "option_ids" in answer ? answer.option_ids : [];
    return (
      <div className="space-y-2.5">
        {question.options.map((option) => {
          const selected = selectedIds.includes(option.id);
          return (
            <OptionCard
              key={option.id}
              label={option.label}
              selected={selected}
              onClick={() =>
                onChange({
                  option_ids: selected
                    ? selectedIds.filter((id) => id !== option.id)
                    : [...selectedIds, option.id],
                })
              }
            />
          );
        })}
      </div>
    );
  }

  // type === "number"
  const value = answer && "value_number" in answer ? answer.value_number : undefined;
  return (
    <Input
      type="number"
      value={value ?? ""}
      onChange={(e) => {
        const raw = e.target.value;
        onChange({ value_number: raw === "" ? undefined : Number(raw) });
      }}
      inputMode="numeric"
      placeholder="Masukkan angka"
      className="h-11 rounded-xl"
    />
  );
}
