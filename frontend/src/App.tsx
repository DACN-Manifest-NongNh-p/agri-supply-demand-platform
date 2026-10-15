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

// Pulls in MapLibre (~1 MB), so it loads only when a delivery is opened.
const DeliveryDetailPage = lazy(() => import('./components/screens/Producer/DeliveryDetailPage'))

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
              <Suspense fallback={<main className="ph-main"><p className="ph-empty">Loading delivery…</p></main>}>
                <DeliveryDetailPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
