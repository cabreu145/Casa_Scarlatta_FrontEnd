import Hero from '@/features/home/Hero'
import SuetPreview from '@/features/home/SuetPreview'
import FlowPreview from '@/features/home/FlowPreview'
import MoodGallery from '@/features/home/MoodGallery'
import PropositeSection from '@/features/home/PropositoSection'

export default function Home() {
  return (
    <main>
      <Hero />
      <SuetPreview />
      <FlowPreview />
      <MoodGallery />
      <PropositeSection />
    </main>
  )
}
