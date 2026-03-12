import { Schema, model, type Document } from 'mongoose'

export interface ILagerhaus extends Document {
  titel: string | null
  beschreibung: string | null
  bilder: string[]
  createdAt: Date
  updatedAt: Date
}

const lagerhausSchema = new Schema<ILagerhaus>({
  titel: { type: String, default: null },
  beschreibung: { type: String, default: null },
  bilder: { type: [String], default: [] },
}, { timestamps: true })

export const Lagerhaus = model<ILagerhaus>('Lagerhaus', lagerhausSchema)
