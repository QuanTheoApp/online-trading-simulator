const YAHOO_BASE = 'https://query2.finance.yahoo.com'
const YAHOO_CHART = 'https://query1.finance.yahoo.com'

async function searchStocks(query: string) {
  const res = await fetch(
    `${YAHOO_BASE}/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=20&newsCount=0&enableFuzzyQuery=false`
  )
  if (!res.ok) throw new Error('Search failed')
  const data = await res.json()
  return (data.quotes || [])
    .filter((q: any) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF' || q.quoteType === 'INDEX')
    .map((q: any) => ({
      symbol: q.symbol,
      name: q.shortname || q.longname || q.symbol,
      type: q.quoteType,
      exchange: q.exchDisp || q.exchange,
    }))
}

async function getQuote(symbol: string) {
  const res = await fetch(
    `${YAHOO_CHART}/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d&includePrePost=false`
  )
  if (!res.ok) throw new Error('Quote failed')
  const data = await res.json()
  const result = data.chart?.result?.[0]
  if (!result) throw new Error('No data')

  const meta = result.meta
  const quotes = result.indicators?.quote?.[0]
  const timestamps = result.timestamp || []

  let prevClose = meta.chartPreviousClose || meta.previousClose || 0
  let lastPrice = meta.regularMarketPrice || 0
  let high24 = 0, low24 = Infinity, volume = 0

  if (quotes && timestamps.length > 0) {
    for (let i = 0; i < timestamps.length; i++) {
      if (quotes.high?.[i] != null && quotes.high[i] > high24) high24 = quotes.high[i]
      if (quotes.low?.[i] != null && quotes.low[i] < low24) low24 = quotes.low[i]
      if (quotes.volume?.[i] != null) volume += quotes.volume[i]
    }
  }
  if (low24 === Infinity) low24 = 0

  const change = lastPrice - prevClose
  const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0

  return {
    symbol: meta.symbol,
    price: String(lastPrice),
    prevClose: String(prevClose),
    change: String(change.toFixed(2)),
    changePercent: String(changePercent.toFixed(2)),
    high: String(high24),
    low: String(low24),
    volume: String(volume),
    currency: meta.currency || 'USD',
    exchange: meta.exchangeName || '',
    marketState: meta.marketState || '',
  }
}

async function getChart(symbol: string, interval: string, range: string) {
  const res = await fetch(
    `${YAHOO_CHART}/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&includePrePost=false`
  )
  if (!res.ok) throw new Error('Chart failed')
  const data = await res.json()
  const result = data.chart?.result?.[0]
  if (!result) throw new Error('No data')

  const timestamps = result.timestamp || []
  const quotes = result.indicators?.quote?.[0]
  if (!quotes) return []

  return timestamps
    .map((t: number, i: number) => {
      const o = quotes.open?.[i]
      const h = quotes.high?.[i]
      const l = quotes.low?.[i]
      const c = quotes.close?.[i]
      if (o == null || h == null || l == null || c == null) return null
      return { time: t, open: o, high: h, low: l, close: c, volume: quotes.volume?.[i] || 0 }
    })
    .filter(Boolean)
}

export default async (req: Request) => {
  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  try {
    if (action === 'search') {
      const q = url.searchParams.get('q') || ''
      if (q.length < 1) return Response.json({ results: [] })
      const results = await searchStocks(q)
      return Response.json({ results })
    }

    if (action === 'quote') {
      const symbol = url.searchParams.get('symbol')
      if (!symbol) return Response.json({ error: 'Symbol required' }, { status: 400 })
      const quote = await getQuote(symbol)
      return Response.json(quote)
    }

    if (action === 'chart') {
      const symbol = url.searchParams.get('symbol')
      const interval = url.searchParams.get('interval') || '1d'
      const range = url.searchParams.get('range') || '6mo'
      if (!symbol) return Response.json({ error: 'Symbol required' }, { status: 400 })
      const klines = await getChart(symbol, interval, range)
      return Response.json({ klines })
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    return Response.json({ error: err.message || 'Stock API error' }, { status: 502 })
  }
}

export const config = { path: '/api/stock' }
