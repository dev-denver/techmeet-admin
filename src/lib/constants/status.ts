export const PROJECT_STATUS = {
  recruiting: { label: "모집중", color: "default" },
  completed: { label: "완료", color: "secondary" },
  cancelled: { label: "취소", color: "destructive" },
} as const;

export type ProjectStatus = keyof typeof PROJECT_STATUS;

export const APPLICATION_STATUS = {
  pending: { label: "대기중", color: "outline" },
  reviewing: { label: "검토중", color: "secondary" },
  interview: { label: "면접중", color: "outline" },
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

export const ADMIN_ROLE = {
  superadmin: { label: "슈퍼관리자", color: "default" },
  admin: { label: "관리자", color: "secondary" },
} as const;

export type AdminRole = keyof typeof ADMIN_ROLE;

export const DEPLOYMENT_GRADE = {
  "초급": { label: "초급", color: "outline" },
  "중급": { label: "중급", color: "secondary" },
  "고급": { label: "고급", color: "default" },
  "특급": { label: "특급", color: "destructive" },
} as const;

export type DeploymentGradeKey = keyof typeof DEPLOYMENT_GRADE;
