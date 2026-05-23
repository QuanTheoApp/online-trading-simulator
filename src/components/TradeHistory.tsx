import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { getTradeHistory } from '../lib/api'
import { formatUSD, formatCrypto, formatPrice, symbolToName, getBaseFromSymbol, timeAgo } from '../lib/format'

export default function TradeHistory() {
  const { isReady, tradeHistory, setTradeHistory } = useStore()
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all')

  useEffect(() => {
    if (!isReady) { setLoading(false); return }
    const load = async () => {
      try {
        const data = await getTradeHistory(100)
        setTradeHistory(data.trades)
      } catch {} finally { setLoading(false) }
    }
    load()
  }, [isReady])

  const filtered = filter === 'all' ? tradeHistory : tradeHistory.filter(t => t.side === filter)

  return (
    <div className="p-4 max-w-5xl mx-auto animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Trade History</h1>
        <div className="flex gap-1 bg-dark-800 rounded-lg p-1 border border-dark-600/30">
          {(['all', 'buy', 'sell'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                filter === f ? 'bg-brand/15 text-brand' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-glow p-12 text-center">
          <h3 className="font-display text-lg font-semibold text-slate-300">No trades yet</h3>
          <p className="text-sm text-slate-500 mt-1">Execute your first trade to see it here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(trade => {
            const base = getBaseFromSymbol(trade.symbol)
            return (
              <div key={trade.id} className="card hover:bg-dark-700/30 transition-colors p-3 flex items-center gap-3">
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
                    <span className="text-xs text-slate-500">{symbolToName(trade.symbol)}</span>
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
      )}
    </div>
  )
}
