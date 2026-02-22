import type { AccountStatus } from "@/lib/constants/status";

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  bio: string | null;
  tech_stack: string[];
  experience_years: number | null;
  portfolio_url: string | null;
  avatar_url: string | null;
  headline: string | null;
  availability_status: string | null;
  kakao_id: string | null;
  account_status: AccountStatus;
  notification_new_project: boolean;
  notification_application_update: boolean;
  notification_marketing: boolean;
  withdrawn_at: string | null;
  referrer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileListItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  tech_stack: string[];
  account_status: AccountStatus;
  created_at: string;
  application_count?: number;
}

export interface ProfileFormValues {
  name: string;
  phone: string | null;
  bio: string | null;
  tech_stack: string[];
  experience_years: number | null;
  portfolio_url: string | null;
  account_status: AccountStatus;
  notification_new_project: boolean;
  notification_application_update: boolean;
  notification_marketing: boolean;
}
