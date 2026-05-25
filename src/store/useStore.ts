import { create } from 'zustand'
import { loginPlayer } from '../lib/api'

const STORAGE_KEY = 'ots_player'

export interface PlayerInfo {
  id: string
  email: string
  traderName: string
}

export interface Holding {
  id: number
  userId: string
  symbol: string
  quantity: string
  avgEntryPrice: string
}

export interface Trade {
  id: number
  userId: string
  symbol: string
  side: string
  quantity: string
  price: string
  total: string
  createdAt: string
}

export interface PortfolioStats {
  totalTrades: number
  totalRealized: number
  winRate: number
  roi: number
  wins: number
  losses: number
  bestTrade: number
  worstTrade: number
}

export interface LeaderboardHolding {
  symbol: string
  quantity: string
  avgEntryPrice: string
}

export interface LeaderboardEntry {
  userId: string
  traderName: string
  portfolioValue: number
  usdBalance: number
  pnl: number
  pnlPercent: number
  totalTrades: number
  holdingsCount: number
  holdings: LeaderboardHolding[]
  joinedAt: string
}

export interface Wallet {
  id: number
  userId: string
  name: string
  icon: string
  initialBalance: string
  usdBalance: string
  createdAt: string
  holdings: Holding[]
}

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

export type MarketType = 'crypto' | 'stock'

interface Store {
  player: PlayerInfo | null
  isReady: boolean
  showNameModal: boolean
  setShowNameModal: (show: boolean) => void
  showPinModal: boolean
  setShowPinModal: (show: boolean) => void
  initPlayer: () => void
  setPlayer: (email: string, pin: string, traderName?: string) => Promise<void>
  verifyPin: (pin: string) => Promise<boolean>
  requireAuth: () => boolean
  loginError: string | null
  setLoginError: (err: string | null) => void
  clearPlayer: () => void

  showSplash: boolean
  setShowSplash: (show: boolean) => void

  marketType: MarketType
  setMarketType: (t: MarketType) => void
  currentSymbol: string
  currentBase: string
  currentQuote: string
  setCurrentSymbol: (s: string, base?: string, quote?: string) => void
  currentPrice: number
  setCurrentPrice: (p: number) => void

  usdBalance: number
  setUsdBalance: (b: number) => void
  holdings: Holding[]
  setHoldings: (h: Holding[]) => void
  portfolioStats: PortfolioStats | null
  setPortfolioStats: (s: PortfolioStats) => void

  tradeHistory: Trade[]
  setTradeHistory: (t: Trade[]) => void

  leaderboard: LeaderboardEntry[]
  setLeaderboard: (l: LeaderboardEntry[]) => void

  wallets: Wallet[]
  setWallets: (w: Wallet[]) => void

  pendingTradeSide: 'buy' | 'sell' | null
  setPendingTradeSide: (side: 'buy' | 'sell' | null) => void

  toasts: ToastMessage[]
  addToast: (type: ToastMessage['type'], message: string) => void
  removeToast: (id: string) => void
}

function loadStoredPlayer(): { id: string; email: string; traderName: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (data.id && data.email) return { id: data.id, email: data.email, traderName: data.traderName || '' }
    return null
  } catch {
    return null
  }
}

export const useStore = create<Store>((set, get) => ({
  player: null,
  isReady: false,
  showNameModal: false,
  setShowNameModal: (show) => set({ showNameModal: show }),
  showPinModal: false,
  setShowPinModal: (show) => set({ showPinModal: show }),
  loginError: null,
  setLoginError: (err) => set({ loginError: err }),

  initPlayer: () => {
    // Silent init — don't show modals, just mark state
  },

  requireAuth: () => {
    if (get().isReady) return true
    const stored = loadStoredPlayer()
    if (stored) {
      set({ showPinModal: true })
    } else {
      localStorage.removeItem(STORAGE_KEY)
      set({ showNameModal: true })
    }
    return false
  },

  setPlayer: async (email, pin, traderName) => {
    set({ loginError: null })
    try {
      const data = await loginPlayer(email, pin, traderName)
      const player: PlayerInfo = { id: data.id, email, traderName: data.traderName }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(player))
      set({ player, isReady: true, showNameModal: false })
      if (data.isNew) {
        get().addToast('success', `Welcome! You start with $100,000 virtual funds.`)
      } else {
        get().addToast('success', `Welcome back, ${data.traderName}!`)
      }
    } catch (err: any) {
      set({ loginError: err.message || 'Login failed' })
    }
  },

  verifyPin: async (pin) => {
    set({ loginError: null })
    const stored = loadStoredPlayer()
    if (!stored) return false
    try {
      const data = await loginPlayer(stored.email, pin)
      const player: PlayerInfo = { id: data.id, email: stored.email, traderName: data.traderName }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(player))
      set({
        player,
        isReady: true,
        showPinModal: false,
      })
      return true
    } catch {
      return false
    }
  },

  clearPlayer: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ player: null, isReady: false, holdings: [], usdBalance: 100000, showNameModal: false, showPinModal: false, loginError: null, showSplash: true })
  },

  showSplash: true,
  setShowSplash: (show) => set({ showSplash: show }),

  marketType: 'crypto',
  setMarketType: (t) => set({ marketType: t }),
  currentSymbol: 'BTCUSDT',
  currentBase: 'BTC',
  currentQuote: 'USDT',
  setCurrentSymbol: (s, base, quote) => set({
    currentSymbol: s,
    currentBase: base || s,
    currentQuote: quote || 'USD',
  }),
  currentPrice: 0,
  setCurrentPrice: (p) => set({ currentPrice: p }),

  usdBalance: 100000,
  setUsdBalance: (b) => set({ usdBalance: b }),
  holdings: [],
  setHoldings: (h) => set({ holdings: h }),
  portfolioStats: null,
  setPortfolioStats: (s) => set({ portfolioStats: s }),

  tradeHistory: [],
  setTradeHistory: (t) => set({ tradeHistory: t }),

  leaderboard: [],
  setLeaderboard: (l) => set({ leaderboard: l }),

  wallets: [],
  setWallets: (w) => set({ wallets: w }),

  pendingTradeSide: null,
  setPendingTradeSide: (side) => set({ pendingTradeSide: side }),

  toasts: [],
  addToast: (type, message) => {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }))
    setTimeout(() => get().removeToast(id), 4000)
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}))
