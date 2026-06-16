import type { AccountStatus } from "@/lib/constants/status";

export interface Profile {
  id: string;
  seq_id: number;
  name: string;
  email: string;
  phone: string | null;
  bio: string | null;
  tech_stack: string[];
  avatar_url: string | null;
  headline: string | null;
  availability_status: string | null;
  available_from_date: string | null;
  kakao_id: string | null;
  birth_date: string | null;
  gender: string | null;
  address: string | null;
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
  seq_id: number;
  name: string;
  email: string;
  phone: string | null;
  tech_stack: string[];
  account_status: AccountStatus;
  created_at: string;
  application_count?: number;
  project_count?: string | null;
  admin_memo?: string | null;
}

export interface UserAdminMemo {
  id: string;
  user_id: string;
  memo: string;
  updated_at: string;
  updated_by_id: string | null;
  updated_by_name: string | null;
}

export interface ProfileResume {
  id: string;
  profile_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface ProfileFormValues {
  name: string;
  phone: string | null;
  bio: string | null;
  tech_stack: string[];
  account_status: AccountStatus;
  notification_new_project: boolean;
  notification_application_update: boolean;
  notification_marketing: boolean;
}
