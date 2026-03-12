import { z } from 'zod'

const envSchema = z.object({
  PORT: z.string().default('4000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI ist erforderlich'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET muss mindestens 32 Zeichen haben'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
})

function loadEnv() {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.error('Ungueltige Umgebungsvariablen:', result.error.format())
    process.exit(1)
  }
  return result.data
}

export const env = loadEnv()
