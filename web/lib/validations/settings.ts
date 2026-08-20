import { z } from "zod";

import type {
  CommunitySettings,
  ContactSettings,
  SocialSettings,
  StatsSettings,
} from "@/lib/types";

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

/** Kontak di footer — PRD §9 F-01. */
export const contactSettingsSchema = z.object({
  phone: z.string().max(40, "Maksimal 40 karakter"),
  email: z
    .string()
    .max(150, "Maksimal 150 karakter")
    .refine((value) => value === "" || z.string().email().safeParse(value).success, {
      message: "Alamat email tidak valid",
    }),
  address: z.string().max(200, "Maksimal 200 karakter"),
});

export type ContactSettingsInput = z.input<typeof contactSettingsSchema>;
export type ContactSettingsOutput = z.output<typeof contactSettingsSchema>;

export function toContactSettingsFormValues(settings: ContactSettings): ContactSettingsInput {
  return {
    phone: settings.contact_phone ?? "",
    email: settings.contact_email ?? "",
    address: settings.contact_address ?? "",
  };
}

/**
 * Baris kontak yang dikosongkan disimpan sebagai `null` — footer
 * menyembunyikannya, lebih baik daripada memajang baris kosong.
 */
export function toContactSettingsPayload(values: ContactSettingsOutput) {
  return {
    contact_phone: values.phone.trim() || null,
    contact_email: values.email.trim() || null,
    contact_address: values.address.trim() || null,
  };
}

/** Tautan sosial media di footer — PRD §9 F-01. */
export const socialSettingsSchema = z.object({
  instagramUrl: optionalUrl,
  facebookUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  tiktokUrl: optionalUrl,
});

export type SocialSettingsInput = z.input<typeof socialSettingsSchema>;
export type SocialSettingsOutput = z.output<typeof socialSettingsSchema>;

export function toSocialSettingsFormValues(settings: SocialSettings): SocialSettingsInput {
  return {
    instagramUrl: settings.social_instagram_url ?? "",
    facebookUrl: settings.social_facebook_url ?? "",
    youtubeUrl: settings.social_youtube_url ?? "",
    tiktokUrl: settings.social_tiktok_url ?? "",
  };
}

export function toSocialSettingsPayload(values: SocialSettingsOutput) {
  return {
    social_instagram_url: values.instagramUrl || null,
    social_facebook_url: values.facebookUrl || null,
    social_youtube_url: values.youtubeUrl || null,
    social_tiktok_url: values.tiktokUrl || null,
  };
}

/**
 * Statistik landing page — PRD §9 F-01. Hanya label & sakelar tampil:
 * angkanya dihitung backend dari database, jadi tidak ada field untuk itu di
 * sini. Itu yang membuat angkanya tidak bisa dikarang dari panel.
 */
export const statsSettingsSchema = z.object({
  enabled: z.boolean(),
  labelMothers: z.string().min(1, "Label wajib diisi").max(60, "Maksimal 60 karakter"),
  labelContents: z.string().min(1, "Label wajib diisi").max(60, "Maksimal 60 karakter"),
  labelAssessments: z.string().min(1, "Label wajib diisi").max(60, "Maksimal 60 karakter"),
  labelHealthWorkers: z.string().min(1, "Label wajib diisi").max(60, "Maksimal 60 karakter"),
});

export type StatsSettingsInput = z.infer<typeof statsSettingsSchema>;

export function toStatsSettingsFormValues(settings: StatsSettings): StatsSettingsInput {
  return {
    enabled: settings.stats_enabled,
    labelMothers: settings.stats_label_mothers ?? "",
    labelContents: settings.stats_label_contents ?? "",
    labelAssessments: settings.stats_label_assessments ?? "",
    labelHealthWorkers: settings.stats_label_health_workers ?? "",
  };
}

export function toStatsSettingsPayload(values: StatsSettingsInput) {
  return {
    stats_enabled: values.enabled,
    stats_label_mothers: values.labelMothers.trim(),
    stats_label_contents: values.labelContents.trim(),
    stats_label_assessments: values.labelAssessments.trim(),
    stats_label_health_workers: values.labelHealthWorkers.trim(),
  };
}
