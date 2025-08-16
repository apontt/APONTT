
import { z } from "zod";
import { config } from "dotenv";

// Carregar variáveis de ambiente do arquivo .env
config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SESSION_SECRET: z.string().default('dev-secret-key'),
  ASAAS_API_KEY: z.string().optional(),
  ADMIN_PASSWORD: z.string().default('apontt2025!'),
});

export const env = envSchema.parse(process.env);
