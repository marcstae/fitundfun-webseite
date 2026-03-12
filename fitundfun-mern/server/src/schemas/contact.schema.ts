import { z } from 'zod'

export const ContactMessageSchema = z.object({
  name: z.string()
    .min(1, 'Name erforderlich')
    .max(100, 'Name zu lang')
    .regex(/^[a-zA-ZäöüÄÖÜß\s\-']+$/, 'Name enthält ungültige Zeichen'),
  email: z.string()
    .email('Ungültige E-Mail-Adresse')
    .max(255, 'E-Mail zu lang'),
  nachricht: z.string()
    .min(10, 'Nachricht muss mindestens 10 Zeichen haben')
    .max(5000, 'Nachricht zu lang (max. 5000 Zeichen)'),
})
