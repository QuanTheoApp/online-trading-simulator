const STORAGE_KEY = 'ots_player'

function getPlayerHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (data.id) h['X-Player-ID'] = data.id
      if (data.email) h['X-Player-Name'] = data.email
    }
  } catch {}
  return h
}

export async function loginPlayer(email: string, pin: string, traderName?: string): Promise<{ id: string; traderName: string; usdBalance: string; isNew?: boolean }> {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, pin, traderName }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Login failed')
  return data
}

export interface BinancePair {
  symbol: string
  base: string
  quote: string
}

let binancePairsCache: BinancePair[] | null = null

export async function fetchBinancePairs(): Promise<BinancePair[]> {
  if (binancePairsCache) return binancePairsCache
  const res = await fetch('https://api.binance.com/api/v3/exchangeInfo')
  if (!res.ok) throw new Error('Failed to fetch exchange info')
  const data = await res.json()
  binancePairsCache = data.symbols
    .filter((s: any) => s.status === 'TRADING' && s.isSpotTradingAllowed)
    .map((s: any) => ({ symbol: s.symbol, base: s.baseAsset, quote: s.quoteAsset }))
  return binancePairsCache!
}

export interface StockResult {
  symbol: string
  name: string
  type: string
  exchange: string
}

export async function searchStocks(query: string): Promise<StockResult[]> {
  const res = await fetch(`/api/stock?action=search&q=${encodeURIComponent(query)}`)
  if (!res.ok) return []
  const data = await res.json()
  return data.results || []
}

export async function fetchStockQuote(symbol: string) {
  const res = await fetch(`/api/stock?action=quote&symbol=${encodeURIComponent(symbol)}`)
  if (!res.ok) throw new Error('Stock quote failed')
  return res.json()
}

export async function fetchStockChart(symbol: string, interval = '1d', range = '6mo') {
  const res = await fetch(`/api/stock?action=chart&symbol=${encodeURIComponent(symbol)}&interval=${interval}&range=${range}`)
  if (!res.ok) throw new Error('Stock chart failed')
  const data = await res.json()
  return data.klines || []
}

export async function executeTrade(symbol: string, side: 'buy' | 'sell', quantity: number, price: number) {
  const res = await fetch('/api/trade', {
    method: 'POST',
    headers: getPlayerHeaders(),
    body: JSON.stringify({ symbol, side, quantity, price }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Trade failed')
  return data
}

export async function getPortfolio() {
  const res = await fetch('/api/portfolio', { headers: getPlayerHeaders() })
  if (!res.ok) throw new Error('Failed to fetch portfolio')
  return res.json()
}

export async function getTradeHistory(limit = 50, offset = 0) {
  const res = await fetch(`/api/trades?limit=${limit}&offset=${offset}`, { headers: getPlayerHeaders() })
  if (!res.ok) throw new Error('Failed to fetch trades')
  return res.json()
}

export async function getLeaderboard() {
  const res = await fetch('/api/leaderboard')
  if (!res.ok) throw new Error('Failed to fetch leaderboard')
  return res.json()
}

export async function getWallets() {
  const res = await fetch('/api/wallets', { headers: getPlayerHeaders() })
  if (!res.ok) throw new Error('Failed to fetch wallets')
  return res.json()
}

export async function createWallet(name: string, icon: string, initialBalance: number) {
  const res = await fetch('/api/wallets', {
    method: 'POST',
    headers: getPlayerHeaders(),
    body: JSON.stringify({ name, icon, initialBalance }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to create wallet')
  return data
}

export async function executeWalletTrade(walletId: number, symbol: string, side: 'buy' | 'sell', quantity: number, price: number) {
  const res = await fetch(`/api/wallets/${walletId}/trade`, {
    method: 'POST',
    headers: getPlayerHeaders(),
    body: JSON.stringify({ symbol, side, quantity, price }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Wallet trade failed')
  return data
}

export async function deleteWallet(id: number) {
  const res = await fetch(`/api/wallets?id=${id}`, {
    method: 'DELETE',
    headers: getPlayerHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete wallet')
  return res.json()
}

export async function fetchMarketData(symbol: string) {
  const res = await fetch(`/api/prices?symbol=${symbol}`)
  if (!res.ok) throw new Error('Failed to fetch market data')
  return res.json()
}

export async function fetchTickerDirect(symbol: string) {
  const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`)
  if (!res.ok) throw new Error('Symbol not found')
  return res.json()
}

export async function fetchKlinesDirect(symbol: string, interval = '1h', limit = 168) {
  const res = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
  )
  if (!res.ok) throw new Error('Failed to fetch klines')
  const data = await res.json()
  return data.map((k: any) => ({
    time: k[0] / 1000,
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }))
}
