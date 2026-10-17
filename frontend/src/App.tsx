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
import ProducerOrdersPage from './components/screens/Producer/OrdersPage'
import BuyerLayout from './components/screens/Buyer/BuyerLayout'
import BuyerHome from './components/screens/Buyer/BuyerHome'
import DemandsPage from './components/screens/Buyer/DemandsPage'
import DemandDetailPage from './components/screens/Buyer/DemandDetailPage'
import NewDemandPage from './components/screens/Buyer/NewDemandPage'
import CompanyPage from './components/screens/Buyer/CompanyPage'
import BuyerProfilePage from './components/screens/Buyer/ProfilePage'
import ProducerProfilePage from './components/screens/Producer/ProfilePage'
import NewBatchPage from './components/screens/Producer/NewBatchPage'
import NewAuctionPage from './components/screens/Producer/NewAuctionPage'
import SupplyPage from './components/screens/Buyer/SupplyPage'
import SupplyDetailPage from './components/screens/Buyer/SupplyDetailPage'
import BuyerOrdersPage from './components/screens/Buyer/OrdersPage'
import BuyerAuctionsPage from './components/screens/Buyer/AuctionsPage'
import BuyerAuctionDetailPage from './components/screens/Buyer/AuctionDetailPage'
import ProducerAuctionsPage from './components/screens/Producer/AuctionsPage'
import CoordinatorLayout from './components/screens/Coordinator/CoordinatorLayout'
import CoordinatorHome from './components/screens/Coordinator/CoordinatorHome'
import MatchingPage from './components/screens/Coordinator/MatchingPage'
import RequestsPage from './components/screens/Coordinator/RequestsPage'
import RescuePage from './components/screens/Coordinator/RescuePage'
import CoordinatorDeliveriesPage from './components/screens/Coordinator/DeliveriesPage'
import LogisticsLayout from './components/screens/Logistics/LogisticsLayout'
import LogisticsHome from './components/screens/Logistics/LogisticsHome'
import OrdersPage from './components/screens/Logistics/OrdersPage'
import TripsPage from './components/screens/Logistics/TripsPage'
import FleetPage from './components/screens/Logistics/FleetPage'
import AccountPage from './components/screens/Logistics/AccountPage'
import AdminLayout from './components/screens/Admin/AdminLayout'
import AdminHome from './components/screens/Admin/AdminHome'
import ContentPage from './components/screens/Admin/ContentPage'
import AnnouncementsPage from './components/screens/Admin/AnnouncementsPage'
import RulesPage from './components/screens/Admin/RulesPage'
import ProductsPage from './components/screens/Admin/ProductsPage'
import UsersPage from './components/screens/Admin/UsersPage'

// Pulls in MapLibre (~1 MB), so it loads only when a delivery is opened.
const DeliveryDetailPage = lazy(() => import('./components/screens/Producer/DeliveryDetailPage'))
const BuyerDeliveryDetailPage = lazy(() => import('./components/screens/Buyer/DeliveryDetailPage'))
const CoordinatorDeliveryDetailPage = lazy(() => import('./components/screens/Coordinator/DeliveryDetailPage'))
const TripDetailPage = lazy(() => import('./components/screens/Logistics/TripDetailPage'))

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
          <Route path="batches/new" element={<NewBatchPage />} />
          <Route path="auctions" element={<ProducerAuctionsPage />} />
          <Route path="auctions/new" element={<NewAuctionPage />} />
          <Route path="calendar" element={<LegacyCalendarRedirect />} />
          <Route path="demand" element={<MarketDemandPage />} />
          <Route path="orders" element={<ProducerOrdersPage />} />
          <Route path="profile" element={<ProducerProfilePage />} />
          {/* Shipments are followed from Orders now; the old list link lands there. */}
          <Route path="deliveries" element={<Navigate to="/producer/orders?tab=deliveries" replace />} />
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
          <Route path="demands/new" element={<NewDemandPage />} />
          <Route path="company" element={<CompanyPage />} />
          <Route path="profile" element={<BuyerProfilePage />} />
          <Route path="demands/:id" element={<DemandDetailPage />} />
          <Route path="supply" element={<SupplyPage />} />
          <Route path="supply/:code" element={<SupplyDetailPage />} />
          <Route path="orders" element={<BuyerOrdersPage />} />
          <Route path="auctions" element={<BuyerAuctionsPage />} />
          <Route path="auctions/:id" element={<BuyerAuctionDetailPage />} />
          {/* The deliveries list is a tab of the cart now. */}
          <Route path="deliveries" element={<Navigate to="/buyer/orders?tab=deliveries" replace />} />
          <Route
            path="deliveries/:id"
            element={
              <Suspense fallback={deliveryFallback}>
                <BuyerDeliveryDetailPage />
              </Suspense>
            }
          />
        </Route>
        <Route
          path="/coordinator"
          element={
            <RequireRole role="COORDINATOR">
              <CoordinatorLayout />
            </RequireRole>
          }
        >
          <Route index element={<CoordinatorHome />} />
          <Route path="matching" element={<MatchingPage />} />
          <Route path="requests" element={<RequestsPage />} />
          <Route path="rescue" element={<RescuePage />} />
          <Route path="deliveries" element={<CoordinatorDeliveriesPage />} />
          <Route
            path="deliveries/:id"
            element={
              <Suspense fallback={deliveryFallback}>
                <CoordinatorDeliveryDetailPage />
              </Suspense>
            }
          />
        </Route>
        <Route
          path="/logistics"
          element={
            <RequireRole role="LOGISTICS">
              <LogisticsLayout />
            </RequireRole>
          }
        >
          <Route index element={<LogisticsHome />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="trips" element={<TripsPage />} />
          <Route
            path="trips/:id"
            element={
              <Suspense fallback={deliveryFallback}>
                <TripDetailPage />
              </Suspense>
            }
          />
          <Route path="fleet" element={<FleetPage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>
        <Route
          path="/admin"
          element={
            <RequireRole role="ADMIN">
              <AdminLayout />
            </RequireRole>
          }
        >
          <Route index element={<AdminHome />} />
          <Route path="content" element={<ContentPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="rules" element={<RulesPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="users" element={<UsersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
