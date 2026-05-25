import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { executeTrade } from '../lib/api'
import { formatUSD, formatPrice, formatCrypto } from '../lib/format'

export default function TradingPanel() {
  const {
    currentSymbol, currentBase, currentPrice, isReady, usdBalance, marketType,
    holdings, setUsdBalance, setHoldings, addToast, requireAuth,
    pendingTradeSide, setPendingTradeSide,
  } = useStore()

  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [usdAmount, setUsdAmount] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (pendingTradeSide) {
      setSide(pendingTradeSide)
      setPendingTradeSide(null)
    }
  }, [pendingTradeSide, setPendingTradeSide])

  const base = currentBase
  const holding = holdings.find(h => h.symbol === currentSymbol)
  const holdingQty = holding ? parseFloat(holding.quantity) : 0
  const holdingValue = holdingQty * currentPrice

  const usdValue = parseFloat(usdAmount) || 0
  const quantity = currentPrice > 0 ? usdValue / currentPrice : 0

  useEffect(() => { setUsdAmount('') }, [currentSymbol, side])

  const handleTrade = async () => {
    if (!isReady) { requireAuth(); return }
    if (usdValue <= 0 || currentPrice <= 0 || quantity <= 0) return

    setLoading(true)
    try {
      const result = await executeTrade(currentSymbol, side, quantity, currentPrice)
      setUsdBalance(parseFloat(result.usdBalance))
      setHoldings(result.holdings)
      addToast('success', `${side === 'buy' ? 'Bought' : 'Sold'} ${formatCrypto(quantity)} ${base} for ${formatUSD(usdValue)}`)
      setUsdAmount('')
    } catch (err: any) {
      addToast('error', err.message)
    } finally {
      setLoading(false)
    }
  }

  const setPercentage = (pct: number) => {
    if (side === 'buy') {
      setUsdAmount((usdBalance * pct).toFixed(2))
    } else {
      setUsdAmount((holdingValue * pct).toFixed(2))
    }
  }

  return (
    <div className="card-glow p-4">
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setSide('buy')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            side === 'buy'
              ? 'bg-profit/15 text-profit border border-profit/30'
              : 'bg-dark-700/40 text-slate-500 border border-transparent hover:text-slate-300'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide('sell')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            side === 'sell'
              ? 'bg-loss/15 text-loss border border-loss/30'
              : 'bg-dark-700/40 text-slate-500 border border-transparent hover:text-slate-300'
          }`}
        >
          Sell
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-xs text-slate-500">Price</span>
            <span className="text-xs text-slate-500">Market</span>
          </div>
          <div className="input-field bg-dark-700/30 flex items-center">
            <span className="font-mono text-sm">{currentPrice > 0 ? formatPrice(currentPrice) : '—'}</span>
            <span className="ml-auto text-xs text-slate-500">USD</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-xs text-slate-500">Amount (USD)</span>
            <span className="text-xs text-slate-500">
              {side === 'buy'
                ? `Avail: ${formatUSD(usdBalance)}`
                : `Value: ${formatUSD(holdingValue)}`
              }
            </span>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium">$</span>
            <input
              type="number"
              value={usdAmount}
              onChange={e => setUsdAmount(e.target.value)}
              placeholder="0.00"
              className="input-field pl-7 pr-16 font-mono"
              step="any"
              min="0"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">USD</span>
          </div>
        </div>

        <div className="flex gap-1.5">
          {[0.25, 0.5, 0.75, 1].map(pct => (
            <button
              key={pct}
              onClick={() => setPercentage(pct)}
              className="flex-1 py-1 text-xs font-medium rounded bg-dark-700/50 text-slate-500 hover:text-slate-300 hover:bg-dark-600/50 transition-colors"
            >
              {pct === 1 ? 'Max' : `${pct * 100}%`}
            </button>
          ))}
        </div>

        <div className="py-2 px-3 rounded-lg bg-dark-700/30 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">You {side === 'buy' ? 'get' : 'sell'}</span>
            <span className="font-mono text-slate-300">{formatCrypto(quantity, 8)} {base}</span>
          </div>
          {side === 'buy' && usdValue > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Remaining</span>
              <span className={`font-mono ${usdBalance - usdValue < 0 ? 'text-loss' : 'text-slate-300'}`}>
                {formatUSD(Math.max(usdBalance - usdValue, 0))}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={handleTrade}
          disabled={loading || usdValue <= 0 || currentPrice <= 0 || (side === 'buy' && usdValue > usdBalance) || (side === 'sell' && usdValue > holdingValue + 0.01)}
          className={`w-full py-3 ${side === 'buy' ? 'btn-buy' : 'btn-sell'}`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Executing...
            </span>
          ) : (
            `${side === 'buy' ? 'Buy' : 'Sell'} ${base}`
          )}
        </button>
      </div>

      {holdingQty > 0 && (
        <div className="mt-4 pt-3 border-t border-dark-600/30">
          <div className="text-xs text-slate-500 mb-2">Your Position</div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Quantity</span>
            <span className="font-mono">{formatCrypto(holdingQty, 6)} {base}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-slate-400">Avg Entry</span>
            <span className="font-mono">{formatPrice(parseFloat(holding!.avgEntryPrice))}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-slate-400">Value</span>
            <span className="font-mono">{formatUSD(holdingQty * currentPrice)}</span>
          </div>
          {currentPrice > 0 && (
            <div className="flex justify-between text-sm mt-1">
              <span className="text-slate-400">P&L</span>
              {(() => {
                const pnl = (currentPrice - parseFloat(holding!.avgEntryPrice)) * holdingQty
                const pnlPct = ((currentPrice - parseFloat(holding!.avgEntryPrice)) / parseFloat(holding!.avgEntryPrice)) * 100
                return (
                  <span className={`font-mono ${pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {pnl >= 0 ? '+' : ''}{formatUSD(pnl)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
                  </span>
                )
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
