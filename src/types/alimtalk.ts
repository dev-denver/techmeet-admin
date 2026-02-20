import type { SendType } from "@/lib/constants/status";

export interface AlimtalkLog {
  id: string;
  user_id: string | null;
  template_code: string;
  template_name: string;
  service_type: "project" | "notice" | "individual";
  message_id: string | null;
  send_type: SendType;
  scheduled_at: string | null;
  is_success: boolean | null;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
  profile?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AlimtalkSendValues {
  template_code: string;
  template_name: string;
  service_type: "project" | "notice" | "individual";
  send_type: SendType;
  scheduled_at?: string | null;
  target: "all" | "individual";
  user_id?: string;
  message_params?: Record<string, string>;
}
