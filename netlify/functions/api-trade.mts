import { db } from '../../db/index.js'
import { users, trades, holdings } from '../../db/schema.js'
import { eq, and } from 'drizzle-orm'

function getPlayerFromRequest(req: Request) {
  const playerId = req.headers.get('x-player-id')
  if (!playerId) return null
  const playerName = req.headers.get('x-player-name') || 'Trader'
  return { id: playerId, name: playerName }
}

async function ensurePlayer(id: string, name: string) {
  const [existing] = await db.select().from(users).where(eq(users.id, id))
  if (existing) return existing
  const [created] = await db.insert(users).values({
    id,
    username: name,
    fullName: name,
    usdBalance: '100000',
  }).onConflictDoNothing().returning()
  if (created) return created
  const [refetched] = await db.select().from(users).where(eq(users.id, id))
  return refetched
}

export default async (req: Request) => {
  const player = getPlayerFromRequest(req)
  if (!player) return Response.json({ error: 'Player ID required' }, { status: 400 })

  const { symbol, side, quantity, price } = await req.json()

  if (!symbol || !side || !quantity || !price || quantity <= 0 || price <= 0) {
    return Response.json({ error: 'Invalid trade parameters' }, { status: 400 })
  }

  const dbUser = await ensurePlayer(player.id, player.name)
  if (!dbUser) return Response.json({ error: 'Player setup failed' }, { status: 500 })

  const total = quantity * price
  const currentBalance = parseFloat(dbUser.usdBalance!)

  if (side === 'buy') {
    if (currentBalance < total) {
      return Response.json({ error: 'Insufficient funds', available: currentBalance }, { status: 400 })
    }

    await db.update(users)
      .set({ usdBalance: String(currentBalance - total), updatedAt: new Date() })
      .where(eq(users.id, player.id))

    const [existing] = await db.select().from(holdings)
      .where(and(eq(holdings.userId, player.id), eq(holdings.symbol, symbol)))

    if (existing) {
      const oldQty = parseFloat(existing.quantity!)
      const newQty = oldQty + quantity
      const newAvg = ((parseFloat(existing.avgEntryPrice!) * oldQty) + total) / newQty
      await db.update(holdings)
        .set({ quantity: String(newQty), avgEntryPrice: String(newAvg) })
        .where(eq(holdings.id, existing.id))
    } else {
      await db.insert(holdings).values({
        userId: player.id, symbol,
        quantity: String(quantity),
        avgEntryPrice: String(price),
      })
    }
  } else if (side === 'sell') {
    const [holding] = await db.select().from(holdings)
      .where(and(eq(holdings.userId, player.id), eq(holdings.symbol, symbol)))

    if (!holding || parseFloat(holding.quantity!) < quantity) {
      return Response.json({ error: 'Insufficient holdings' }, { status: 400 })
    }

    await db.update(users)
      .set({ usdBalance: String(currentBalance + total), updatedAt: new Date() })
      .where(eq(users.id, player.id))

    const newQty = parseFloat(holding.quantity!) - quantity
    if (newQty < 0.00000001) {
      await db.delete(holdings).where(eq(holdings.id, holding.id))
    } else {
      await db.update(holdings)
        .set({ quantity: String(newQty) })
        .where(eq(holdings.id, holding.id))
    }
  } else {
    return Response.json({ error: 'Invalid side, must be buy or sell' }, { status: 400 })
  }

  await db.insert(trades).values({
    userId: player.id, symbol, side,
    quantity: String(quantity),
    price: String(price),
    total: String(total),
  })

  const [updated] = await db.select().from(users).where(eq(users.id, player.id))
  const userHoldings = await db.select().from(holdings).where(eq(holdings.userId, player.id))

  return Response.json({ success: true, usdBalance: updated.usdBalance, holdings: userHoldings })
}

export const config = { path: '/api/trade' }
