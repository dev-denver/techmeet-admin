export type DeploymentGrade = "초급" | "중급" | "고급" | "특급";

export interface SmMember {
  id: string;
  seq_id: number;
  site: string;
  name: string;
  part: string;
  detail_work: string;
  grade: DeploymentGrade;
  created_at: string;
  updated_at: string;
}

export interface SmNotice {
  id: string;
  seq_id: number;
  site: string;
  transfer_notice: string;
  notice_date: string;
  main_manager: string;
  created_at: string;
  updated_at: string;
}

export interface SiMember {
  id: string;
  seq_id: number;
  site: string;
  name: string;
  project_name: string;
  detail_work: string;
  grade: DeploymentGrade;
  created_at: string;
  updated_at: string;
}
