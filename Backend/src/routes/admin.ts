import { Router, type Response } from 'express'
import multer from 'multer'
import mongoose from 'mongoose'
import { passwordsMatch, requireAdmin, signToken } from '../auth.js'
import { adminEmail, adminPassword } from '../env.js'
import { Chapter } from '../models/Chapter.js'
import { Cq } from '../models/Cq.js'
import { Mcq } from '../models/Mcq.js'
import { PdfFile } from '../models/PdfFile.js'
import { Solution } from '../models/Solution.js'
import { pdfBucket, savePdf } from '../pdfBucket.js'
import { clearCatalogCache } from './catalog.js'
import { presentPdf } from './pdfs.js'

export const adminRouter = Router()

adminRouter.use((req, res, next) => {
  if (req.method !== 'GET' && req.path !== '/login') {
    res.on('finish', () => {
      if (res.statusCode < 400) clearCatalogCache()
    })
  }
  next()
})

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter(_req, file, callback) {
    const name = file.originalname.toLowerCase()
    if (file.mimetype === 'application/pdf' || name.endsWith('.pdf')) callback(null, true)
    else callback(new Error('শুধু PDF নেওয়া যাবে।'))
  },
})

const strands = new Set(['algebra', 'geometry', 'trig', 'measure'])

adminRouter.post('/login', (req, res) => {
  const email = text(req.body?.email).toLowerCase()
  const password = text(req.body?.password)
  let expectedEmail = ''
  let expectedPassword = ''
  try {
    expectedEmail = adminEmail()
    expectedPassword = adminPassword()
  } catch {
    res.status(500).json({ code: 'admin_unconfigured', message: 'সার্ভারে অ্যাডমিন সেট করা নেই।' })
    return
  }
  const emailOk = Boolean(email) && passwordsMatch(email, expectedEmail)
  const passwordOk = Boolean(password) && passwordsMatch(password, expectedPassword)
  if (!emailOk || !passwordOk) {
    res.status(401).json({ code: 'invalid_login', message: 'ইমেইল বা পাসওয়ার্ড মেলেনি।' })
    return
  }
  res.json({ token: signToken() })
})

adminRouter.use(requireAdmin)

adminRouter.post('/chapters', async (req, res) => {
  try {
    const title = text(req.body?.title)
    const titleEn = text(req.body?.titleEn)
    const strand = text(req.body?.strand)
    const blurb = text(req.body?.blurb)
    if (!title || !titleEn || !blurb || !strands.has(strand)) {
      res.status(400).json({ message: 'নাম, ইংরেজি নাম, ধরন ও সংক্ষিপ্ত বিবরণ দরকার।' })
      return
    }
    const latest = await Chapter.findOne().sort({ id: -1 }).select('id').lean()
    const chapter = await Chapter.create({
      id: (latest?.id ?? 0) + 1,
      title,
      titleEn,
      strand,
      blurb,
      topics: lines(req.body?.topics),
      notes: lines(req.body?.notes),
      formulas: [],
      spotlight: {
        prompt: 'এই অধ্যায়ের নমুনা পরে যোগ হবে।',
        steps: ['অ্যাডমিন প্যানেল থেকে নোট যোগ করা যাবে।'],
        answer: '—',
      },
    })
    res.status(201).json(chapter)
  } catch (error) {
    fail(res, error)
  }
})

adminRouter.delete('/chapters/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) {
      res.status(400).json({ message: 'অধ্যায়ের নম্বর সঠিক নয়।' })
      return
    }
    const chapter = await Chapter.findOneAndDelete({ id })
    if (!chapter) {
      res.status(404).json({ message: 'অধ্যায় পাওয়া যায়নি।' })
      return
    }
    await Solution.deleteMany({ chapterId: id })
    await Mcq.deleteMany({ chapterId: id })
    await Cq.deleteMany({ chapterId: id })
    const pdfs = await PdfFile.find({ chapterId: id })
    for (const pdf of pdfs) {
      await pdfBucket().delete(pdf.fileId).catch(() => undefined)
    }
    await PdfFile.deleteMany({ chapterId: id })
    res.json({ ok: true })
  } catch (error) {
    fail(res, error)
  }
})

adminRouter.post('/mcqs', async (req, res) => {
  try {
    const chapterId = Number(req.body?.chapterId)
    const question = text(req.body?.question)
    const explanation = text(req.body?.explanation)
    const options = four(req.body?.options)
    const answer = Number(req.body?.answer)
    if (!question || !explanation || !options || !Number.isInteger(answer) || answer < 0 || answer > 3) {
      res.status(400).json({ message: 'প্রশ্ন, চারটি অপশন, সঠিক উত্তর ও ব্যাখ্যা দরকার।' })
      return
    }
    if (!(await chapterExists(chapterId))) {
      res.status(404).json({ message: 'অধ্যায় পাওয়া যায়নি।' })
      return
    }
    const saved = await Mcq.create({
      id: `m-${chapterId}-${Date.now()}`,
      chapterId,
      question,
      options,
      answer,
      explanation,
    })
    res.status(201).json(saved)
  } catch (error) {
    fail(res, error)
  }
})

adminRouter.delete('/mcqs/:id', async (req, res) => {
  try {
    const removed = await Mcq.findOneAndDelete({ id: String(req.params.id) })
    if (!removed) {
      res.status(404).json({ message: 'প্রশ্ন পাওয়া যায়নি।' })
      return
    }
    res.json({ ok: true })
  } catch (error) {
    fail(res, error)
  }
})

adminRouter.post('/cqs', async (req, res) => {
  try {
    const chapterId = Number(req.body?.chapterId)
    const title = text(req.body?.title)
    const stimulus = text(req.body?.stimulus)
    const parts = [
      part('ক', 2, req.body?.kaPrompt, req.body?.kaSolution),
      part('খ', 4, req.body?.khaPrompt, req.body?.khaSolution),
      part('গ', 4, req.body?.gaPrompt, req.body?.gaSolution),
    ]
    if (!title || !stimulus || parts.some((item) => !item)) {
      res.status(400).json({ message: 'উদ্দীপক এবং ক, খ, গ-এর প্রশ্ন ও সমাধান দরকার।' })
      return
    }
    if (!(await chapterExists(chapterId))) {
      res.status(404).json({ message: 'অধ্যায় পাওয়া যায়নি।' })
      return
    }
    const saved = await Cq.create({
      id: `c-${chapterId}-${Date.now()}`,
      chapterId,
      title,
      stimulus,
      parts,
    })
    res.status(201).json(saved)
  } catch (error) {
    fail(res, error)
  }
})

adminRouter.delete('/cqs/:id', async (req, res) => {
  try {
    const removed = await Cq.findOneAndDelete({ id: String(req.params.id) })
    if (!removed) {
      res.status(404).json({ message: 'প্রশ্ন পাওয়া যায়নি।' })
      return
    }
    res.json({ ok: true })
  } catch (error) {
    fail(res, error)
  }
})

adminRouter.post('/solutions', async (req, res) => {
  try {
    const chapterId = Number(req.body?.chapterId)
    const title = text(req.body?.title)
    const prompt = text(req.body?.prompt)
    const answer = text(req.body?.answer)
    const steps = lines(req.body?.steps)
    if (!title || !prompt || !answer || steps.length === 0) {
      res.status(400).json({ message: 'শিরোনাম, প্রশ্ন, ধাপ ও উত্তর দরকার।' })
      return
    }
    if (!(await chapterExists(chapterId))) {
      res.status(404).json({ message: 'অধ্যায় পাওয়া যায়নি।' })
      return
    }
    const saved = await Solution.create({
      id: `s-${chapterId}-${Date.now()}`,
      chapterId,
      title,
      prompt,
      steps,
      answer,
    })
    res.status(201).json(saved)
  } catch (error) {
    fail(res, error)
  }
})

adminRouter.delete('/solutions/:id', async (req, res) => {
  try {
    const removed = await Solution.findOneAndDelete({ id: String(req.params.id) })
    if (!removed) {
      res.status(404).json({ message: 'সমাধান পাওয়া যায়নি।' })
      return
    }
    res.json({ ok: true })
  } catch (error) {
    fail(res, error)
  }
})

adminRouter.post('/pdfs', upload.single('file'), async (req, res) => {
  try {
    const file = req.file
    const header = file?.buffer.subarray(0, 5).toString('utf8') ?? ''
    if (!file || !header.startsWith('%PDF')) {
      res.status(400).json({ message: 'সঠিক PDF ফাইল দরকার।' })
      return
    }
    const chapterId = Number(req.body?.chapterId)
    const kind = text(req.body?.kind)
    const title = text(req.body?.title) || file.originalname.replace(/\.pdf$/i, '')
    if (!title || !Number.isInteger(chapterId) || !['book', 'solution', 'other'].includes(kind)) {
      res.status(400).json({ message: 'অধ্যায়, নাম ও PDF-এর ধরন বেছে নাও।' })
      return
    }
    if (!(await chapterExists(chapterId))) {
      res.status(404).json({ message: 'অধ্যায় পাওয়া যায়নি।' })
      return
    }
    const filename = file.originalname.replace(/[^\w.\-\u0980-\u09FF ()]+/g, '_') || 'file.pdf'
    const fileId = await savePdf(file.buffer, filename)
    try {
      const saved = await PdfFile.create({
        title,
        chapterId,
        kind,
        filename,
        size: file.size,
        fileId,
      })
      res.status(201).json(presentPdf(saved.toObject()))
    } catch (error) {
      await pdfBucket().delete(fileId).catch(() => undefined)
      throw error
    }
  } catch (error) {
    fail(res, error)
  }
})

adminRouter.delete('/pdfs/:id', async (req, res) => {
  try {
    const id = String(req.params.id)
    if (!mongoose.isValidObjectId(id)) {
      res.status(404).json({ message: 'ফাইল পাওয়া যায়নি।' })
      return
    }
    const file = await PdfFile.findByIdAndDelete(id)
    if (!file) {
      res.status(404).json({ message: 'ফাইল পাওয়া যায়নি।' })
      return
    }
    await pdfBucket().delete(file.fileId).catch(() => undefined)
    res.json({ ok: true })
  } catch (error) {
    fail(res, error)
  }
})

function text(value: unknown) {
  return String(value ?? '').trim()
}

function lines(value: unknown) {
  return text(value)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function four(value: unknown) {
  if (!Array.isArray(value) || value.length !== 4) return null
  const options = value.map((item) => text(item))
  if (options.some((item) => !item)) return null
  return options
}

function part(key: 'ক' | 'খ' | 'গ', marks: 2 | 4, prompt: unknown, solution: unknown) {
  const question = text(prompt)
  const answer = text(solution)
  if (!question || !answer) return null
  return { key, marks, prompt: question, solution: answer }
}

async function chapterExists(chapterId: number) {
  if (!Number.isInteger(chapterId)) return false
  return Boolean(await Chapter.exists({ id: chapterId }))
}

function fail(res: Response, error: unknown) {
  if (error && typeof error === 'object' && 'name' in error && error.name === 'ValidationError') {
    res.status(400).json({ message: 'তথ্য পূর্ণ নয়।' })
    return
  }
  console.error(error)
  res.status(500).json({ message: 'সেভ করা যায়নি।' })
}
