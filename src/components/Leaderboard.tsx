import { useEffect, useState } from 'react'
import { getLeaderboard } from '../lib/api'
import { formatUSD, formatPercent } from '../lib/format'
import { useStore, LeaderboardEntry } from '../store/useStore'

export default function Leaderboard() {
  const { leaderboard, setLeaderboard } = useStore()
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'value' | 'pnl' | 'trades'>('value')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getLeaderboard()
        setLeaderboard(data.leaderboard)
      } catch {} finally { setLoading(false) }
    }
    load()
  }, [])

  const sorted = [...leaderboard].sort((a, b) => {
    if (sortBy === 'value') return b.portfolioValue - a.portfolioValue
    if (sortBy === 'pnl') return b.pnlPercent - a.pnlPercent
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
        <h1 className="font-display text-2xl font-bold">Leaderboard</h1>
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
                  <th className="text-right px-4 py-3 text-xs text-slate-500 font-medium">Portfolio Value</th>
                  <th className="text-right px-4 py-3 text-xs text-slate-500 font-medium">P&L</th>
                  <th className="text-right px-4 py-3 text-xs text-slate-500 font-medium hidden sm:table-cell">Trades</th>
                  <th className="text-right px-4 py-3 text-xs text-slate-500 font-medium hidden md:table-cell">Assets</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((entry, idx) => (
                  <tr key={entry.traderName} className="border-b border-dark-600/20 hover:bg-dark-700/30 transition-colors">
                    <td className="px-4 py-3">{getRankBadge(idx)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand/60 to-brand-dark/60 flex items-center justify-center text-xs font-bold text-dark-950">
                          {entry.traderName[0].toUpperCase()}
                        </div>
                        <div className="text-sm font-medium">{entry.traderName}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">{formatUSD(entry.portfolioValue)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-mono text-sm ${entry.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {formatPercent(entry.pnlPercent)}
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
