"use client";

import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export interface RefereeItem {
  id: string;
  seq_id: number;
  name: string;
  email: string;
  created_at: string;
  account_status: "active" | "withdrawn";
}

export interface ReferrerGroup {
  referrer: {
    id: string;
    seq_id: number;
    name: string;
    email: string;
    avatar_url: string | null;
    account_status: "active" | "withdrawn";
  };
  referees: RefereeItem[];
}

interface Props {
  groups: ReferrerGroup[];
  emptyMessage?: string;
}

export function ReferrerGroupList({ groups, emptyMessage }: Props) {
  if (groups.length === 0) {
    return (
      <EmptyState title={emptyMessage ?? "추천 관계가 없습니다."} />
    );
  }

  return (
    <Accordion type="multiple" className="space-y-2">
      {groups.map(({ referrer, referees }) => {
        const isWithdrawnReferrer = referrer.account_status === "withdrawn";
        return (
          <AccordionItem
            key={referrer.id}
            value={referrer.id}
            className="border rounded-lg px-4"
          >
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3 flex-1 mr-4">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback
                    className={cn(
                      "text-sm font-semibold",
                      isWithdrawnReferrer && "opacity-50"
                    )}
                  >
                    {referrer.name?.[0] ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start gap-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/users/${referrer.id}`}
                      className={cn(
                        "font-semibold text-sm hover:underline",
                        isWithdrawnReferrer && "text-muted-foreground line-through"
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {referrer.name}
                    </Link>
                    <span className="font-mono text-xs text-muted-foreground">
                      #{referrer.seq_id}
                    </span>
                    {isWithdrawnReferrer && (
                      <Badge variant="outline" className="text-xs text-muted-foreground h-5 px-1.5">
                        탈퇴
                      </Badge>
                    )}
                  </div>
                  <span className={cn(
                    "text-xs text-muted-foreground",
                    isWithdrawnReferrer && "opacity-60"
                  )}>
                    {referrer.email}
                  </span>
                </div>
                <Badge variant="secondary" className="ml-auto shrink-0 mr-2">
                  {referees.length}명 추천
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-14">
                        ID
                      </th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">
                        이름
                      </th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden sm:table-cell">
                        이메일
                      </th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">
                        가입일
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {referees.map((referee, idx) => {
                      const isWithdrawn = referee.account_status === "withdrawn";
                      return (
                        <tr
                          key={referee.id}
                          className={cn(
                            idx < referees.length - 1 ? "border-b" : undefined,
                            isWithdrawn && "opacity-60"
                          )}
                        >
                          <td className="px-3 py-2">
                            <span className="font-mono text-xs text-muted-foreground">
                              #{referee.seq_id}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/users/${referee.id}`}
                                className={cn(
                                  "font-medium hover:underline",
                                  isWithdrawn && "line-through text-muted-foreground"
                                )}
                              >
                                {referee.name}
                              </Link>
                              {isWithdrawn && (
                                <Badge variant="outline" className="text-xs text-muted-foreground h-4 px-1 py-0 leading-none">
                                  탈퇴
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">
                            {referee.email}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground text-xs">
                            {formatDate(referee.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
