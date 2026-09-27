import { Card, CardContent } from "@/components/ui/card"
import { PieChart, HeartPulse, Banknote, Building2, PlaneTakeoff } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import { useRef } from "react"

const tips = [
  {
    icon: PieChart,
    color: "text-violet-500",
    glow: "shadow-violet-200 dark:shadow-violet-900",
    bg: "from-violet-50 to-violet-100/60 dark:from-violet-900/30 dark:to-violet-800/20",
    border: "border-violet-200/60 dark:border-violet-700/40",
    text: "Analiza tus ventas por temporada para preparar stock de polos, tazas y gorras antes de campañas corporativas."
  },
  {
    icon: HeartPulse,
    color: "text-rose-500",
    glow: "shadow-rose-200 dark:shadow-rose-900",
    bg: "from-rose-50 to-rose-100/60 dark:from-rose-900/30 dark:to-rose-800/20",
    border: "border-rose-200/60 dark:border-rose-700/40",
    text: "Un mockup claro ayuda al cliente a aprobar el diseño antes de producir, reduciendo reprocesos."
  },
  {
    icon: Banknote,
    color: "text-emerald-500",
    glow: "shadow-emerald-200 dark:shadow-emerald-900",
    bg: "from-emerald-50 to-emerald-100/60 dark:from-emerald-900/30 dark:to-emerald-800/20",
    border: "border-emerald-200/60 dark:border-emerald-700/40",
    text: "Mantener productos base ordenados acelera cotizaciones y mejora la respuesta comercial."
  },
  {
    icon: Building2,
    color: "text-blue-500",
    glow: "shadow-blue-200 dark:shadow-blue-900",
    bg: "from-blue-50 to-blue-100/60 dark:from-blue-900/30 dark:to-blue-800/20",
    border: "border-blue-200/60 dark:border-blue-700/40",
    text: "Los clientes corporativos suelen repetir pedidos si guardas su historial, colores y diseños frecuentes."
  },
  {
    icon: PlaneTakeoff,
    color: "text-amber-500",
    glow: "shadow-amber-200 dark:shadow-amber-900",
    bg: "from-amber-50 to-amber-100/60 dark:from-amber-900/30 dark:to-amber-800/20",
    border: "border-amber-200/60 dark:border-amber-700/40",
    text: "Planifica campañas para fechas clave como aniversarios, ferias, fiestas patrias y cierre de año."
  }
]

export function MYPEBenefitsWidget() {
  const plugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  )

  return (
    <div className="sticky top-24 z-10 w-full mb-6 relative group">

      {/* Glow decorativo detrás del widget */}
      <div className="absolute -z-10 -inset-1.5 bg-gradient-to-br from-violet-400/20 via-blue-400/10 to-amber-400/20 blur-2xl opacity-60 rounded-[2rem]" />

      <Card className="border border-white/50 dark:border-slate-700/50 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md overflow-hidden rounded-2xl">

        {/* ── Cabecera integrada ─────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-5 pt-5 pb-1">
          <svg
            className="h-3.5 w-3.5 text-muted-foreground"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
            Tips para sublimados
          </span>
        </div>

        <CardContent className="p-0">
          <Carousel
            plugins={[plugin.current]}
            className="w-full"
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
            opts={{ loop: true, align: "start" }}
          >
            <CarouselContent>
              {tips.map((tip, index) => (
                <CarouselItem key={index}>
                  <div className="px-6 pt-5 pb-8 flex flex-col items-center text-center gap-5 min-h-[240px] justify-center">

                    {/* Ícono con glow */}
                    <div className={`
                      relative h-16 w-16 rounded-2xl
                      bg-gradient-to-br ${tip.bg}
                      border ${tip.border}
                      flex items-center justify-center
                      shadow-lg ${tip.glow}
                    `}>
                      <tip.icon className={`h-7 w-7 ${tip.color} relative z-10`} />
                      {/* Glow interior sutil */}
                      <div className={`absolute inset-0 rounded-2xl opacity-40 blur-sm bg-gradient-to-br ${tip.bg}`} />
                    </div>

                    {/* Texto del tip */}
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-[260px]">
                      {tip.text}
                    </p>

                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* ── Botones de navegación absolutos y minimalistas ──────── */}
            <CarouselPrevious
              className="
                absolute left-2 top-1/2 -translate-y-1/2
                h-8 w-8 rounded-full
                border border-border/60
                bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm
                text-muted-foreground hover:text-foreground
                shadow-sm hover:shadow-md
                opacity-0 group-hover:opacity-100
                transition-all duration-200
              "
            />
            <CarouselNext
              className="
                absolute right-2 top-1/2 -translate-y-1/2
                h-8 w-8 rounded-full
                border border-border/60
                bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm
                text-muted-foreground hover:text-foreground
                shadow-sm hover:shadow-md
                opacity-0 group-hover:opacity-100
                transition-all duration-200
              "
            />

          </Carousel>
        </CardContent>
      </Card>
    </div>
  )
}
