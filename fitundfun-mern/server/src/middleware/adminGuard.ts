import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import type { AuthPayload } from './auth.js'

export function adminGuard(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token
  if (!token) {
    res.status(401).json({ message: 'Nicht autorisiert' })
    return
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload
    req.auth = payload
  } catch {
    res.status(401).json({ message: 'Ungültiges Token' })
    return
  }

  // CSRF-Schutz: Schreibende Methoden muessen JSON oder multipart sein
  const method = req.method.toUpperCase()
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const contentType = req.headers['content-type'] || ''
    const isJsonOrMultipart =
      contentType.includes('application/json') ||
      contentType.includes('multipart/form-data')

    if (!isJsonOrMultipart) {
      res.status(403).json({ message: 'Ungültige Anfrage' })
      return
    }
  }

  next()
}
