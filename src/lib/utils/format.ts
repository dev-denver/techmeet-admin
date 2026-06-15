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

export function formatRate(amount: number | null | undefined): string {
  if (amount == null) return "-";
  return `${new Intl.NumberFormat("ko-KR").format(amount)}만원`;
}

export function formatCount(count: number): string {
  return new Intl.NumberFormat("ko-KR").format(count);
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "-";
  const d = phone.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}
