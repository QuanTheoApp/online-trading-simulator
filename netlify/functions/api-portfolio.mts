import { db } from '../../db/index.js'
import { users, trades, holdings } from '../../db/schema.js'
import { eq, desc } from 'drizzle-orm'

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

  const dbUser = await ensurePlayer(player.id, player.name)
  if (!dbUser) return Response.json({ error: 'Player not found' }, { status: 404 })

  const userHoldings = await db.select().from(holdings).where(eq(holdings.userId, player.id))

  const userTrades = await db.select().from(trades)
    .where(eq(trades.userId, player.id))
    .orderBy(desc(trades.createdAt))

  let totalInvested = 0
  let totalRealized = 0
  let wins = 0
  let losses = 0
  let bestTrade = 0
  let worstTrade = 0

  const sellTrades = userTrades.filter(t => t.side === 'sell')
  const buyTrades = userTrades.filter(t => t.side === 'buy')

  for (const sell of sellTrades) {
    const sellQty = parseFloat(sell.quantity!)
    const sellPrice = parseFloat(sell.price!)

    const holdingAtTime = buyTrades
      .filter(b => b.symbol === sell.symbol && new Date(b.createdAt!) <= new Date(sell.createdAt!))

    if (holdingAtTime.length > 0) {
      const avgBuy = holdingAtTime.reduce((sum, b) => sum + parseFloat(b.price!), 0) / holdingAtTime.length
      const pnl = (sellPrice - avgBuy) * sellQty
      totalRealized += pnl
      if (pnl > 0) wins++
      else losses++
      if (pnl > bestTrade) bestTrade = pnl
      if (pnl < worstTrade) worstTrade = pnl
    }
  }

  totalInvested = buyTrades.reduce((sum, t) => sum + parseFloat(t.total!), 0)

  const totalTrades = userTrades.length
  const winRate = totalTrades > 0 ? (wins / Math.max(wins + losses, 1)) * 100 : 0
  const roi = totalInvested > 0 ? (totalRealized / totalInvested) * 100 : 0

  return Response.json({
    user: {
      id: dbUser.id,
      username: dbUser.username,
      fullName: dbUser.fullName,
      usdBalance: dbUser.usdBalance,
      createdAt: dbUser.createdAt,
    },
    holdings: userHoldings,
    stats: {
      totalTrades,
      totalRealized,
      winRate,
      roi,
      wins,
      losses,
      bestTrade,
      worstTrade,
    },
  })
}

export const config = { path: '/api/portfolio' }
