import type { SendType } from "@/lib/constants/status";

export interface AlimtalkLog {
  id: string;
  seq_id: number;
  user_id: string | null;
  title: string;
  content: string;
  message_id: string | null;
  send_type: SendType;
  scheduled_at: string | null;
  is_success: boolean | null;
  sent_at: string | null;
  error_message: string | null;
  group_status: string | null;
  created_at: string;
  profile?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AlimtalkRecipient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export interface AlimtalkSendValues {
  title: string;
  content: string;
  send_type: SendType;
  scheduled_at?: string | null;
  user_ids: string[];
}
