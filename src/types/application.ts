import type { ApplicationStatus } from "@/lib/constants/status";

export interface Application {
  id: string;
  project_id: string;
  profile_id: string;
  status: ApplicationStatus;
  cover_letter: string | null;
  expected_budget: number | null;
  available_start_date: string | null;
  admin_memo: string | null;
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    title: string;
  };
  profile?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ApplicationListItem {
  id: string;
  project_id: string;
  profile_id: string;
  status: ApplicationStatus;
  expected_budget: number | null;
  created_at: string;
  project_title?: string;
  profile_name?: string;
  profile_email?: string;
}

export interface ApplicationStatusUpdateValues {
  status: ApplicationStatus;
  admin_memo?: string;
}
