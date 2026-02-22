"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface PageErrorProps {
  title?: string;
  message?: string;
  retry?: () => void;
}

export function PageError({
  title = "오류가 발생했습니다",
  message = "데이터를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
  retry,
}: PageErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">{message}</p>
      {retry && (
        <Button variant="outline" className="mt-4" onClick={retry}>
          다시 시도
        </Button>
      )}
    </div>
  );
}
