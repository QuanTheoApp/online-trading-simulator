import { useStore } from '../store/useStore'

export default function MarketSplash() {
  const { setCurrentSymbol, setMarketType, setShowSplash, player } = useStore()

  const handleCrypto = () => {
    setMarketType('crypto')
    setCurrentSymbol('BTCUSDT', 'BTC', 'USDT')
    setShowSplash(false)
  }

  const handleStock = () => {
    setMarketType('stock')
    setCurrentSymbol('TSLA', 'TSLA', 'USD')
    setShowSplash(false)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-10">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-brand to-brand-dark items-center justify-center mb-4 shadow-lg shadow-brand/20">
            <svg viewBox="0 0 20 20" className="w-7 h-7 text-dark-950">
              <path fill="currentColor" d="M10 2l2.5 3.5H15l-2 3.5 2.5 4H5L7.5 9l-2-3.5h2.5z"/>
            </svg>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">
            Welcome{player ? `, ${player.traderName}` : ''}
          </h1>
          <p className="text-slate-500 text-sm sm:text-base">Choose a market to start trading on OTS</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <button
            onClick={handleCrypto}
            className="group card-glow p-8 sm:p-10 text-left transition-all duration-300 hover:border-brand/40 hover:shadow-brand/10 hover:shadow-xl active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center mb-5 group-hover:bg-brand/20 transition-colors">
              <svg className="w-6 h-6 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 0v20m-7-3.5h14M5 7.5h14"/>
              </svg>
            </div>
            <h2 className="font-display text-xl font-bold mb-2">Crypto Trading</h2>
            <p className="text-sm text-slate-500 mb-4">Trade cryptocurrency pairs with real-time Binance data</p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-1 rounded bg-brand/10 text-brand border border-brand/20">BTC/USDT</span>
              <span className="text-xs text-slate-600">default pair</span>
            </div>
          </button>

          <button
            onClick={handleStock}
            className="group card-glow p-8 sm:p-10 text-left transition-all duration-300 hover:border-emerald-500/40 hover:shadow-emerald-500/10 hover:shadow-xl active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 group-hover:bg-emerald-500/20 transition-colors">
              <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <h2 className="font-display text-xl font-bold mb-2">U.S. Market Trading</h2>
            <p className="text-sm text-slate-500 mb-4">Trade stocks and ETFs from major U.S. exchanges</p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">TSLA</span>
              <span className="text-xs text-slate-600">default ticker</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
