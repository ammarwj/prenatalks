export type User = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: "user" | "health_worker" | "admin" | "super_admin";
  email_verified_at: string | null;
  avatar_path: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
};

export type PregnancyStatus = "active" | "completed" | "archived";

/** Skema `pregnancies` — PRD §10. */
export type Pregnancy = {
  id: number;
  lmp_date: string;
  edd_date: string | null;
  edd_overridden: boolean;
  gravida: number | null;
  para: number | null;
  abortus: number | null;
  height_cm: number | null;
  weight_prepregnancy_kg: number | null;
  weight_current_kg: number | null;
  blood_type: string | null;
  medical_history: string[] | null;
  facility_name: string | null;
  facility_contact: string | null;
  status: PregnancyStatus;
  created_at: string;
  updated_at: string;
};

/** Respons `POST /calculator` — PRD §11.2 F-04. */
/** Satu penanda di lini masa kehamilan — lihat PregnancyCalculator::milestones(). */
export type PregnancyMilestone = {
  key: "trimester_2" | "viability" | "trimester_3" | "term" | "edd";
  label: string;
  week: number;
  date: string;
  passed: boolean;
};

export type CalculatorResult = {
  gestational_age: {
    weeks: number;
    days: number;
    text: string;
  };
  edd_date: string;
  edd_overridden: boolean;
  trimester: 1 | 2 | 3;
  days_remaining: number;
  /** Selalu 0 sebelum HPL; days_remaining di-clamp ke 0 setelahnya. */
  days_past_due: number;
  progress_percent: number;
  milestones: PregnancyMilestone[];
};

/** PRD §9 F-05 — struktur kuesioner cek risiko sisi pengguna (skor & tanda bahaya disembunyikan). */
export type QuestionType = "single_choice" | "multiple_choice" | "boolean" | "number";

export type QuestionOption = {
  id: number;
  label: string;
};

export type Question = {
  id: number;
  text: string;
  help_text: string | null;
  type: QuestionType;
  is_required: boolean;
  order_index: number;
  group_label: string | null;
  options: QuestionOption[];
};

export type Questionnaire = {
  id: number;
  title: string;
  description: string | null;
  version: number;
  questions: Question[];
};

export type RiskLevel = {
  id: number;
  name: string;
  color_hex: string;
  recommendation: string;
};

export type ContributingFactor = {
  question_text: string;
  group_label: string | null;
  answer_label: string | number | null;
  score: number;
  is_danger_sign: boolean;
};

export type RiskAssessmentStatus = "in_progress" | "completed";

export type RiskAssessment = {
  id: number;
  status: RiskAssessmentStatus;
  total_score: number | null;
  has_danger_sign: boolean | null;
  risk_level: RiskLevel | null;
  contributing_factors: ContributingFactor[];
  questionnaire_version: number;
  completed_at: string | null;
  created_at: string | null;
};

export type RiskAssessmentSummary = {
  id: number;
  total_score: number;
  has_danger_sign: boolean;
  risk_level: RiskLevel | null;
  completed_at: string;
};

/** Sisi admin (super_admin) — skor & ambang terbuka penuh untuk dikonfigurasi. */
export type AdminQuestionOption = {
  id: number;
  label: string;
  score: number;
  is_danger_sign: boolean;
  order_index: number;
};

export type AdminQuestion = {
  id: number;
  text: string;
  help_text: string | null;
  type: QuestionType;
  is_required: boolean;
  order_index: number;
  group_label: string | null;
  options: AdminQuestionOption[];
};

export type AdminRiskLevel = {
  id: number;
  name: string;
  min_score: number;
  max_score: number | null;
  color_hex: string;
  recommendation: string;
  order_index: number;
};

export type AdminQuestionnaire = {
  id: number;
  title: string;
  description: string | null;
  version: number;
  is_active: boolean;
  published_at: string | null;
  has_history?: boolean;
  questions: AdminQuestion[];
  risk_levels: AdminRiskLevel[];
  created_at: string;
  updated_at: string;
};

/** PRD §9 F-06 — Form Builder. Mesin yang sama dipakai survei (F-07) lewat `type = "survey"`. */
export type FormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "radio"
  | "checkbox"
  | "select"
  | "scale"
  | "file";

export type FormStatus = "draft" | "published" | "closed";

export type FormFieldValidation = {
  min?: number;
  max?: number;
  regex?: string;
  max_size_kb?: number;
};

/** Pilihan (radio/checkbox/select) berupa daftar label; skala berupa rentang {min,max}. */
export type FormFieldOptions = string[] | { min: number; max: number };

export type AdminFormField = {
  id: number;
  label: string;
  description: string | null;
  type: FormFieldType;
  placeholder: string | null;
  options: FormFieldOptions | null;
  validation: FormFieldValidation | null;
  is_required: boolean;
  order_index: number;
};

export type AdminForm = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  type: "form" | "survey";
  is_public: boolean;
  requires_login: boolean;
  is_anonymous: boolean;
  one_response_per_user: boolean;
  status: FormStatus;
  opens_at: string | null;
  closes_at: string | null;
  fields: AdminFormField[];
  created_at: string;
  updated_at: string;
};

/** PRD §9 F-07 — sisi publik `/survei/[slug]`, skor/atribut admin disembunyikan (tidak relevan, form tidak berskor). */
export type PublicFormField = {
  id: number;
  label: string;
  description: string | null;
  type: FormFieldType;
  placeholder: string | null;
  options: FormFieldOptions | null;
  validation: FormFieldValidation | null;
  is_required: boolean;
};

export type PublicForm = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  type: "form" | "survey";
  requires_login: boolean;
  is_anonymous: boolean;
  one_response_per_user: boolean;
  is_open: boolean;
  fields: PublicFormField[];
};

export type AdminFormSubmissionAnswer = {
  field_id: number;
  label: string;
  value: string | string[] | null;
};

export type AdminFormSubmission = {
  id: number;
  respondent: { id: number; name: string } | null;
  submitted_at: string;
  answers: AdminFormSubmissionAnswer[];
};

export type FormResponseDistribution = {
  field_id: number;
  label: string;
  counts: Record<string, number>;
};

export type FormResponseSummary = {
  respondent_count: number;
  distribution: FormResponseDistribution[];
};

export type FormExportFormat = "csv" | "xlsx";
export type FormExportStatus = "processing" | "completed" | "failed";

export type AdminFormExport = {
  id: number;
  format: FormExportFormat;
  status: FormExportStatus;
  download_url: string | null;
  expires_at: string | null;
  created_at: string;
};

/** PRD §9 F-08 — Artikel. */
export type LifeStage = "preconception" | "pregnancy" | "birth" | "postpartum" | "parenting";
export type ArticleStatus = "draft" | "published";

export type Category = {
  id: number;
  name: string;
  slug: string;
  type: "article" | "video" | "faq";
};

export type ArticleSummary = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_url: string | null;
  category: { id: number; name: string; slug: string } | null;
  life_stage: LifeStage;
  trimester: number | null;
  reading_minutes: number | null;
  published_at: string | null;
};

export type Article = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_url: string | null;
  category: { id: number; name: string; slug: string } | null;
  life_stage: LifeStage;
  trimester: number | null;
  author: { name: string } | null;
  source_reference: string;
  reviewed_at: string;
  reading_minutes: number | null;
  views_count: number;
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  related: ArticleSummary[];
};

export type AdminArticle = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_url: string | null;
  category: { id: number; name: string } | null;
  category_id: number | null;
  trimester: number | null;
  author: { id: number; name: string } | null;
  life_stage: LifeStage;
  source_reference: string;
  reviewed_at: string;
  status: ArticleStatus;
  is_scheduled: boolean;
  published_at: string | null;
  views_count: number;
  reading_minutes: number | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
};

/** PRD §9 F-09 — Video Edukasi. */
export type VideoSummary = {
  id: number;
  title: string;
  slug: string;
  thumbnail_url: string;
  category: { id: number; name: string } | null;
  duration_seconds: number | null;
  published_at: string | null;
};

export type VideoDetail = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  embed_url: string;
  thumbnail_url: string;
  category: { id: number; name: string; slug: string } | null;
  life_stage: LifeStage;
  duration_seconds: number | null;
  published_at: string | null;
};

export type AdminVideo = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  youtube_id: string;
  embed_url: string;
  thumbnail_url: string;
  category: { id: number; name: string } | null;
  category_id: number | null;
  duration_seconds: number | null;
  life_stage: LifeStage;
  status: ArticleStatus;
  is_scheduled: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

/** PRD §9 F-10 — FAQ. */
export type Faq = {
  id: number;
  question: string;
  answer: string;
  category: { id: number; name: string } | null;
};

export type AdminFaq = {
  id: number;
  question: string;
  answer: string;
  category: { id: number; name: string } | null;
  category_id: number | null;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

/** PRD §9 F-11 — checklist persiapan melahirkan. */
export type ChecklistItemType = "template" | "custom";

export type ChecklistItem = {
  /** Item template: `checklist_items.id`. Item pribadi: id baris progres. */
  id: number;
  type: ChecklistItemType;
  title: string;
  description: string | null;
  is_checked: boolean;
  checked_at: string | null;
};

export type ChecklistProgressSummary = {
  total: number;
  checked: number;
  progress_percent: number;
};

export type ChecklistGroup = ChecklistProgressSummary & {
  name: string;
  is_custom: boolean;
  items: ChecklistItem[];
};

export type ChecklistOverview = {
  groups: ChecklistGroup[];
  summary: ChecklistProgressSummary;
};

export type AdminChecklistItem = {
  id: number;
  group_name: string;
  title: string;
  description: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * PRD §9 F-12 — pengaturan komunitas dari tabel `settings`.
 * Bentuknya peta datar `kunci → nilai`, sama seperti respons
 * `GET /settings` (publik) dan `GET /admin/settings`.
 */
export type CommunitySettings = {
  community_heading: string;
  community_description: string;
  community_rules: string[];
  community_whatsapp_url: string | null;
  community_telegram_url: string | null;
};

/** PRD §9 F-13 — ringkasan dashboard pengguna (`GET /dashboard`). */
/** `GET /dashboard` menyebar hasil CalculatorResult yang sama, plus id & HPHT. */
export type DashboardPregnancy = CalculatorResult & {
  id: number;
  lmp_date: string | null;
};

export type DashboardAssessment = {
  id: number;
  total_score: number;
  has_danger_sign: boolean;
  completed_at: string | null;
  risk_level: RiskLevel | null;
};

export type DashboardPendingForm = {
  id: number;
  title: string;
  slug: string;
  type: "form" | "survey";
  description: string | null;
  closes_at: string | null;
};

export type DashboardOverview = {
  pregnancy: DashboardPregnancy | null;
  latest_assessment: DashboardAssessment | null;
  checklist: ChecklistProgressSummary;
  pending_forms: DashboardPendingForm[];
  recommended_articles: ArticleSummary[];
};

/** PRD §9 F-14 — statistik panel admin (`GET /admin/dashboard`). */
export type AdminStats = {
  users: { total: number; new_this_month: number; active: number; admins: number };
  assessments: { this_month: number; total: number; with_danger_sign: number };
  risk_distribution: { id: number; name: string; color_hex: string; count: number }[];
  content: {
    articles_published: number;
    articles_draft: number;
    videos_published: number;
    faqs_published: number;
  };
  form_responses: { total: number; this_month: number; open_forms: number };
};

export type UserRole = User["role"];

/** PRD §9 F-14 — kelola pengguna (`GET/PUT /admin/users`). */
export type AdminUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  email_verified_at: string | null;
  last_login_at: string | null;
  created_at: string;
};

/** PRD §9 F-14, §10 — audit log (`GET /admin/audit-logs`). */
export type AuditLogEntry = {
  id: number;
  action: string;
  action_label: string;
  model_type: string;
  model_label: string;
  model_id: number | null;
  changes: Record<string, unknown> | null;
  ip: string | null;
  created_at: string;
  user: { id: number; name: string; email: string } | null;
};

export type PaginationMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

/** PRD §9 F-16 — isi halaman Tentang seksi 1–5, dari tabel `settings`. */
export type AboutSettings = {
  about_name_philosophy: { term: string; meaning: string }[];
  about_history_intro: string;
  about_milestones: { year: string; title: string; description: string | null }[];
  about_commitment_heading: string;
  about_commitment_body: string;
  about_logo_philosophy: string;
  about_color_purple_meaning: string;
  about_color_teal_meaning: string;
};

/** Warna merek dikunci di backend (PRD §1.4), dikirim lewat `meta`. */
export type BrandColors = { purple: string; teal: string };

/**
 * Aset identitas situs (PRD §1.4) — diunggah super admin lewat
 * `/admin/brand`. Backend menyusun `url` lengkap dengan `?v=`; nomor versi
 * naik tiap penggantian sehingga cache lama pasti meleset.
 *
 * `null` berarti belum ada unggahan — pemakainya jatuh ke aset statis bawaan.
 */
export type BrandImageAsset = {
  version: number;
  url: string;
  width: number | null;
  height: number | null;
};

export type BrandFaviconAsset = {
  version: number;
  url: string;
  /** PNG 180×180 untuk ikon layar utama iOS. */
  apple_touch_url: string;
};

export type BrandHeroAsset = BrandImageAsset & {
  /** JPEG 1200×630 untuk pratinjau tautan (og:image). */
  og_url: string;
};

export type BrandSettings = {
  brand_logo: BrandImageAsset | null;
  brand_favicon: BrandFaviconAsset | null;
  brand_hero: BrandHeroAsset | null;
};

/** Aset merek yang bisa diganti — sejajar dengan `BrandAssetService::ASSETS`. */
export type BrandAssetName = "logo" | "favicon" | "hero";

/** PRD §9 F-01 — kontak di footer, dari tabel `settings`. */
export type ContactSettings = {
  contact_phone: string | null;
  contact_email: string | null;
  contact_address: string | null;
};

/** PRD §9 F-01 — tautan sosial media di footer. Ikonnya tetap di kode. */
export type SocialSettings = {
  social_instagram_url: string | null;
  social_facebook_url: string | null;
  social_youtube_url: string | null;
  social_tiktok_url: string | null;
};

/**
 * PRD §9 F-01 — hanya label & sakelar tampil. Angkanya dihitung backend dari
 * database dan dibaca lewat `GET /stats`, bukan dari sini.
 */
export type StatsSettings = {
  stats_enabled: boolean;
  stats_label_mothers: string;
  stats_label_contents: string;
  stats_label_assessments: string;
  stats_label_health_workers: string;
};

export type PublicSettings = CommunitySettings &
  AboutSettings &
  BrandSettings &
  ContactSettings &
  SocialSettings &
  StatsSettings;

/**
 * PRD §9 F-01 — angka statistik landing page (`GET /stats`).
 *
 * `value` angka asli, `display` versi yang dibulatkan **ke bawah** untuk
 * ditampilkan ("1.000+" untuk 1.024). Landing page memakai `display`; form
 * pengaturan menampilkan keduanya supaya admin tahu label yang ditulisnya
 * didukung angka berapa.
 */
export type StatKey = "mothers" | "contents" | "assessments" | "health_workers";

export type StatItem = {
  key: StatKey;
  value: number;
  display: string;
  label: string;
};

export type PublicStats = {
  enabled: boolean;
  items: StatItem[];
};

/**
 * PRD §12.3 & Lampiran C — Syarat & Ketentuan dan Kebijakan Privasi.
 *
 * Slug dikunci di backend (`LegalDocument::SLUGS`) karena ditautkan dari
 * footer dan dari checkbox persetujuan di halaman daftar.
 */
export type LegalDocumentSlug = "syarat-ketentuan" | "kebijakan-privasi";

export type LegalDocument = {
  slug: LegalDocumentSlug;
  title: string;
  /** HTML dari TipTap — wajib lewat `sanitizeRichTextHtml()` sebelum dirender. */
  body: string;
  effective_date: string | null;
  updated_at: string;
};

export type AdminLegalDocument = LegalDocument & {
  id: number;
  is_published: boolean;
  updated_by: { id: number; name: string } | null;
  created_at: string;
};

/** PRD §9 F-01 — testimoni di landing page. */
export type Testimonial = {
  id: number;
  name: string;
  pregnancy_age: string;
  quote: string;
  rating: number;
  photo_url: string | null;
};

export type AdminTestimonial = Testimonial & {
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

/** PRD §9 F-16 seksi 6 — profil tim. */
export type TeamMember = {
  id: number;
  name: string;
  role_title: string;
  credential: string | null;
  description: string | null;
  photo_url: string | null;
};

export type AdminTeamMember = TeamMember & {
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * PRD §9 F-15 — izin akses tenaga kesehatan.
 *
 * `access_code` hanya ada di respons pemberian & pembuatan ulang izin;
 * setelah itu backend cuma menyimpan hash-nya, jadi tidak ada bentuk
 * `Consent` yang membawanya.
 */
export type Consent = {
  id: number;
  health_worker: { id: number; name: string | null; email: string | null };
  is_active: boolean;
  expires_at: string | null;
  revoked_at: string | null;
  last_accessed_at: string | null;
  notes_count?: number;
  created_at: string;
};

export type ConsentIssued = {
  consent: Consent;
  access_code: string;
  access_link: string;
};

export type HealthWorkerDirectoryEntry = {
  id: number;
  name: string;
  email: string;
};

export type HealthWorkerNote = {
  id: number;
  body: string;
  risk_assessment_id: number | null;
  health_worker_name: string | null;
  created_at: string;
};

/** Sisi tenaga kesehatan — satu baris di daftar pasien. */
export type HealthWorkerPatient = {
  consent_id: number;
  patient_name: string | null;
  is_active: boolean;
  expires_at: string | null;
  granted_at: string;
  last_accessed_at: string | null;
};

/**
 * Cakupan yang dibuka izin ini, tidak lebih: konteks usia kehamilan, hasil
 * cek risiko, dan catatan edukasi. Lihat HealthWorkerPatientService di
 * backend untuk alasan tiap kolom yang sengaja tidak ada di sini.
 */
export type HealthWorkerPatientDetail = HealthWorkerPatient & {
  pregnancy: {
    gestational_age: { weeks: number; days: number; text: string };
    trimester: 1 | 2 | 3;
    edd_date: string;
    days_remaining: number;
  } | null;
  assessments: RiskAssessmentSummary[];
  notes: HealthWorkerNote[];
};
