import { Mail, MessageCircle, PlayCircle, BookOpen, Search, ArrowRight, LifeBuoy } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Main } from '@/components/layout/main'

export default function HelpCenter() {
  return (
    <Main className="p-0 sm:p-0 lg:p-0 overflow-x-hidden">
      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 py-12 px-6 sm:px-10 lg:px-16 text-white shadow-md">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/90 backdrop-blur-sm">
              <LifeBuoy className="h-4 w-4 text-emerald-400" />
              Soporte operativo
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
              Centro de <span className="bg-gradient-to-r from-sky-300 to-emerald-300 bg-clip-text text-transparent">Ayuda</span>
            </h1>
            <p className="max-w-xl text-blue-100/80 text-sm sm:text-base leading-relaxed mx-auto md:mx-0">
              Aprende a gestionar productos, clientes, mockups, ventas y comprobantes para pedidos de sublimados personalizados.
            </p>
          </div>
          
          <div className="w-full max-w-sm hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
              <Input 
                placeholder="¿Qué necesitas ayuda hoy?" 
                className="w-full h-12 pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl backdrop-blur-md focus-visible:ring-emerald-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Body Content ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Video & FAQs */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* Video Player */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-blue-600 dark:text-blue-400">
                  <PlayCircle className="h-6 w-6" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Videotutorial de Inicio
                </h2>
              </div>
              
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/20 border border-slate-200 dark:border-slate-800 bg-slate-900 group">
                <iframe 
                  src="https://drive.google.com/file/d/1p3wVoBp4ebRH8Tub27pWqfhVa8JkvpYJ/preview" 
                  className="absolute top-0 left-0 w-full h-full border-0"
                  allow="autoplay; fullscreen"
                  title="Videotutorial Sabiduría"
                />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                En este video de 5 minutos te mostramos la ruta completa: configuración, catálogo de productos, mockups y primera venta.
              </p>
            </section>

            {/* FAQs */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Preguntas Frecuentes
                </h2>
              </div>

              <div className="bg-card rounded-2xl border border-border shadow-sm">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1" className="border-b px-6 py-2">
                    <AccordionTrigger className="text-left font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:no-underline">
                      ¿Cómo registrar un producto personalizable?
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600 dark:text-slate-400 leading-relaxed pt-2 pb-4">
                      Dirígete a <strong>Catálogos &gt; Productos</strong> en el menú lateral. Haz clic en "+ Nuevo" y registra el producto base, precio, unidad y stock si corresponde. Esto te permitirá vender polos, tazas, gorras u otros artículos personalizados con mejor control operativo.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2" className="border-b px-6 py-2">
                    <AccordionTrigger className="text-left font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:no-underline">
                      ¿Cómo registrar una venta de sublimados?
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600 dark:text-slate-400 leading-relaxed pt-2 pb-4">
                      Ve a <strong>Operaciones &gt; Ventas &gt; Nueva Venta</strong>. Selecciona el cliente, el tipo de comprobante y agrega los productos personalizados del pedido. El sistema calculará importes e IGV cuando corresponda. Luego podrás emitir y descargar el comprobante en PDF.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3" className="border-b-0 px-6 py-2">
                    <AccordionTrigger className="text-left font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:no-underline">
                      ¿Cuál es la diferencia entre Factura, Boleta y Nota de Venta?
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600 dark:text-slate-400 leading-relaxed pt-2 pb-4">
                      Las <strong>Facturas</strong> y <strong>Boletas</strong> se usan para ventas con sustento tributario. La Factura exige que el cliente tenga RUC de 11 dígitos. La <strong>Nota de Venta</strong> sirve como control interno para pedidos rápidos o coordinaciones previas con el cliente.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </section>
            
          </div>

          {/* Right Column: Contact Card */}
          <div className="lg:col-span-4">
            <div className="sticky top-24">
              <Card className="border-border shadow-lg shadow-blue-900/5 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/50 overflow-hidden">
                {/* Decorative top bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-sky-400" />
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      ¿Aún tienes dudas?
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      Si el videotutorial no resolvió tu problema, el administrador del sistema puede ayudarte con productos, clientes, mockups o ventas.
                    </p>
                  </div>

                  <div className="pt-2 space-y-3">
                    <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all">
                      <Mail className="mr-2 h-4 w-4" />
                      Contactar por Correo
                    </Button>
                    <Button variant="outline" className="w-full h-12 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-sm">
                      <MessageCircle className="mr-2 h-4 w-4 text-emerald-500" />
                      Chat de Soporte
                    </Button>
                  </div>
                  
                  <div className="pt-4 border-t border-border mt-6">
                    <a href="/recursos" className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                      Ver biblioteca de recursos <ArrowRight className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </div>
    </Main>
  )
}
