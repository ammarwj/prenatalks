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
export type CalculatorResult = {
  gestational_age: {
    weeks: number;
    days: number;
    text: string;
  };
  edd_date: string;
  trimester: 1 | 2 | 3;
  days_remaining: number;
  progress_percent: number;
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
