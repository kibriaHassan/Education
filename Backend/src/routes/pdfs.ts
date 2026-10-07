import { Router } from 'express'
import mongoose from 'mongoose'
import { PdfFile } from '../models/PdfFile.js'
import { pdfBucket } from '../pdfBucket.js'

export const pdfRouter = Router()

pdfRouter.get('/', async (req, res) => {
  const filter: { chapterId?: number; kind?: string } = {}
  if (req.query.chapterId !== undefined && req.query.chapterId !== '') {
    const chapterId = Number(req.query.chapterId)
    if (!Number.isInteger(chapterId)) {
      res.status(400).json({ message: 'অধ্যায়ের নম্বর সঠিক নয়।' })
      return
    }
    filter.chapterId = chapterId
  }
  if (req.query.kind === 'book' || req.query.kind === 'solution' || req.query.kind === 'other') {
    filter.kind = req.query.kind
  }
  const files = await PdfFile.find(filter).sort({ createdAt: -1 }).lean()
  res.json(files.map(presentPdf))
})

pdfRouter.get('/:id/file', async (req, res) => {
  const id = String(req.params.id)
  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ message: 'ফাইল পাওয়া যায়নি।' })
    return
  }
  const file = await PdfFile.findById(id)
  if (!file) {
    res.status(404).json({ message: 'ফাইল পাওয়া যায়নি।' })
    return
  }

  const encoded = encodeURIComponent(file.filename)
  const disposition = req.query.download === '1' ? 'attachment' : 'inline'
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `${disposition}; filename*=UTF-8''${encoded}`)
  pdfBucket()
    .openDownloadStream(file.fileId)
    .on('error', () => {
      if (!res.headersSent) res.status(404).json({ message: 'ফাইল পাওয়া যায়নি।' })
    })
    .pipe(res)
})

export function presentPdf(file: {
  _id: unknown
  title: string
  chapterId: number
  kind: string
  filename: string
  size: number
}) {
  return {
    id: String(file._id),
    title: file.title,
    chapterId: file.chapterId,
    kind: file.kind,
    filename: file.filename,
    size: file.size,
  }
}
