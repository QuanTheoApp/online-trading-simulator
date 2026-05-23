import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts'
import { fetchKlinesDirect, fetchStockChart } from '../lib/api'
import { useStore } from '../store/useStore'

const CRYPTO_INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d']
const STOCK_INTERVALS = [
  { label: '1D', interval: '5m', range: '1d' },
  { label: '5D', interval: '15m', range: '5d' },
  { label: '1M', interval: '1h', range: '1mo' },
  { label: '3M', interval: '1d', range: '3mo' },
  { label: '6M', interval: '1d', range: '6mo' },
  { label: '1Y', interval: '1d', range: '1y' },
]

export default function PriceChart() {
  const { currentSymbol, setCurrentPrice, marketType } = useStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const [cryptoInterval, setCryptoInterval] = useState('1h')
  const [stockIntervalIdx, setStockIntervalIdx] = useState(2)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#64748b',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#1e2d4a20' },
        horzLines: { color: '#1e2d4a20' },
      },
      crosshair: {
        vertLine: { color: '#f0b42940', labelBackgroundColor: '#f0b429' },
        horzLine: { color: '#f0b42940', labelBackgroundColor: '#f0b429' },
      },
      rightPriceScale: {
        borderColor: '#1e2d4a40',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: '#1e2d4a40',
        timeVisible: true,
      },
      width: container.clientWidth,
      height: container.clientHeight,
    })

    const series = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    })

    chartRef.current = chart
    seriesRef.current = series

    const handleResize = () => {
      chart.applyOptions({ width: container.clientWidth, height: container.clientHeight })
    }
    const observer = new ResizeObserver(handleResize)
    observer.observe(container)

    return () => {
      observer.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    if (wsRef.current) { wsRef.current.close(); wsRef.current = null }

    if (marketType === 'crypto') {
      const loadData = async () => {
        try {
          const limitMap: Record<string, number> = { '1m': 240, '5m': 200, '15m': 200, '1h': 168, '4h': 120, '1d': 120 }
          const klines = await fetchKlinesDirect(currentSymbol, cryptoInterval, limitMap[cryptoInterval] || 168)
          if (cancelled || !seriesRef.current) return
          seriesRef.current.setData(klines as CandlestickData<Time>[])
          if (klines.length > 0) setCurrentPrice(klines[klines.length - 1].close)
          chartRef.current?.timeScale().fitContent()
        } catch (err) {
          console.error('Chart data error:', err)
        } finally {
          if (!cancelled) setLoading(false)
        }
      }
      loadData()

      const wsSymbol = currentSymbol.toLowerCase()
      const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${wsSymbol}@kline_${cryptoInterval}`)
      wsRef.current = ws
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.k && seriesRef.current) {
            const k = msg.k
            seriesRef.current.update({
              time: (k.t / 1000) as Time,
              open: parseFloat(k.o),
              high: parseFloat(k.h),
              low: parseFloat(k.l),
              close: parseFloat(k.c),
            })
            setCurrentPrice(parseFloat(k.c))
          }
        } catch {}
      }
    } else {
      const si = STOCK_INTERVALS[stockIntervalIdx]
      const loadData = async () => {
        try {
          const klines = await fetchStockChart(currentSymbol, si.interval, si.range)
          if (cancelled || !seriesRef.current) return
          seriesRef.current.setData(klines as CandlestickData<Time>[])
          if (klines.length > 0) setCurrentPrice(klines[klines.length - 1].close)
          chartRef.current?.timeScale().fitContent()
        } catch (err) {
          console.error('Stock chart error:', err)
        } finally {
          if (!cancelled) setLoading(false)
        }
      }
      loadData()
    }

    return () => {
      cancelled = true
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null }
    }
  }, [currentSymbol, marketType, cryptoInterval, stockIntervalIdx, setCurrentPrice])

  return (
    <div className="card-glow overflow-hidden">
      <div className="flex items-center gap-1 px-3 py-2 border-b border-dark-600/30">
        {marketType === 'crypto' ? (
          CRYPTO_INTERVALS.map(i => (
            <button
              key={i}
              onClick={() => setCryptoInterval(i)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                i === cryptoInterval ? 'bg-brand/15 text-brand' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {i}
            </button>
          ))
        ) : (
          STOCK_INTERVALS.map((si, idx) => (
            <button
              key={si.label}
              onClick={() => setStockIntervalIdx(idx)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                idx === stockIntervalIdx ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {si.label}
            </button>
          ))
        )}
      </div>
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-dark-800/60 backdrop-blur-sm">
            <div className="w-6 h-6 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
          </div>
        )}
        <div ref={containerRef} className="w-full h-[350px] lg:h-[450px]" />
      </div>
    </div>
  )
}
