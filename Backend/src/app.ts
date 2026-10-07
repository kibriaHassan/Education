import cors from 'cors'
import express from 'express'
import { clientOrigins } from './env.js'
import { adminRouter } from './routes/admin.js'
import { catalogRouter } from './routes/catalog.js'
import { pdfRouter } from './routes/pdfs.js'

const localOrigin =
  /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/

function allowClient(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
  if (!origin || clientOrigins().includes(origin) || localOrigin.test(origin)) {
    callback(null, true)
    return
  }
  callback(null, false)
}

export const app = express()

app.use(cors({ origin: allowClient }))
app.use(express.json({ limit: '1mb' }))
app.use('/api/admin', adminRouter)
app.use('/api/pdfs', pdfRouter)
app.use('/api', catalogRouter)

app.use((_req, res) => {
  res.status(404).json({ message: 'এই ঠিকানায় কিছু নেই।' })
})

app.use((error: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) {
    next(error)
    return
  }
  const problem = error as { name?: string; code?: string; message?: string }
  if (problem.message === 'শুধু PDF নেওয়া যাবে।') {
    res.status(400).json({ message: problem.message })
    return
  }
  if (problem.name === 'MulterError') {
    res.status(400).json({
      message: problem.code === 'LIMIT_FILE_SIZE' ? 'PDF ২৫ মেগাবাইটের কম হতে হবে।' : 'ফাইল আপলোড হয়নি।',
    })
    return
  }
  console.error(req.method, req.path, error)
  res.status(500).json({ message: 'সার্ভারে সমস্যা হয়েছে।' })
})
