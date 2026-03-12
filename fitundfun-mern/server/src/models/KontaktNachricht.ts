import { Schema, model, type Document } from 'mongoose'

export interface IKontaktNachricht extends Document {
  name: string
  email: string
  nachricht: string
  gelesen: boolean
  erstelltAm: Date
}

const kontaktNachrichtSchema = new Schema<IKontaktNachricht>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  nachricht: { type: String, required: true },
  gelesen: { type: Boolean, default: false },
  erstelltAm: { type: Date, default: Date.now },
})

kontaktNachrichtSchema.index({ gelesen: 1 })
kontaktNachrichtSchema.index({ erstelltAm: -1 })

export const KontaktNachricht = model<IKontaktNachricht>('KontaktNachricht', kontaktNachrichtSchema)
