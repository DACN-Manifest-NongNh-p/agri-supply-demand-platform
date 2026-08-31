import { Hero } from './sections/Hero'
import { Nav } from './sections/Nav'
import { Intro } from './sections/Intro'
import { HowItWorks } from './sections/HowItWorks'
import { TimeAware } from './sections/TimeAware'
import { SmartCoordination, Reservation } from './sections/SmartCoordination'
import { Intelligence } from './sections/Intelligence'
import { Rescue, FinalCTA, Footer } from './sections/Rescue'
import { Dashboard } from './sections/Dashboard'

export default function LandingPage() {
  return (
    <div className="landing-page">
      <Nav />
      <Hero />
      <Intro />
      <HowItWorks />
      <TimeAware />
      <Intelligence />
      <Dashboard />
      <SmartCoordination />
      <Reservation />
      <Rescue />
      <FinalCTA />
      <Footer />
    </div>
  )
}