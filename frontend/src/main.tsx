import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initializeKeycloak } from './lib/keycloak'
import './index.css'
import App from './App.tsx'

const root = createRoot(document.getElementById('root')!)

async function bootstrap() {
  try {
    await initializeKeycloak()
  } catch (error) {
    console.error('Keycloak initialization failed', error)
  }

  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
