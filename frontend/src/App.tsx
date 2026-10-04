import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './components/screens/LandingPage/LandingPage'
import { LoginPage, SignUpPage } from './components/screens/Auth/AuthPages'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
