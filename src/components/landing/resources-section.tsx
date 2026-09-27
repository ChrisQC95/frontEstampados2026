import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
//import { Calculator, FileText, HelpCircle, ChevronRight, Info, CheckCircle2 } from "lucide-react"
//import { useNavigate } from "@tanstack/react-router"



export function ResourcesSection() {

  return (
    <section className="py-6">

      {/* FAQ Section */}
      <div className="mt-16">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-royal-blue mb-2">Preguntas frecuentes sobre pedidos personalizados</h3>
          <p className="text-muted-foreground text-lg">Resolvemos dudas comunes sobre cotización, mockups y producción.</p>
        </div>

        <Card className="border-0 shadow-md max-w-4xl mx-auto bg-card">
          <CardContent className="p-2 sm:p-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-b-border/50">
                <AccordionTrigger className="text-left hover:text-royal-blue transition-colors font-semibold text-lg py-4 px-2">
                  ¿Cómo se calcula el precio de un sublimado?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base px-2 pb-4">
                  Se calcula considerando producto base, cantidad, diseño, tiempo de preparación, insumos, merma y tipo de entrega. Para pedidos corporativos también conviene considerar empaque y urgencia.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border-b-border/50">
                <AccordionTrigger className="text-left hover:text-royal-blue transition-colors font-semibold text-lg py-4 px-2">
                  ¿Necesito aprobar un mockup antes de producir?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base px-2 pb-4">
                  Sí. El mockup ayuda a validar ubicación, tamaño, color y proporción del diseño antes de usar insumos reales.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="border-b-border/50">
                <AccordionTrigger className="text-left hover:text-royal-blue transition-colors font-semibold text-lg py-4 px-2">
                  ¿Puedo vender productos con varios colores?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base px-2 pb-4">
                  Sí. Lo ideal es registrar productos base y colores disponibles para cotizar rápido y evitar ofrecer variantes sin stock.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4" className="border-b-border/50">
                <AccordionTrigger className="text-left hover:text-royal-blue transition-colors font-semibold text-lg py-4 px-2">
                  ¿Cuánto demora producir un pedido?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base px-2 pb-4">
                  Depende de cantidad, disponibilidad de productos base, complejidad del diseño y aprobación del cliente. La planificación por etapas ayuda a cumplir fechas.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5" className="border-b-0">
                <AccordionTrigger className="text-left hover:text-royal-blue transition-colors font-semibold text-lg py-4 px-2">
                  ¿Qué datos debo guardar del cliente?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base px-2 pb-4">
                  Guarda razón social o nombre, documento, datos de contacto, dirección de entrega, historial de pedidos y preferencias de diseño cuando corresponda.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
