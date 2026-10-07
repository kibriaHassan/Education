import { Readable } from 'node:stream'
import mongoose from 'mongoose'

export function pdfBucket() {
  const db = mongoose.connection.db
  if (!db) throw new Error('MongoDB যুক্ত নেই।')
  return new mongoose.mongo.GridFSBucket(db, { bucketName: 'pdfs' })
}

export function savePdf(buffer: Buffer, filename: string) {
  const upload = pdfBucket().openUploadStream(filename, { contentType: 'application/pdf' })
  return new Promise<mongoose.Types.ObjectId>((resolve, reject) => {
    Readable.from(buffer).pipe(upload)
    upload.on('error', reject)
    upload.on('finish', () => resolve(upload.id))
  })
}
