import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { sanitizeFilename } from '../utils/sanitize.js'

const UPLOAD_DIR = path.resolve('uploads')

const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(UPLOAD_DIR, 'images')
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (_req, file, cb) => {
    const sanitized = sanitizeFilename(file.originalname)
    cb(null, `${Date.now()}-${sanitized}`)
  },
})

const pdfStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(UPLOAD_DIR, 'pdfs')
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (_req, file, cb) => {
    const sanitized = sanitizeFilename(file.originalname)
    cb(null, `${Date.now()}-${sanitized}`)
  },
})

export const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    cb(null, allowed.includes(file.mimetype))
  },
})

export const uploadPdf = multer({
  storage: pdfStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype === 'application/pdf')
  },
})
