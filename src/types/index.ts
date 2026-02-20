export type * from "./project";
export type * from "./user";
export type * from "./application";
export type * from "./notice";
export type * from "./alimtalk";
export type * from "./team";

export interface AdminUser {
  id: string;
  auth_user_id: string;
  name: string;
  email: string;
  role: "superadmin" | "admin";
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  message: string;
  code?: string;
}
