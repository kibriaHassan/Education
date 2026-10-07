import 'dotenv/config'

export function mongoUri() {
  const uri = process.env.MONGODB_URI?.trim()
  if (!uri) {
    throw new Error('MONGODB_URI সেট করা নেই। Backend/.env ফাইলে MongoDB-এর ঠিকানা দাও।')
  }
  return uri
}

export function port() {
  const value = Number(process.env.PORT ?? 4000)
  return Number.isInteger(value) && value > 0 ? value : 4000
}

export function adminEmail() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if (!email) throw new Error('ADMIN_EMAIL সেট করা নেই।')
  return email
}

export function adminPassword() {
  const password = process.env.ADMIN_PASSWORD?.trim()
  if (!password) {
    throw new Error('ADMIN_PASSWORD সেট করা নেই।')
  }
  return password
}

export function clientOrigins() {
  const extra = process.env.CLIENT_ORIGIN?.split(',').map((item) => item.trim()).filter(Boolean) ?? []
  return ['http://127.0.0.1:5173', 'http://localhost:5173', ...extra]
}
