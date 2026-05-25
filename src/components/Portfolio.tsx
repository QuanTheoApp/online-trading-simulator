import { useEffect, useState, useCallback, useRef } from 'react'
import { useStore } from '../store/useStore'
import { getPortfolio, fetchStockQuote } from '../lib/api'
import { formatUSD, formatPercent, formatCrypto, formatPrice, symbolToName, getBaseFromSymbol, isCryptoSymbol } from '../lib/format'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = ['#f0b429', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f97316', '#06b6d4', '#ec4899', '#84cc16', '#6366f1']
const PRICE_REFRESH_MS = 15_000

export default function Portfolio() {
  const { isReady, holdings, usdBalance, portfolioStats, setUsdBalance, setHoldings, setPortfolioStats } = useStore()
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const symbolsRef = useRef<string[]>([])

  const refreshPrices = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) return
    const priceMap: Record<string, number> = {}
    await Promise.all(symbols.map(async (s) => {
      try {
        if (isCryptoSymbol(s)) {
          const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${s}`)
          const d = await res.json()
          priceMap[s] = parseFloat(d.price)
        } else {
          const d = await fetchStockQuote(s)
          priceMap[s] = parseFloat(d.price)
        }
      } catch {}
    }))
    setPrices(priceMap)
  }, [])

  useEffect(() => {
    if (!isReady) { setLoading(false); return }
    let interval: ReturnType<typeof setInterval>
    const load = async () => {
      try {
        const data = await getPortfolio()
        setUsdBalance(parseFloat(data.user.usdBalance))
        setHoldings(data.holdings)
        setPortfolioStats(data.stats)

        const symbols = data.holdings.map((h: any) => h.symbol)
        symbolsRef.current = symbols
        await refreshPrices(symbols)

        interval = setInterval(() => refreshPrices(symbolsRef.current), PRICE_REFRESH_MS)
      } catch (err) {
        console.error(err)
      } finally { setLoading(false) }
    }
    load()
    return () => { if (interval) clearInterval(interval) }
  }, [isReady, refreshPrices])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
      </div>
    )
  }

  const holdingsValue = holdings.reduce((sum, h) => {
    const p = prices[h.symbol] || parseFloat(h.avgEntryPrice)
    return sum + parseFloat(h.quantity) * p
  }, 0)
  const totalValue = usdBalance + holdingsValue
  const totalPnl = totalValue - 100000
  const totalPnlPct = (totalPnl / 100000) * 100

  const pieData = [
    { name: 'USD Cash', value: usdBalance },
    ...holdings.map(h => ({
      name: getBaseFromSymbol(h.symbol),
      value: parseFloat(h.quantity) * (prices[h.symbol] || parseFloat(h.avgEntryPrice)),
    })),
  ].filter(d => d.value > 0)

  return (
    <div className="p-4 max-w-7xl mx-auto animate-fadeIn">
      <h1 className="font-display text-2xl font-bold mb-6">Portfolio</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="card-glow p-4 animate-pulse-glow">
          <div className="stat-label">Total Value</div>
          <div className="stat-value mt-1">{formatUSD(totalValue)}</div>
        </div>
        <div className="card p-4">
          <div className="stat-label">Total P&L</div>
          <div className={`stat-value mt-1 ${totalPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
            {totalPnl >= 0 ? '+' : ''}{formatUSD(totalPnl)}
          </div>
          <div className={`text-xs font-mono mt-0.5 ${totalPnl >= 0 ? 'text-profit/70' : 'text-loss/70'}`}>
            {formatPercent(totalPnlPct)}
          </div>
        </div>
        <div className="card p-4">
          <div className="stat-label">Win Rate</div>
          <div className="stat-value mt-1">{portfolioStats?.winRate.toFixed(1) || '0'}%</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {portfolioStats?.wins || 0}W / {portfolioStats?.losses || 0}L
          </div>
        </div>
        <div className="card p-4">
          <div className="stat-label">Total Trades</div>
          <div className="stat-value mt-1">{portfolioStats?.totalTrades || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <div className="stat-label">Best Trade</div>
          <div className="stat-value mt-1 text-profit">{formatUSD(portfolioStats?.bestTrade || 0)}</div>
        </div>
        <div className="card p-4">
          <div className="stat-label">Worst Trade</div>
          <div className="stat-value mt-1 text-loss">{formatUSD(portfolioStats?.worstTrade || 0)}</div>
        </div>
        <div className="card p-4">
          <div className="stat-label">ROI</div>
          <div className={`stat-value mt-1 ${(portfolioStats?.roi || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
            {formatPercent(portfolioStats?.roi || 0)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-glow p-4">
          <h3 className="font-display font-semibold text-sm text-slate-400 mb-4">Asset Allocation</h3>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="w-48 h-48">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload?.[0]) {
                          return (
                            <div className="card px-3 py-2 text-xs">
                              <div className="font-semibold">{payload[0].name}</div>
                              <div className="font-mono text-slate-400">{formatUSD(payload[0].value as number)}</div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-slate-400">{d.name}</span>
                    <span className="ml-auto font-mono">{((d.value / totalValue) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">No assets yet — start trading!</div>
          )}
        </div>

        <div className="card-glow p-4">
          <h3 className="font-display font-semibold text-sm text-slate-400 mb-4">Holdings</h3>
          {holdings.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">No open positions</div>
          ) : (
            <div className="space-y-2">
              {holdings.map(h => {
                const price = prices[h.symbol] || parseFloat(h.avgEntryPrice)
                const qty = parseFloat(h.quantity)
                const value = qty * price
                const pnl = (price - parseFloat(h.avgEntryPrice)) * qty
                const pnlPct = ((price - parseFloat(h.avgEntryPrice)) / parseFloat(h.avgEntryPrice)) * 100
                return (
                  <div key={h.symbol} className="flex items-center gap-3 p-2.5 rounded-lg bg-dark-700/30 hover:bg-dark-700/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center text-xs font-bold font-mono">
                      {getBaseFromSymbol(h.symbol).slice(0, 3)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <span className="text-sm font-semibold">{getBaseFromSymbol(h.symbol)}</span>
                        <span className="font-mono text-sm">{formatUSD(value)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{formatCrypto(qty, 4)} @ {formatPrice(parseFloat(h.avgEntryPrice))}</span>
                        <span className={pnl >= 0 ? 'text-profit' : 'text-loss'}>
                          {pnl >= 0 ? '+' : ''}{formatUSD(pnl)} ({formatPercent(pnlPct)})
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
