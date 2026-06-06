/**
 * 구조적 JSON 로거.
 * - stdout/stderr로 한 줄 JSON을 출력해 Vercel 로그·외부 수집기에서 파싱하기 쉽게 한다.
 * - 컨텍스트의 민감 키(password/token/secret 등)는 자동 마스킹한다.
 * - Sentry 등 외부 추적기 연동 시 emit()에서 함께 전송하면 된다(추후 P1).
 */

type LogLevel = "error" | "warn" | "info";

const SENSITIVE_KEY_PATTERNS = [
  "password",
  "token",
  "secret",
  "authorization",
  "service_role",
  "api_key",
  "apikey",
];

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_KEY_PATTERNS.some((p) => lower.includes(p));
}

function maskContext(
  context?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!context) return undefined;
  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    masked[key] = isSensitiveKey(key) ? "***" : value;
  }
  return masked;
}

function emit(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context ? { context: maskContext(context) } : {}),
  };

  let line: string;
  try {
    line = JSON.stringify(entry);
  } catch {
    // 순환 참조 등 직렬화 불가 시 최소 정보만 기록
    line = JSON.stringify({ level, message, timestamp: entry.timestamp });
  }

  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  error: (message: string, context?: Record<string, unknown>) =>
    emit("error", message, context),
  warn: (message: string, context?: Record<string, unknown>) =>
    emit("warn", message, context),
  info: (message: string, context?: Record<string, unknown>) =>
    emit("info", message, context),
};
