import { Schema, model, type Document } from 'mongoose'

export interface IAdminUser extends Document {
  email: string
  passwordHash: string
  createdAt: Date
}

const adminUserSchema = new Schema<IAdminUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } })

adminUserSchema.index({ email: 1 }, { unique: true })

export const AdminUser = model<IAdminUser>('AdminUser', adminUserSchema)
