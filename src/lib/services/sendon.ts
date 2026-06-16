import { Sendon, SmsMessageType } from "@alipeople/sendon-sdk-typescript";
import { env } from "@/lib/config/env";

export type SmsSendResult = {
  success: boolean;
  groupId?: string;
  reservationId?: string;
  error?: string;
};

function createClient() {
  return new Sendon({ id: env.sendon.id, apikey: env.sendon.apiKey });
}

export async function sendSms(
  to: string,
  message: string,
  scheduledAt?: string | null
): Promise<SmsSendResult> {
  const client = createClient();
  const res = await client.sms.send({
    type: SmsMessageType.LMS,
    from: env.sendon.from,
    to: [to],
    message,
    ...(scheduledAt ? { reservation: { datetime: scheduledAt } } : {}),
  });
  const success = res.code === 200;
  return {
    success,
    groupId: res.data?.groupId,
    reservationId: res.data?.reservationId,
    error: success ? undefined : res.message,
  };
}
