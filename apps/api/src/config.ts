import { z } from "zod";

const ConfigSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8787),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  MODEL_API_KEY: z
    .string()
    .min(1, "MODEL_API_KEY is required")
    // Pasted keys often carry a stray space or newline — never fail auth on that.
    .transform((s) => s.trim())
    .pipe(z.string().min(1, "MODEL_API_KEY is required")),
  GROQ_API_KEY: z
    .string()
    .optional()
    .transform((s) => s?.trim() || undefined),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  APP_URL: z.string().url("APP_URL must be a valid URL"),
  STORAGE_ENDPOINT: z.string().min(1, "STORAGE_ENDPOINT is required"),
  STORAGE_BUCKET: z.string().min(1, "STORAGE_BUCKET is required"),
  STORAGE_REGION: z.string().default("us-east-1"),
  STORAGE_ACCESS_KEY: z.string().min(1, "STORAGE_ACCESS_KEY is required"),
  STORAGE_SECRET_KEY: z.string().min(1, "STORAGE_SECRET_KEY is required"),
  STORAGE_FORCE_PATH_STYLE: z
    .string()
    .default("true")
    .transform((v) => v.toLowerCase() !== "false"),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Config = z.infer<typeof ConfigSchema>;

export class ConfigError extends Error {
  constructor(message: string) {
    super(`Invalid configuration: ${message}`);
    this.name = "ConfigError";
  }
}

/** Loads and validates process env. Throws ConfigError naming the problem. */
export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  const parsed = ConfigSchema.safeParse(env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new ConfigError(details);
  }
  return parsed.data;
}
