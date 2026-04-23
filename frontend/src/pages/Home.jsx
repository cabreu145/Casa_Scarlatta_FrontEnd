import HeroCarousel from '@/features/home/HeroCarousel'
import DisciplinasSection from '@/features/home/DisciplinasSection'
import PricingSection from '@/features/home/PricingSection'
import CoachesCtaSection from '@/features/home/CoachesCtaSection'

export default function Home() {
  return (
    <main>
      <HeroCarousel />
      <DisciplinasSection />
      <PricingSection />
      <CoachesCtaSection />
    </main>
  )
}
