import { Link, useLocation } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { formatUSD } from '../lib/format'

const NAV_LINKS = [
  { to: '/', label: 'Trade' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/history', label: 'History' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/wallets', label: 'Wallets' },
]

export default function Navbar() {
  const location = useLocation()
  const { player, usdBalance, requireAuth, clearPlayer } = useStore()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/90 backdrop-blur-lg border-b border-dark-600/40">
      <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center shadow-lg shadow-brand/20">
              <svg viewBox="0 0 20 20" className="w-4 h-4 text-dark-950">
                <path fill="currentColor" d="M10 2l2.5 3.5H15l-2 3.5 2.5 4H5L7.5 9l-2-3.5h2.5z"/>
              </svg>
            </div>
            <span className="font-display font-bold text-lg tracking-tight">
              OT<span className="text-brand">S</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'text-brand bg-brand/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-dark-700/50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {player ? (
            <>
              <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-dark-800/80 border border-dark-600/30">
                <span className="text-xs text-slate-500">Balance</span>
                <span className="font-mono text-sm font-semibold text-profit">{formatUSD(usdBalance)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand/80 to-brand-dark/80 flex items-center justify-center text-xs font-bold text-dark-950">
                  {player.traderName[0].toUpperCase()}
                </div>
                <span className="hidden sm:inline text-sm text-slate-300 font-medium truncate max-w-[160px]">{player.traderName}</span>
              </div>
              <button
                onClick={clearPlayer}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded hover:bg-dark-700/50"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => requireAuth()}
              className="btn-primary text-sm px-4 py-1.5"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      <div className="md:hidden border-t border-dark-600/30 bg-dark-900/95 backdrop-blur-lg">
        <div className="flex overflow-x-auto gap-0.5 px-2 py-1.5 no-scrollbar">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex-shrink-0 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                location.pathname === link.to
                  ? 'text-brand bg-brand/10'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
