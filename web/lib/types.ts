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
