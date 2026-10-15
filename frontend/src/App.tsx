import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom'
import LandingPage from './components/screens/LandingPage/LandingPage'
import { LoginPage, SignUpPage } from './components/screens/Auth/AuthPages'
import { AuthCallback, RequireRole } from './components/auth/routing'
import { AUTH_CALLBACK_PATH } from './lib/keycloak'
import ProducerLayout from './components/screens/Producer/ProducerLayout'
import ProducerHome from './components/screens/Producer/ProducerHome'
import BatchesPage from './components/screens/Producer/BatchesPage'
import MarketDemandPage from './components/screens/Producer/MarketDemandPage'
import DeliveriesPage from './components/screens/Producer/DeliveriesPage'
import BuyerLayout from './components/screens/Buyer/BuyerLayout'
import BuyerHome from './components/screens/Buyer/BuyerHome'
import DemandsPage from './components/screens/Buyer/DemandsPage'
import DemandDetailPage from './components/screens/Buyer/DemandDetailPage'
import SupplyPage from './components/screens/Buyer/SupplyPage'
import SupplyDetailPage from './components/screens/Buyer/SupplyDetailPage'
import BuyerDeliveriesPage from './components/screens/Buyer/DeliveriesPage'

// Pulls in MapLibre (~1 MB), so it loads only when a delivery is opened.
const DeliveryDetailPage = lazy(() => import('./components/screens/Producer/DeliveryDetailPage'))
const BuyerDeliveryDetailPage = lazy(() => import('./components/screens/Buyer/DeliveryDetailPage'))

const deliveryFallback = <main className="ph-main"><p className="ph-empty">Loading delivery…</p></main>

// /producer/calendar became /producer/batches; keep old links (and their ?batch=) working.
function LegacyCalendarRedirect() {
  const location = useLocation()
  return <Navigate to={`/producer/batches${location.search}`} replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path={AUTH_CALLBACK_PATH} element={<AuthCallback />} />
        <Route
          path="/producer"
          element={
            <RequireRole role="PRODUCER">
              <ProducerLayout />
            </RequireRole>
          }
        >
          <Route index element={<ProducerHome />} />
          <Route path="batches" element={<BatchesPage />} />
          <Route path="calendar" element={<LegacyCalendarRedirect />} />
          <Route path="demand" element={<MarketDemandPage />} />
          <Route path="deliveries" element={<DeliveriesPage />} />
          <Route
            path="deliveries/:id"
            element={
              <Suspense fallback={deliveryFallback}>
                <DeliveryDetailPage />
              </Suspense>
            }
          />
        </Route>
        <Route
          path="/buyer"
          element={
            <RequireRole role="BUYER">
              <BuyerLayout />
            </RequireRole>
          }
        >
          <Route index element={<BuyerHome />} />
          <Route path="demands" element={<DemandsPage />} />
          <Route path="demands/:id" element={<DemandDetailPage />} />
          <Route path="supply" element={<SupplyPage />} />
          <Route path="supply/:code" element={<SupplyDetailPage />} />
          <Route path="deliveries" element={<BuyerDeliveriesPage />} />
          <Route
            path="deliveries/:id"
            element={
              <Suspense fallback={deliveryFallback}>
                <BuyerDeliveryDetailPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
