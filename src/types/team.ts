import type { TeamRole } from "@/lib/constants/status";

export interface Team {
  id: string;
  name: string;
  description: string;
  created_at: string;
  member_count?: number;
}

export interface ProfileTeam {
  id: string;
  profile_id: string;
  team_id: string;
  role: TeamRole;
  joined_at: string;
  profile?: {
    id: string;
    name: string;
    email: string;
  };
  team?: {
    id: string;
    name: string;
  };
}

export interface TeamFormValues {
  name: string;
  description: string;
}

export interface AddMemberValues {
  profile_id: string;
  role: TeamRole;
}
