import { useEffect, useState, useRef } from 'react'
import { useStore } from '../store/useStore'
import { fetchTickerDirect, fetchStockQuote } from '../lib/api'
import { formatPrice, formatPercent, formatCompact, symbolToName } from '../lib/format'
import SearchBar from './SearchBar'
import PriceChart from './PriceChart'
import TradingPanel from './TradingPanel'

export default function TradingView() {
  const { currentSymbol, currentBase, currentQuote, currentPrice, isReady, marketType } = useStore()
  const [ticker, setTicker] = useState<any>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    let cancelled = false

    if (wsRef.current) { wsRef.current.close(); wsRef.current = null }
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = undefined }

    if (marketType === 'crypto') {
      const load = async () => {
        try {
          const data = await fetchTickerDirect(currentSymbol)
          if (!cancelled) setTicker(data)
        } catch {}
      }
      load()

      const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${currentSymbol.toLowerCase()}@ticker`)
      wsRef.current = ws
      ws.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data)
          setTicker((prev: any) => ({
            ...prev,
            lastPrice: d.c,
            priceChangePercent: d.P,
            priceChange: d.p,
            highPrice: d.h,
            lowPrice: d.l,
            volume: d.v,
            quoteVolume: d.q,
          }))
        } catch {}
      }
    } else {
      const fetchQuote = async () => {
        try {
          const data = await fetchStockQuote(currentSymbol)
          if (!cancelled) {
            setTicker({
              lastPrice: data.price,
              priceChangePercent: data.changePercent,
              priceChange: data.change,
              highPrice: data.high,
              lowPrice: data.low,
              volume: data.volume,
              quoteVolume: data.volume,
              marketState: data.marketState,
            })
            useStore.getState().setCurrentPrice(parseFloat(data.price))
          }
        } catch {}
      }
      fetchQuote()
      pollRef.current = setInterval(fetchQuote, 15000)
    }

    return () => {
      cancelled = true
      if (wsRef.current) wsRef.current.close()
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [currentSymbol, marketType])

  useEffect(() => {
    if (isReady) {
      import('../lib/api').then(({ getPortfolio }) =>
        getPortfolio().then(data => {
          useStore.getState().setUsdBalance(parseFloat(data.user.usdBalance))
          useStore.getState().setHoldings(data.holdings)
          useStore.getState().setPortfolioStats(data.stats)
        }).catch(() => {})
      )
    }
  }, [isReady])

  const change = ticker ? parseFloat(ticker.priceChangePercent) : 0
  const isUp = change >= 0

  const displayName = marketType === 'crypto' ? symbolToName(currentBase) : ''
  const pairLabel = marketType === 'crypto'
    ? <>{currentBase}<span className="text-slate-500 text-lg">/{currentQuote}</span></>
    : <>{currentSymbol}<span className="text-slate-500 text-lg"> USD</span></>

  return (
    <div className="p-3 lg:p-4 max-w-[1600px] mx-auto animate-fadeIn">
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchBar />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-1">
          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="font-display text-2xl font-bold">{pairLabel}</h1>
              {displayName && <span className="text-xs text-slate-500">{displayName}</span>}
              {marketType === 'stock' && ticker?.marketState && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  ticker.marketState === 'REGULAR' ? 'bg-profit/10 text-profit' : 'bg-slate-700/50 text-slate-500'
                }`}>
                  {ticker.marketState === 'REGULAR' ? 'OPEN' : ticker.marketState === 'PRE' ? 'PRE-MARKET' : ticker.marketState === 'POST' ? 'AFTER-HOURS' : 'CLOSED'}
                </span>
              )}
            </div>
          </div>
          <div className="font-mono text-3xl font-bold tracking-tight">
            ${currentPrice > 0 ? formatPrice(currentPrice) : '—'}
          </div>
          {ticker && (
            <>
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-sm font-mono font-semibold ${
                isUp ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'
              }`}>
                <svg className={`w-3 h-3 ${isUp ? '' : 'rotate-180'}`} viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 2l4 5H2z"/>
                </svg>
                {formatPercent(change)}
              </div>
              <div className="hidden sm:flex gap-6 text-xs">
                <div>
                  <span className="text-slate-500">{marketType === 'crypto' ? '24h High' : 'High'} </span>
                  <span className="font-mono text-slate-300">${formatPrice(parseFloat(ticker.highPrice))}</span>
                </div>
                <div>
                  <span className="text-slate-500">{marketType === 'crypto' ? '24h Low' : 'Low'} </span>
                  <span className="font-mono text-slate-300">${formatPrice(parseFloat(ticker.lowPrice))}</span>
                </div>
                <div>
                  <span className="text-slate-500">Volume </span>
                  <span className="font-mono text-slate-300">{formatCompact(parseFloat(ticker.quoteVolume || ticker.volume))}</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="max-w-md">
          <TradingPanel />
        </div>

        <PriceChart />

        {ticker && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:hidden">
            <div className="card p-2.5">
              <div className="stat-label">{marketType === 'crypto' ? '24h High' : 'High'}</div>
              <div className="font-mono text-sm mt-0.5">${formatPrice(parseFloat(ticker.highPrice))}</div>
            </div>
            <div className="card p-2.5">
              <div className="stat-label">{marketType === 'crypto' ? '24h Low' : 'Low'}</div>
              <div className="font-mono text-sm mt-0.5">${formatPrice(parseFloat(ticker.lowPrice))}</div>
            </div>
            <div className="card p-2.5">
              <div className="stat-label">Volume</div>
              <div className="font-mono text-sm mt-0.5">{formatCompact(parseFloat(ticker.quoteVolume || ticker.volume))}</div>
            </div>
            <div className="card p-2.5">
              <div className="stat-label">Change</div>
              <div className={`font-mono text-sm mt-0.5 ${isUp ? 'text-profit' : 'text-loss'}`}>{formatPercent(change)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
