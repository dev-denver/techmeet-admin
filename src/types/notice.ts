import type { NoticeType } from "@/lib/constants/status";

export interface Notice {
  id: string;
  seq_id: number;
  title: string;
  content: string;
  is_published: boolean;
  is_important: boolean;
  notice_type: NoticeType;
  start_at: string | null;
  end_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoticeListItem {
  id: string;
  seq_id: number;
  title: string;
  is_published: boolean;
  is_important: boolean;
  notice_type: NoticeType;
  start_at: string | null;
  end_at: string | null;
  deleted_at: string | null;
  created_at: string;
}

export interface NoticeFormValues {
  title: string;
  content: string;
  is_published: boolean;
  is_important: boolean;
  notice_type: NoticeType;
  start_at: string | null;
  end_at: string | null;
}
