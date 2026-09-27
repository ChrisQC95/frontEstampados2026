import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Main } from '@/components/layout/main'
import { Overview, type GraficoVentaData } from './components/overview'
import { RecentSales, type VentaReciente } from './components/recent-sales'
import { useAuth } from '@/context/AuthContext'
import { auth } from '@/lib/firebase'
import { Loader2, TrendingUp, FileText, ScrollText, NotebookPen, Package, Users } from 'lucide-react'
import { toast } from 'sonner'

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface DashboardData {
  totalVentasMes: number
  crecimientoIngresos: number
  cantidadVentasMes: number
  montoFacturas: number
  cantidadFacturas: number
  montoBoletas: number
  cantidadBoletas: number
  montoNotasVenta: number
  cantidadNotasVenta: number
  totalProductos: number
  totalSocios: number
  ventasRecientes: VentaReciente[]
  graficoVentas: GraficoVentaData[]
}

// ── Helper de formato Soles ────────────────────────────────────────────────────
const pen = (value: number) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)

// ── Componente principal ───────────────────────────────────────────────────────
export function Dashboard() {
  const { dbUser } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!dbUser?.id) return
    const fetchDashboardData = async () => {
      try {
        const token = await auth.currentUser?.getIdToken()
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/dashboard/resumen?usuarioId=${dbUser.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        if (!res.ok) throw new Error('Error fetching dashboard')
        setData(await res.json())
      } catch {
        toast.error('No se pudieron cargar las métricas del dashboard')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [dbUser?.id])

  return (
    <>
      <Main>
        {/* ── Encabezado institucional ─────────────────────────────────── */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Panel de gestión de sublimados
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground leading-relaxed">
            Administra ventas, clientes, productos personalizados y comprobantes desde un solo panel.
            Pensado para una empresa de sublimados que trabaja pedidos corporativos, merchandising
            y productos a medida.
          </p>
        </div>

        {/* ── Cuerpo del dashboard ─────────────────────────────────────── */}
        {loading || !data ? (
          <div className="flex h-96 w-full items-center justify-center text-slate-400">
            <Loader2 className="mr-2 h-8 w-8 animate-spin" />
            Cargando métricas...
          </div>
        ) : (
          <div className="space-y-6">

            {/* ── Grid 6 KPI Cards ─────────────────────────────────────── */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">

              {/* Card 1 — Total Neto */}
              <Card className="border-l-4 border-l-slate-700 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ingresos Netos del Mes</CardTitle>
                  <TrendingUp className="h-4 w-4 text-slate-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pen(data.totalVentasMes)}</div>
                  <p className="text-xs text-muted-foreground">
                    {data.crecimientoIngresos >= 0 ? '+' : ''}
                    {data.crecimientoIngresos.toFixed(1)}% vs mes anterior &middot;{' '}
                    {data.cantidadVentasMes} comprobante{data.cantidadVentasMes !== 1 ? 's' : ''} vigente{data.cantidadVentasMes !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              {/* Card 2 — Facturación Neta (ya descontadas NC) */}
              <Card className="border-l-4 border-l-blue-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Facturación Neta</CardTitle>
                  <FileText className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{pen(data.montoFacturas)}</div>
                  <p className="text-xs text-muted-foreground">
                    {data.cantidadFacturas} factura{data.cantidadFacturas !== 1 ? 's' : ''} vigente{data.cantidadFacturas !== 1 ? 's' : ''} · neto NC
                  </p>
                </CardContent>
              </Card>

              {/* Card 3 — Boletas Netas (ya descontadas NC) */}
              <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Boletas Netas</CardTitle>
                  <ScrollText className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">{pen(data.montoBoletas)}</div>
                  <p className="text-xs text-muted-foreground">
                    {data.cantidadBoletas} boleta{data.cantidadBoletas !== 1 ? 's' : ''} vigente{data.cantidadBoletas !== 1 ? 's' : ''} · neto NC
                  </p>
                </CardContent>
              </Card>

              {/* Card 4 — Notas de Venta */}
              <Card className="border-l-4 border-l-amber-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Notas de Venta</CardTitle>
                  <NotebookPen className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600">{pen(data.montoNotasVenta)}</div>
                  <p className="text-xs text-muted-foreground">
                    {data.cantidadNotasVenta} nota{data.cantidadNotasVenta !== 1 ? 's' : ''} de venta (docs. internos)
                  </p>
                </CardContent>
              </Card>

              {/* Card 5 — Catálogo Activo */}
              <Card className="border-l-4 border-l-orange-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Catálogo Activo</CardTitle>
                  <Package className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{data.totalProductos}</div>
                  <p className="text-xs text-muted-foreground">
                    Producto{data.totalProductos !== 1 ? 's' : ''} registrado{data.totalProductos !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              {/* Card 6 — Socios de Negocio */}
              <Card className="border-l-4 border-l-violet-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Socios de Negocio</CardTitle>
                  <Users className="h-4 w-4 text-violet-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-violet-600">{data.totalSocios}</div>
                  <p className="text-xs text-muted-foreground">
                    Cliente{data.totalSocios !== 1 ? 's' : ''} y/o proveedor{data.totalSocios !== 1 ? 'es' : ''} activo{data.totalSocios !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

            </div>

            {/* ── Gráfico + Ventas recientes ────────────────────────────── */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">

              <Card className="col-span-1 lg:col-span-4 shadow-sm">
                <CardHeader>
                  <CardTitle>Distribución de Ingresos — Últimos 6 Meses</CardTitle>
                  <CardDescription>
                    Desglose por tipo de comprobante · Soles (S/)
                  </CardDescription>
                </CardHeader>
                <CardContent className="ps-2">
                  <Overview data={data.graficoVentas} />
                </CardContent>
              </Card>

              <Card className="col-span-1 lg:col-span-3 shadow-sm">
                <CardHeader>
                  <CardTitle>Ventas Recientes</CardTitle>
                  <CardDescription>
                    {data.cantidadVentasMes > 0
                      ? `${data.cantidadVentasMes} comprobante${data.cantidadVentasMes !== 1 ? 's' : ''} emitido${data.cantidadVentasMes !== 1 ? 's' : ''} este mes.`
                      : 'Aún no has realizado ventas este mes.'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentSales ventas={data.ventasRecientes} />
                </CardContent>
              </Card>

            </div>
          </div>
        )}
      </Main>
    </>
  )
}
