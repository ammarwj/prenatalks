"use client";

import { useState } from "react";

const PREVIEW_LIMIT = 3;
const VALUE_MAX_CHARS = 60;

/** Ringkas nilai apa pun jadi satu baris yang bisa dibaca sekilas. */
function preview(value: unknown): string {
  if (value === null || value === undefined) return "kosong";
  if (typeof value === "boolean") return value ? "ya" : "tidak";
  if (Array.isArray(value)) return `${value.length} item`;
  if (typeof value === "object") return "(data majemuk)";

  const text = String(value);

  return text.length > VALUE_MAX_CHARS ? `${text.slice(0, VALUE_MAX_CHARS)}…` : text;
}

function isBeforeAfter(value: unknown): value is { from: unknown; to: unknown } {
  return typeof value === "object" && value !== null && "from" in value && "to" in value;
}

/**
 * Isi kolom `changes` di audit log (PRD §9 F-14).
 *
 * Bentuknya berbeda per aksi: `updated` menyimpan `{from, to}` per kolom,
 * sedangkan `created`/`deleted` menyimpan cuplikan atribut. Keduanya
 * dirender sebagai daftar pendek dengan opsi "lihat semua" supaya baris
 * tabel tidak meledak tingginya.
 */
export function AuditChangeList({
  action,
  changes,
}: {
  action: string;
  changes: Record<string, unknown> | null;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!changes || Object.keys(changes).length === 0) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  const entries = Object.entries(changes);
  const visible = expanded ? entries : entries.slice(0, PREVIEW_LIMIT);
  const hidden = entries.length - visible.length;

  return (
    <div className="space-y-1">
      <ul className="space-y-0.5">
        {visible.map(([field, value]) => (
          <li key={field} className="text-xs">
            <span className="font-semibold text-foreground">{field}</span>{" "}
            {isBeforeAfter(value) ? (
              <span className="text-muted-foreground">
                <span className="line-through">{preview(value.from)}</span>
                {" → "}
                <span className="text-foreground">{preview(value.to)}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">{preview(value)}</span>
            )}
          </li>
        ))}
      </ul>

      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-xs font-semibold text-primary-text hover:underline"
        >
          + {hidden} kolom lainnya
        </button>
      )}
      {expanded && entries.length > PREVIEW_LIMIT && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-xs font-semibold text-primary-text hover:underline"
        >
          Ringkas
        </button>
      )}
      {action === "deleted" && (
        <p className="text-xs text-muted-foreground italic">Cuplikan sebelum dihapus</p>
      )}
    </div>
  );
}
