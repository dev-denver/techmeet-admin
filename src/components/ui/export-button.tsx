"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ExportButtonProps {
  type: string;
}

export function ExportButton({ type }: ExportButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.open(`/api/export?type=${type}`, "_blank")}
    >
      <Download className="h-4 w-4 mr-2" />
      CSV 내보내기
    </Button>
  );
}
