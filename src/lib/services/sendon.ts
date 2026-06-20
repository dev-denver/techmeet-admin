import { Sendon, SmsMessageType } from "@alipeople/sendon-sdk-typescript";
import { env } from "@/lib/config/env";

export type SmsSendResult = {
  success: boolean;
  groupId?: string;
  reservationId?: string;
  error?: string;
};

export type SmsGroupStatus = "NONE" | "RESERVED" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELED";

export type SmsFindResult = {
  found: boolean;
  groupStatus?: SmsGroupStatus;
  succeededCount?: number;
  failedCount?: number;
  canceledCount?: number;
  blockedCount?: number;
};

function createClient() {
  return new Sendon({ id: env.sendon.id, apikey: env.sendon.apiKey });
}

export async function sendSms(
  to: string,
  message: string,
  scheduledAt?: string | null,
  title?: string
): Promise<SmsSendResult> {
  const client = createClient();
  try {
    const res = await client.sms.send({
      type: SmsMessageType.LMS,
      from: env.sendon.from,
      to: [to],
      message,
      ...(title ? { title } : {}),
      ...(scheduledAt ? { reservation: { datetime: scheduledAt } } : {}),
    });
    const success = res.code === 200;
    return {
      success,
      groupId: res.data?.groupId,
      reservationId: res.data?.reservationId,
      error: success ? undefined : res.message,
    };
  } catch (e) {
    // axios가 비-2xx 응답에 예외를 던지므로, 실제 Sendon API가 반환한 본문(response.data)을
    // 우선적으로 노출해야 거절 사유(발신번호 미등록/인증 실패 등)를 알 수 있다.
    const responseData = (e as { response?: { data?: unknown } })?.response?.data;
    const error = responseData
      ? JSON.stringify(responseData)
      : e instanceof Error
        ? e.message
        : "발송 중 오류 발생";
    return { success: false, error };
  }
}

const TERMINAL_GROUP_STATUSES: SmsGroupStatus[] = ["COMPLETED", "FAILED", "CANCELED"];

export function isTerminalGroupStatus(status?: SmsGroupStatus): boolean {
  return !!status && TERMINAL_GROUP_STATUSES.includes(status);
}

export function computeIsSuccess(result: SmsFindResult): boolean {
  if (result.groupStatus === "COMPLETED") {
    return (result.succeededCount ?? 0) > 0 && (result.failedCount ?? 0) === 0;
  }
  return false;
}

export async function findSms(groupId: string): Promise<SmsFindResult> {
  const client = createClient();
  const res = await client.sms.find(groupId);
  if (res.code !== 200 || !res.data) {
    return { found: false };
  }
  return {
    found: true,
    groupStatus: res.data.groupStatus as SmsGroupStatus | undefined,
    succeededCount: res.data.succeededCount,
    failedCount: res.data.failedCount,
    canceledCount: res.data.canceledCount,
    blockedCount: res.data.blockedCount,
  };
}
