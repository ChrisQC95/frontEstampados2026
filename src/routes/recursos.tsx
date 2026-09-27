import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Navbar } from "@/components/landing/Navbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { FileText, Landmark, Building, MapPin, Info, ArrowRight, ExternalLink } from "lucide-react"

export const Route = createFileRoute('/recursos')({
  component: RecursosPage,
})

function RecursosPage() {
  const [minuta, setMinuta] = useState(200)
  const [notaria, setNotaria] = useState(350)
  const [sunarp, setSunarp] = useState(100)
  const [licencia, setLicencia] = useState(150)

  const reserva = 24
  const ruc = 0

  const total = minuta + notaria + sunarp + licencia + reserva + ruc

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-background">
        <Navbar />

        {/* Hero Section */}
        <section className="bg-royal-blue/5 py-12 md:py-20 text-center">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl md:text-5xl font-bold text-royal-blue mb-4">
              Herramientas para tus Sublimados
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Cotiza, planifica y prepara pedidos personalizados con mayor control
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-16">

          {/* Main Section: Calculadora Referencial de Pedido */}
          <section>
            <Card className="border-0 shadow-lg bg-card max-w-3xl mx-auto overflow-hidden">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl text-royal-blue font-bold">
                  Calculadora Referencial de Pedido
                </CardTitle>
                <CardDescription className="text-base">Estima costos base para preparar un pedido personalizado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 px-6 sm:px-10 pb-10">

                {/* Sliders */}
                <div className="space-y-8">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-royal-blue" />
                        <label className="text-base font-semibold text-foreground">Diseño y preparación</label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="text-muted-foreground hover:text-royal-blue transition-colors focus:outline-none">
                              <Info className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-popover text-popover-foreground border shadow-md">
                            <p className="max-w-xs text-sm">Incluye ajuste de arte, revisión de medidas y preparación del archivo para producción.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <span className="text-xl font-bold text-royal-blue">S/ {minuta}</span>
                    </div>
                    <input
                      type="range"
                      min="150"
                      max="400"
                      value={minuta}
                      onChange={(e) => setMinuta(Number(e.target.value))}
                      className="w-full h-2.5 bg-muted rounded-full appearance-none cursor-pointer accent-royal-blue"
                    />
                    <div className="flex justify-between mt-2">
                      <span className="text-xs font-semibold text-muted-foreground">Mín: S/ 150</span>
                      <span className="text-xs font-semibold text-muted-foreground">Máx: S/ 400</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <Landmark className="h-5 w-5 text-royal-blue" />
                        <label className="text-base font-semibold text-foreground">Productos base</label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="text-muted-foreground hover:text-royal-blue transition-colors focus:outline-none">
                              <Info className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-popover text-popover-foreground border shadow-md">
                            <p className="max-w-xs text-sm">Depende del tipo de producto, cantidad, color y disponibilidad de stock.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <span className="text-xl font-bold text-royal-blue">S/ {notaria}</span>
                    </div>
                    <input
                      type="range"
                      min="250"
                      max="700"
                      value={notaria}
                      onChange={(e) => setNotaria(Number(e.target.value))}
                      className="w-full h-2.5 bg-muted rounded-full appearance-none cursor-pointer accent-royal-blue"
                    />
                    <div className="flex justify-between mt-2">
                      <span className="text-xs font-semibold text-muted-foreground">Mín: S/ 250</span>
                      <span className="text-xs font-semibold text-muted-foreground">Máx: S/ 700</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-royal-blue" />
                        <label className="text-base font-semibold text-foreground">Sublimado e impresión</label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="text-muted-foreground hover:text-royal-blue transition-colors focus:outline-none">
                              <Info className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-popover text-popover-foreground border shadow-md">
                            <p className="max-w-xs text-sm">Considera tinta, papel, tiempo de prensado y merma operativa.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <span className="text-xl font-bold text-royal-blue">S/ {sunarp}</span>
                    </div>
                    <input
                      type="range"
                      min="90"
                      max="200"
                      value={sunarp}
                      onChange={(e) => setSunarp(Number(e.target.value))}
                      className="w-full h-2.5 bg-muted rounded-full appearance-none cursor-pointer accent-royal-blue"
                    />
                    <div className="flex justify-between mt-2">
                      <span className="text-xs font-semibold text-muted-foreground">Mín: S/ 90</span>
                      <span className="text-xs font-semibold text-muted-foreground">Máx: S/ 200</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-royal-blue" />
                        <label className="text-base font-semibold text-foreground">Empaque y entrega</label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="text-muted-foreground hover:text-royal-blue transition-colors focus:outline-none">
                              <Info className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-popover text-popover-foreground border shadow-md">
                            <p className="max-w-xs text-sm">Depende del volumen del pedido, presentación final y zona de entrega.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <span className="text-xl font-bold text-royal-blue">S/ {licencia}</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="400"
                      value={licencia}
                      onChange={(e) => setLicencia(Number(e.target.value))}
                      className="w-full h-2.5 bg-muted rounded-full appearance-none cursor-pointer accent-royal-blue"
                    />
                    <div className="flex justify-between mt-2">
                      <span className="text-xs font-semibold text-muted-foreground">Mín: S/ 100</span>
                      <span className="text-xs font-semibold text-muted-foreground">Máx: S/ 400</span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border w-full"></div>

                {/* Static items */}
                <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">Mockup inicial</span>
                    <span className="font-bold text-foreground">S/ {reserva}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">Revisión del cliente</span>
                    <span className="font-bold text-success-green bg-success-green/10 px-2 py-1 rounded-md">S/ {ruc} - Gratuito</span>
                  </div>
                </div>

              </CardContent>
              <CardFooter className="bg-royal-blue py-10 flex flex-col items-center justify-center gap-8">
                <div className="text-center">
                  <p className="text-white/80 text-sm md:text-base font-medium tracking-widest uppercase mb-2">Total Referencial del Pedido</p>
                  <p className="text-5xl md:text-6xl font-bold text-white drop-shadow-sm">S/ {total}</p>
                </div>
                <a href="https://www.sunarp.gob.pe/w-sid/index.html" target="_blank" rel="noopener noreferrer">
                  <Button className="bg-white text-royal-blue hover:bg-white/90 font-bold gap-2 text-base px-8 h-14 shadow-xl rounded-full w-full sm:w-auto transition-transform hover:scale-105">
                    Preparar una cotización <ArrowRight className="h-5 w-5" />
                  </Button>
                </a>
              </CardFooter>
            </Card>
          </section>

          {/* Secondary Section: Capital y Contratos */}
          <section className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Tarjeta 1 */}
            <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl text-royal-blue">Planificación de Insumos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Antes de aceptar un pedido, valida stock de productos base, colores disponibles, tiempos de producción y margen esperado. Esto reduce retrasos y evita prometer entregas fuera de capacidad.
                </p>
              </CardContent>
            </Card>

            {/* Tarjeta 2 */}
            <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl text-royal-blue">Plantillas Comerciales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-muted-foreground">
                  Prepara documentos base para responder más rápido a clientes corporativos:
                </p>
                <div className="space-y-3">
                  <a href="https://www.gob.pe/institucion/sunarp/informes-publicaciones/4081275-modelo-de-minutas-de-constitucion-de-empresas" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full justify-start gap-4 h-auto py-3 border-royal-blue/20 hover:bg-royal-blue hover:text-white transition-colors group">
                      <span className="text-left font-semibold">Ver referencia comercial</span>
                      <ExternalLink className="h-4 w-4 opacity-70 group-hover:opacity-100" />
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Final Section: Preguntas Frecuentes (FAQ) */}
          <section className="max-w-3xl mx-auto pb-12">
            <h2 className="text-3xl font-bold text-royal-blue mb-8 text-center">Preguntas Frecuentes</h2>
            <Card className="border-0 shadow-md">
              <CardContent className="p-2 sm:p-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1" className="border-b-border/50">
                    <AccordionTrigger className="text-left hover:text-royal-blue transition-colors font-medium text-base sm:text-lg py-5 px-2">¿Cuánto demora preparar un pedido?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-base px-2 pb-5">
                      Depende de cantidad, disponibilidad de insumos y aprobación del mockup. Un pedido pequeño puede resolverse en pocos días si el diseño está aprobado.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2" className="border-b-border/50">
                    <AccordionTrigger className="text-left hover:text-royal-blue transition-colors font-medium text-base sm:text-lg py-5 px-2">¿El mockup tiene costo?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-base px-2 pb-5">
                      Puede manejarse como cortesía para pedidos confirmados o como servicio separado cuando requiere diseño adicional.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3" className="border-b-0">
                    <AccordionTrigger className="text-left hover:text-royal-blue transition-colors font-medium text-base sm:text-lg py-5 px-2">¿Debo validar stock antes de vender?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-base px-2 pb-5">
                      Sí. Validar stock y colores antes de confirmar evita cambios de último minuto con el cliente.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </TooltipProvider>
  )
}
