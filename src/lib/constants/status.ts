export const PROJECT_STATUS = {
  draft: { label: "임시저장", color: "secondary" },
  open: { label: "모집중", color: "default" },
  in_review: { label: "검토중", color: "outline" },
  in_progress: { label: "진행중", color: "default" },
  completed: { label: "완료", color: "secondary" },
  cancelled: { label: "취소", color: "destructive" },
} as const;

export type ProjectStatus = keyof typeof PROJECT_STATUS;

export const APPLICATION_STATUS = {
  pending: { label: "대기중", color: "outline" },
  reviewed: { label: "검토됨", color: "secondary" },
  accepted: { label: "수락됨", color: "default" },
  rejected: { label: "거절됨", color: "destructive" },
  withdrawn: { label: "취소됨", color: "secondary" },
} as const;

export type ApplicationStatus = keyof typeof APPLICATION_STATUS;

export const ACCOUNT_STATUS = {
  active: { label: "활성", color: "default" },
  withdrawn: { label: "탈퇴", color: "destructive" },
} as const;

export type AccountStatus = keyof typeof ACCOUNT_STATUS;

export const NOTICE_TYPE = {
  immediate: { label: "즉시", color: "default" },
  scheduled: { label: "예약", color: "outline" },
} as const;

export type NoticeType = keyof typeof NOTICE_TYPE;

export const SEND_TYPE = {
  immediate: { label: "즉시", color: "default" },
  scheduled: { label: "예약", color: "outline" },
} as const;

export type SendType = keyof typeof SEND_TYPE;

export const TEAM_ROLE = {
  leader: { label: "리더", color: "default" },
  member: { label: "멤버", color: "secondary" },
} as const;

export type TeamRole = keyof typeof TEAM_ROLE;

export const ADMIN_ROLE = {
  superadmin: { label: "슈퍼관리자", color: "default" },
  admin: { label: "관리자", color: "secondary" },
} as const;

export type AdminRole = keyof typeof ADMIN_ROLE;
