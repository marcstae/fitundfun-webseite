import { Schema, model, type Document, type Types } from 'mongoose'

export interface ILagerDownload extends Document {
  lagerId: Types.ObjectId
  titel: string
  filePath: string
  reihenfolge: number
  createdAt: Date
}

const lagerDownloadSchema = new Schema<ILagerDownload>({
  lagerId: { type: Schema.Types.ObjectId, ref: 'Lager', required: true },
  titel: { type: String, required: true },
  filePath: { type: String, required: true },
  reihenfolge: { type: Number, default: 0 },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } })

lagerDownloadSchema.index({ lagerId: 1 })

export const LagerDownload = model<ILagerDownload>('LagerDownload', lagerDownloadSchema)
