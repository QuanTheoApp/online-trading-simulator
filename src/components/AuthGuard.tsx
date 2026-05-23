import { ReactNode } from 'react'
import { useStore } from '../store/useStore'

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { isReady, requireAuth } = useStore()

  if (!isReady) {
    return (
      <div className="p-4 max-w-md mx-auto mt-20 animate-fadeIn">
        <div className="card-glow p-8 text-center">
          <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-br from-brand to-brand-dark items-center justify-center mb-4 shadow-lg shadow-brand/20">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-dark-950" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="font-display text-xl font-bold mb-2">Sign in required</h2>
          <p className="text-sm text-slate-500 mb-6">You need to sign in to access this page</p>
          <button onClick={() => requireAuth()} className="btn-primary px-6 py-2.5">
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
