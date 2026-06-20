export type DeploymentGrade = "초급" | "중급" | "고급" | "특급";
export type DeploymentProjectType = "SI" | "SM";
export type DeploymentProjectStatus = "active" | "closed";

export interface DeploymentProject {
  id: string;
  seq_id: number;
  name: string;
  type: DeploymentProjectType;
  status: DeploymentProjectStatus;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeploymentProjectMember {
  id: string;
  seq_id: number;
  project_id: string;
  name: string;
  part: string | null;
  detail_work: string | null;
  grade: DeploymentGrade | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeploymentProjectNotice {
  id: string;
  seq_id: number;
  project_id: string;
  transfer_notice: string;
  notice_date: string;
  main_manager: string;
  created_at: string;
  updated_at: string;
}
