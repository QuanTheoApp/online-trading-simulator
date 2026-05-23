import { ReactNode } from 'react'
import Navbar from './Navbar'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-dark-950 text-slate-200 font-body">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand/[0.02] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/[0.02] rounded-full blur-3xl" />
      </div>
      <Navbar />
      <main className="relative pt-[6.5rem] md:pt-20 min-h-screen">
        {children}
      </main>
    </div>
  )
}
