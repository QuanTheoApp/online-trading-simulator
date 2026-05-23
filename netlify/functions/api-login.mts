import { db } from '../../db/index.js'
import { users } from '../../db/schema.js'
import { eq } from 'drizzle-orm'

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { email, pin, traderName } = await req.json()

  if (!email || !pin || typeof pin !== 'string' || pin.length !== 4) {
    return Response.json({ error: 'Email and 4-digit PIN required' }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()

  const [existing] = await db.select().from(users).where(eq(users.email, normalizedEmail))

  if (existing) {
    if (existing.pin !== pin) {
      return Response.json({ error: 'Incorrect PIN for this email' }, { status: 401 })
    }
    return Response.json({
      id: existing.id,
      traderName: existing.fullName || existing.username,
      usdBalance: existing.usdBalance,
    })
  }

  if (!traderName || typeof traderName !== 'string' || !traderName.trim()) {
    return Response.json({ error: 'Trader name is required for new accounts' }, { status: 400 })
  }

  const name = traderName.trim()
  const id = crypto.randomUUID()
  const [created] = await db.insert(users).values({
    id,
    email: normalizedEmail,
    username: name,
    fullName: name,
    pin,
    usdBalance: '100000',
  }).returning()

  return Response.json({
    id: created.id,
    traderName: created.fullName || created.username,
    usdBalance: created.usdBalance,
    isNew: true,
  })
}

export const config = { path: '/api/login' }
