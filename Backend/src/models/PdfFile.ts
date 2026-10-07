import mongoose from 'mongoose'

const pdfSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    chapterId: { type: Number, required: true, index: true },
    kind: { type: String, enum: ['book', 'solution', 'other'], required: true },
    filename: { type: String, required: true },
    size: { type: Number, required: true },
    fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { versionKey: false, timestamps: { createdAt: true, updatedAt: false } },
)

export const PdfFile = mongoose.model('PdfFile', pdfSchema)
