export default async (req: Request) => {
  const url = new URL(req.url)
  const symbol = url.searchParams.get('symbol')?.toUpperCase()

  if (!symbol) return Response.json({ error: 'Symbol required' }, { status: 400 })

  try {
    const [tickerRes, klinesRes] = await Promise.all([
      fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`),
      fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=168`),
    ])

    if (!tickerRes.ok) return Response.json({ error: 'Symbol not found' }, { status: 404 })

    const ticker = await tickerRes.json()
    const klines = await klinesRes.json()

    return Response.json({
      ticker: {
        symbol: ticker.symbol,
        price: ticker.lastPrice,
        change: ticker.priceChange,
        changePercent: ticker.priceChangePercent,
        high: ticker.highPrice,
        low: ticker.lowPrice,
        volume: ticker.volume,
        quoteVolume: ticker.quoteVolume,
      },
      klines: klines.map((k: any) => ({
        time: k[0] / 1000,
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
      })),
    })
  } catch (err) {
    return Response.json({ error: 'Failed to fetch market data' }, { status: 502 })
  }
}

export const config = { path: '/api/prices' }
