import { z } from "zod";

const envSchema = z.object({
  // CORE
  MONGODB_URI: z.string().min(1, "MONGODB_URI is missing"),
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is missing"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL is not a valid URL").min(1),
  
  // STELLAR (Dynamic Toggle)
  NEXT_PUBLIC_STELLAR_NETWORK: z.enum(["testnet", "public"]).default("testnet"),
  NEXT_PUBLIC_HORIZON_URL: z.string().url().default("https://horizon-testnet.stellar.org"),
  
  // OPTIONAL / FEATURE FLAGS
  ENABLE_ANALYTICS: z.enum(["true", "false"]).default("false"),
  LOG_LEVEL: z.enum(["info", "warn", "error", "debug"]).default("info"),
});

const _env = envSchema.safeParse({
  MONGODB_URI: process.env.MONGODB_URI,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL,
  NEXT_PUBLIC_STELLAR_NETWORK: process.env.NEXT_PUBLIC_STELLAR_NETWORK,
  NEXT_PUBLIC_HORIZON_URL: process.env.NEXT_PUBLIC_HORIZON_URL,
  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS,
  LOG_LEVEL: process.env.LOG_LEVEL,
});

if (!_env.success) {
  const errors = _env.error.flatten().fieldErrors;
  const errorMsg = Object.entries(errors)
    .map(([key, value]) => `${key}: ${value?.join(", ")}`)
    .join("\n");

  console.error("❌ CRITICAL: Invalid environment configuration settled on network:\n", errorMsg);
  
  if (process.env.NODE_ENV === "production" || process.env.STRICT_ENV === "true") {
    throw new Error(`[TRUSTCERT_FATAL] Registry configuration failure:\n${errorMsg}`);
  }
}

export const env = _env.success ? _env.data : ({} as z.infer<typeof envSchema>);
