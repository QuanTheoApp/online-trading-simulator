import { db } from '../../db/index.js'
import { users, trades, holdings } from '../../db/schema.js'
import { eq, desc } from 'drizzle-orm'

const KNOWN_QUOTE_SUFFIXES = ['USDT', 'USDC', 'BUSD', 'FDUSD', 'TUSD', 'BTC', 'ETH', 'BNB', 'EUR', 'TRY', 'GBP', 'BRL', 'ARS']

function isCrypto(symbol: string): boolean {
  return KNOWN_QUOTE_SUFFIXES.some(q => symbol.endsWith(q) && symbol.length > q.length)
}

export default async (req: Request) => {
  const url = new URL(req.url)
  const userId = url.searchParams.get('userId')
  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 })

  const [user] = await db.select().from(users).where(eq(users.id, userId))
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const userHoldings = await db.select().from(holdings).where(eq(holdings.userId, userId))

  const userTrades = await db.select().from(trades)
    .where(eq(trades.userId, userId))
    .orderBy(desc(trades.createdAt))

  const symbols = [...new Set(userHoldings.map(h => h.symbol))]
  let prices: Record<string, number> = {}
  if (symbols.length > 0) {
    const pricePromises = symbols.map(async (s) => {
      try {
        if (isCrypto(s)) {
          const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${s}`)
          const data = await res.json()
          return { symbol: s, price: parseFloat(data.price) }
        } else {
          const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s)}?interval=1d&range=1d`)
          const data = await res.json()
          const price = data.chart?.result?.[0]?.meta?.regularMarketPrice || 0
          return { symbol: s, price }
        }
      } catch {
        return { symbol: s, price: 0 }
      }
    })
    const results = await Promise.all(pricePromises)
    prices = Object.fromEntries(results.filter(r => r.price > 0).map(r => [r.symbol, r.price]))
  }

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

  const totalInvested = buyTrades.reduce((sum, t) => sum + parseFloat(t.total!), 0)
  const totalTrades = userTrades.length
  const winRate = totalTrades > 0 ? (wins / Math.max(wins + losses, 1)) * 100 : 0
  const roi = totalInvested > 0 ? (totalRealized / totalInvested) * 100 : 0

  const holdingsValue = userHoldings.reduce((sum, h) => {
    const qty = parseFloat(h.quantity!)
    const price = prices[h.symbol] || parseFloat(h.avgEntryPrice!)
    return sum + qty * price
  }, 0)
  const usdBalance = parseFloat(user.usdBalance!)
  const portfolioValue = usdBalance + holdingsValue

  return Response.json({
    user: {
      id: user.id,
      traderName: user.fullName || user.username,
      portfolioValue,
      usdBalance,
      joinedAt: user.createdAt,
    },
    holdings: userHoldings.map(h => ({
      symbol: h.symbol,
      quantity: h.quantity,
      avgEntryPrice: h.avgEntryPrice,
      currentPrice: prices[h.symbol] || parseFloat(h.avgEntryPrice!),
    })),
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
    recentTrades: userTrades.slice(0, 20).map(t => ({
      symbol: t.symbol,
      side: t.side,
      quantity: t.quantity,
      price: t.price,
      total: t.total,
      createdAt: t.createdAt,
    })),
  })
}

export const config = { path: '/api/public-portfolio' }
