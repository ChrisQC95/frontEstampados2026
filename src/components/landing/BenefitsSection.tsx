import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, ShieldCheck, Rocket, HeartPulse, CheckCircle2 } from "lucide-react"

export function BenefitsSection() {
  return (
    <section id="beneficios" className="py-20 bg-blue-50/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            ¿Por qué centralizar tus sublimados hoy?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Organiza tus productos, pedidos y clientes para vender con una operación más clara y profesional.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
          {/* Tarjeta 1 */}
          <Card className="bg-white border hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">Control Comercial</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success-green mt-0.5" />
                  <span className="text-muted-foreground">Seguimiento de ventas, boletas, facturas y notas de venta.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success-green mt-0.5" />
                  <span className="text-muted-foreground">Visibilidad de ingresos por campañas y temporadas.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success-green mt-0.5" />
                  <span className="text-muted-foreground">Mejor coordinación entre ventas, administración y marketing.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Tarjeta 2 */}
          <Card className="bg-white border hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <ShieldCheck className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Clientes Corporativos</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success-green mt-0.5" />
                  <span className="text-muted-foreground">Gestiona empresas que solicitan merchandising, uniformes o regalos personalizados.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success-green mt-0.5" />
                  <span className="text-muted-foreground">Mantén datos de facturación y contacto listos para cada pedido.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Tarjeta 3 */}
          <Card className="bg-white border hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100">
                  <Rocket className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-xl">Producción Flexible</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success-green mt-0.5" />
                  <span className="text-muted-foreground">Trabaja pedidos pequeños o por lote sin perder control de stock.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success-green mt-0.5" />
                  <span className="text-muted-foreground">Prepara cotizaciones, mockups y ventas según cada campaña.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Tarjeta 4 */}
          <Card className="bg-white border hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <HeartPulse className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-xl">Marketing Visual</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success-green mt-0.5" />
                  <span className="text-muted-foreground">Crea prototipos visuales para validar diseños antes de producir.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success-green mt-0.5" />
                  <span className="text-muted-foreground">Reutiliza productos base, colores y diseños para acelerar propuestas.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

        </div>
      </div>
    </section>
  )
}
