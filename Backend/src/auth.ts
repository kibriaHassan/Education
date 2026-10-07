import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { adminPassword } from './env.js'

const lifetime = 12 * 60 * 60 * 1000

export function passwordsMatch(input: string, expected: string) {
  const left = createHash('sha256').update(input).digest()
  const right = createHash('sha256').update(expected).digest()
  return timingSafeEqual(left, right)
}

export function signToken() {
  const body = Buffer.from(JSON.stringify({ exp: Date.now() + lifetime })).toString('base64url')
  const signature = createHmac('sha256', adminPassword()).update(body).digest('base64url')
  return `${body}.${signature}`
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const [body, signature] = token.split('.')
  if (!body || !signature) {
    res.status(401).json({ message: 'অ্যাডমিন হিসেবে ঢুকতে হবে।' })
    return
  }

  let expected = ''
  try {
    expected = createHmac('sha256', adminPassword()).update(body).digest('base64url')
  } catch {
    res.status(500).json({ message: 'সার্ভারে অ্যাডমিন পাসওয়ার্ড সেট করা নেই।' })
    return
  }

  const left = Buffer.from(signature)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    res.status(401).json({ message: 'অ্যাডমিন হিসেবে ঢুকতে হবে।' })
    return
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as { exp?: number }
    if (!payload.exp || payload.exp < Date.now()) {
      res.status(401).json({ message: 'সময় শেষ। আবার ঢুকতে হবে।' })
      return
    }
  } catch {
    res.status(401).json({ message: 'অ্যাডমিন হিসেবে ঢুকতে হবে।' })
    return
  }

  next()
}
