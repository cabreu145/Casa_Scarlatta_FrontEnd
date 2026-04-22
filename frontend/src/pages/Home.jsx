import HeroCarousel from '@/features/home/HeroCarousel'
import DisciplinasSection from '@/features/home/DisciplinasSection'
import CoachesCtaSection from '@/features/home/CoachesCtaSection'
import PropositoSection from '@/features/home/PropositoSection'

export default function Home() {
  return (
    <main>
      <HeroCarousel />
      <DisciplinasSection />
      <CoachesCtaSection />
      <PropositoSection />
    </main>
  )
}
