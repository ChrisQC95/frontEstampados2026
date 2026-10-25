import { createFileRoute } from '@tanstack/react-router'
import {
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  Gem,
  Lightbulb,
  Megaphone,
  PackageCheck,
  Palette,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

import { Navbar } from '@/components/landing/Navbar'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/')({
  component: HomePage,
})

const portfolioItems = [
  {
    title: 'Polos corporativos',
    category: 'Textil',
    image: '/images/sabiduria-productos.png',
    className: 'md:row-span-2',
  },
  {
    title: 'Tazas personalizadas',
    category: 'Merchandising',
    image: '/images/sabiduria-productos.png',
    className: '',
  },
  {
    title: 'Gorras de campaña',
    category: 'Promocional',
    image: '/images/sabiduria-productos.png',
    className: '',
  },
  {
    title: 'Cuadernos y papelería',
    category: 'Empresarial',
    image: '/images/sabiduria-productos.png',
    className: 'md:col-span-2',
  },
]

const services = [
  { title: 'Estampado textil', description: 'Polos, gorras, mandiles y prendas para equipos comerciales.', icon: Palette },
  { title: 'Merchandising corporativo', description: 'Tazas, tomatodos, libretas, llaveros y regalos de marca.', icon: PackageCheck },
  { title: 'Producción para campañas', description: 'Piezas visuales para activaciones, ferias y temporadas comerciales.', icon: Megaphone },
]

const foda = [
  { title: 'Fortalezas', icon: ShieldCheck, points: ['Diseños con identidad visual propia', 'Producción flexible para pedidos pequeños y empresariales', 'Experiencia en productos promocionales variados'] },
  { title: 'Oportunidades', icon: TrendingUp, points: ['Crecimiento de regalos corporativos personalizados', 'Campañas por temporadas y fechas comerciales', 'Mayor demanda de branding para empresas pequeñas'] },
  { title: 'Debilidades', icon: Lightbulb, points: ['Dependencia de fotografías actualizadas del portafolio', 'Necesidad de ordenar catálogos por material y color', 'Procesos de cotización que pueden digitalizarse más'] },
  { title: 'Amenazas', icon: BriefcaseBusiness, points: ['Competidores con precios agresivos', 'Variación de costos en insumos', 'Cambios rápidos en tendencias visuales'] },
]

function HomePage() {
  return (
    <div className='min-h-screen bg-[#fbf8ff] text-slate-900'>
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <MissionVisionSection />
        <PortfolioSection />
        <FodaSection />
        <ContactSection />
      </main>
    </div>
  )
}

function HeroSection() {
  return (
    <section id='inicio' className='relative overflow-hidden bg-sabiduria-purple text-white'>
      <div className='absolute inset-0 opacity-[0.09]' style={{ backgroundImage: 'url(/images/sabiduria-logo.jpeg)', backgroundSize: '420px', backgroundPosition: 'left center' }} />
      <div className='relative mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20'>
        <div className='max-w-2xl'>
          <div className='mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-white/85 backdrop-blur'>
            <Sparkles className='h-4 w-4 text-sabiduria-gold' />
            Estampados para empresas
          </div>
          <h1 className='text-4xl font-black leading-[0.96] tracking-tight sm:text-6xl lg:text-7xl'>
            Tu marca en productos que se usan, se ven y se recuerdan.
          </h1>
          <p className='mt-6 max-w-xl text-base leading-8 text-purple-50/86 sm:text-lg'>
            En Sabiduría convertimos polos, tazas, gorras, libretas y merchandising en piezas visuales listas para campañas corporativas, regalos empresariales y activaciones comerciales.
          </p>
          <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
            <Button asChild className='bg-sabiduria-gold px-6 py-6 font-bold text-sabiduria-purple hover:bg-yellow-300'>
              <a href='#trabajos'>Ver trabajos</a>
            </Button>
            <Button asChild variant='outline' className='border-white/30 bg-white/10 px-6 py-6 font-bold text-white hover:bg-white hover:text-sabiduria-purple'>
              <a href='#contacto'>Solicitar información</a>
            </Button>
          </div>
          <div className='mt-10 grid max-w-xl grid-cols-3 gap-3'>
            {[
              ['B2B', 'enfoque corporativo'],
              ['+10', 'tipos de producto'],
              ['100%', 'personalizable'],
            ].map(([value, label]) => (
              <div key={value} className='rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur'>
                <p className='text-2xl font-black text-white'>{value}</p>
                <p className='mt-1 text-xs font-medium text-purple-50/75'>{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className='relative'>
          <div className='absolute -inset-4 rounded-[2rem] bg-white/10 blur-2xl' />
          <div className='relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur'>
            <img src='/images/sabiduria-productos.png' alt='Productos estampados Sabiduría' className='h-[330px] w-full rounded-[1.25rem] object-cover object-center sm:h-[470px] lg:h-[560px]' />
          </div>
        </div>
      </div>
    </section>
  )
}

function AboutSection() {
  return (
    <section id='nosotros' className='bg-white py-20'>
      <div className='mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8'>
        <div>
          <p className='text-sm font-black uppercase tracking-[0.22em] text-sabiduria-purple'>Nosotros</p>
          <h2 className='mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl'>Estampados con identidad, orden y propósito comercial.</h2>
        </div>
        <div className='space-y-6 text-base leading-8 text-slate-600'>
          <p>
            Sabiduría trabaja con empresas que necesitan productos personalizados para comunicar mejor su marca. Nuestro objetivo es que cada pieza se vea profesional, sea útil y mantenga coherencia visual con la campaña o identidad del cliente.
          </p>
          <div className='grid gap-4 sm:grid-cols-3'>
            {services.map((service) => (
              <div key={service.title} className='rounded-xl border border-purple-100 bg-purple-50/50 p-4'>
                <service.icon className='h-6 w-6 text-sabiduria-purple' />
                <h3 className='mt-3 font-bold text-slate-950'>{service.title}</h3>
                <p className='mt-2 text-sm leading-6 text-slate-600'>{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function MissionVisionSection() {
  return (
    <section id='mision-vision' className='bg-[#f7f0ff] py-20'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
          <div>
            <p className='text-sm font-black uppercase tracking-[0.22em] text-sabiduria-purple'>Misión y Visión</p>
            <h2 className='mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl'>Una marca creativa con mirada empresarial.</h2>
          </div>
        </div>
        <div className='grid gap-6 md:grid-cols-2'>
          <InfoCard icon={Target} title='Misión' description='Brindar soluciones de estampado y personalización que ayuden a empresas y emprendedores a fortalecer su presencia visual mediante productos útiles, atractivos y coherentes con su identidad.' />
          <InfoCard icon={Eye} title='Visión' description='Ser una empresa referente en personalización corporativa, reconocida por su creatividad, calidad visual y capacidad para acompañar campañas empresariales con productos memorables.' />
        </div>
      </div>
    </section>
  )
}

function PortfolioSection() {
  return (
    <section id='trabajos' className='bg-white py-20'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='mb-10 max-w-3xl'>
          <p className='text-sm font-black uppercase tracking-[0.22em] text-sabiduria-purple'>Nuestros Trabajos</p>
          <h2 className='mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl'>Portafolio visual de estampados y productos personalizados.</h2>
          <p className='mt-4 text-base leading-8 text-slate-600'>
            Esta galería queda preparada para que luego puedas alimentar imágenes y textos desde el sistema. Por ahora muestra trabajos representativos y categorías comerciales.
          </p>
        </div>
        <div className='grid auto-rows-[230px] gap-4 md:grid-cols-4'>
          {portfolioItems.map((item) => (
            <article key={item.title} className={`group relative overflow-hidden rounded-2xl bg-slate-100 shadow-sm ring-1 ring-slate-200 ${item.className}`}>
              <img src={item.image} alt={item.title} className='h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]' />
              <div className='absolute inset-0 bg-gradient-to-t from-sabiduria-purple/82 via-sabiduria-purple/12 to-transparent opacity-90' />
              <div className='absolute inset-x-0 bottom-0 p-5 text-white'>
                <p className='text-xs font-bold uppercase tracking-[0.2em] text-sabiduria-gold'>{item.category}</p>
                <h3 className='mt-1 text-xl font-black'>{item.title}</h3>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function FodaSection() {
  return (
    <section id='foda' className='bg-sabiduria-purple py-20 text-white'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='mb-10 max-w-3xl'>
          <p className='text-sm font-black uppercase tracking-[0.22em] text-sabiduria-gold'>FODA</p>
          <h2 className='mt-3 text-3xl font-black tracking-tight sm:text-5xl'>Diagnóstico estratégico de la marca.</h2>
          <p className='mt-4 text-base leading-8 text-purple-50/80'>
            Una lectura inicial para ordenar decisiones comerciales, contenido visual y futuras funciones del sistema.
          </p>
        </div>
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          {foda.map((item) => (
            <div key={item.title} className='rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur'>
              <item.icon className='h-7 w-7 text-sabiduria-gold' />
              <h3 className='mt-4 text-xl font-black'>{item.title}</h3>
              <ul className='mt-4 space-y-3'>
                {item.points.map((point) => (
                  <li key={point} className='flex gap-2 text-sm leading-6 text-purple-50/82'>
                    <CheckCircle2 className='mt-0.5 h-4 w-4 shrink-0 text-sabiduria-cyan' />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ContactSection() {
  return (
    <section id='contacto' className='bg-[#fbf8ff] py-20'>
      <div className='mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:px-8'>
        <div className='rounded-3xl bg-white p-8 shadow-sm ring-1 ring-purple-100 sm:p-10'>
          <p className='text-sm font-black uppercase tracking-[0.22em] text-sabiduria-purple'>Contacto</p>
          <h2 className='mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl'>Preparemos tu siguiente campaña visual.</h2>
          <p className='mt-4 max-w-2xl text-base leading-8 text-slate-600'>
            Cuéntanos qué producto necesitas, para cuántas personas y qué diseño deseas aplicar. Te ayudamos a convertir la idea en un prototipo claro para tu cliente o equipo.
          </p>
          <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
            <Button asChild className='bg-sabiduria-purple px-6 py-6 font-bold text-white hover:bg-sabiduria-purple-soft'>
              <a href='mailto:contacto@sabiduria.com'>Escribir por correo</a>
            </Button>
            <Button asChild variant='outline' className='border-sabiduria-purple/20 px-6 py-6 font-bold text-sabiduria-purple hover:bg-purple-50'>
              <a href='#trabajos'>Explorar portafolio</a>
            </Button>
          </div>
        </div>
        <div className='rounded-3xl bg-sabiduria-purple p-8 text-white shadow-sm sm:p-10'>
          <Gem className='h-10 w-10 text-sabiduria-gold' />
          <h3 className='mt-5 text-2xl font-black'>Diseños listos para vender mejor</h3>
          <div className='mt-6 space-y-4'>
            {['Mockups para aprobación del cliente', 'Productos base por color y categoría', 'Contenido visual para campañas y temporadas'].map((item) => (
              <div key={item} className='flex items-start gap-3 rounded-xl bg-white/10 p-4'>
                <BadgeCheck className='mt-0.5 h-5 w-5 shrink-0 text-sabiduria-gold' />
                <span className='text-sm font-medium leading-6 text-purple-50/90'>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <footer className='mx-auto mt-14 flex max-w-7xl flex-col gap-3 border-t border-purple-100 px-4 pt-8 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8'>
        <div className='flex items-center gap-3'>
          <img src='/images/sabiduria-logo.jpeg' alt='Sabiduría' className='h-10 w-10 rounded-full object-cover' />
          <span className='font-semibold text-slate-700'>Sabiduría Estampados</span>
        </div>
        <span>Contenido estático preparado para futura administración dinámica.</span>
      </footer>
    </section>
  )
}

function InfoCard({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className='rounded-2xl border border-purple-100 bg-white p-7 shadow-sm'>
      <div className='flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-sabiduria-purple'>
        <Icon className='h-6 w-6' />
      </div>
      <h3 className='mt-5 text-2xl font-black text-slate-950'>{title}</h3>
      <p className='mt-3 text-base leading-8 text-slate-600'>{description}</p>
    </div>
  )
}




