import { networkInterfaces } from 'node:os'
import { app } from './app.js'
import { connectDb } from './db.js'
import { port } from './env.js'
import { warmCatalog } from './routes/catalog.js'

const serverPort = port()

function lanAddresses() {
  const found: string[] = []
  for (const list of Object.values(networkInterfaces())) {
    for (const item of list ?? []) {
      if (item.family === 'IPv4' && !item.internal) found.push(item.address)
    }
  }
  return found
}

try {
  await connectDb()
  app.listen(serverPort, '0.0.0.0', () => {
    console.log(`অঙ্কশালা API চলছে: http://127.0.0.1:${serverPort}`)
    for (const address of lanAddresses()) console.log(`ফোন থেকে: http://${address}:${serverPort}`)
    warmCatalog().catch(() => undefined)
  })
} catch (error) {
  console.error('MongoDB-এ যুক্ত হওয়া যায়নি। Backend/.env-এ MONGODB_URI ঠিক আছে কিনা দেখো।')
  console.error(error)
  process.exit(1)
}
