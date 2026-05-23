import { db } from '../../db/index.js'
import { trades } from '../../db/schema.js'
import { eq, desc } from 'drizzle-orm'

function getPlayerFromRequest(req: Request) {
  const playerId = req.headers.get('x-player-id')
  if (!playerId) return null
  return { id: playerId }
}

export default async (req: Request) => {
  const player = getPlayerFromRequest(req)
  if (!player) return Response.json({ error: 'Player ID required' }, { status: 400 })

  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200)
  const offset = parseInt(url.searchParams.get('offset') || '0')
  const symbol = url.searchParams.get('symbol')

  let query = db.select().from(trades).where(eq(trades.userId, player.id)).orderBy(desc(trades.createdAt))

  const allTrades = await query.limit(limit).offset(offset)

  const filtered = symbol ? allTrades.filter(t => t.symbol === symbol) : allTrades

  return Response.json({ trades: filtered })
}

export const config = { path: '/api/trades' }
