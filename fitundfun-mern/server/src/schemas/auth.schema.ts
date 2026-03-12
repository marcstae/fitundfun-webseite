import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string()
    .email('Ungültige E-Mail-Adresse')
    .max(255, 'E-Mail zu lang'),
  password: z.string()
    .min(1, 'Passwort erforderlich')
    .max(128, 'Passwort zu lang'),
})
