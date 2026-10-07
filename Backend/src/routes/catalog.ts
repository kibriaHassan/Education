import { Router } from 'express'
import mongoose from 'mongoose'
import { Chapter } from '../models/Chapter.js'
import { Cq } from '../models/Cq.js'
import { Mcq } from '../models/Mcq.js'
import { Solution } from '../models/Solution.js'

export const catalogRouter = Router()

const hidden = { _id: 0 }

type CatalogBody = {
  chapters: unknown[]
  solutions: unknown[]
  mcqs: unknown[]
  cqs: unknown[]
}

let catalogCache: CatalogBody | null = null
let catalogPending: Promise<CatalogBody> | null = null

export function warmCatalog() {
  return loadCatalogBody().then(() => undefined)
}

export function clearCatalogCache() {
  catalogCache = null
  catalogPending = null
}

function loadCatalogBody() {
  if (catalogCache) return Promise.resolve(catalogCache)
  if (!catalogPending) {
    catalogPending = Promise.all([
      Chapter.find().select(hidden).sort({ id: 1 }).lean(),
      Solution.find().select(hidden).sort({ id: 1 }).lean(),
      Mcq.find().select(hidden).sort({ id: 1 }).lean(),
      Cq.find().select(hidden).sort({ id: 1 }).lean(),
    ])
      .then(([chapters, solutions, mcqs, cqs]) => {
        const body = { chapters, solutions, mcqs, cqs }
        catalogCache = body
        catalogPending = null
        return body
      })
      .catch((error: unknown) => {
        catalogPending = null
        throw error
      })
  }
  return catalogPending
}

catalogRouter.get('/health', (_req, res) => {
  const connected = mongoose.connection.readyState === 1
  res.json({ ok: connected, database: connected ? 'connected' : 'disconnected' })
})

catalogRouter.get('/chapters', async (_req, res, next) => {
  try {
    const chapters = await Chapter.find().select(hidden).sort({ id: 1 }).lean()
    res.json(chapters)
  } catch (error) {
    next(error)
  }
})

catalogRouter.get('/chapters/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) {
      res.status(400).json({ message: 'অধ্যায়ের নম্বর সঠিক নয়।' })
      return
    }
    const chapter = await Chapter.findOne({ id }).select(hidden).lean()
    if (!chapter) {
      res.status(404).json({ message: 'অধ্যায় পাওয়া যায়নি।' })
      return
    }
    res.json(chapter)
  } catch (error) {
    next(error)
  }
})

catalogRouter.get('/solutions', async (req, res, next) => {
  try {
    res.json(await Solution.find(chapterFilter(req.query.chapterId)).select(hidden).sort({ id: 1 }).lean())
  } catch (error) {
    next(error)
  }
})

catalogRouter.get('/mcqs', async (req, res, next) => {
  try {
    res.json(await Mcq.find(chapterFilter(req.query.chapterId)).select(hidden).sort({ id: 1 }).lean())
  } catch (error) {
    next(error)
  }
})

catalogRouter.get('/cqs', async (req, res, next) => {
  try {
    res.json(await Cq.find(chapterFilter(req.query.chapterId)).select(hidden).sort({ id: 1 }).lean())
  } catch (error) {
    next(error)
  }
})

catalogRouter.get('/catalog', async (_req, res, next) => {
  try {
    res.json(await loadCatalogBody())
  } catch (error) {
    next(error)
  }
})

function chapterFilter(value: unknown) {
  if (value === undefined || value === '') return {}
  const chapterId = Number(value)
  if (!Number.isInteger(chapterId)) return { chapterId: -1 }
  return { chapterId }
}
