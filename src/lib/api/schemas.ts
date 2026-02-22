import { z } from "zod";

// ── Users ──
export const userUpdateSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요.").optional(),
  phone: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  skills: z.array(z.string()).optional(),
  career_years: z.union([z.number().min(0), z.null()]).optional(),
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
  status: z.enum(["draft", "open", "in_review", "in_progress", "completed", "cancelled"]),
  budget_min: z.union([z.number().min(0), z.null()]),
  budget_max: z.union([z.number().min(0), z.null()]),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  skills: z.array(z.string()),
  category: z.string().nullable(),
});

export const projectUpdateSchema = projectCreateSchema.partial();

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;

// ── Applications ──
export const applicationUpdateSchema = z.object({
  status: z.enum(["pending", "reviewed", "accepted", "rejected", "withdrawn"]),
  admin_memo: z.string().nullable().optional(),
});

export type ApplicationUpdateInput = z.infer<typeof applicationUpdateSchema>;

// ── Notices ──
export const noticeCreateSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요.").max(200, "제목은 200자 이내로 입력해주세요."),
  content: z.string().min(1, "내용을 입력해주세요."),
  is_published: z.boolean(),
  notice_type: z.enum(["immediate", "scheduled"]),
  start_at: z.string().nullable(),
  end_at: z.string().nullable(),
});

export const noticeUpdateSchema = noticeCreateSchema.partial();

export type NoticeCreateInput = z.infer<typeof noticeCreateSchema>;

// ── Teams ──
export const teamCreateSchema = z.object({
  name: z.string().min(1, "팀 이름을 입력해주세요.").max(100, "팀 이름은 100자 이내로 입력해주세요."),
  description: z.string().optional().default(""),
});

export const teamUpdateSchema = teamCreateSchema.partial();

export type TeamCreateInput = z.infer<typeof teamCreateSchema>;

// ── Team Members ──
export const teamMemberAddSchema = z.object({
  profile_id: z.string().uuid("올바른 사용자 ID를 입력해주세요."),
  role: z.enum(["leader", "member"]),
});

export const teamMemberUpdateSchema = z.object({
  role: z.enum(["leader", "member"]),
});

export type TeamMemberAddInput = z.infer<typeof teamMemberAddSchema>;

// ── Admins ──
export const adminCreateSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요."),
  email: z.string().email("올바른 이메일을 입력해주세요."),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
  role: z.enum(["superadmin", "admin"]),
});

export type AdminCreateInput = z.infer<typeof adminCreateSchema>;

// ── Alimtalk ──
export const alimtalkSendSchema = z.object({
  template_code: z.string().min(1, "템플릿 코드를 입력해주세요."),
  template_name: z.string().min(1, "템플릿 이름을 입력해주세요."),
  service_type: z.enum(["project", "notice", "individual"]),
  send_type: z.enum(["immediate", "scheduled"]),
  scheduled_at: z.string().nullable().optional(),
  target: z.enum(["all", "individual"]),
  user_id: z.string().uuid().optional(),
}).refine(
  (data) => data.target !== "individual" || data.user_id,
  { message: "개별 발송 시 사용자를 선택해주세요.", path: ["user_id"] }
).refine(
  (data) => data.send_type !== "scheduled" || data.scheduled_at,
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

export type BulkStatusInput = z.infer<typeof bulkStatusSchema>;
export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>;
