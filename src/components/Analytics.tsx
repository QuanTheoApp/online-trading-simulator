import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { getPortfolio, getTradeHistory } from '../lib/api'
import { formatUSD, formatPercent, formatCrypto, symbolToName, getBaseFromSymbol } from '../lib/format'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, Cell } from 'recharts'

export default function Analytics() {
  const { isReady, tradeHistory, setTradeHistory, portfolioStats, setPortfolioStats, setUsdBalance, setHoldings } = useStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isReady) { setLoading(false); return }
    const load = async () => {
      try {
        const [portfolio, trades] = await Promise.all([getPortfolio(), getTradeHistory(200)])
        setUsdBalance(parseFloat(portfolio.user.usdBalance))
        setHoldings(portfolio.holdings)
        setPortfolioStats(portfolio.stats)
        setTradeHistory(trades.trades)
      } catch {} finally { setLoading(false) }
    }
    load()
  }, [isReady])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
      </div>
    )
  }

  const symbolVolume: Record<string, { buys: number; sells: number; total: number }> = {}
  tradeHistory.forEach(t => {
    const sym = getBaseFromSymbol(t.symbol)
    if (!symbolVolume[sym]) symbolVolume[sym] = { buys: 0, sells: 0, total: 0 }
    const val = parseFloat(t.total)
    symbolVolume[sym].total += val
    if (t.side === 'buy') symbolVolume[sym].buys += val
    else symbolVolume[sym].sells += val
  })

  const volumeData = Object.entries(symbolVolume)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 10)
    .map(([name, d]) => ({ name, buys: d.buys, sells: d.sells }))

  const dailyPnl: Record<string, number> = {}
  tradeHistory.forEach(t => {
    const day = new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (!dailyPnl[day]) dailyPnl[day] = 0
    dailyPnl[day] += t.side === 'sell' ? parseFloat(t.total) : -parseFloat(t.total)
  })

  const pnlTimeline = Object.entries(dailyPnl).reverse().slice(0, 30).reverse().map(([date, value]) => ({ date, value }))

  let cumulative = 100000
  const cumulativeData = pnlTimeline.map(d => {
    cumulative += d.value
    return { date: d.date, value: cumulative }
  })

  const stats = portfolioStats

  return (
    <div className="p-4 max-w-7xl mx-auto animate-fadeIn">
      <h1 className="font-display text-2xl font-bold mb-6">Analytics</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="card p-4">
          <div className="stat-label">Realized P&L</div>
          <div className={`stat-value mt-1 ${(stats?.totalRealized || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
            {formatUSD(stats?.totalRealized || 0)}
          </div>
        </div>
        <div className="card p-4">
          <div className="stat-label">Win Rate</div>
          <div className="stat-value mt-1">{(stats?.winRate || 0).toFixed(1)}%</div>
          <div className="w-full h-1.5 bg-dark-600 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-profit rounded-full transition-all" style={{ width: `${stats?.winRate || 0}%` }} />
          </div>
        </div>
        <div className="card p-4">
          <div className="stat-label">Win / Loss</div>
          <div className="stat-value mt-1">
            <span className="text-profit">{stats?.wins || 0}</span>
            <span className="text-slate-500 mx-1">/</span>
            <span className="text-loss">{stats?.losses || 0}</span>
          </div>
        </div>
        <div className="card p-4">
          <div className="stat-label">ROI</div>
          <div className={`stat-value mt-1 ${(stats?.roi || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
            {formatPercent(stats?.roi || 0)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="card-glow p-4">
          <h3 className="font-display font-semibold text-sm text-slate-400 mb-4">Portfolio Value Over Time</h3>
          {cumulativeData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={cumulativeData}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f0b429" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#f0b429" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a40" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    contentStyle={{ background: '#131b2e', border: '1px solid #1e2d4a', borderRadius: '8px', fontSize: 12 }}
                    formatter={(v: number) => [formatUSD(v), 'Value']}
                  />
                  <Area type="monotone" dataKey="value" stroke="#f0b429" fill="url(#grad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-slate-500">Not enough data yet</div>
          )}
        </div>

        <div className="card-glow p-4">
          <h3 className="font-display font-semibold text-sm text-slate-400 mb-4">Volume by Asset</h3>
          {volumeData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={volumeData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a40" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    contentStyle={{ background: '#131b2e', border: '1px solid #1e2d4a', borderRadius: '8px', fontSize: 12 }}
                    formatter={(v: number) => formatUSD(v)}
                  />
                  <Bar dataKey="buys" fill="#10b981" radius={[3, 3, 0, 0]} name="Buys" />
                  <Bar dataKey="sells" fill="#ef4444" radius={[3, 3, 0, 0]} name="Sells" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-slate-500">Not enough data yet</div>
          )}
        </div>
      </div>

      <div className="card-glow p-4">
        <h3 className="font-display font-semibold text-sm text-slate-400 mb-4">Daily P&L</h3>
        {pnlTimeline.length > 0 ? (
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={pnlTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a40" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => `$${v.toFixed(0)}`} />
                <Tooltip
                  contentStyle={{ background: '#131b2e', border: '1px solid #1e2d4a', borderRadius: '8px', fontSize: 12 }}
                  formatter={(v: number) => formatUSD(v)}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[3, 3, 0, 0]}>
                  {pnlTimeline.map((entry, idx) => (
                    <Cell key={idx} fill={entry.value >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-52 flex items-center justify-center text-sm text-slate-500">Not enough data yet</div>
        )}
      </div>
    </div>
  )
}
