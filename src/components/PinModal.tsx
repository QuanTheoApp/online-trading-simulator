import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store/useStore'

export default function PinModal() {
  const { showPinModal, verifyPin, clearPlayer } = useStore()
  const [pin, setPin] = useState(['', '', '', ''])
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const pinRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (showPinModal) {
      setTimeout(() => pinRefs.current[0]?.focus(), 100)
    }
  }, [showPinModal])

  if (!showPinModal) return null

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1)
    if (value && !/^\d$/.test(value)) return

    setError(false)
    const next = [...pin]
    next[index] = value
    setPin(next)

    if (value && index < 3) {
      pinRefs.current[index + 1]?.focus()
    }

    if (value && index === 3) {
      const fullPin = next.join('')
      if (fullPin.length === 4) {
        const ok = verifyPin(fullPin)
        if (!ok) {
          setError(true)
          setShake(true)
          setTimeout(() => {
            setShake(false)
            setPin(['', '', '', ''])
            pinRefs.current[0]?.focus()
          }, 500)
        }
      }
    }
  }

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus()
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-dark-950/90 backdrop-blur-sm" />
      <div className="relative card-glow p-8 w-full max-w-sm animate-fadeIn">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-brand to-brand-dark items-center justify-center mb-4 shadow-lg shadow-brand/20">
            <svg viewBox="0 0 24 24" className="w-7 h-7 text-dark-950" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="font-display text-xl font-bold">Welcome Back</h2>
          <p className="text-sm text-slate-500 mt-1">Enter your 4-digit PIN to continue</p>
        </div>

        <div className={`flex justify-center gap-3 mb-6 ${shake ? 'animate-shake' : ''}`}>
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
              className={`w-14 h-16 text-center text-2xl font-mono font-bold rounded-xl bg-dark-800/80 border-2 text-slate-200 focus:outline-none transition-all ${
                error
                  ? 'border-loss/60 ring-2 ring-loss/30'
                  : 'border-orange-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-500/40'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-sm text-loss mb-4 animate-fadeIn">
            Incorrect PIN. Please try again.
          </p>
        )}

        <div className="text-center">
          <button
            onClick={clearPlayer}
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            Not you? Start fresh
          </button>
        </div>
      </div>
    </div>
  )
}
