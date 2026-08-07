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
