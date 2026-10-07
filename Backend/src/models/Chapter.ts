import mongoose from 'mongoose'

const formulaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    expr: { type: String, required: true },
    note: { type: String },
  },
  { _id: false },
)

const spotlightSchema = new mongoose.Schema(
  {
    prompt: { type: String, required: true },
    steps: { type: [String], required: true },
    answer: { type: String, required: true },
  },
  { _id: false },
)

const chapterSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    titleEn: { type: String, required: true },
    strand: { type: String, enum: ['algebra', 'geometry', 'trig', 'measure'], required: true },
    blurb: { type: String, required: true },
    topics: { type: [String], required: true },
    notes: { type: [String], required: true },
    formulas: { type: [formulaSchema], required: true },
    spotlight: { type: spotlightSchema, required: true },
  },
  { versionKey: false },
)

export const Chapter = mongoose.model('Chapter', chapterSchema)
