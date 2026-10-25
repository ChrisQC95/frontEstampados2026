import { createFileRoute } from '@tanstack/react-router'

import { Navbar } from '@/components/landing/Navbar'
import { LandingShop } from '@/components/landing/LandingShop'

export const Route = createFileRoute('/tienda')({
  component: TiendaPage,
})

function TiendaPage() {
  return (
    <div className='min-h-screen bg-[#f7f0ff] text-slate-900'>
      <Navbar />
      <main>
        <LandingShop />
      </main>
    </div>
  )
}
