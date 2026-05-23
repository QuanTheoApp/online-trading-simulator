import { db } from '../../db/index.js'
import { wallets, walletHoldings } from '../../db/schema.js'
import { eq, and } from 'drizzle-orm'

function getPlayerFromRequest(req: Request) {
  const playerId = req.headers.get('x-player-id')
  if (!playerId) return null
  return { id: playerId }
}

export default async (req: Request, context: any) => {
  const player = getPlayerFromRequest(req)
  if (!player) return Response.json({ error: 'Player ID required' }, { status: 400 })

  const walletId = parseInt(context.params.id)
  if (!walletId) return Response.json({ error: 'Invalid wallet ID' }, { status: 400 })

  const [wallet] = await db.select().from(wallets)
    .where(and(eq(wallets.id, walletId), eq(wallets.userId, player.id)))
  if (!wallet) return Response.json({ error: 'Wallet not found' }, { status: 404 })

  const { symbol, side, quantity, price } = await req.json()
  if (!symbol || !side || !quantity || !price || quantity <= 0 || price <= 0) {
    return Response.json({ error: 'Invalid trade parameters' }, { status: 400 })
  }

  const total = quantity * price
  const balance = parseFloat(wallet.usdBalance!)

  if (side === 'buy') {
    if (balance < total) return Response.json({ error: 'Insufficient wallet funds' }, { status: 400 })

    await db.update(wallets).set({ usdBalance: String(balance - total) }).where(eq(wallets.id, walletId))

    const [existing] = await db.select().from(walletHoldings)
      .where(and(eq(walletHoldings.walletId, walletId), eq(walletHoldings.symbol, symbol)))

    if (existing) {
      const oldQty = parseFloat(existing.quantity!)
      const newQty = oldQty + quantity
      const newAvg = ((parseFloat(existing.avgEntryPrice!) * oldQty) + total) / newQty
      await db.update(walletHoldings)
        .set({ quantity: String(newQty), avgEntryPrice: String(newAvg) })
        .where(eq(walletHoldings.id, existing.id))
    } else {
      await db.insert(walletHoldings).values({
        walletId, symbol,
        quantity: String(quantity),
        avgEntryPrice: String(price),
      })
    }
  } else if (side === 'sell') {
    const [holding] = await db.select().from(walletHoldings)
      .where(and(eq(walletHoldings.walletId, walletId), eq(walletHoldings.symbol, symbol)))

    if (!holding || parseFloat(holding.quantity!) < quantity) {
      return Response.json({ error: 'Insufficient holdings' }, { status: 400 })
    }

    await db.update(wallets).set({ usdBalance: String(balance + total) }).where(eq(wallets.id, walletId))

    const newQty = parseFloat(holding.quantity!) - quantity
    if (newQty < 0.00000001) {
      await db.delete(walletHoldings).where(eq(walletHoldings.id, holding.id))
    } else {
      await db.update(walletHoldings).set({ quantity: String(newQty) }).where(eq(walletHoldings.id, holding.id))
    }
  }

  const [updated] = await db.select().from(wallets).where(eq(wallets.id, walletId))
  const wHoldings = await db.select().from(walletHoldings).where(eq(walletHoldings.walletId, walletId))

  return Response.json({ wallet: { ...updated, holdings: wHoldings } })
}

export const config = { path: '/api/wallets/:id/trade' }
