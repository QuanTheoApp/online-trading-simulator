import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getLeaderboard, fetchStockQuote } from '../lib/api'
import { formatUSD, formatPercent } from '../lib/format'
import { useStore, LeaderboardEntry } from '../store/useStore'
import { isCryptoSymbol } from '../lib/format'

const PRICE_REFRESH_MS = 15_000

export default function Leaderboard() {
  const { leaderboard, setLeaderboard } = useStore()
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'value' | 'pnl' | 'trades'>('value')
  const [livePrices, setLivePrices] = useState<Record<string, number>>({})
  const symbolsRef = useRef<string[]>([])

  const refreshLeaderboard = useCallback(async () => {
    try {
      const data = await getLeaderboard()
      setLeaderboard(data.leaderboard)
      return data.leaderboard as LeaderboardEntry[]
    } catch {}
    return null
  }, [setLeaderboard])

  const refreshStockPrices = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) return
    const priceMap: Record<string, number> = {}
    await Promise.all(symbols.map(async (s) => {
      try {
        const d = await fetchStockQuote(s)
        priceMap[s] = parseFloat(d.price)
      } catch {}
    }))
    if (Object.keys(priceMap).length > 0) {
      setLivePrices(prev => ({ ...prev, ...priceMap }))
    }
  }, [])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    const wsRefs: WebSocket[] = []
    const load = async () => {
      try {
        const entries = await refreshLeaderboard()
        if (!entries) return

        const allSymbols = new Set<string>()
        entries.forEach((entry: LeaderboardEntry) => {
          entry.holdings.forEach(h => allSymbols.add(h.symbol))
        })

        const symbols = [...allSymbols]
        symbolsRef.current = symbols

        const cryptoSymbols = symbols.filter(s => isCryptoSymbol(s))
        const stockSymbols = symbols.filter(s => !isCryptoSymbol(s))

        if (cryptoSymbols.length > 0) {
          const streams = cryptoSymbols.map(s => `${s.toLowerCase()}@ticker`).join('/')
          const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`)
          wsRefs.push(ws)
          ws.onmessage = (e) => {
            try {
              const msg = JSON.parse(e.data)
              const d = msg.data
              if (d && d.s && d.c) {
                setLivePrices(prev => ({ ...prev, [d.s]: parseFloat(d.c) }))
              }
            } catch {}
          }
        }

        if (stockSymbols.length > 0) {
          await refreshStockPrices(stockSymbols)
          interval = setInterval(() => {
            const stocks = symbolsRef.current.filter(s => !isCryptoSymbol(s))
            if (stocks.length > 0) refreshStockPrices(stocks)
          }, PRICE_REFRESH_MS)
        }
      } finally { setLoading(false) }
    }
    load()
    return () => {
      if (interval) clearInterval(interval)
      wsRefs.forEach(ws => ws.close())
    }
  }, [refreshLeaderboard, refreshStockPrices])

  const computeValue = (entry: LeaderboardEntry) => {
    if (!entry.holdings || entry.holdings.length === 0) return entry.portfolioValue
    const holdingsValue = entry.holdings.reduce((sum, h) => {
      const qty = parseFloat(h.quantity)
      const price = livePrices[h.symbol] ?? parseFloat(h.avgEntryPrice)
      return sum + qty * price
    }, 0)
    return entry.usdBalance + holdingsValue
  }

  const enriched = leaderboard.map(entry => {
    const hasLiveData = entry.holdings?.some(h => livePrices[h.symbol] !== undefined)
    const value = hasLiveData ? computeValue(entry) : entry.portfolioValue
    const pnl = value - 100000
    const pnlPercent = (pnl / 100000) * 100
    return { ...entry, liveValue: value, livePnl: pnl, livePnlPercent: pnlPercent }
  })

  const sorted = [...enriched].sort((a, b) => {
    if (sortBy === 'value') return b.liveValue - a.liveValue
    if (sortBy === 'pnl') return b.livePnlPercent - a.livePnlPercent
    return b.totalTrades - a.totalTrades
  })

  const getRankBadge = (idx: number) => {
    if (idx === 0) return <span className="inline-flex w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 items-center justify-center text-xs font-bold">1</span>
    if (idx === 1) return <span className="inline-flex w-6 h-6 rounded-full bg-slate-400/20 text-slate-300 items-center justify-center text-xs font-bold">2</span>
    if (idx === 2) return <span className="inline-flex w-6 h-6 rounded-full bg-amber-700/20 text-amber-600 items-center justify-center text-xs font-bold">3</span>
    return <span className="inline-flex w-6 h-6 items-center justify-center text-xs text-slate-500 font-mono">{idx + 1}</span>
  }

  return (
    <div className="p-4 max-w-5xl mx-auto animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <h1 className="font-display text-2xl font-bold">Leaderboard</h1>
          {!loading && sorted.length > 0 && (
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        <div className="flex gap-1 bg-dark-800 rounded-lg p-1 border border-dark-600/30">
          {([['value', 'Value'], ['pnl', 'P&L %'], ['trades', 'Trades']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                sortBy === key ? 'bg-brand/15 text-brand' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="card-glow p-12 text-center">
          <div className="text-4xl mb-3">🏆</div>
          <h3 className="font-display text-lg font-semibold text-slate-300">No traders yet</h3>
          <p className="text-sm text-slate-500 mt-1">Be the first to join the competition!</p>
        </div>
      ) : (
        <div className="card-glow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-600/30">
                  <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Rank</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium">Trader</th>
                  <th className="text-right px-4 py-3 text-xs text-slate-500 font-medium">
                    <span className="flex items-center justify-end gap-1.5">
                      Portfolio Value
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-profit/10 text-profit text-[9px] font-bold uppercase tracking-wider">
                        <span className="w-1 h-1 rounded-full bg-profit animate-pulse" />
                        Live
                      </span>
                    </span>
                  </th>
                  <th className="text-right px-4 py-3 text-xs text-slate-500 font-medium">P&L</th>
                  <th className="text-right px-4 py-3 text-xs text-slate-500 font-medium hidden sm:table-cell">Trades</th>
                  <th className="text-right px-4 py-3 text-xs text-slate-500 font-medium hidden md:table-cell">Assets</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((entry, idx) => (
                  <tr key={entry.userId} className="border-b border-dark-600/20 hover:bg-dark-700/30 transition-colors">
                    <td className="px-4 py-3">{getRankBadge(idx)}</td>
                    <td className="px-4 py-3">
                      <Link to={`/trader/${entry.userId}`} className="flex items-center gap-2.5 group">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand/60 to-brand-dark/60 flex items-center justify-center text-xs font-bold text-dark-950">
                          {entry.traderName[0].toUpperCase()}
                        </div>
                        <div className="text-sm font-medium group-hover:text-brand transition-colors">{entry.traderName}</div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">{formatUSD(entry.liveValue)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-mono text-sm ${entry.livePnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {formatPercent(entry.livePnlPercent)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-slate-400 hidden sm:table-cell">
                      {entry.totalTrades}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-slate-400 hidden md:table-cell">
                      {entry.holdingsCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
