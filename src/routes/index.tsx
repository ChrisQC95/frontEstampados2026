import { createFileRoute } from '@tanstack/react-router'
import { Navbar } from '@/components/landing/Navbar'
import { HeroSection } from '@/components/landing/HeroSection'
import { ProgressWidget } from '@/components/landing/progress-widget'
import { StepsSection } from '@/components/landing/StepsSection'
import { MYPEBenefitsWidget } from '@/components/landing/mype-benefits-widget'
import { BenefitsSection } from '@/components/landing/BenefitsSection'
import { ResourcesSection } from '@/components/landing/resources-section'
import { HelpBar } from '@/components/landing/help-bar'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className='min-h-screen bg-background'>
      <Navbar />

      <div className='relative'>
        <HeroSection />

        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='lg:absolute lg:right-8 lg:top-20 lg:w-80 xl:right-12 2xl:right-[calc((100vw-1280px)/2+32px)]'>
            <div className='relative -mt-4 lg:mt-0'>
              <ProgressWidget />
            </div>
          </div>
        </div>
      </div>

      <div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
        <div className='grid gap-6 lg:grid-cols-[1fr_320px]'>
          <div className='space-y-0'>
            <StepsSection />
            <BenefitsSection />
            <ResourcesSection />
          </div>

          <aside className='space-y-6'>
            <MYPEBenefitsWidget />
          </aside>
        </div>
      </div>

      <div className='mt-4'>
        <HelpBar />
      </div>
    </div>
  )
}
