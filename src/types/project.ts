import type { ProjectStatus } from "@/lib/constants/status";

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  budget_min: number | null;
  budget_max: number | null;
  start_date: string | null;
  end_date: string | null;
  skills: string[];
  category: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ProjectListItem {
  id: string;
  title: string;
  status: ProjectStatus;
  budget_min: number | null;
  budget_max: number | null;
  start_date: string | null;
  category: string | null;
  created_at: string;
  application_count?: number;
}

export interface ProjectFormValues {
  title: string;
  description: string;
  status: ProjectStatus;
  budget_min: number | null;
  budget_max: number | null;
  start_date: string | null;
  end_date: string | null;
  skills: string[];
  category: string | null;
}
