import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initializeKeycloak } from './lib/keycloak'
import { recordSignIn } from './lib/api'
import { loadSite } from './lib/site'
import './index.css'
import App from './App.tsx'

const root = createRoot(document.getElementById('root')!)

async function bootstrap() {
  // Site configuration (page text, rules, products, announcements) loads alongside sign-in, so the
  // first render already uses what the admin set. Without the API the built-in defaults are used.
  // TEMPORARY, for UI review only (see RequireRole): skip Keycloak, which rejects other dev ports.
  const bypass = import.meta.env.DEV && import.meta.env.VITE_AUTH_BYPASS === 'true'
  const [keycloak] = await Promise.allSettled([bypass ? Promise.resolve(false) : initializeKeycloak(), loadSite()])
  if (keycloak.status === 'rejected') console.error('Keycloak initialization failed', keycloak.reason)
  // Keep the app's user table in step with Keycloak; does not hold up the first render.
  else if (keycloak.value) void recordSignIn()

  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
