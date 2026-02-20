import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  return format(new Date(date), "yyyy.MM.dd", { locale: ko });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "-";
  return format(new Date(date), "yyyy.MM.dd HH:mm", { locale: ko });
}

export function formatRelativeTime(
  date: string | Date | null | undefined
): string {
  if (!date) return "-";
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko });
}

export function formatBudget(amount: number | null | undefined): string {
  if (amount == null) return "-";
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCount(count: number): string {
  return new Intl.NumberFormat("ko-KR").format(count);
}
