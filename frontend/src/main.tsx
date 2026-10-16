import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initializeKeycloak } from './lib/keycloak'
import { loadSite } from './lib/site'
import './index.css'
import App from './App.tsx'

const root = createRoot(document.getElementById('root')!)

async function bootstrap() {
  // Site configuration (page text, rules, products, announcements) loads alongside sign-in, so the
  // first render already uses what the admin set. Without the API the built-in defaults are used.
  const [keycloak] = await Promise.allSettled([initializeKeycloak(), loadSite()])
  if (keycloak.status === 'rejected') console.error('Keycloak initialization failed', keycloak.reason)

  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
