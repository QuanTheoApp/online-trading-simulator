import { useState, useRef } from 'react'
import { useStore } from '../store/useStore'

export default function PlayerNameModal() {
  const { showNameModal, setPlayer } = useStore()
  const [name, setName] = useState('')
  const [pin, setPin] = useState(['', '', '', ''])
  const [loading, setLoading] = useState(false)
  const pinRefs = useRef<(HTMLInputElement | null)[]>([])

  if (!showNameModal) return null

  const pinValue = pin.join('')
  const pinComplete = pinValue.length === 4

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1)
    if (value && !/^\d$/.test(value)) return

    const next = [...pin]
    next[index] = value
    setPin(next)

    if (value && index < 3) {
      pinRefs.current[index + 1]?.focus()
    }
  }

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !pinComplete) return
    setLoading(true)
    setPlayer(name.trim(), pinValue)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-dark-950/90 backdrop-blur-sm" />
      <div className="relative card-glow p-8 w-full max-w-md animate-fadeIn">
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-br from-brand to-brand-dark items-center justify-center mb-3 shadow-lg shadow-brand/20">
            <svg viewBox="0 0 20 20" className="w-6 h-6 text-dark-950">
              <path fill="currentColor" d="M10 2l2.5 3.5H15l-2 3.5 2.5 4H5L7.5 9l-2-3.5h2.5z"/>
            </svg>
          </div>
          <h2 className="font-display text-xl font-bold">Welcome to OTS</h2>
          <p className="text-sm text-slate-500 mt-1">
            Enter your name and set a PIN to start trading with $100,000 in virtual funds
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5 font-medium">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input-field"
              placeholder="Enter your trader name"
              maxLength={40}
              minLength={1}
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1.5 font-medium">Set a 4-Digit PIN</label>
            <p className="text-xs text-slate-600 mb-3">You'll need this PIN each time you return</p>
            <div className="flex justify-center gap-3">
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { pinRefs.current[i] = el }}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handlePinChange(i, e.target.value)}
                  onKeyDown={e => handlePinKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-mono font-bold rounded-xl bg-dark-800/80 border-2 border-orange-500 text-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-500/40 focus:outline-none transition-all"
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim() || !pinComplete}
            className="btn-primary w-full py-3"
          >
            {loading ? 'Setting up...' : 'Start Trading'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-600">
          Your progress is saved automatically. Use the same browser and PIN to come back.
        </p>
      </div>
    </div>
  )
}
