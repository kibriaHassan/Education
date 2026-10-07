import mongoose from 'mongoose'

const partSchema = new mongoose.Schema(
  {
    key: { type: String, enum: ['ক', 'খ', 'গ'], required: true },
    marks: { type: Number, enum: [2, 4], required: true },
    prompt: { type: String, required: true },
    solution: { type: String, required: true },
  },
  { _id: false },
)

const cqSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    chapterId: { type: Number, required: true, index: true },
    title: { type: String, required: true },
    stimulus: { type: String, required: true },
    parts: {
      type: [partSchema],
      required: true,
      validate: (value: unknown[]) => value.length === 3,
    },
  },
  { versionKey: false },
)

export const Cq = mongoose.model('Cq', cqSchema)
