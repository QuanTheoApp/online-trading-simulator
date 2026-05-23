import { db } from '../../db/index.js'
import { users, trades, holdings } from '../../db/schema.js'
import { eq, desc, count, sql } from 'drizzle-orm'

const KNOWN_QUOTE_SUFFIXES = ['USDT', 'USDC', 'BUSD', 'FDUSD', 'TUSD', 'BTC', 'ETH', 'BNB', 'EUR', 'TRY', 'GBP', 'BRL', 'ARS']

function isCrypto(symbol: string): boolean {
  return KNOWN_QUOTE_SUFFIXES.some(q => symbol.endsWith(q) && symbol.length > q.length)
}

export default async (req: Request) => {
  const allUsers = await db.select().from(users)
  const allHoldings = await db.select().from(holdings)
  const tradeCounts = await db.select({
    userId: trades.userId,
    total: count(),
  }).from(trades).groupBy(trades.userId)

  const symbols = [...new Set(allHoldings.map(h => h.symbol))]

  let prices: Record<string, number> = {}
  if (symbols.length > 0) {
    try {
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
    } catch {}
  }

  const leaderboard = allUsers.map(u => {
    const uHoldings = allHoldings.filter(h => h.userId === u.id)
    const usdBalance = parseFloat(u.usdBalance!)
    const holdingsValue = uHoldings.reduce((sum, h) => {
      const qty = parseFloat(h.quantity!)
      const price = prices[h.symbol] || parseFloat(h.avgEntryPrice!)
      return sum + qty * price
    }, 0)
    const portfolioValue = usdBalance + holdingsValue
    const pnl = portfolioValue - 100000
    const pnlPercent = (pnl / 100000) * 100
    const tradeCount = tradeCounts.find(t => t.userId === u.id)

    return {
      traderName: u.fullName || u.username,
      portfolioValue,
      pnl,
      pnlPercent,
      totalTrades: tradeCount ? Number(tradeCount.total) : 0,
      holdingsCount: uHoldings.length,
      joinedAt: u.createdAt,
    }
  })

  leaderboard.sort((a, b) => b.portfolioValue - a.portfolioValue)

  return Response.json({
    leaderboard: leaderboard.slice(0, 100),
    totalTraders: allUsers.length,
  })
}

export const config = { path: '/api/leaderboard' }
