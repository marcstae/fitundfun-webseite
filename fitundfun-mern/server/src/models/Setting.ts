import { Schema, model, type Document } from 'mongoose'

export interface ISetting extends Document {
  siteTitle: string | null
  contactEmail: string | null
  heroImageUrl: string | null
  createdAt: Date
  updatedAt: Date
}

const settingSchema = new Schema<ISetting>({
  siteTitle: { type: String, default: null },
  contactEmail: { type: String, default: null },
  heroImageUrl: { type: String, default: null },
}, { timestamps: true })

export const Setting = model<ISetting>('Setting', settingSchema)
