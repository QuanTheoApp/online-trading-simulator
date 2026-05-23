import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPublicPortfolio } from '../lib/api'
import { formatUSD, formatPercent, formatCrypto, formatPrice, getBaseFromSymbol, timeAgo } from '../lib/format'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = ['#f0b429', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f97316', '#06b6d4', '#ec4899', '#84cc16', '#6366f1']

interface PublicHolding {
  symbol: string
  quantity: string
  avgEntryPrice: string
  currentPrice: number
}

interface PublicTrade {
  symbol: string
  side: string
  quantity: string
  price: string
  total: string
  createdAt: string
}

interface ProfileData {
  user: {
    id: string
    traderName: string
    portfolioValue: number
    usdBalance: number
    joinedAt: string
  }
  holdings: PublicHolding[]
  stats: {
    totalTrades: number
    totalRealized: number
    winRate: number
    roi: number
    wins: number
    losses: number
    bestTrade: number
    worstTrade: number
  }
  recentTrades: PublicTrade[]
}

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>()
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userId) return
    const load = async () => {
      try {
        const result = await getPublicPortfolio(userId)
        setData(result)
      } catch {
        setError('Trader not found')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-4 max-w-md mx-auto mt-20 animate-fadeIn">
        <div className="card-glow p-8 text-center">
          <h2 className="font-display text-xl font-bold mb-2">Trader Not Found</h2>
          <p className="text-sm text-slate-500 mb-4">This profile doesn't exist or has been removed.</p>
          <Link to="/leaderboard" className="btn-primary px-4 py-2 inline-block">Back to Leaderboard</Link>
        </div>
      </div>
    )
  }

  const { user, holdings, stats, recentTrades } = data
  const totalPnl = user.portfolioValue - 100000
  const totalPnlPct = (totalPnl / 100000) * 100

  const holdingsValue = holdings.reduce((sum, h) => sum + parseFloat(h.quantity) * h.currentPrice, 0)

  const pieData = [
    { name: 'USD Cash', value: user.usdBalance },
    ...holdings.map(h => ({
      name: getBaseFromSymbol(h.symbol),
      value: parseFloat(h.quantity) * h.currentPrice,
    })),
  ].filter(d => d.value > 0)

  return (
    <div className="p-4 max-w-7xl mx-auto animate-fadeIn">
      <div className="mb-4">
        <Link to="/leaderboard" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
          &larr; Back to Leaderboard
        </Link>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand/70 to-brand-dark/70 flex items-center justify-center text-xl font-bold text-dark-950">
          {user.traderName[0].toUpperCase()}
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">{user.traderName}</h1>
          {user.joinedAt && (
            <p className="text-xs text-slate-500">Joined {new Date(user.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="card-glow p-4 animate-pulse-glow">
          <div className="stat-label">Portfolio Value</div>
          <div className="stat-value mt-1">{formatUSD(user.portfolioValue)}</div>
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
          <div className="stat-value mt-1">{stats.winRate.toFixed(1)}%</div>
          <div className="text-xs text-slate-500 mt-0.5">{stats.wins}W / {stats.losses}L</div>
        </div>
        <div className="card p-4">
          <div className="stat-label">Total Trades</div>
          <div className="stat-value mt-1">{stats.totalTrades}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <div className="stat-label">Best Trade</div>
          <div className="stat-value mt-1 text-profit">{formatUSD(stats.bestTrade)}</div>
        </div>
        <div className="card p-4">
          <div className="stat-label">Worst Trade</div>
          <div className="stat-value mt-1 text-loss">{formatUSD(stats.worstTrade)}</div>
        </div>
        <div className="card p-4">
          <div className="stat-label">ROI</div>
          <div className={`stat-value mt-1 ${stats.roi >= 0 ? 'text-profit' : 'text-loss'}`}>
            {formatPercent(stats.roi)}
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
                    <span className="ml-auto font-mono">{((d.value / user.portfolioValue) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">No assets yet</div>
          )}
        </div>

        <div className="card-glow p-4">
          <h3 className="font-display font-semibold text-sm text-slate-400 mb-4">Holdings</h3>
          {holdings.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">No open positions</div>
          ) : (
            <div className="space-y-2">
              {holdings.map(h => {
                const qty = parseFloat(h.quantity)
                const value = qty * h.currentPrice
                const pnl = (h.currentPrice - parseFloat(h.avgEntryPrice)) * qty
                const pnlPct = ((h.currentPrice - parseFloat(h.avgEntryPrice)) / parseFloat(h.avgEntryPrice)) * 100
                return (
                  <div key={h.symbol} className="flex items-center gap-3 p-2.5 rounded-lg bg-dark-700/30">
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

      {recentTrades.length > 0 && (
        <div className="mt-4">
          <h3 className="font-display font-semibold text-sm text-slate-400 mb-3">Recent Trades</h3>
          <div className="space-y-2">
            {recentTrades.map((trade, idx) => {
              const base = getBaseFromSymbol(trade.symbol)
              return (
                <div key={idx} className="card p-3 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    trade.side === 'buy' ? 'bg-profit/10' : 'bg-loss/10'
                  }`}>
                    <svg className={`w-4 h-4 ${trade.side === 'buy' ? 'text-profit' : 'text-loss rotate-180'}`} viewBox="0 0 12 12" fill="currentColor">
                      <path d="M6 1l5 7H1z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold uppercase px-1.5 py-0.5 rounded ${
                        trade.side === 'buy' ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'
                      }`}>
                        {trade.side}
                      </span>
                      <span className="text-sm font-semibold">{base}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-500 mt-0.5">
                      <span>Qty: <span className="font-mono text-slate-400">{formatCrypto(parseFloat(trade.quantity), 6)}</span></span>
                      <span>Price: <span className="font-mono text-slate-400">${formatPrice(parseFloat(trade.price))}</span></span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-semibold">{formatUSD(parseFloat(trade.total))}</div>
                    <div className="text-xs text-slate-500">{timeAgo(trade.createdAt)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
