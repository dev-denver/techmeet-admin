function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  supabase: {
    url: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serviceRoleKey: () => requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001",
    env: (process.env.NEXT_PUBLIC_APP_ENV ?? "development") as
      | "development"
      | "production",
  },
  kakao: {
    appKey: process.env.KAKAO_ALIMTALK_APP_KEY ?? "",
    senderKey: process.env.KAKAO_ALIMTALK_SENDER_KEY ?? "",
  },
};
