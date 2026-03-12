import mongoose from 'mongoose'
import { env } from './env.js'

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI)
    console.log('MongoDB verbunden')
  } catch (error) {
    console.error('MongoDB Verbindungsfehler:', error)
    process.exit(1)
  }

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB Fehler:', err)
  })

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB getrennt')
  })
}
