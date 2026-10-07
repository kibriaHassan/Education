import mongoose from 'mongoose'

const mcqSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    chapterId: { type: Number, required: true, index: true },
    question: { type: String, required: true },
    options: {
      type: [String],
      required: true,
      validate: (value: string[]) => value.length === 4,
    },
    answer: { type: Number, required: true, min: 0, max: 3 },
    explanation: { type: String, required: true },
  },
  { versionKey: false },
)

export const Mcq = mongoose.model('Mcq', mcqSchema)
