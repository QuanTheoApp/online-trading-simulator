import { Routes, Route } from 'react-router-dom'
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
import AuthGuard from './components/AuthGuard'
import PublicProfile from './components/PublicProfile'
import { useStore } from './store/useStore'

function HomePage() {
  const { showSplash } = useStore()
  return showSplash ? <MarketSplash /> : <TradingView />
}

export default function App() {
  return (
    <>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/portfolio" element={<AuthGuard><Portfolio /></AuthGuard>} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/trader/:userId" element={<PublicProfile />} />
          <Route path="/history" element={<AuthGuard><TradeHistory /></AuthGuard>} />
          <Route path="/analytics" element={<AuthGuard><Analytics /></AuthGuard>} />
          <Route path="/wallets" element={<AuthGuard><WalletManager /></AuthGuard>} />
        </Routes>
      </Layout>
      <PlayerNameModal />
      <PinModal />
      <Toast />
    </>
  )
}
