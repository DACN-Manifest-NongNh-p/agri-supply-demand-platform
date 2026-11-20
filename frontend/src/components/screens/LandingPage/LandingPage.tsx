import { Hero } from './sections/Hero'
import { Nav } from './sections/Nav'
import { Overview } from './sections/Overview'
import { HowItWorks } from './sections/HowItWorks'
import { AuctionSection, MatchingSection, ProcurementSection, TransactionSection, VerificationSection } from './sections/Showcase'
import { FinalCTA, Footer } from './sections/Rescue'
import { AnnouncementBanner } from "@/components/notifications/AnnouncementBanner";

/** Public landing page, following the Farmora flow: verify → trade (three channels) → transaction → delivery. */
export default function LandingPage() {
  return (
    <div className="landing-page">
      <Nav />
      <Hero />
      <Overview />
      <HowItWorks />
      <VerificationSection />
      <MatchingSection />
      <ProcurementSection />
      <AuctionSection />
      <TransactionSection />
      <FinalCTA />
      <Footer />
      <AnnouncementBanner audience="PUBLIC" placement="floating" />
    </div>
  )
}
