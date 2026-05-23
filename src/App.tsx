import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/Layout'
import TradingView from './components/TradingView'
import MarketSplash from './components/MarketSplash'
import Portfolio from './components/Portfolio'
import Leaderboard from './components/Leaderboard'
import TradeHistory from './components/TradeHistory'
import Analytics from './components/Analytics'
import WalletManager from './components/WalletManager'
import PlayerNameModal from './components/PlayerNameModal'
import PinModal from './components/PinModal'
import Toast from './components/Toast'
import { useStore } from './store/useStore'

function HomePage() {
  const { showSplash } = useStore()
  return showSplash ? <MarketSplash /> : <TradingView />
}

export default function App() {
  const { initPlayer } = useStore()

  useEffect(() => {
    initPlayer()
  }, [initPlayer])

  return (
    <>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/history" element={<TradeHistory />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/wallets" element={<WalletManager />} />
        </Routes>
      </Layout>
      <PlayerNameModal />
      <PinModal />
      <Toast />
    </>
  )
}
