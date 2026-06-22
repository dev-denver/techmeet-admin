import { z } from "zod";

// ── Users ──
export const userUpdateSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요.").optional(),
  phone: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  tech_stack: z.array(z.string()).optional(),
  account_status: z.enum(["active", "withdrawn"]).optional(),
  notification_new_project: z.boolean().optional(),
  notification_application_update: z.boolean().optional(),
  notification_marketing: z.boolean().optional(),
  contract_type: z.enum(["business", "individual"]).nullable().optional(),
  business_name: z.string().nullable().optional(),
  business_number: z.string().nullable().optional(),
  business_address: z.string().nullable().optional(),
  bank_name: z.string().nullable().optional(),
  bank_account_number: z.string().nullable().optional(),
  referrer_note: z.string().nullable().optional(),
});

export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

export const userCreateSchema = z.object({
  email: z.string().email("올바른 이메일을 입력해주세요."),
  name: z.string().min(1, "이름을 입력해주세요.").max(50, "이름은 50자 이내로 입력해주세요."),
  phone: z.string()
    .regex(/^01[0-9]-\d{4}-\d{4}$/, "올바른 전화번호 형식이 아닙니다.")
    .nullable()
    .optional(),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;

export const userMemoUpdateSchema = z.object({
  memo: z.string().max(2000, "메모는 2000자 이내로 입력해주세요."),
});

export type UserMemoUpdateInput = z.infer<typeof userMemoUpdateSchema>;

// ── Projects ──
export const projectCreateSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요.").max(200, "제목은 200자 이내로 입력해주세요."),
  description: z.string().min(1, "설명을 입력해주세요."),
  status: z.enum(["recruiting", "completed", "cancelled"]),
  duration_start_date: z.string().min(1, "시작일을 입력해주세요."),
  duration_end_date: z.string().min(1, "종료일을 입력해주세요."),
  tech_stack: z.array(z.string()),
  category: z.string().nullable(),
  business_type: z.enum(["sm", "si"]).nullable(),
  is_visible: z.boolean().default(true),
}).refine(
  (d) => d.duration_end_date >= d.duration_start_date,
  { message: "종료일은 시작일 이후여야 합니다.", path: ["duration_end_date"] }
);

export const projectUpdateSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요.").max(200, "제목은 200자 이내로 입력해주세요.").optional(),
  description: z.string().min(1, "설명을 입력해주세요.").optional(),
  status: z.enum(["recruiting", "completed", "cancelled"]).optional(),
  duration_start_date: z.string().min(1).optional(),
  duration_end_date: z.string().min(1).optional(),
  tech_stack: z.array(z.string()).optional(),
  category: z.string().nullable().optional(),
  business_type: z.enum(["sm", "si"]).nullable().optional(),
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
const noticeAttachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.number(),
  type: z.string(),
  url: z.string(),
  path: z.string(),
  uploaded_at: z.string(),
});

export const noticeCreateSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요.").max(200, "제목은 200자 이내로 입력해주세요."),
  content: z.string().min(1, "내용을 입력해주세요."),
  is_published: z.boolean(),
  is_important: z.boolean(),
  notice_type: z.enum(["immediate", "scheduled"]),
  start_at: z.string().nullable(),
  end_at: z.string().nullable(),
  attachments: z.array(noticeAttachmentSchema).default([]),
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

// ── Alimtalk Send ──
export const alimtalkSendSchema = z.object({
  title:        z.string().min(1, "제목을 입력해주세요.").max(100, "제목은 최대 100자입니다."),
  content:      z.string().min(1, "내용을 입력해주세요.").max(2000, "내용은 최대 2000자입니다."),
  send_type:    z.enum(["immediate", "scheduled"]),
  scheduled_at: z.string().nullable().optional(),
  user_ids:     z.array(z.string().uuid()).min(1, "발송 대상자를 1명 이상 선택해주세요."),
}).refine(
  (d) => d.send_type !== "scheduled" || d.scheduled_at,
  { message: "예약 발송 시 발송 시간을 입력해주세요.", path: ["scheduled_at"] }
);

export type AlimtalkSendInput = z.infer<typeof alimtalkSendSchema>;

// ── Deployment Projects ──
export const deploymentProjectCreateSchema = z.object({
  name:   z.string().min(1, "프로젝트명을 입력해주세요."),
  type:   z.enum(["SI", "SM"]),
  status: z.enum(["active", "closed"]),
});
export const deploymentProjectUpdateSchema = deploymentProjectCreateSchema.partial();
export type DeploymentProjectCreateInput = z.infer<typeof deploymentProjectCreateSchema>;
export type DeploymentProjectUpdateInput = z.infer<typeof deploymentProjectUpdateSchema>;

export const deploymentProjectMemberCreateSchema = z.object({
  project_id:  z.string().uuid(),
  name:        z.string().min(1, "이름을 입력해주세요."),
  part:        z.string().optional().nullable(),
  detail_work: z.string().optional().nullable(),
  grade:       z.enum(["초급", "중급", "고급", "특급"]).optional().nullable(),
  memo:        z.string().optional().nullable(),
});
export const deploymentProjectMemberUpdateSchema = deploymentProjectMemberCreateSchema
  .omit({ project_id: true })
  .partial();
export type DeploymentProjectMemberCreateInput = z.infer<typeof deploymentProjectMemberCreateSchema>;
export type DeploymentProjectMemberUpdateInput = z.infer<typeof deploymentProjectMemberUpdateSchema>;

export const deploymentProjectNoticeCreateSchema = z.object({
  project_id:      z.string().uuid(),
  transfer_notice: z.string().min(1, "주요이관사항을 입력해주세요."),
  notice_date:     z.string().min(1, "날짜를 입력해주세요."),
  main_manager:    z.string().min(1, "주 담당자를 입력해주세요."),
});
export const deploymentProjectNoticeUpdateSchema = deploymentProjectNoticeCreateSchema
  .omit({ project_id: true })
  .partial();
export type DeploymentProjectNoticeCreateInput = z.infer<typeof deploymentProjectNoticeCreateSchema>;
export type DeploymentProjectNoticeUpdateInput = z.infer<typeof deploymentProjectNoticeUpdateSchema>;

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
