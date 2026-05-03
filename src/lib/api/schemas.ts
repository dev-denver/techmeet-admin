import { z } from "zod";

// ── Users ──
export const userUpdateSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요.").optional(),
  phone: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  tech_stack: z.array(z.string()).optional(),
  experience_years: z.union([z.number().min(0), z.null()]).optional(),
  portfolio_url: z.string().url("올바른 URL을 입력해주세요.").nullable().optional(),
  account_status: z.enum(["active", "withdrawn"]).optional(),
  notification_new_project: z.boolean().optional(),
  notification_application_update: z.boolean().optional(),
  notification_marketing: z.boolean().optional(),
});

export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

// ── Projects ──
export const projectCreateSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요.").max(200, "제목은 200자 이내로 입력해주세요."),
  description: z.string().min(1, "설명을 입력해주세요."),
  status: z.enum(["recruiting", "in_progress", "completed", "cancelled"]),
  duration_start_date: z.string().min(1, "시작일을 입력해주세요."),
  duration_end_date: z.string().min(1, "종료일을 입력해주세요."),
  tech_stack: z.array(z.string()),
  category: z.string().nullable(),
  is_visible: z.boolean().default(true),
}).refine(
  (d) => d.duration_end_date >= d.duration_start_date,
  { message: "종료일은 시작일 이후여야 합니다.", path: ["duration_end_date"] }
);

export const projectUpdateSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요.").max(200, "제목은 200자 이내로 입력해주세요.").optional(),
  description: z.string().min(1, "설명을 입력해주세요.").optional(),
  status: z.enum(["recruiting", "in_progress", "completed", "cancelled"]).optional(),
  duration_start_date: z.string().min(1).optional(),
  duration_end_date: z.string().min(1).optional(),
  tech_stack: z.array(z.string()).optional(),
  category: z.string().nullable().optional(),
  is_visible: z.boolean().optional(),
}).refine(
  (d) => {
    if (d.duration_start_date && d.duration_end_date) {
      return d.duration_end_date >= d.duration_start_date;
    }
    return true;
  },
  { message: "종료일은 시작일 이후여야 합니다.", path: ["duration_end_date"] }
);

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;

// ── Applications ──
export const applicationUpdateSchema = z.object({
  status: z.enum(["pending", "reviewing", "interview", "accepted", "rejected", "withdrawn"]),
});

export type ApplicationUpdateInput = z.infer<typeof applicationUpdateSchema>;

// ── Notices ──
export const noticeCreateSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요.").max(200, "제목은 200자 이내로 입력해주세요."),
  content: z.string().min(1, "내용을 입력해주세요."),
  is_published: z.boolean(),
  is_important: z.boolean(),
  notice_type: z.enum(["immediate", "scheduled"]),
  start_at: z.string().nullable(),
  end_at: z.string().nullable(),
});

export const noticeUpdateSchema = noticeCreateSchema.partial();

export type NoticeCreateInput = z.infer<typeof noticeCreateSchema>;

// ── Admins ──
export const adminCreateSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요."),
  email: z.string().email("올바른 이메일을 입력해주세요."),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
  role: z.enum(["superadmin", "admin"]),
  phone: z.string().nullable().optional(),
});

export type AdminCreateInput = z.infer<typeof adminCreateSchema>;

// ── Alimtalk Templates ──
export const alimtalkTemplateCreateSchema = z.object({
  code:         z.string().min(1).max(100).regex(/^[A-Z0-9_]+$/, "대문자·숫자·언더스코어만 사용 가능합니다."),
  name:         z.string().min(1, "템플릿 이름을 입력해주세요.").max(200),
  body:         z.string().min(1, "본문을 입력해주세요."),
  variables:    z.array(z.string()).default([]),
  service_type: z.enum(["project", "notice", "individual", "all"]),
  is_active:    z.boolean().default(true),
});

export const alimtalkTemplateUpdateSchema = alimtalkTemplateCreateSchema.partial().omit({ code: true });

export type AlimtalkTemplateCreateInput = z.infer<typeof alimtalkTemplateCreateSchema>;
export type AlimtalkTemplateUpdateInput = z.infer<typeof alimtalkTemplateUpdateSchema>;

// ── Alimtalk Send (template_id 기반) ──
export const alimtalkSendSchema = z.object({
  template_id:  z.string().uuid("템플릿을 선택해주세요."),
  service_type: z.enum(["project", "notice", "individual"]),
  send_type:    z.enum(["immediate", "scheduled"]),
  scheduled_at: z.string().nullable().optional(),
  target:       z.enum(["all", "individual"]),
  user_id:      z.string().uuid().optional(),
}).refine(
  (d) => d.target !== "individual" || d.user_id,
  { message: "개별 발송 시 사용자를 선택해주세요.", path: ["user_id"] }
).refine(
  (d) => d.send_type !== "scheduled" || d.scheduled_at,
  { message: "예약 발송 시 발송 시간을 입력해주세요.", path: ["scheduled_at"] }
);

export type AlimtalkSendInput = z.infer<typeof alimtalkSendSchema>;

// ── Bulk Actions ──
export const bulkStatusSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "항목을 선택해주세요."),
  status: z.string().min(1, "상태를 선택해주세요."),
});

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "항목을 선택해주세요."),
});

export const bulkVisibilitySchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "항목을 선택해주세요."),
  is_visible: z.boolean(),
});

export const bulkRestoreSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "항목을 선택해주세요."),
});

export type BulkStatusInput = z.infer<typeof bulkStatusSchema>;
export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>;
export type BulkVisibilityInput = z.infer<typeof bulkVisibilitySchema>;
export type BulkRestoreInput = z.infer<typeof bulkRestoreSchema>;
