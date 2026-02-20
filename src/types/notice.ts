import type { NoticeType } from "@/lib/constants/status";

export interface Notice {
  id: string;
  title: string;
  content: string;
  is_published: boolean;
  notice_type: NoticeType;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface NoticeListItem {
  id: string;
  title: string;
  is_published: boolean;
  notice_type: NoticeType;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
}

export interface NoticeFormValues {
  title: string;
  content: string;
  is_published: boolean;
  notice_type: NoticeType;
  start_at: string | null;
  end_at: string | null;
}
