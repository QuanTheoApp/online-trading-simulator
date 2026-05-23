import { useState, useRef, useEffect, useCallback } from 'react'
import { useStore, MarketType } from '../store/useStore'
import { fetchBinancePairs, searchStocks, BinancePair, StockResult } from '../lib/api'
import { symbolToName } from '../lib/format'

const POPULAR_CRYPTO = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'ADAUSDT', 'DOGEUSDT', 'DOTUSDT', 'AVAXUSDT', 'LINKUSDT',
  'ATOMUSDT', 'LTCUSDT', 'UNIUSDT', 'NEARUSDT', 'ARBUSDT',
  'OPUSDT', 'APTUSDT', 'SUIUSDT', 'MATICUSDT', 'SHIBUSDT',
  'FILUSDT', 'PEPEUSDT', 'TRXUSDT', 'AAVEUSDT',
]

const POPULAR_STOCKS: StockResult[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'EQUITY', exchange: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'EQUITY', exchange: 'NASDAQ' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'EQUITY', exchange: 'NASDAQ' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'EQUITY', exchange: 'NASDAQ' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'EQUITY', exchange: 'NASDAQ' },
  { symbol: 'META', name: 'Meta Platforms Inc.', type: 'EQUITY', exchange: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'EQUITY', exchange: 'NASDAQ' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', type: 'EQUITY', exchange: 'NYSE' },
  { symbol: 'V', name: 'Visa Inc.', type: 'EQUITY', exchange: 'NYSE' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'EQUITY', exchange: 'NYSE' },
  { symbol: 'WMT', name: 'Walmart Inc.', type: 'EQUITY', exchange: 'NYSE' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', type: 'ETF', exchange: 'NYSE' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', type: 'ETF', exchange: 'NASDAQ' },
  { symbol: 'DIA', name: 'SPDR Dow Jones ETF', type: 'ETF', exchange: 'NYSE' },
  { symbol: 'IWM', name: 'iShares Russell 2000 ETF', type: 'ETF', exchange: 'NYSE' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', type: 'EQUITY', exchange: 'NASDAQ' },
  { symbol: 'NFLX', name: 'Netflix Inc.', type: 'EQUITY', exchange: 'NASDAQ' },
  { symbol: 'DIS', name: 'Walt Disney Company', type: 'EQUITY', exchange: 'NYSE' },
  { symbol: 'BA', name: 'Boeing Company', type: 'EQUITY', exchange: 'NYSE' },
  { symbol: 'COIN', name: 'Coinbase Global Inc.', type: 'EQUITY', exchange: 'NASDAQ' },
]

export default function SearchBar() {
  const { currentSymbol, currentBase, currentQuote, setCurrentSymbol, marketType, setMarketType } = useStore()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [allPairs, setAllPairs] = useState<BinancePair[]>([])
  const [stockResults, setStockResults] = useState<StockResult[]>([])
  const [stockLoading, setStockLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    fetchBinancePairs().then(setAllPairs).catch(() => {})
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const searchStocksDebounced = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length < 1) { setStockResults([]); return }
    setStockLoading(true)
    debounceRef.current = setTimeout(() => {
      searchStocks(q).then(r => { setStockResults(r); setStockLoading(false) }).catch(() => setStockLoading(false))
    }, 300)
  }, [])

  const handleQueryChange = (val: string) => {
    setQuery(val)
    setOpen(val.length > 0)
    if (marketType === 'stock') searchStocksDebounced(val)
  }

  const handleTabSwitch = (t: MarketType) => {
    setMarketType(t)
    setQuery('')
    setStockResults([])
    setOpen(false)
  }

  const handleSelectCrypto = (pair: BinancePair) => {
    setMarketType('crypto')
    setCurrentSymbol(pair.symbol, pair.base, pair.quote)
    setQuery('')
    setOpen(false)
  }

  const handleSelectStock = (stock: StockResult) => {
    setMarketType('stock')
    setCurrentSymbol(stock.symbol, stock.symbol, 'USD')
    setQuery('')
    setOpen(false)
  }

  const filteredCrypto = query.length > 0
    ? allPairs
        .filter(p =>
          p.symbol.toLowerCase().includes(query.toLowerCase()) ||
          p.base.toLowerCase().includes(query.toLowerCase()) ||
          symbolToName(p.base).toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 60)
    : []

  const displayStocks = query.length > 0 ? stockResults : []

  const placeholder = marketType === 'crypto'
    ? `Search all Binance pairs — ${currentBase}/${currentQuote}`
    : `Search U.S. stocks & ETFs — ${currentSymbol}`

  return (
    <div ref={ref} className="relative">
      <div className="flex gap-1 mb-2">
        <button
          onClick={() => handleTabSwitch('crypto')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            marketType === 'crypto'
              ? 'bg-brand/15 text-brand border border-brand/30'
              : 'bg-dark-700/40 text-slate-500 border border-transparent hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 0v20m-7-3.5h14M5 7.5h14"/></svg>
            Crypto
          </span>
        </button>
        <button
          onClick={() => handleTabSwitch('stock')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            marketType === 'stock'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-dark-700/40 text-slate-500 border border-transparent hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            U.S. Stocks
          </span>
        </button>
      </div>

      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => handleQueryChange(e.target.value)}
          onFocus={() => { if (query.length > 0) setOpen(true) }}
          placeholder={placeholder}
          className="input-field pl-9 pr-4 py-2"
        />
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 card-glow max-h-80 overflow-y-auto z-50 p-1">
          {marketType === 'crypto' ? (
            <>
              {filteredCrypto.length > 0 && (
                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-600 font-semibold">
                  {filteredCrypto.length} result{filteredCrypto.length !== 1 ? 's' : ''}
                </div>
              )}
              {filteredCrypto.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-slate-500">No pairs found</div>
              ) : (
                filteredCrypto.map(p => {
                  const isActive = p.symbol === currentSymbol && marketType === 'crypto'
                  return (
                    <button
                      key={p.symbol}
                      onClick={() => handleSelectCrypto(p)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        isActive ? 'bg-brand/10 text-brand' : 'hover:bg-dark-700/50 text-slate-300'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-dark-600 flex items-center justify-center text-xs font-bold font-mono shrink-0">
                        {p.base.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold">{p.base}<span className="text-slate-500">/{p.quote}</span></div>
                        <div className="text-xs text-slate-500 truncate">{symbolToName(p.base)}</div>
                      </div>
                    </button>
                  )
                })
              )}
            </>
          ) : (
            <>
              {stockLoading && query.length > 0 ? (
                <div className="px-3 py-6 text-center text-sm text-slate-500">
                  <div className="w-5 h-5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin mx-auto mb-2" />
                  Searching...
                </div>
              ) : (
                <>
                  {displayStocks.length === 0 ? (
                    <div className="px-3 py-6 text-center text-sm text-slate-500">No stocks found</div>
                  ) : (
                    displayStocks.map(s => {
                      const isActive = s.symbol === currentSymbol && marketType === 'stock'
                      return (
                        <button
                          key={s.symbol}
                          onClick={() => handleSelectStock(s)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                            isActive ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-dark-700/50 text-slate-300'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                            s.type === 'ETF' ? 'bg-purple-900/50 text-purple-400' : 'bg-emerald-900/50 text-emerald-400'
                          }`}>
                            {s.symbol.slice(0, 2)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">{s.symbol}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                s.type === 'ETF' ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-700/50 text-slate-500'
                              }`}>{s.type}</span>
                            </div>
                            <div className="text-xs text-slate-500 truncate">{s.name}</div>
                          </div>
                          <div className="text-[10px] text-slate-600 shrink-0">{s.exchange}</div>
                        </button>
                      )
                    })
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
