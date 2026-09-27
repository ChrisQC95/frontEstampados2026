import { useCallback, useEffect, useMemo, useState } from 'react'
import { getHistorialVentas, getReporteVentas, emitirNotaCredito } from './api'
import { getSociosNegocio } from '../nueva-venta/api'
import { getCuentas } from '@/features/configuracion/cuentas-bancarias/api'
import type { Venta, ReporteVentaExcelRow } from './types'
import type { SocioNegocio } from '../nueva-venta/types'
import type { CuentaBancaria } from '@/features/configuracion/cuentas-bancarias/types'
import { useAuth } from '@/context/AuthContext'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  Eye,
  FileDown,
  FileSpreadsheet,
  Building2,
  Search,
  CalendarRange,
  TrendingUp,
  RotateCcw,
  XCircle,
} from 'lucide-react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { FacturaPDF } from './components/FacturaPDF'
import * as XLSX from 'xlsx'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

// ─── Mapeos estáticos ────────────────────────────────────────────────────────
const TIPOS_COMPROBANTE: Record<number, string> = {
  1: 'FACTURA ELECTRÓNICA',
  2: 'BOLETA DE VENTA',
  4: 'NOTA DE CRÉDITO',
}
const TIPOS_COMPROBANTE_CORTO: Record<number, string> = {
  1: 'FAC',
  2: 'BOV',
  4: 'NC',
}

// ─── Catálogo 09 SUNAT — Motivos de Nota de Crédito ─────────────────────────
const MOTIVOS_NC = [
  { codigo: '01', descripcion: 'Anulación de la operación' },
  { codigo: '02', descripcion: 'Anulación por error en el RUC' },
  { codigo: '03', descripcion: 'Corrección por error en la descripción o atención de reclamo' },
  { codigo: '04', descripcion: 'Descuento global' },
  { codigo: '05', descripcion: 'Descuento por ítem' },
  { codigo: '06', descripcion: 'Devolución total' },
  { codigo: '07', descripcion: 'Devolución por ítem' },
  { codigo: '08', descripcion: 'Bonificación' },
  { codigo: '09', descripcion: 'Disminución en el valor' },
  { codigo: '10', descripcion: 'Otros Conceptos' },
  { codigo: '11', descripcion: 'Ajustes de operaciones de exportación' },
  { codigo: '12', descripcion: 'Ajustes afectos al IVAP' },
  { codigo: '13', descripcion: 'Corrección o modificación del monto neto pendiente de pago y/o fechas de vencimiento' }
];

const MONEDAS: Record<number, string> = {
  1: 'PEN - Soles',
  2: 'USD - Dólares',
}
const TIPOS_PAGO: Record<number, string> = {
  1: 'Contado',
  2: 'Crédito a 30 días',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getBadgeClasses = (estado: string | null) => {
  switch (estado) {
    case 'ACEPTADO': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'PENDIENTE': return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'RECHAZADO': return 'bg-red-50 text-red-700 border-red-200'
    case 'ANULADO': return 'bg-slate-100 text-slate-500 border-slate-200'
    default: return 'bg-amber-50 text-amber-700 border-amber-200'
  }
}

const primerDiaMes = () => format(startOfMonth(new Date()), 'yyyy-MM-dd')
const ultimoDiaMes = () => format(endOfMonth(new Date()), 'yyyy-MM-dd')
const DEFAULT_PDF_LOGO_URL = '/images/sabiduria-logo.jpeg'

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('No se pudo leer la imagen para el PDF.'))
    reader.readAsDataURL(blob)
  })

const imageUrlToDataUrl = async (url: string) => {
  const response = await fetch(url, { mode: 'cors', cache: 'force-cache' })
  if (!response.ok) throw new Error('No se pudo cargar la imagen para el PDF.')
  return blobToDataUrl(await response.blob())
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export function HistorialVentas() {
  const { dbUser, empresaPerfil } = useAuth()
  const currentUserId = dbUser?.id

  const [ventas, setVentas] = useState<Venta[]>([])
  const [socios, setSocios] = useState<SocioNegocio[]>([])
  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancaria[]>([])
  const [loading, setLoading] = useState(true)
  const [exportando, setExportando] = useState(false)
  const [pdfLogoUrl, setPdfLogoUrl] = useState('')
  const [pdfLogoLoading, setPdfLogoLoading] = useState(false)

  // ─── Filtros ───────────────────────────────────────────────────────────────
  const [busqueda, setBusqueda] = useState('')
  const [fechaInicio, setFechaInicio] = useState(primerDiaMes())
  const [fechaFin, setFechaFin] = useState(ultimoDiaMes())

  // ─── Modal detalle venta ────────────────────────────────────────────────────────
  const [ventaActiva, setVentaActiva] = useState<Venta | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // ─── Modal Nota de Crédito ─────────────────────────────────────────────────────
  const [ventaNcTarget, setVentaNcTarget] = useState<Venta | null>(null)
  const [ncModalOpen, setNcModalOpen] = useState(false)
  const [ncMotivo, setNcMotivo] = useState('')
  const [ncSustento, setNcSustento] = useState('')
  const [ncLoading, setNcLoading] = useState(false)

  useEffect(() => {
    let active = true
    const logoUrl = empresaPerfil?.logoUrl?.trim() || DEFAULT_PDF_LOGO_URL

    setPdfLogoLoading(true)
    setPdfLogoUrl('')

    imageUrlToDataUrl(logoUrl)
      .catch(() => (logoUrl === DEFAULT_PDF_LOGO_URL ? '' : imageUrlToDataUrl(DEFAULT_PDF_LOGO_URL)))
      .then((dataUrl) => {
        if (active) setPdfLogoUrl(dataUrl)
      })
      .finally(() => {
        if (active) setPdfLogoLoading(false)
      })

    return () => {
      active = false
    }
  }, [empresaPerfil?.logoUrl])

  const empresaPdf = useMemo(() => ({
    usuarioId: empresaPerfil?.usuarioId ?? dbUser?.id ?? 0,
    ruc: empresaPerfil?.ruc ?? '',
    razonSocial: empresaPerfil?.razonSocial ?? dbUser?.razonSocial ?? 'Sabiduría',
    nombreComercial: empresaPerfil?.nombreComercial ?? empresaPerfil?.razonSocial ?? dbUser?.razonSocial ?? 'Sabiduría',
    direccionFiscal: empresaPerfil?.direccionFiscal ?? '',
    telefono: empresaPerfil?.telefono ?? '',
    emailContacto: empresaPerfil?.emailContacto ?? '',
    logoUrl: pdfLogoUrl,
  }), [dbUser?.id, dbUser?.razonSocial, empresaPerfil, pdfLogoUrl])

  const handleEmitirNC = async () => {
    if (!ventaNcTarget || !ncMotivo || !ncSustento.trim()) {
      toast.warning('Completa el motivo y el sustento antes de continuar.')
      return
    }
    setNcLoading(true)
    try {
      await emitirNotaCredito(ventaNcTarget.id, ncMotivo, ncSustento.trim())
      toast.success(`Nota de Crédito emitida correctamente para ${ventaNcTarget.serie}-${String(ventaNcTarget.correlativo).padStart(8, '0')}`)
      setNcModalOpen(false)
      setNcMotivo('')
      setNcSustento('')
      setVentaNcTarget(null)
      // Recargar el historial para reflejar documentoOrigenId actualizado
      if (currentUserId) {
        const updated = await getHistorialVentas(currentUserId)
        setVentas(updated.sort((a, b) => b.id - a.id))
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al emitir la Nota de Crédito'
      toast.error(msg)
    } finally {
      setNcLoading(false)
    }
  }

  // ─── Carga inicial ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUserId) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const [ventasData, sociosData, cuentasData] = await Promise.all([
          getHistorialVentas(currentUserId),
          getSociosNegocio(currentUserId),
          getCuentas(currentUserId),
        ])
        setVentas(ventasData.sort((a, b) => b.id - a.id))
        setSocios(sociosData)
        setCuentasBancarias(cuentasData.filter(c => c.activo))
      } catch {
        toast.error('Error al cargar el historial de ventas')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [currentUserId])

  // ─── Helpers de socio ─────────────────────────────────────────────────────
  const getSocio = useCallback((id: number) => socios.find(s => s.id === id), [socios])
  const getSocioNombre = useCallback((id: number) => getSocio(id)?.nombreRazonSocial ?? `ID: ${id}`, [getSocio])
  const getSocioDocumento = useCallback((id: number) => getSocio(id)?.numeroDocumento ?? '', [getSocio])
  const getSocioDireccion = useCallback((id: number) => getSocio(id)?.direccionFiscal ?? '', [getSocio])

  // ─── Filtrado en memoria ──────────────────────────────────────────────────
  const ventasFiltradas = useMemo(() => {
    const q = busqueda.toLowerCase().trim()
    return ventas.filter(v => {
      // Filtro por rango de fechas
      const fechaVenta = v.fechaEmision.split('T')[0]
      if (fechaInicio && fechaVenta < fechaInicio) return false
      if (fechaFin && fechaVenta > fechaFin) return false

      // Filtro por texto (razón social, RUC, número de comprobante)
      if (!q) return true
      const nombre = getSocioNombre(v.socioNegocioId).toLowerCase()
      const ruc = getSocioDocumento(v.socioNegocioId).toLowerCase()
      const comprobante = `${v.serie}-${v.correlativo.toString().padStart(6, '0')}`.toLowerCase()
      return nombre.includes(q) || ruc.includes(q) || comprobante.includes(q)
    })
  }, [ventas, busqueda, fechaInicio, fechaFin, getSocioNombre, getSocioDocumento])

  // ─── KPIs del período filtrado ────────────────────────────────────────────
  const kpis = useMemo(() => {
    let totalPeriodo = 0
    let totalIgv = 0
    let cantidad = 0

    // 1. Crear un registro de todos los IDs de ventas que están "muertas"
    // (Ya sea porque se anularon directamente o porque tienen una NC válida)
    const ventasAnuladas = new Set<number>()

    ventas.forEach(v => {
      // Si la venta está anulada o tiene un documento que la originó (NC aplicada)
      if (v.estadoSunat === 'ANULADO' || v.documentoOrigenId != null) {
        ventasAnuladas.add(v.id)
      }
      // Si es una Nota de Crédito válida, el documento que modifica "muere"
      if (v.tipoComprobanteId === 4 && v.documentoModificadoId) {
        if (v.estadoSunat !== 'ANULADO') {
          ventasAnuladas.add(v.documentoModificadoId)
        }
      }
    })

    // 2. Calcular solo iterando sobre los "sobrevivientes"
    for (const v of ventasFiltradas) {
      // Las Notas de Crédito no suman dinero a la caja, se ignoran en el neto final.
      if (v.tipoComprobanteId === 4) continue

      // Si la venta está en la lista negra (anulada), vale 0. Se ignora.
      if (ventasAnuladas.has(v.id)) continue

      // Comprobante 100% vigente y positivo
      totalPeriodo += v.total
      totalIgv += v.igv
      cantidad++
    }

    return { totalPeriodo, totalIgv, cantidad }
  }, [ventasFiltradas, ventas])


  // ─── Descarga Excel ───────────────────────────────────────────────────────
  const handleDescargarExcel = async () => {
    if (!currentUserId) return
    setExportando(true)
    try {
      const datos: ReporteVentaExcelRow[] = await getReporteVentas(currentUserId, fechaInicio, fechaFin)
      if (datos.length === 0) {
        toast.info('No hay datos para exportar en el período seleccionado')
        return
      }

      // Transformar a filas legibles para el Excel
      const filas = datos.map(r => ({
        'Fecha Emisión': format(new Date(r.fechaEmision), 'dd/MM/yyyy HH:mm'),
        'Tipo Comprobante': r.tipoComprobante,
        'Serie': r.serie,
        'Correlativo': r.correlativo,
        'RUC/DNI Cliente': r.rucCliente,
        'Razón Social': r.razonSocialCliente,
        'Producto/Servicio': r.productoNombre,
        'Cantidad': r.cantidad,
        'Precio Unitario': r.precioUnitario,
        'Subtotal Ítem': r.subtotalItem,
        'Estado SUNAT': r.estadoSunat ?? 'PENDIENTE',
      }))

      const worksheet = XLSX.utils.json_to_sheet(filas)
      // Anchos de columna aproximados
      worksheet['!cols'] = [
        { wch: 18 }, { wch: 22 }, { wch: 6 }, { wch: 10 },
        { wch: 14 }, { wch: 30 }, { wch: 30 },
        { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 12 },
      ]
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Ventas')

      const mesLabel = format(new Date(fechaInicio), 'MMM_yyyy', { locale: es }).toUpperCase()
      XLSX.writeFile(workbook, `Reporte_Ventas_${mesLabel}.xlsx`)
      toast.success('Reporte Excel descargado correctamente')
    } catch {
      toast.error('Error al generar el reporte Excel')
    } finally {
      setExportando(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6 animate-in fade-in-0">

      {/* ── ENCABEZADO ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Historial de Ventas</h1>
          <p className="text-slate-500 mt-1 text-sm">Consulta y gestiona todos los comprobantes emitidos.</p>
        </div>
      </div>

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="bg-indigo-50 p-3 rounded-lg">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Ingresos Netos en Período</p>
              <p className="text-2xl font-bold text-slate-900">S/ {kpis.totalPeriodo.toFixed(2)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Excl. anulados · ya descontadas NC</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="bg-emerald-50 p-3 rounded-lg">
              <CalendarRange className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">IGV Neto</p>
              <p className="text-2xl font-bold text-slate-900">S/ {kpis.totalIgv.toFixed(2)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Excl. anulados · ya descontadas NC</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="bg-amber-50 p-3 rounded-lg">
              <FileSpreadsheet className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Comprobantes Vigentes</p>
              <p className="text-2xl font-bold text-slate-900">{kpis.cantidad}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Solo FAC · BOL · NV activas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── TOOLBAR CON FILTROS ──────────────────────────────────────────── */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            {/* Buscador */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por cliente, RUC o Nº comprobante..."
                className="pl-9 h-9 bg-slate-50 border-slate-200"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>

            {/* Filtros de fecha */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Período:</span>
              <Input
                type="date"
                className="h-9 w-36 bg-slate-50 border-slate-200 text-sm"
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
              />
              <span className="text-slate-400 text-sm">→</span>
              <Input
                type="date"
                className="h-9 w-36 bg-slate-50 border-slate-200 text-sm"
                value={fechaFin}
                onChange={e => setFechaFin(e.target.value)}
              />
            </div>

            {/* Botón Excel */}
            <Button
              onClick={handleDescargarExcel}
              disabled={exportando}
              className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              {exportando ? 'Exportando...' : 'Exportar Excel'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── TABLA PRINCIPAL ──────────────────────────────────────────────── */}
      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto pb-1">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b border-slate-200">
                <TableHead className="font-semibold text-slate-600 w-[110px]">Fecha</TableHead>
                <TableHead className="font-semibold text-slate-600">Comprobante</TableHead>
                <TableHead className="font-semibold text-slate-600">Cliente</TableHead>
                <TableHead className="font-semibold text-slate-600 text-right">Total</TableHead>
                <TableHead className="font-semibold text-slate-600 text-center w-[110px]">Estado</TableHead>
                <TableHead className="font-semibold text-slate-600 text-center w-[80px]">Opciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                    Cargando historial...
                  </TableCell>
                </TableRow>
              ) : ventasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                    {busqueda ? 'No se encontraron resultados para tu búsqueda.' : 'No hay ventas en el período seleccionado.'}
                  </TableCell>
                </TableRow>
              ) : (
                ventasFiltradas.map((venta) => (
                  <TableRow key={venta.id} className="hover:bg-slate-50/70 transition-colors border-b border-slate-100 last:border-0">
                    <TableCell className="text-sm text-slate-600 py-3">
                      {format(new Date(venta.fechaEmision), 'dd MMM yyyy', { locale: es })}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          {TIPOS_COMPROBANTE_CORTO[venta.tipoComprobanteId]}
                        </span>
                        <span className="font-mono text-sm font-semibold text-slate-800">
                          {venta.serie}-{venta.correlativo.toString().padStart(6, '0')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex flex-col">
                        <span
                          className="text-sm font-medium text-slate-800 truncate max-w-[220px]"
                          title={getSocioNombre(venta.socioNegocioId)}
                        >
                          {getSocioNombre(venta.socioNegocioId)}
                        </span>
                        <span className="text-xs text-slate-400">{getSocioDocumento(venta.socioNegocioId)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-3">
                      <span className="text-sm font-bold text-slate-900 font-mono">
                        S/ {venta.total.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center py-3">
                      {venta.documentoOrigenId != null ? (
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-rose-50 text-rose-600 border-rose-200">
                          <XCircle className="w-3 h-3 mr-1 inline-block" />
                          ANULADO
                        </Badge>
                      ) : venta.tipoComprobanteId === 4 ? (
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-violet-50 text-violet-700 border-violet-200">
                          <RotateCcw className="w-3 h-3 mr-1 inline-block" />
                          N. CRÉDITO
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${getBadgeClasses(venta.estadoSunat)}`}
                        >
                          {venta.estadoSunat ?? 'PENDIENTE'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* Botón Ver Detalle */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                          onClick={() => { setVentaActiva(venta); setModalOpen(true) }}
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {/* Botón Emitir NC — solo para Factura (1) y Boleta (2) no anuladas */}
                        {(venta.tipoComprobanteId === 1 || venta.tipoComprobanteId === 2)
                          && venta.documentoOrigenId == null && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              onClick={() => { setVentaNcTarget(venta); setNcModalOpen(true) }}
                              title="Emitir Nota de Crédito"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── MODAL DETALLE — DISEÑO FACTURA CORPORATIVA ───────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-[95vw] max-w-4xl p-0 overflow-hidden border-slate-200 shadow-xl gap-0">
          {ventaActiva && (
            <div className="flex flex-col max-h-[90vh]">

              {/* HEADER TIPO FACTURA */}
              <div className="bg-white px-6 py-5 border-b border-slate-100">
                <div className="flex items-start justify-between gap-4">
                  {/* Lado izquierdo: datos empresa */}
                  <div className="flex-1">
                    {empresaPerfil?.logoUrl ? (
                      <img src={empresaPerfil.logoUrl} alt="Logo" className="h-10 object-contain mb-2" />
                    ) : (
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-5 w-5 text-slate-400" />
                        <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Empresa</span>
                      </div>
                    )}
                    <p className="text-base font-bold text-slate-900">
                      {empresaPerfil?.nombreComercial || empresaPerfil?.razonSocial || dbUser?.razonSocial || 'Sabiduría'}
                    </p>
                    {empresaPerfil?.ruc && (
                      <p className="text-xs text-slate-500">RUC: {empresaPerfil.ruc}</p>
                    )}
                    {empresaPerfil?.direccionFiscal && (
                      <p className="text-xs text-slate-500">{empresaPerfil.direccionFiscal}</p>
                    )}
                  </div>

                  {/* Lado derecho: número de doc + estado */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-center min-w-[180px] shrink-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">
                      {TIPOS_COMPROBANTE[ventaActiva.tipoComprobanteId] || 'COMPROBANTE'}
                    </p>
                    <p className="text-xl font-bold text-slate-900 font-mono">
                      {ventaActiva.serie}-{ventaActiva.correlativo.toString().padStart(6, '0')}
                    </p>
                    <div className="mt-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold uppercase tracking-wider ${getBadgeClasses(ventaActiva.estadoSunat)}`}
                      >
                        {ventaActiva.estadoSunat ?? 'PENDIENTE'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* CONTENIDO SCROLLABLE */}
              <ScrollArea className="flex-1">
                <div className="px-6 py-5 space-y-5">

                  {/* Cards: Cliente + Condiciones */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="shadow-none border-slate-200">
                      <CardHeader className="pb-2 pt-3 px-4">
                        <CardTitle className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
                          Datos del Cliente
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 space-y-1">
                        <p className="font-semibold text-slate-900 text-sm">{getSocioNombre(ventaActiva.socioNegocioId)}</p>
                        <p className="text-xs text-slate-500">RUC / DNI: {getSocioDocumento(ventaActiva.socioNegocioId)}</p>
                        {getSocioDireccion(ventaActiva.socioNegocioId) && (
                          <p className="text-xs text-slate-500">{getSocioDireccion(ventaActiva.socioNegocioId)}</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="shadow-none border-slate-200">
                      <CardHeader className="pb-2 pt-3 px-4">
                        <CardTitle className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
                          Condiciones de Pago
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Fecha Emisión</p>
                            <p className="text-sm font-semibold text-slate-800">
                              {format(new Date(ventaActiva.fechaEmision), "dd MMM yyyy", { locale: es })}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Moneda</p>
                            <p className="text-sm font-semibold text-slate-800">{MONEDAS[ventaActiva.monedaId] || 'Soles'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Tipo de Pago</p>
                            <p className="text-sm font-semibold text-slate-800">{TIPOS_PAGO[ventaActiva.tipoPagoId] || 'Contado'}</p>
                          </div>
                          {ventaActiva.fechaVencimiento && (
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Vencimiento</p>
                              <p className="text-sm font-semibold text-slate-800">
                                {format(new Date(ventaActiva.fechaVencimiento), "dd MMM yyyy", { locale: es })}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Tabla de ítems */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-800">
                        <TableRow className="hover:bg-slate-800 border-0">
                          <TableHead className="text-slate-200 text-xs font-semibold uppercase tracking-wider h-9 w-10 text-center">#</TableHead>
                          <TableHead className="text-slate-200 text-xs font-semibold uppercase tracking-wider h-9">Descripción</TableHead>
                          <TableHead className="text-slate-200 text-xs font-semibold uppercase tracking-wider h-9 text-center w-16">U.M.</TableHead>
                          <TableHead className="text-slate-200 text-xs font-semibold uppercase tracking-wider h-9 text-right w-20">Cant.</TableHead>
                          <TableHead className="text-slate-200 text-xs font-semibold uppercase tracking-wider h-9 text-right w-24">P. Unit.</TableHead>
                          <TableHead className="text-slate-200 text-xs font-semibold uppercase tracking-wider h-9 text-right w-24">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ventaActiva.detalles.map((d, idx) => (
                          <TableRow
                            key={d.id}
                            className={`border-b border-slate-100 last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
                          >
                            <TableCell className="text-center text-xs text-slate-400 py-3">{idx + 1}</TableCell>
                            <TableCell className="text-sm text-slate-800 font-medium py-3">{d.productoNombre}</TableCell>
                            <TableCell className="text-center text-xs text-slate-500 py-3">{d.unidadMedida}</TableCell>
                            <TableCell className="text-right text-sm text-slate-700 py-3">{d.cantidad}</TableCell>
                            <TableCell className="text-right text-sm text-slate-700 py-3 font-mono">{d.precioUnitario.toFixed(2)}</TableCell>
                            <TableCell className="text-right text-sm font-bold text-slate-900 py-3 font-mono">{d.totalLinea.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Totales alineados a la derecha */}
                  <div className="flex justify-end">
                    <div className="w-full sm:w-72 space-y-1.5">
                      <div className="flex justify-between text-sm text-slate-500">
                        <span>Op. Gravadas</span>
                        <span className="font-mono">S/ {ventaActiva.opGravadas.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-slate-500">
                        <span>Op. Inafectas</span>
                        <span className="font-mono">S/ {ventaActiva.opInafectas.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-slate-500">
                        <span>IGV (18%)</span>
                        <span className="font-mono">S/ {ventaActiva.igv.toFixed(2)}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between">
                        <span className="text-base font-bold text-slate-900">IMPORTE TOTAL</span>
                        <span className="text-base font-bold text-indigo-700 font-mono">S/ {ventaActiva.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </ScrollArea>

              {/* FOOTER */}
              <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                {ventaActiva.documentoOrigenId != null ? (
                  /* Venta anulada por NC — PDF inhabilitado */
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-200 text-slate-400 w-full sm:w-auto cursor-not-allowed"
                    disabled
                    title="Este documento fue anulado mediante Nota de Crédito"
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    PDF No Disponible
                  </Button>
                ) : (
                  <PDFDownloadLink
                    document={
                      <FacturaPDF
                        venta={ventaActiva}
                        clienteNombre={getSocioNombre(ventaActiva.socioNegocioId)}
                        clienteDocumento={getSocioDocumento(ventaActiva.socioNegocioId)}
                        clienteDireccion={getSocioDireccion(ventaActiva.socioNegocioId)}
                        empresa={empresaPdf}

                        cuentasBancarias={cuentasBancarias}
                      />
                    }
                    fileName={`${ventaActiva.serie}-${ventaActiva.correlativo.toString().padStart(6, '0')}.pdf`}
                  >
                    {({ loading: pdfLoading }) => (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 w-full sm:w-auto"
                        disabled={pdfLoading || pdfLogoLoading}
                      >
                        <FileDown className="w-4 h-4 mr-2" />
                        {pdfLogoLoading ? 'Preparando logo...' : pdfLoading ? 'Generando PDF...' : 'Descargar PDF'}
                      </Button>
                    )}
                  </PDFDownloadLink>
                )}{/* fin ternario */}

                <p className="text-xs text-slate-400 text-center sm:text-right">
                  Emitido el {format(new Date(ventaActiva.fechaEmision), "d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── MODAL NOTA DE CRÉDITO ─────────────────────────────────────── */}
      <Dialog
        open={ncModalOpen}
        onOpenChange={(open) => {
          if (!open) { setNcMotivo(''); setNcSustento(''); setVentaNcTarget(null) }
          setNcModalOpen(open)
        }}
      >
        <DialogContent className="w-[95vw] max-w-lg border-slate-200 shadow-xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100">
                <RotateCcw className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Emitir Nota de Crédito
                </DialogTitle>
                {ventaNcTarget && (
                  <DialogDescription className="text-sm text-slate-500">
                    Para: <strong className="text-slate-700 font-mono">
                      {ventaNcTarget.serie}-{String(ventaNcTarget.correlativo).padStart(8, '0')}
                    </strong>
                  </DialogDescription>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Motivo SUNAT Cat. 09 */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">
                Motivo (Catálogo 09 SUNAT) <span className="text-rose-500">*</span>
              </Label>
              <Select value={ncMotivo} onValueChange={setNcMotivo}>
                <SelectTrigger className="h-10 border-slate-300">
                  <SelectValue placeholder="Selecciona el motivo..." />
                </SelectTrigger>
                <SelectContent>
                  {MOTIVOS_NC.map(m => (
                    <SelectItem key={m.codigo} value={m.codigo}>
                      {m.codigo} — {m.descripcion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sustento */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">
                Sustento <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                placeholder="Describe el motivo de la devolución o anulación..."
                className="min-h-[90px] resize-none border-slate-300"
                value={ncSustento}
                onChange={e => setNcSustento(e.target.value)}
                maxLength={255}
              />
              <p className="text-xs text-slate-400 text-right">{ncSustento.length}/255</p>
            </div>

            {/* Aviso */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex gap-2">
              <XCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Esta acción es <strong>irreversible</strong>. La venta quedará marcada como
                anulada y el stock de los productos será repuesto automáticamente.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setNcModalOpen(false)}
              disabled={ncLoading}
            >
              Cancelar
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleEmitirNC}
              disabled={ncLoading || !ncMotivo || !ncSustento.trim()}
            >
              {ncLoading ? (
                <><RotateCcw className="w-4 h-4 mr-2 animate-spin" />Procesando...</>
              ) : (
                <><RotateCcw className="w-4 h-4 mr-2" />Emitir Nota de Crédito</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
