import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export interface AuthPayload {
  userId: string
  email: string
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload
    }
  }
}

export function verifyAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token
  if (!token) {
    res.status(401).json({ message: 'Nicht autorisiert' })
    return
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload
    req.auth = payload
    next()
  } catch {
    res.status(401).json({ message: 'Ungültiges Token' })
  }
}
