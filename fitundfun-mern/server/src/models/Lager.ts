import { Schema, model, type Document } from 'mongoose'

export interface ILager extends Document {
  jahr: number
  titel: string | null
  datumVon: Date
  datumBis: Date
  beschreibung: string | null
  preis: string | null
  immichAlbumUrl: string | null
  istAktuell: boolean
  createdAt: Date
  updatedAt: Date
}

const lagerSchema = new Schema<ILager>({
  jahr: { type: Number, required: true },
  titel: { type: String, default: null },
  datumVon: { type: Date, required: true },
  datumBis: { type: Date, required: true },
  beschreibung: { type: String, default: null },
  preis: { type: String, default: null },
  immichAlbumUrl: { type: String, default: null },
  istAktuell: { type: Boolean, default: false },
}, { timestamps: true })

lagerSchema.index({ jahr: 1 })
lagerSchema.index({ istAktuell: 1 })

lagerSchema.virtual('downloads', {
  ref: 'LagerDownload',
  localField: '_id',
  foreignField: 'lagerId',
  options: { sort: { reihenfolge: 1 } },
})

lagerSchema.set('toJSON', { virtuals: true })
lagerSchema.set('toObject', { virtuals: true })

export const Lager = model<ILager>('Lager', lagerSchema)
