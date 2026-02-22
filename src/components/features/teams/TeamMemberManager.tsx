"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { TEAM_ROLE } from "@/lib/constants/status";
import { formatDate } from "@/lib/utils/format";
import { Plus, Trash2 } from "lucide-react";
import type { ProfileTeam } from "@/types";

interface TeamMemberManagerProps {
  teamId: string;
  teamName: string;
  members: ProfileTeam[];
}

export function TeamMemberManager({ teamId, teamName, members }: TeamMemberManagerProps) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProfileTeam | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [profileId, setProfileId] = useState("");
  const [role, setRole] = useState<"leader" | "member">("member");
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  async function handleAddMember() {
    if (!profileId.trim()) {
      setError("사용자 ID를 입력해주세요.");
      return;
    }
    setError(null);
    setAdding(true);

    const res = await fetch(`/api/teams/${teamId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_id: profileId, role }),
    });

    setAdding(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.message ?? "멤버 추가에 실패했습니다.");
      return;
    }

    setAddOpen(false);
    setProfileId("");
    setRole("member");
    router.refresh();
  }

  async function handleDeleteMember() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/teams/${teamId}/members?memberId=${deleteTarget.id}`, {
      method: "DELETE",
    });
    setDeleting(false);
    if (res.ok) {
      setDeleteTarget(null);
      router.refresh();
    }
  }

  async function handleRoleChange(member: ProfileTeam, newRole: string) {
    await fetch(`/api/teams/${teamId}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: member.id, role: newRole }),
    });
    router.refresh();
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{teamName} - 멤버 ({members.length}명)</h2>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                멤버 추가
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>멤버 추가</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">사용자 ID</label>
                  <Input
                    placeholder="프로필 UUID"
                    value={profileId}
                    onChange={(e) => setProfileId(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">역할</label>
                  <Select value={role} onValueChange={(v) => setRole(v as "leader" | "member")}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">멤버</SelectItem>
                      <SelectItem value="leader">리더</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex gap-3">
                  <Button onClick={handleAddMember} disabled={adding}>
                    {adding ? "추가 중..." : "추가"}
                  </Button>
                  <Button variant="outline" onClick={() => setAddOpen(false)}>
                    취소
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>역할</TableHead>
                <TableHead>가입일</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <EmptyState title="멤버가 없습니다." description="멤버를 추가해보세요." />
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => {
                  const profile = Array.isArray(member.profile) ? member.profile[0] : member.profile;
                  const roleConfig = TEAM_ROLE[member.role];
                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{profile?.name ?? "-"}</TableCell>
                      <TableCell>{profile?.email ?? "-"}</TableCell>
                      <TableCell>
                        <Select
                          defaultValue={member.role}
                          onValueChange={(v) => handleRoleChange(member, v)}
                        >
                          <SelectTrigger className="w-[100px] h-8">
                            <Badge variant={roleConfig?.color as "default" | "secondary"}>
                              {roleConfig?.label ?? member.role}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="leader">리더</SelectItem>
                            <SelectItem value="member">멤버</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{formatDate(member.joined_at)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(member)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="멤버 제거"
        description="이 멤버를 팀에서 제거하시겠습니까?"
        confirmLabel="제거"
        variant="destructive"
        onConfirm={handleDeleteMember}
        loading={deleting}
      />
    </>
  );
}
