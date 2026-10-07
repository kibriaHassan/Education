import mongoose from 'mongoose'

const solutionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    chapterId: { type: Number, required: true, index: true },
    title: { type: String, required: true },
    prompt: { type: String, required: true },
    steps: { type: [String], required: true },
    answer: { type: String, required: true },
  },
  { versionKey: false },
)

export const Solution = mongoose.model('Solution', solutionSchema)
