function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  supabase: {
    get url() {
      return getEnv("NEXT_PUBLIC_SUPABASE_URL");
    },
    get anonKey() {
      return getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    },
    get serviceRoleKey() {
      return getEnv("SUPABASE_SERVICE_ROLE_KEY");
    },
  },
  app: {
    get url() {
      return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
    },
    get env() {
      return (process.env.NEXT_PUBLIC_APP_ENV ?? "development") as
        | "development"
        | "production";
    },
  },
  kakao: {
    get appKey() {
      return process.env.KAKAO_ALIMTALK_APP_KEY ?? "";
    },
    get senderKey() {
      return process.env.KAKAO_ALIMTALK_SENDER_KEY ?? "";
    },
  },
};
