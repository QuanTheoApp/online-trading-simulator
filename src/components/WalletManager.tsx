import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { getWallets, createWallet, deleteWallet, executeWalletTrade } from '../lib/api'
import { formatUSD, formatCrypto, formatPrice, symbolToName, getBaseFromSymbol } from '../lib/format'

const ICONS = ['📊', '🚀', '💎', '🔥', '⚡', '🎯', '🏆', '💰', '🌟', '🦊']

export default function WalletManager() {
  const { isReady, wallets, setWallets, addToast, currentPrice, currentSymbol } = useStore()
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('📊')
  const [newBalance, setNewBalance] = useState('10000')
  const [creating, setCreating] = useState(false)
  const [expandedWallet, setExpandedWallet] = useState<number | null>(null)
  const [tradeSymbol, setTradeSymbol] = useState('BTCUSDT')
  const [tradeSide, setTradeSide] = useState<'buy' | 'sell'>('buy')
  const [tradeAmount, setTradeAmount] = useState('')
  const [tradePrice, setTradePrice] = useState('')
  const [trading, setTrading] = useState(false)

  useEffect(() => {
    if (!isReady) { setLoading(false); return }
    loadWallets()
  }, [isReady])

  const loadWallets = async () => {
    try {
      const data = await getWallets()
      setWallets(data.wallets)
    } catch {} finally { setLoading(false) }
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      await createWallet(newName, newIcon, parseFloat(newBalance) || 10000)
      await loadWallets()
      setShowCreate(false)
      setNewName('')
      setNewBalance('10000')
      addToast('success', `Wallet "${newName}" created!`)
    } catch (err: any) {
      addToast('error', err.message)
    } finally { setCreating(false) }
  }

  const handleDelete = async (id: number, name: string) => {
    try {
      await deleteWallet(id)
      await loadWallets()
      addToast('info', `Wallet "${name}" deleted`)
    } catch (err: any) {
      addToast('error', err.message)
    }
  }

  const handleWalletTrade = async (walletId: number) => {
    const qty = parseFloat(tradeAmount)
    const price = parseFloat(tradePrice) || currentPrice
    if (!qty || !price) return

    setTrading(true)
    try {
      await executeWalletTrade(walletId, tradeSymbol, tradeSide, qty, price)
      await loadWallets()
      setTradeAmount('')
      addToast('success', `${tradeSide === 'buy' ? 'Bought' : 'Sold'} ${formatCrypto(qty)} ${getBaseFromSymbol(tradeSymbol)}`)
    } catch (err: any) {
      addToast('error', err.message)
    } finally { setTrading(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 max-w-5xl mx-auto animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Custom Wallets</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary text-sm">
          {showCreate ? 'Cancel' : '+ New Wallet'}
        </button>
      </div>

      {showCreate && (
        <div className="card-glow p-5 mb-6 animate-fadeIn">
          <h3 className="font-display font-semibold text-sm text-slate-300 mb-4">Create New Wallet</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Wallet Name</label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="input-field"
                placeholder="My Growth Portfolio"
                maxLength={40}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Starting Balance (USD)</label>
              <input
                type="number"
                value={newBalance}
                onChange={e => setNewBalance(e.target.value)}
                className="input-field font-mono"
                min="100"
                max="1000000"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-xs text-slate-500 mb-1.5">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setNewIcon(icon)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                    newIcon === icon ? 'bg-brand/20 ring-2 ring-brand/50' : 'bg-dark-700/50 hover:bg-dark-600/50'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="btn-primary mt-4"
          >
            {creating ? 'Creating...' : 'Create Wallet'}
          </button>
        </div>
      )}

      {wallets.length === 0 ? (
        <div className="card-glow p-12 text-center">
          <div className="text-4xl mb-3">💎</div>
          <h3 className="font-display text-lg font-semibold text-slate-300">No wallets yet</h3>
          <p className="text-sm text-slate-500 mt-1">Create your first fantasy portfolio to start competing</p>
        </div>
      ) : (
        <div className="space-y-3">
          {wallets.map(w => {
            const holdingsValue = w.holdings.reduce((sum, h) => sum + parseFloat(h.quantity) * parseFloat(h.avgEntryPrice), 0)
            const totalValue = parseFloat(w.usdBalance) + holdingsValue
            const pnl = totalValue - parseFloat(w.initialBalance)
            const pnlPct = (pnl / parseFloat(w.initialBalance)) * 100
            const isExpanded = expandedWallet === w.id

            return (
              <div key={w.id} className="card-glow overflow-hidden">
                <div
                  className="p-4 flex items-center gap-3 cursor-pointer hover:bg-dark-700/20 transition-colors"
                  onClick={() => setExpandedWallet(isExpanded ? null : w.id)}
                >
                  <div className="w-10 h-10 rounded-xl bg-dark-700/50 flex items-center justify-center text-xl">{w.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-semibold text-sm">{w.name}</div>
                    <div className="text-xs text-slate-500">{w.holdings.length} assets</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-semibold">{formatUSD(totalValue)}</div>
                    <div className={`text-xs font-mono ${pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {pnl >= 0 ? '+' : ''}{formatUSD(pnl)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
                    </div>
                  </div>
                  <svg className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>

                {isExpanded && (
                  <div className="border-t border-dark-600/30 p-4 space-y-3 animate-fadeIn">
                    <div className="flex gap-3 text-xs">
                      <div className="card p-2.5 flex-1">
                        <span className="text-slate-500">Cash</span>
                        <div className="font-mono mt-0.5">{formatUSD(parseFloat(w.usdBalance))}</div>
                      </div>
                      <div className="card p-2.5 flex-1">
                        <span className="text-slate-500">Invested</span>
                        <div className="font-mono mt-0.5">{formatUSD(holdingsValue)}</div>
                      </div>
                      <div className="card p-2.5 flex-1">
                        <span className="text-slate-500">Start</span>
                        <div className="font-mono mt-0.5">{formatUSD(parseFloat(w.initialBalance))}</div>
                      </div>
                    </div>

                    {w.holdings.length > 0 && (
                      <div className="space-y-1">
                        {w.holdings.map(h => (
                          <div key={h.symbol} className="flex items-center justify-between text-xs p-2 rounded bg-dark-700/20">
                            <span className="font-semibold">{getBaseFromSymbol(h.symbol)}</span>
                            <span className="font-mono text-slate-400">{formatCrypto(parseFloat(h.quantity), 4)} @ ${formatPrice(parseFloat(h.avgEntryPrice))}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 border-t border-dark-600/20">
                      <div className="text-xs text-slate-500 mb-2">Quick Trade</div>
                      <div className="flex gap-2 flex-wrap">
                        <input
                          value={tradeSymbol}
                          onChange={e => setTradeSymbol(e.target.value.toUpperCase())}
                          className="input-field w-28 text-xs"
                          placeholder="BTCUSDT"
                        />
                        <select
                          value={tradeSide}
                          onChange={e => setTradeSide(e.target.value as any)}
                          className="input-field w-20 text-xs"
                        >
                          <option value="buy">Buy</option>
                          <option value="sell">Sell</option>
                        </select>
                        <input
                          type="number"
                          value={tradeAmount}
                          onChange={e => setTradeAmount(e.target.value)}
                          className="input-field w-24 text-xs font-mono"
                          placeholder="Qty"
                          step="any"
                        />
                        <input
                          type="number"
                          value={tradePrice}
                          onChange={e => setTradePrice(e.target.value)}
                          className="input-field w-28 text-xs font-mono"
                          placeholder={`Price (${currentPrice})`}
                          step="any"
                        />
                        <button
                          onClick={() => handleWalletTrade(w.id)}
                          disabled={trading}
                          className={`text-xs ${tradeSide === 'buy' ? 'btn-buy' : 'btn-sell'}`}
                        >
                          {trading ? '...' : tradeSide === 'buy' ? 'Buy' : 'Sell'}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(w.id, w.name)}
                      className="text-xs text-slate-600 hover:text-loss transition-colors"
                    >
                      Delete wallet
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
