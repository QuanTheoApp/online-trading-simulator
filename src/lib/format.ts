export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatCrypto(value: number, decimals = 6): string {
  if (value === 0) return '0'
  if (Math.abs(value) < 0.000001) return value.toExponential(2)
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  })
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatCompact(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`
  return formatUSD(value)
}

export function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (price >= 1) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
  if (price >= 0.01) return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 })
  return price.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 8 })
}

const CRYPTO_NAMES: Record<string, string> = {
  BTC: 'Bitcoin', ETH: 'Ethereum', BNB: 'BNB', SOL: 'Solana',
  XRP: 'XRP', ADA: 'Cardano', DOGE: 'Dogecoin', DOT: 'Polkadot',
  MATIC: 'Polygon', AVAX: 'Avalanche', LINK: 'Chainlink', ATOM: 'Cosmos',
  LTC: 'Litecoin', UNI: 'Uniswap', SHIB: 'Shiba Inu', NEAR: 'NEAR',
  ARB: 'Arbitrum', OP: 'Optimism', APT: 'Aptos', SUI: 'Sui',
  FIL: 'Filecoin', PEPE: 'Pepe', TRX: 'TRON', AAVE: 'Aave',
  USDT: 'Tether', USDC: 'USD Coin', BUSD: 'Binance USD', DAI: 'Dai',
  SAND: 'The Sandbox', MANA: 'Decentraland', AXS: 'Axie Infinity',
  ALGO: 'Algorand', FTM: 'Fantom', HBAR: 'Hedera', VET: 'VeChain',
  ICP: 'Internet Computer', EOS: 'EOS', XLM: 'Stellar', THETA: 'Theta',
  XTZ: 'Tezos', EGLD: 'MultiversX', FLOW: 'Flow', CHZ: 'Chiliz',
  GALA: 'Gala', ENJ: 'Enjin', CRV: 'Curve', COMP: 'Compound',
  MKR: 'Maker', SNX: 'Synthetix', GRT: 'The Graph', BAT: 'Basic Attention Token',
  ZEC: 'Zcash', DASH: 'Dash', NEO: 'NEO', WAVES: 'Waves',
  KAVA: 'Kava', ONE: 'Harmony', ZIL: 'Zilliqa', ENS: 'ENS',
  DYDX: 'dYdX', LDO: 'Lido DAO', RPL: 'Rocket Pool', GMX: 'GMX',
  IMX: 'Immutable', RNDR: 'Render', INJ: 'Injective', SEI: 'Sei',
  TIA: 'Celestia', JUP: 'Jupiter', WIF: 'dogwifhat', BONK: 'Bonk',
  FLOKI: 'FLOKI', JASMY: 'JasmyCoin', ROSE: 'Oasis', CFX: 'Conflux',
  LUNC: 'Terra Classic', LUNA: 'Terra', BCH: 'Bitcoin Cash', ETC: 'Ethereum Classic',
  XMR: 'Monero', TON: 'Toncoin', KAS: 'Kaspa', STX: 'Stacks',
  RUNE: 'THORChain', FET: 'Fetch.ai', AGIX: 'SingularityNET',
  WLD: 'Worldcoin', BLUR: 'Blur', PENDLE: 'Pendle', JTO: 'Jito',
  PYTH: 'Pyth Network', ORDI: 'ORDI', SATS: '1000SATS', RAY: 'Raydium',
}

export function symbolToName(symbol: string): string {
  if (CRYPTO_NAMES[symbol]) return CRYPTO_NAMES[symbol]
  const base = symbol.replace(/USDT$|USDC$|BUSD$|BTC$|ETH$|BNB$/, '')
  return CRYPTO_NAMES[base] || base
}

export function getBaseFromSymbol(symbol: string): string {
  return symbol.replace(/USDT$|USDC$|BUSD$|BTC$|ETH$|BNB$|FDUSD$|TUSD$|EUR$|TRY$|GBP$|BRL$|ARS$/, '') || symbol
}

const KNOWN_QUOTE_SUFFIXES = ['USDT', 'USDC', 'BUSD', 'FDUSD', 'TUSD', 'BTC', 'ETH', 'BNB', 'EUR', 'TRY', 'GBP', 'BRL', 'ARS']

export function isCryptoSymbol(symbol: string): boolean {
  return KNOWN_QUOTE_SUFFIXES.some(q => symbol.endsWith(q) && symbol.length > q.length)
}

export function timeAgo(date: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
