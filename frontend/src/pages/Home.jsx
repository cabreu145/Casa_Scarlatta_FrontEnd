/**
 * Home.jsx
 * ─────────────────────────────────────────────────────
 * Página principal pública. Compone las secciones del landing:
 * carrusel hero, disciplinas, precios y call-to-action de coaches.
 *
 * Usado en: App.jsx (ruta "/")
 * Depende de: HeroCarousel, DisciplinasSection, PricingSection, CoachesCtaSection
 * ─────────────────────────────────────────────────────
 */
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
