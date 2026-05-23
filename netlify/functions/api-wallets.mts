import { db } from '../../db/index.js'
import { wallets, walletHoldings } from '../../db/schema.js'
import { eq, and } from 'drizzle-orm'

function getPlayerFromRequest(req: Request) {
  const playerId = req.headers.get('x-player-id')
  if (!playerId) return null
  return { id: playerId }
}

export default async (req: Request) => {
  const player = getPlayerFromRequest(req)
  if (!player) return Response.json({ error: 'Player ID required' }, { status: 400 })

  if (req.method === 'GET') {
    const userWallets = await db.select().from(wallets).where(eq(wallets.userId, player.id))
    const allHoldings = await db.select().from(walletHoldings)

    const result = userWallets.map(w => ({
      ...w,
      holdings: allHoldings.filter(h => h.walletId === w.id),
    }))

    return Response.json({ wallets: result })
  }

  if (req.method === 'POST') {
    const { name, icon, initialBalance } = await req.json()
    if (!name) return Response.json({ error: 'Name required' }, { status: 400 })

    const balance = Math.min(Math.max(parseFloat(initialBalance) || 10000, 100), 1000000)

    const [wallet] = await db.insert(wallets).values({
      userId: player.id,
      name,
      icon: icon || '📊',
      initialBalance: String(balance),
      usdBalance: String(balance),
    }).returning()

    return Response.json({ wallet })
  }

  if (req.method === 'DELETE') {
    const url = new URL(req.url)
    const id = parseInt(url.searchParams.get('id') || '')
    if (!id) return Response.json({ error: 'Wallet ID required' }, { status: 400 })

    const [wallet] = await db.select().from(wallets)
      .where(and(eq(wallets.id, id), eq(wallets.userId, player.id)))
    if (!wallet) return Response.json({ error: 'Wallet not found' }, { status: 404 })

    await db.delete(wallets).where(eq(wallets.id, id))
    return Response.json({ success: true })
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 })
}

export const config = { path: '/api/wallets' }
