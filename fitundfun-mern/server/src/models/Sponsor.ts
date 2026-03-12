import { Schema, model, type Document } from 'mongoose'

export interface ISponsor extends Document {
  name: string
  logoUrl: string | null
  websiteUrl: string | null
  reihenfolge: number
  createdAt: Date
}

const sponsorSchema = new Schema<ISponsor>({
  name: { type: String, required: true },
  logoUrl: { type: String, default: null },
  websiteUrl: { type: String, default: null },
  reihenfolge: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } })

sponsorSchema.index({ reihenfolge: 1 })

export const Sponsor = model<ISponsor>('Sponsor', sponsorSchema)
