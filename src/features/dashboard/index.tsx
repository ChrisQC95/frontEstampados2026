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
import {
  BarChart3,
  Download,
  FileText,
  Loader2,
  NotebookPen,
  Package,
  PieChart as PieChartIcon,
  ScrollText,
  ShoppingBag,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

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

interface VentaPorComprobante {
  tipoComprobanteId: number
  tipoComprobante: string
  cantidadVentas: number
  montoVentas: number
}

interface VentaPorProducto {
  productoId: number
  productoNombre: string
  categoria: string | null
  unidadesVendidas: number
  montoVendido: number
  cantidadLineas: number
}

interface PedidoPorEstado {
  estado: string
  cantidadPedidos: number
  montoPedidos: number
  subtotalProductos: number
  costoEnvio: number
}

interface ProductoTiendaSolicitado {
  tiendaProductoId: number
  productoNombre: string
  servicioEstampado: string | null
  cantidadUnidadesSolicitadas: number
  importeSolicitado: number
  cantidadPedidos: number
}

interface ReportePedidosTienda {
  pedidosPorEstado: PedidoPorEstado[]
  productosMasSolicitados: ProductoTiendaSolicitado[]
}

type ReportTab = 'comprobantes' | 'productos' | 'tienda'

const REPORT_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#06b6d4']

// ── Helper de formato Soles ────────────────────────────────────────────────────
const pen = (value: number) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value ?? 0)

const compactName = (name: string) => name.length > 20 ? `${name.slice(0, 18)}…` : name

const EmptyReport = ({ children }: { children: string }) => (
  <div className="flex h-64 items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 text-center text-sm text-muted-foreground">
    {children}
  </div>
)

const exportSheet = (rows: Record<string, string | number | null>[]) =>
  XLSX.utils.json_to_sheet(rows, { skipHeader: false })

// ── Componente principal ───────────────────────────────────────────────────────
export function Dashboard() {
  const { dbUser } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeReportTab, setActiveReportTab] = useState<ReportTab>('comprobantes')
  const [ventasPorComprobante, setVentasPorComprobante] = useState<VentaPorComprobante[]>([])
  const [ventasPorProducto, setVentasPorProducto] = useState<VentaPorProducto[]>([])
  const [reportePedidosTienda, setReportePedidosTienda] = useState<ReportePedidosTienda | null>(null)
  const [reportesLoading, setReportesLoading] = useState(true)
  const [reportesError, setReportesError] = useState(false)

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

  useEffect(() => {
    if (!dbUser?.id) return
    let active = true

    const fetchReports = async () => {
      setReportesLoading(true)
      setReportesError(false)
      try {
        const token = await auth.currentUser?.getIdToken()
        const headers = { Authorization: `Bearer ${token}` }
        const baseUrl = `${import.meta.env.VITE_API_URL}/api/dashboard/reportes`
        const endpoints = [
          `${baseUrl}/ventas-por-comprobante?usuarioId=${dbUser.id}`,
          `${baseUrl}/ventas-por-producto?usuarioId=${dbUser.id}`,
          `${baseUrl}/pedidos-tienda?usuarioId=${dbUser.id}`,
        ]
        const responses = await Promise.all(
          endpoints.map((url) => fetch(url, { headers }))
        )
        if (responses.some((response) => !response.ok)) {
          throw new Error('No se pudieron cargar todos los reportes')
        }
        const [comprobantes, productos, tienda] = await Promise.all(
          responses.map((response) => response.json())
        ) as [VentaPorComprobante[], VentaPorProducto[], ReportePedidosTienda]
        if (!active) return
        setVentasPorComprobante(comprobantes ?? [])
        setVentasPorProducto(productos ?? [])
        setReportePedidosTienda(tienda ?? { pedidosPorEstado: [], productosMasSolicitados: [] })
      } catch {
        if (!active) return
        setReportesError(true)
        toast.error('No se pudieron cargar los reportes analíticos')
      } finally {
        if (active) setReportesLoading(false)
      }
    }

    fetchReports()
    return () => { active = false }
  }, [dbUser?.id])

  const reportTabs: { id: ReportTab; label: string; icon: typeof PieChartIcon }[] = [
    { id: 'comprobantes', label: 'Ventas por comprobante', icon: PieChartIcon },
    { id: 'productos', label: 'Top Productos', icon: BarChart3 },
    { id: 'tienda', label: 'Métricas de Tienda', icon: ShoppingBag },
  ]

  const pedidosPorEstado = reportePedidosTienda?.pedidosPorEstado ?? []
  const productosTienda = reportePedidosTienda?.productosMasSolicitados ?? []
  const topProductos = ventasPorProducto.slice(0, 10)
  const totalPedidosTienda = pedidosPorEstado.reduce((total, pedido) => total + pedido.cantidadPedidos, 0)
  const montoPedidosTienda = pedidosPorEstado.reduce((total, pedido) => total + pedido.montoPedidos, 0)

  const downloadActiveReport = () => {
    try {
      const workbook = XLSX.utils.book_new()
      const exportDate = new Date().toISOString().slice(0, 10)

      if (activeReportTab === 'comprobantes') {
        if (!ventasPorComprobante.length) return
        XLSX.utils.book_append_sheet(workbook, exportSheet(
          ventasPorComprobante.map((row) => ({
            tipo_comprobante_id: row.tipoComprobanteId,
            tipo_comprobante: row.tipoComprobante,
            cantidad_ventas: row.cantidadVentas,
            monto_ventas_pen: row.montoVentas,
          }))
        ), 'Ventas_comprobante')
        XLSX.writeFile(workbook, `reporte_ventas_comprobante_${exportDate}.xlsx`)
        toast.success('Reporte de ventas por comprobante descargado')
        return
      }

      if (activeReportTab === 'productos') {
        if (!ventasPorProducto.length) return
        XLSX.utils.book_append_sheet(workbook, exportSheet(
          ventasPorProducto.map((row) => ({
            producto_id: row.productoId,
            producto: row.productoNombre,
            categoria: row.categoria,
            unidades_vendidas: row.unidadesVendidas,
            monto_vendido_pen: row.montoVendido,
            cantidad_lineas_venta: row.cantidadLineas,
          }))
        ), 'Ventas_producto')
        XLSX.writeFile(workbook, `reporte_ventas_producto_${exportDate}.xlsx`)
        toast.success('Reporte de ventas por producto descargado')
        return
      }

      if (!pedidosPorEstado.length && !productosTienda.length) return
      if (pedidosPorEstado.length) {
        XLSX.utils.book_append_sheet(workbook, exportSheet(
          pedidosPorEstado.map((row) => ({
            estado_pedido: row.estado,
            cantidad_pedidos: row.cantidadPedidos,
            monto_pedidos_pen: row.montoPedidos,
            subtotal_productos_pen: row.subtotalProductos,
            costo_envio_pen: row.costoEnvio,
          }))
        ), 'Pedidos_estado')
      }
      if (productosTienda.length) {
        XLSX.utils.book_append_sheet(workbook, exportSheet(
          productosTienda.map((row) => ({
            tienda_producto_id: row.tiendaProductoId,
            producto: row.productoNombre,
            servicio_estampado: row.servicioEstampado,
            unidades_solicitadas: row.cantidadUnidadesSolicitadas,
            importe_solicitado_pen: row.importeSolicitado,
            cantidad_pedidos: row.cantidadPedidos,
          }))
        ), 'Productos_tienda')
      }
      XLSX.writeFile(workbook, `reporte_pedidos_tienda_${exportDate}.xlsx`)
      toast.success('Reporte de pedidos de tienda descargado')
    } catch {
      toast.error('No se pudo generar el archivo Excel')
    }
  }

  return (
    <>
      <Main>
        <div className="mb-8 rounded-2xl border bg-gradient-to-br from-background via-background to-primary/5 p-5 shadow-sm sm:p-7">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Resumen del negocio</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Panel de gestión de sublimados
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Administra ventas, clientes, productos personalizados y comprobantes desde un solo panel.
            Pensado para una empresa de sublimados que trabaja pedidos corporativos, merchandising
            y productos a medida.
          </p>
        </div>

        {loading || !data ? (
          <div className="flex h-96 w-full items-center justify-center text-slate-400">
            <Loader2 className="mr-2 h-8 w-8 animate-spin" />
            Cargando métricas...
          </div>
        ) : (
          <div className="space-y-8">
            <section aria-label="Métricas principales" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
              <Card className="rounded-2xl border-l-4 border-l-slate-700 shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ingresos Netos del Mes</CardTitle>
                  <TrendingUp className="h-4 w-4 text-slate-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pen(data.totalVentasMes)}</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {data.crecimientoIngresos >= 0 ? '+' : ''}{data.crecimientoIngresos.toFixed(1)}% vs mes anterior ·{' '}
                    {data.cantidadVentasMes} comprobante{data.cantidadVentasMes !== 1 ? 's' : ''} vigente{data.cantidadVentasMes !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-l-4 border-l-blue-500 shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Facturación Neta</CardTitle><FileText className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold text-blue-600">{pen(data.montoFacturas)}</div><p className="mt-1 text-xs text-muted-foreground">{data.cantidadFacturas} factura{data.cantidadFacturas !== 1 ? 's' : ''} vigente{data.cantidadFacturas !== 1 ? 's' : ''} · neto NC</p></CardContent>
              </Card>

              <Card className="rounded-2xl border-l-4 border-l-emerald-500 shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Boletas Netas</CardTitle><ScrollText className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold text-emerald-600">{pen(data.montoBoletas)}</div><p className="mt-1 text-xs text-muted-foreground">{data.cantidadBoletas} boleta{data.cantidadBoletas !== 1 ? 's' : ''} vigente{data.cantidadBoletas !== 1 ? 's' : ''} · neto NC</p></CardContent>
              </Card>

              <Card className="rounded-2xl border-l-4 border-l-amber-500 shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Notas de Venta</CardTitle><NotebookPen className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold text-amber-600">{pen(data.montoNotasVenta)}</div><p className="mt-1 text-xs text-muted-foreground">{data.cantidadNotasVenta} nota{data.cantidadNotasVenta !== 1 ? 's' : ''} de venta (docs. internos)</p></CardContent>
              </Card>

              <Card className="rounded-2xl border-l-4 border-l-orange-500 shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Catálogo Activo</CardTitle><Package className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold text-orange-600">{data.totalProductos}</div><p className="mt-1 text-xs text-muted-foreground">Producto{data.totalProductos !== 1 ? 's' : ''} registrado{data.totalProductos !== 1 ? 's' : ''}</p></CardContent>
              </Card>

              <Card className="rounded-2xl border-l-4 border-l-violet-500 shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Socios de Negocio</CardTitle><Users className="h-4 w-4 text-violet-500" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold text-violet-600">{data.totalSocios}</div><p className="mt-1 text-xs text-muted-foreground">Cliente{data.totalSocios !== 1 ? 's' : ''} y/o proveedor{data.totalSocios !== 1 ? 'es' : ''} activo{data.totalSocios !== 1 ? 's' : ''}</p></CardContent>
              </Card>
            </section>

            <section aria-labelledby="reportes-title" className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Explora tus datos</p>
                <h2 id="reportes-title" className="mt-1 text-xl font-semibold tracking-tight">Reportes analíticos</h2>
                <p className="mt-1 text-sm text-muted-foreground">Ventas, productos y pedidos online para analizar el rendimiento del negocio.</p>
              </div>

              <div role="tablist" aria-label="Reportes analíticos" className="grid grid-cols-1 gap-2 rounded-2xl border bg-muted/30 p-2 sm:grid-cols-3">
                {reportTabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={activeReportTab === id}
                    onClick={() => setActiveReportTab(id)}
                    className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${activeReportTab === id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-background hover:text-foreground'}`}
                  >
                    <Icon className="h-4 w-4" />{label}
                  </button>
                ))}
              </div>

              <Card className="overflow-hidden rounded-2xl shadow-sm">
                <CardHeader className="flex flex-col gap-4 border-b bg-muted/10 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1.5">
                    <CardTitle>
                      {activeReportTab === 'comprobantes' && 'Ingresos por tipo de comprobante'}
                      {activeReportTab === 'productos' && 'Productos con mayores ventas'}
                      {activeReportTab === 'tienda' && 'Actividad de pedidos de tienda'}
                    </CardTitle>
                    <CardDescription>
                      {activeReportTab === 'comprobantes' && 'Participación de cada comprobante en los ingresos registrados.'}
                      {activeReportTab === 'productos' && 'Ranking por monto vendido; incluye unidades y categoría.'}
                      {activeReportTab === 'tienda' && 'Pedidos por estado y productos online más solicitados.'}
                    </CardDescription>
                  </div>
                  <button
                    type="button"
                    onClick={downloadActiveReport}
                    disabled={reportesLoading || reportesError || (
                      activeReportTab === 'comprobantes' ? ventasPorComprobante.length === 0 :
                        activeReportTab === 'productos' ? ventasPorProducto.length === 0 :
                          pedidosPorEstado.length === 0 && productosTienda.length === 0
                    )}
                    className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                    title="Descargar el reporte Excel para Power BI"
                  >
                    <Download className="h-4 w-4" />Descargar Excel
                  </button>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {reportesLoading ? (
                    <div className="flex h-72 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
                      <Loader2 className="h-7 w-7 animate-spin text-primary" />Obteniendo datos de reportes...
                    </div>
                  ) : reportesError ? (
                    <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
                      <p className="font-medium">No se pudieron cargar los reportes.</p>
                      <p className="text-sm text-muted-foreground">Revisa la conexión con el servidor e inténtalo nuevamente recargando la vista.</p>
                    </div>
                  ) : (
                    <>
                      {activeReportTab === 'comprobantes' && (
                        ventasPorComprobante.length === 0 ? <EmptyReport>No hay ventas disponibles para este reporte.</EmptyReport> :
                          <div className="grid items-center gap-6 lg:grid-cols-5">
                            <div className="h-72 min-w-0 lg:col-span-3">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie data={ventasPorComprobante} dataKey="montoVentas" nameKey="tipoComprobante" innerRadius="58%" outerRadius="82%" paddingAngle={3} strokeWidth={2} stroke="hsl(var(--background))">
                                    {ventasPorComprobante.map((item, index) => <Cell key={item.tipoComprobanteId} fill={REPORT_COLORS[index % REPORT_COLORS.length]} />)}
                                  </Pie>
                                  <Tooltip formatter={(value) => pen(Number(value ?? 0))} />
                                  <Legend verticalAlign="bottom" height={32} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="space-y-3 lg:col-span-2">
                              {ventasPorComprobante.map((item, index) => (
                                <div key={item.tipoComprobanteId} className="flex items-center justify-between gap-4 rounded-xl border p-3">
                                  <div className="flex min-w-0 items-center gap-3">
                                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: REPORT_COLORS[index % REPORT_COLORS.length] }} />
                                    <div className="min-w-0"><p className="truncate text-sm font-medium">{item.tipoComprobante}</p><p className="text-xs text-muted-foreground">{item.cantidadVentas} ventas</p></div>
                                  </div>
                                  <span className="shrink-0 text-sm font-semibold">{pen(item.montoVentas)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                      )}

                      {activeReportTab === 'productos' && (
                        topProductos.length === 0 ? <EmptyReport>Aún no hay productos vendidos para mostrar.</EmptyReport> :
                          <div className="space-y-4">
                            <div className="h-[360px] min-w-0 sm:h-[440px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topProductos} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                  <XAxis type="number" tickFormatter={(value) => `S/ ${Number(value).toLocaleString('es-PE')}`} />
                                  <YAxis type="category" dataKey="productoNombre" width={130} tickFormatter={compactName} tick={{ fontSize: 12 }} />
                                  <Tooltip formatter={(value) => pen(Number(value ?? 0))} labelFormatter={(label) => String(label)} />
                                  <Bar dataKey="montoVendido" name="Ingresos" fill="#2563eb" radius={[0, 6, 6, 0]} maxBarSize={28} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="overflow-x-auto rounded-xl border">
                              <table className="w-full min-w-[520px] text-left text-sm">
                                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Producto</th><th className="px-4 py-3">Categoría</th><th className="px-4 py-3 text-right">Unidades</th><th className="px-4 py-3 text-right">Ingresos</th></tr></thead>
                                <tbody>{topProductos.map((producto) => <tr key={producto.productoId} className="border-t"><td className="px-4 py-3 font-medium">{producto.productoNombre}</td><td className="px-4 py-3 text-muted-foreground">{producto.categoria || '—'}</td><td className="px-4 py-3 text-right">{Number(producto.unidadesVendidas).toLocaleString('es-PE')}</td><td className="px-4 py-3 text-right font-medium">{pen(producto.montoVendido)}</td></tr>)}</tbody>
                              </table>
                            </div>
                          </div>
                      )}

                      {activeReportTab === 'tienda' && (
                        <div className="space-y-6">
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-xl border bg-muted/20 p-4"><p className="text-xs font-medium text-muted-foreground">Pedidos registrados</p><p className="mt-2 text-2xl font-bold">{totalPedidosTienda}</p></div>
                            <div className="rounded-xl border bg-muted/20 p-4"><p className="text-xs font-medium text-muted-foreground">Importe de pedidos</p><p className="mt-2 text-2xl font-bold">{pen(montoPedidosTienda)}</p></div>
                            <div className="rounded-xl border bg-muted/20 p-4"><p className="text-xs font-medium text-muted-foreground">Productos solicitados</p><p className="mt-2 text-2xl font-bold">{productosTienda.length}</p></div>
                          </div>
                          <div className="grid gap-6 xl:grid-cols-2">
                            <div>
                              <h3 className="mb-3 text-sm font-semibold">Pedidos por estado</h3>
                              {pedidosPorEstado.length === 0 ? <EmptyReport>No hay pedidos de tienda registrados.</EmptyReport> :
                                <div className="h-72 min-w-0">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={pedidosPorEstado} margin={{ top: 8, right: 12, left: -18, bottom: 8 }}>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                      <XAxis dataKey="estado" tick={{ fontSize: 11 }} />
                                      <YAxis allowDecimals={false} />
                                      <Tooltip formatter={(value) => Number(value ?? 0).toLocaleString('es-PE')} />
                                      <Bar dataKey="cantidadPedidos" name="Pedidos" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={48} />
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>}
                            </div>
                            <div>
                              <h3 className="mb-3 text-sm font-semibold">Productos más solicitados</h3>
                              {productosTienda.length === 0 ? <EmptyReport>No hay productos online solicitados.</EmptyReport> :
                                <div className="space-y-2">
                                  {productosTienda.slice(0, 8).map((producto, index) => (
                                    <div key={producto.tiendaProductoId} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                                      <div className="flex min-w-0 items-center gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span><div className="min-w-0"><p className="truncate text-sm font-medium">{producto.productoNombre}</p><p className="truncate text-xs text-muted-foreground">{producto.servicioEstampado || `${producto.cantidadPedidos} pedido${producto.cantidadPedidos === 1 ? '' : 's'}`}</p></div></div>
                                      <div className="shrink-0 text-right"><p className="text-sm font-semibold">{Number(producto.cantidadUnidadesSolicitadas).toLocaleString('es-PE')} uds.</p><p className="text-xs text-muted-foreground">{pen(producto.importeSolicitado)}</p></div>
                                    </div>
                                  ))}
                                </div>}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </section>

            <section aria-label="Actividad de ventas" className="grid grid-cols-1 gap-4 xl:grid-cols-7">
              <Card className="rounded-2xl shadow-sm xl:col-span-4">
                <CardHeader><CardTitle>Distribución de Ingresos — Últimos 6 Meses</CardTitle><CardDescription>Desglose por tipo de comprobante · Soles (S/)</CardDescription></CardHeader>
                <CardContent className="ps-2"><Overview data={data.graficoVentas} /></CardContent>
              </Card>
              <Card className="rounded-2xl shadow-sm xl:col-span-3">
                <CardHeader><CardTitle>Ventas Recientes</CardTitle><CardDescription>{data.cantidadVentasMes > 0 ? `${data.cantidadVentasMes} comprobante${data.cantidadVentasMes !== 1 ? 's' : ''} emitido${data.cantidadVentasMes !== 1 ? 's' : ''} este mes.` : 'Aún no has realizado ventas este mes.'}</CardDescription></CardHeader>
                <CardContent><RecentSales ventas={data.ventasRecientes} /></CardContent>
              </Card>
            </section>
          </div>
        )}
      </Main>
    </>
  )
}
