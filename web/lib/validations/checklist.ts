import { z } from "zod";

import type { AdminChecklistItem } from "@/lib/types";

/**
 * Kelima kelompok di PRD §9 F-11. Sumber kebenarannya tetap di backend
 * (`ChecklistItem::GROUPS`) — daftar ini hanya nilai awal bila `meta.groups`
 * dari `GET /admin/checklist-items` belum termuat.
 */
export const CHECKLIST_GROUPS = [
  "Dokumen",
  "Perlengkapan Ibu",
  "Perlengkapan Bayi",
  "Persiapan Transportasi & Donor Darah",
  "Rencana Persalinan",
] as const;

export const checklistItemSchema = z.object({
  groupName: z.string().min(1, "Kelompok wajib dipilih"),
  title: z.string().min(1, "Judul item wajib diisi").max(200, "Maksimal 200 karakter"),
  description: z.string().max(1000, "Maksimal 1000 karakter"),
  isActive: z.boolean(),
});

export type ChecklistItemInput = z.infer<typeof checklistItemSchema>;

export function toChecklistItemFormValues(
  item?: AdminChecklistItem,
  defaultGroup: string = CHECKLIST_GROUPS[0]
): ChecklistItemInput {
  if (!item) {
    return { groupName: defaultGroup, title: "", description: "", isActive: true };
  }

  return {
    groupName: item.group_name,
    title: item.title,
    description: item.description ?? "",
    isActive: item.is_active,
  };
}

/** Payload persis bentuk `AdminChecklistItemRequest::rules()` di backend. */
export type ChecklistItemPayload = {
  group_name: string;
  title: string;
  description: string | null;
  is_active: boolean;
};

export function toChecklistItemPayload(values: ChecklistItemInput): ChecklistItemPayload {
  return {
    group_name: values.groupName,
    title: values.title,
    description: values.description.trim() || null,
    is_active: values.isActive,
  };
}

/** Item pribadi pengguna — `POST /checklist/custom`. */
export const customChecklistItemSchema = z.object({
  title: z.string().min(1, "Judul item wajib diisi").max(200, "Maksimal 200 karakter"),
});

export type CustomChecklistItemInput = z.infer<typeof customChecklistItemSchema>;
