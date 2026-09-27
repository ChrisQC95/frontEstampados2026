import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  MonitorSmartphone, 
  Building2, 
  Download, 
  Fingerprint, 
  CheckCircle2, 
  Clock,
  IdCard,
  MapPin,
  FileText,
  Info,
  User,
  PieChart,
  Receipt,
  Trophy,
  ExternalLink,
  Route
} from "lucide-react"

export function RequirementsTabs() {
  return (
    <div className="w-full">
      {/* Title */}
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold tracking-tight text-royal-blue mb-4">
          Flujo Operativo para Sublimados
        </h2>
        <p className="text-muted-foreground text-lg">
          Organiza el recorrido de un pedido desde el diseño hasta la venta final.
        </p>
      </div>

      <Tabs defaultValue="digital" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="digital" className="text-base">
            <MonitorSmartphone className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Pedido Digital</span>
            <span className="sm:hidden">Digital</span>
          </TabsTrigger>
          <TabsTrigger value="presencial" className="text-base">
            <Building2 className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Pedido Presencial</span>
            <span className="sm:hidden">Presencial</span>
          </TabsTrigger>
          <TabsTrigger value="ruta" className="text-base">
            <Route className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Ruta del Pedido</span>
            <span className="sm:hidden">Ruta</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="digital">
          <Card className="border-0 shadow-md">
            <CardHeader className="text-center sm:text-left">
              <CardTitle className="text-xl text-royal-blue">Flujo de pedido desde el sistema</CardTitle>
              <CardDescription>
                Registra clientes, productos y mockups desde el panel cuando lo necesites.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="relative flex flex-col items-center p-6 text-center border rounded-xl bg-card transition-colors hover:border-royal-blue/30">
                  <div className="absolute -top-3 -right-3 bg-royal-blue text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-sm">1</div>
                  <Download className="w-10 h-10 mb-4 text-royal-blue" />
                  <h4 className="font-semibold mb-2">Cliente y pedido</h4>
                  <p className="text-sm text-muted-foreground">Registra el cliente, producto solicitado, cantidad y fecha objetivo.</p>
                </div>
                <div className="relative flex flex-col items-center p-6 text-center border rounded-xl bg-card transition-colors hover:border-royal-blue/30">
                  <div className="absolute -top-3 -right-3 bg-royal-blue text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-sm">2</div>
                  <Fingerprint className="w-10 h-10 mb-4 text-royal-blue" />
                  <h4 className="font-semibold mb-2">Mockup visual</h4>
                  <p className="text-sm text-muted-foreground">Carga el diseño del cliente y valida ubicación, tamaño y color sobre el producto base.</p>
                </div>
                <div className="relative flex flex-col items-center p-6 text-center border rounded-xl bg-card border-success-green/20 hover:border-success-green/40 transition-colors">
                  <div className="absolute -top-3 -right-3 bg-success-green text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-sm">3</div>
                  <Clock className="w-10 h-10 mb-4 text-success-green" />
                  <h4 className="font-semibold mb-2">Venta y comprobante</h4>
                  <p className="text-sm text-muted-foreground">Confirma importes, emite el comprobante y deja el pedido listo para seguimiento.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="presencial">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl text-royal-blue">Datos necesarios</CardTitle>
                <CardDescription>Reúne la información mínima antes de confirmar el pedido.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex flex-col justify-center">
                <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/40">
                  <div className="flex bg-success-green/10 p-2 rounded-full shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-success-green" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Datos del cliente</h4>
                    <p className="text-sm text-muted-foreground">Nombre, documento, correo, teléfono y datos de facturación cuando aplique.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/40">
                  <div className="flex bg-success-green/10 p-2 rounded-full shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-success-green" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Detalle del producto</h4>
                    <p className="text-sm text-muted-foreground">Producto base, color, cantidad, diseño, ubicación del estampado y fecha de entrega.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/40">
                  <div className="flex bg-success-green/10 p-2 rounded-full shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-success-green" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Archivo del diseño</h4>
                    <p className="text-sm text-muted-foreground">Preferiblemente PNG transparente o imagen de buena resolución para preparar el mockup.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md flex flex-col justify-center bg-royal-blue/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-royal-blue">
                  <Building2 className="w-5 h-5" />
                  Pedidos corporativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="bg-background border-primary/20 shadow-sm">
                  <Info className="h-5 w-5 text-royal-blue" />
                  <AlertTitle className="text-royal-blue font-semibold ml-2">Flujo recomendado</AlertTitle>
                  <AlertDescription className="text-sm mt-3 ml-2 flex flex-col gap-3">
                    <span className="flex gap-2"><strong className="text-royal-blue">1.</strong> Validar datos de la empresa y responsable de compra.</span>
                    <span className="flex gap-2"><strong className="text-royal-blue">2.</strong> Preparar mockup y cotización con cantidades claras.</span>
                    <span className="flex gap-2"><strong className="text-royal-blue">3.</strong> Registrar venta, entrega y comprobante asociado.</span>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ruta">
          <Card className="border-0 shadow-md">
            <CardHeader className="text-center sm:text-left">
              <CardTitle className="text-xl text-royal-blue">Tu ruta para completar un pedido</CardTitle>
              <CardDescription>
                Sigue estos pasos para pasar de una solicitud a un pedido listo para producción.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative border-l-2 border-dashed border-slate-200 ml-4 md:ml-6 space-y-10 pb-4 mt-4">
                {/* Paso 1 */}
                <div className="relative pl-8 md:pl-10">
                  <div className="absolute -left-[21px] flex h-10 w-10 items-center justify-center rounded-full bg-white border-2 border-royal-blue shadow-sm">
                    <User className="h-5 w-5 text-royal-blue" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-royal-blue border-royal-blue/30 bg-royal-blue/5">
                        Paso 1
                      </Badge>
                      <h4 className="text-lg font-bold text-foreground">Define el requerimiento</h4>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Aclara producto, cantidad, colores, diseño, fecha de entrega y uso final del pedido. Esto evita reprocesos y cambios fuera de alcance.
                    </p>
                  </div>
                </div>

                {/* Paso 2 */}
                <div className="relative pl-8 md:pl-10">
                  <div className="absolute -left-[21px] flex h-10 w-10 items-center justify-center rounded-full bg-white border-2 border-royal-blue shadow-sm">
                    <IdCard className="h-5 w-5 text-royal-blue" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-royal-blue border-royal-blue/30 bg-royal-blue/5">
                        Paso 2
                      </Badge>
                      <h4 className="text-lg font-bold text-foreground">Prepara el mockup</h4>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Usa el módulo de mockups para mostrar el diseño sobre el producto base. El cliente debe validar tamaño, posición y color antes de producir.
                    </p>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <Button variant="outline" size="sm" className="gap-2" asChild>
                        <a href="/dashboard/mockups" target="_blank" rel="noopener noreferrer">
                          Abrir mockups <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2" asChild>
                        <a href="/dashboard/productos" target="_blank" rel="noopener noreferrer">
                          Ver productos <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Paso 3 */}
                <div className="relative pl-8 md:pl-10">
                  <div className="absolute -left-[21px] flex h-10 w-10 items-center justify-center rounded-full bg-white border-2 border-royal-blue shadow-sm">
                    <PieChart className="h-5 w-5 text-royal-blue" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-royal-blue border-royal-blue/30 bg-royal-blue/5">
                        Paso 3
                      </Badge>
                      <h4 className="text-lg font-bold text-foreground">Confirma costos y stock</h4>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Revisa productos base, insumos, tiempo de producción, margen y disponibilidad antes de cerrar la venta.
                    </p>
                  </div>
                </div>

                {/* Paso 4 */}
                <div className="relative pl-8 md:pl-10">
                  <div className="absolute -left-[21px] flex h-10 w-10 items-center justify-center rounded-full bg-white border-2 border-royal-blue shadow-sm">
                    <Receipt className="h-5 w-5 text-royal-blue" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-royal-blue border-royal-blue/30 bg-royal-blue/5">
                        Paso 4
                      </Badge>
                      <h4 className="text-lg font-bold text-foreground">Venta y comprobante</h4>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Registra la venta con factura, boleta o nota de venta según corresponda. Así mantienes historial comercial y control administrativo.
                    </p>
                  </div>
                </div>

                {/* Paso 5 */}
                <div className="relative pl-8 md:pl-10">
                  <div className="absolute -left-[21px] flex h-10 w-10 items-center justify-center rounded-full bg-white border-2 border-success-green shadow-sm">
                    <Trophy className="h-5 w-5 text-success-green" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-success-green border-success-green/30 bg-success-green/5">
                        Paso 5
                      </Badge>
                      <h4 className="text-lg font-bold text-foreground">Entrega y seguimiento</h4>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Marca el pedido como entregado, guarda observaciones y conserva el historial para futuras campañas o reposiciones del cliente.
                    </p>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <Button variant="outline" size="sm" className="gap-2 border-success-green/50 hover:bg-success-green/10 hover:text-success-green hover:border-success-green text-success-green" asChild>
                        <a href="https://www.gob.pe/osce" target="_blank" rel="noopener noreferrer">
                          Oportunidades OSCE <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-12 bg-white rounded-xl border p-6 shadow-sm">
        <h3 className="text-xl font-bold text-royal-blue mb-4">¿Qué pedidos conviene registrar?</h3>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="hover:no-underline hover:text-royal-blue transition-colors text-left">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-royal-blue shrink-0" />
                <span className="font-medium">Pedidos corporativos</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base ml-8">
              Registra pedidos de empresas, instituciones o clientes frecuentes para conservar historial y facilitar nuevas ventas.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="hover:no-underline hover:text-royal-blue transition-colors text-left">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-royal-blue shrink-0" />
                <span className="font-medium">Pedidos personalizados por lote</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base ml-8">
              Registra pedidos con varias unidades, tallas, colores o productos distintos para controlar stock y producción.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger className="hover:no-underline hover:text-royal-blue transition-colors text-left">
              <div className="flex items-center gap-3">
                <IdCard className="w-5 h-5 text-royal-blue shrink-0" />
                <span className="font-medium">Pedidos con entrega programada</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base ml-8">
              Registra pedidos con fecha de entrega comprometida para priorizar producción y reducir retrasos.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
