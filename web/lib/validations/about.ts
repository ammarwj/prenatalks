import { z } from "zod";

import { optionalFileSchema } from "@/lib/validations/file";

import type { AboutSettings, AdminTeamMember } from "@/lib/types";

/** Seksi 1–5 halaman Tentang — PRD §9 F-16. */
export const aboutSettingsSchema = z.object({
  namePhilosophy: z
    .array(
      z.object({
        term: z.string().min(1, "Bagian nama wajib diisi").max(40, "Maksimal 40 karakter"),
        meaning: z.string().min(1, "Makna wajib diisi").max(300, "Maksimal 300 karakter"),
      })
    )
    .length(3, "Filosofi nama harus tepat 3 kartu (pre · natal · talks)"),
  historyIntro: z.string().min(1, "Pengantar sejarah wajib diisi").max(1000, "Maksimal 1000 karakter"),
  milestones: z
    .array(
      z.object({
        year: z.string().min(1, "Tahun wajib diisi").max(20, "Maksimal 20 karakter"),
        title: z.string().min(1, "Judul tonggak wajib diisi").max(120, "Maksimal 120 karakter"),
        description: z.string().max(400, "Maksimal 400 karakter"),
      })
    )
    .max(12, "Maksimal 12 tonggak"),
  commitmentHeading: z.string().min(1, "Judul komitmen wajib diisi").max(120, "Maksimal 120 karakter"),
  commitmentBody: z.string().min(1, "Penjelasan komitmen wajib diisi").max(2000, "Maksimal 2000 karakter"),
  logoPhilosophy: z.string().min(1, "Filosofi logo wajib diisi").max(2000, "Maksimal 2000 karakter"),
  colorPurpleMeaning: z.string().min(1, "Makna warna ungu wajib diisi").max(600, "Maksimal 600 karakter"),
  colorTealMeaning: z.string().min(1, "Makna warna toska wajib diisi").max(600, "Maksimal 600 karakter"),
});

export type AboutSettingsInput = z.infer<typeof aboutSettingsSchema>;

export function toAboutFormValues(settings: AboutSettings): AboutSettingsInput {
  return {
    namePhilosophy: settings.about_name_philosophy ?? [],
    historyIntro: settings.about_history_intro ?? "",
    milestones: (settings.about_milestones ?? []).map((milestone) => ({
      year: milestone.year,
      title: milestone.title,
      description: milestone.description ?? "",
    })),
    commitmentHeading: settings.about_commitment_heading ?? "",
    commitmentBody: settings.about_commitment_body ?? "",
    logoPhilosophy: settings.about_logo_philosophy ?? "",
    colorPurpleMeaning: settings.about_color_purple_meaning ?? "",
    colorTealMeaning: settings.about_color_teal_meaning ?? "",
  };
}

/** Payload persis bentuk aturan `about_*` di `AdminSettingsRequest`. */
export function toAboutPayload(values: AboutSettingsInput) {
  return {
    about_name_philosophy: values.namePhilosophy,
    about_history_intro: values.historyIntro,
    about_milestones: values.milestones.map((milestone) => ({
      year: milestone.year,
      title: milestone.title,
      description: milestone.description.trim() || null,
    })),
    about_commitment_heading: values.commitmentHeading,
    about_commitment_body: values.commitmentBody,
    about_logo_philosophy: values.logoPhilosophy,
    about_color_purple_meaning: values.colorPurpleMeaning,
    about_color_teal_meaning: values.colorTealMeaning,
  };
}

/** Profil tim — PRD §9 F-16 seksi 6. */
export const teamMemberSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(120, "Maksimal 120 karakter"),
  roleTitle: z.string().min(1, "Peran wajib diisi").max(120, "Maksimal 120 karakter"),
  credential: z.string().max(150, "Maksimal 150 karakter"),
  description: z.string().max(1000, "Maksimal 1000 karakter"),
  isPublished: z.boolean(),
  photo: optionalFileSchema({ accept: "image/jpeg,image/png,image/webp", maxSizeKb: 2048 }),
  removePhoto: z.boolean(),
});

export type TeamMemberInput = z.infer<typeof teamMemberSchema>;

export function toTeamMemberFormValues(member?: AdminTeamMember): TeamMemberInput {
  if (!member) {
    return {
      name: "",
      roleTitle: "",
      credential: "",
      description: "",
      isPublished: true,
      removePhoto: false,
    };
  }

  return {
    name: member.name,
    roleTitle: member.role_title,
    credential: member.credential ?? "",
    description: member.description ?? "",
    isPublished: member.is_published,
    removePhoto: false,
  };
}

export function toTeamMemberFormData(values: TeamMemberInput, isUpdate: boolean): FormData {
  const formData = new FormData();

  // Laravel tidak mengurai multipart pada PUT — sama seperti form video (F-09),
  // request dikirim sebagai POST dengan method spoofing.
  if (isUpdate) formData.append("_method", "PUT");

  formData.append("name", values.name);
  formData.append("role_title", values.roleTitle);
  if (values.credential.trim()) formData.append("credential", values.credential.trim());
  if (values.description.trim()) formData.append("description", values.description.trim());
  formData.append("is_published", values.isPublished ? "1" : "0");
  if (values.photo) formData.append("photo", values.photo);
  if (values.removePhoto) formData.append("remove_photo", "1");

  return formData;
}
