import { z } from "zod";

import type { CommunitySettings } from "@/lib/types";

/**
 * Melengkapi tautan yang ditempel tanpa skema (`chat.whatsapp.com/...`)
 * sebelum divalidasi — perilaku yang sama dijalankan backend di
 * `AdminSettingsRequest::prepareForValidation()`, jadi pesan galat di form
 * dan dari server tidak saling bertentangan.
 */
function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

const optionalUrl = z
  .string()
  .transform(normalizeUrl)
  .refine((value) => value === "" || z.string().url().safeParse(value).success, {
    message: "Tautan tidak valid",
  });

export const communitySettingsSchema = z.object({
  heading: z.string().min(1, "Judul komunitas wajib diisi").max(150, "Maksimal 150 karakter"),
  description: z
    .string()
    .min(1, "Penjelasan komunitas wajib diisi")
    .max(2000, "Maksimal 2000 karakter"),
  rules: z
    .array(z.object({ text: z.string().min(1, "Butir aturan tidak boleh kosong").max(250, "Maksimal 250 karakter") }))
    .max(12, "Maksimal 12 butir aturan"),
  whatsappUrl: optionalUrl,
  telegramUrl: optionalUrl,
});

export type CommunitySettingsInput = z.input<typeof communitySettingsSchema>;
export type CommunitySettingsOutput = z.output<typeof communitySettingsSchema>;

export function toCommunitySettingsFormValues(
  settings: CommunitySettings
): CommunitySettingsInput {
  return {
    heading: settings.community_heading ?? "",
    description: settings.community_description ?? "",
    rules: (settings.community_rules ?? []).map((text) => ({ text })),
    whatsappUrl: settings.community_whatsapp_url ?? "",
    telegramUrl: settings.community_telegram_url ?? "",
  };
}

/** Payload persis bentuk `AdminSettingsRequest::rules()` di backend. */
export type CommunitySettingsPayload = {
  community_heading: string;
  community_description: string;
  community_rules: string[];
  community_whatsapp_url: string | null;
  community_telegram_url: string | null;
};

export function toCommunitySettingsPayload(
  values: CommunitySettingsOutput
): CommunitySettingsPayload {
  return {
    community_heading: values.heading,
    community_description: values.description,
    community_rules: values.rules.map((rule) => rule.text.trim()),
    community_whatsapp_url: values.whatsappUrl || null,
    community_telegram_url: values.telegramUrl || null,
  };
}
