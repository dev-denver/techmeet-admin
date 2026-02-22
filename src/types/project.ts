import type { ProjectStatus } from "@/lib/constants/status";

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  budget_min: number | null;
  budget_max: number | null;
  duration_start_date: string | null;
  duration_end_date: string | null;
  tech_stack: string[];
  category: string | null;
  client_name: string | null;
  project_type: string | null;
  work_type: string | null;
  budget_currency: string | null;
  deadline: string | null;
  headcount: number | null;
  requirements: string[];
  location: string | null;
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
  duration_start_date: string | null;
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
  duration_start_date: string | null;
  duration_end_date: string | null;
  tech_stack: string[];
  category: string | null;
}
