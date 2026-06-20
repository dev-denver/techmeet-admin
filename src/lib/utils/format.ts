import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// DB는 UTC(timestamptz)로 저장되어 있으므로, 서버 실행 환경의 타임존(예: Vercel=UTC)과
// 무관하게 항상 한국 시간(KST, UTC+9, DST 없음)으로 표시하기 위해 UTC getter로 직접 계산한다.
function toKSTParts(date: Date) {
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  return {
    year: kst.getUTCFullYear(),
    month: kst.getUTCMonth() + 1,
    day: kst.getUTCDate(),
    hour: kst.getUTCHours(),
    minute: kst.getUTCMinutes(),
  };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const { year, month, day } = toKSTParts(new Date(date));
  return `${year}.${pad2(month)}.${pad2(day)}`;
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const { year, month, day, hour, minute } = toKSTParts(new Date(date));
  return `${year}.${pad2(month)}.${pad2(day)} ${pad2(hour)}:${pad2(minute)}`;
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
