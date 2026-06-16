"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SmMembersSection } from "./SmMembersSection";
import { SmNoticesSection } from "./SmNoticesSection";
import { SiMembersSection } from "./SiMembersSection";
import type { SmMember, SmNotice, SiMember } from "@/types/deployment";

interface DeploymentTabsProps {
  smMembers: SmMember[];
  smNotices: SmNotice[];
  siMembers: SiMember[];
}

export function DeploymentTabs({ smMembers, smNotices, siMembers }: DeploymentTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "sm";
  const subtab = searchParams.get("subtab") ?? "members";

  function setTab(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    if (value === "sm") {
      params.set("subtab", "members");
    } else {
      params.delete("subtab");
    }
    router.push(`?${params.toString()}`);
  }

  function setSubtab(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("subtab", value);
    router.push(`?${params.toString()}`);
  }

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="mb-6">
        <TabsTrigger value="sm">SM</TabsTrigger>
        <TabsTrigger value="si">SI</TabsTrigger>
      </TabsList>

      <TabsContent value="sm">
        <Tabs value={subtab} onValueChange={setSubtab}>
          <TabsList className="mb-4">
            <TabsTrigger value="members">기본정보</TabsTrigger>
            <TabsTrigger value="notices">주요 이관 및 공지사항</TabsTrigger>
          </TabsList>
          <TabsContent value="members">
            <SmMembersSection members={smMembers} />
          </TabsContent>
          <TabsContent value="notices">
            <SmNoticesSection notices={smNotices} />
          </TabsContent>
        </Tabs>
      </TabsContent>

      <TabsContent value="si">
        <SiMembersSection members={siMembers} />
      </TabsContent>
    </Tabs>
  );
}
