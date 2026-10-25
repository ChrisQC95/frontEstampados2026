import { useState, useEffect, useMemo, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  getProductos,
  getSociosNegocio,
  getSeries,
  getVehiculos,
  getConductores,
  registrarVenta,
  getPedidosSeleccionados,
} from './api'
import type {
  Producto,
  SocioNegocio,
  Serie,
  Vehiculo,
  Conductor,
  VentaRequestDTO,
  VentaDetalleRequestDTO,
  GuiaRemisionRequestDTO,
} from './types'

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Trash2, Check, ChevronsUpDown, Save } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function NuevaVenta({ pedidosQuery = '' }: { pedidosQuery?: string }) {
  const { dbUser } = useAuth()
  const usuarioId = dbUser?.id

  // ─── ESTADOS DE CATÁLOGOS ─────────────────────────────────────────────
  const [productos, setProductos] = useState<Producto[]>([])
  const [socios, setSocios] = useState<SocioNegocio[]>([])
  const [clientePedido, setClientePedido] = useState<SocioNegocio | null>(null)
  const [series, setSeries] = useState<Serie[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [conductores, setConductores] = useState<Conductor[]>([])

  const [isLoading, setIsLoading] = useState(true)

  // ─── ESTADOS DE CABECERA (Sección A) ──────────────────────────────────
  const [clienteId, setClienteId] = useState<string>('')
  const [fechaEmision, setFechaEmision] = useState<string>(new Date().toISOString().split('T')[0])
  const [fechaVencimiento, setFechaVencimiento] = useState<string>(new Date().toISOString().split('T')[0])
  const [moneda, setMoneda] = useState<string>('1') // 1: Soles
  const [tipoPago, setTipoPago] = useState<string>('1') // 1: Contado
  const [tipoComprobante, setTipoComprobante] = useState<string>('1') // 1: Factura, 2: Boleta
  const [serieId, setSerieId] = useState<string>('')
  const [observacion, setObservacion] = useState<string>('')

  // ─── ESTADOS DE FILA DE ACCIÓN (Sección B) ────────────────────────────
  const [openProductSearch, setOpenProductSearch] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [inputCantidad, setInputCantidad] = useState<string>('1')
  const [inputPrecio, setInputPrecio] = useState<string>('0.00')

  // ─── ESTADO DE DETALLES (Sección C) ───────────────────────────────────
  const [detalles, setDetalles] = useState<VentaDetalleRequestDTO[]>([])
  const [pedidoTiendaIds, setPedidoTiendaIds] = useState<number[]>([])
  const [pedidoFacturacionLoading, setPedidoFacturacionLoading] = useState(false)
  const [pedidoCargaError, setPedidoCargaError] = useState('')
  const pedidoLoadKey = useRef('')
  const catalogosPedidoRef = useRef<{ productos: Producto[]; socios: SocioNegocio[] }>({ productos: [], socios: [] })

  // ─── ESTADOS DE GUÍA (Sección D) ──────────────────────────────────────
  const [generarGuia, setGenerarGuia] = useState(false)
  const [vehiculoId, setVehiculoId] = useState<string>('')
  const [conductorId, setConductorId] = useState<string>('')
  const [pesoBruto, setPesoBruto] = useState<string>('')
  const [motivoTraslado, setMotivoTraslado] = useState<string>('01')
  const [dirPartida, setDirPartida] = useState<string>('')
  const [ubiPartida, setUbiPartida] = useState<string>('')
  const [dirLlegada, setDirLlegada] = useState<string>('')
  const [ubiLlegada, setUbiLlegada] = useState<string>('')

  // ─── CARGA INICIAL ────────────────────────────────────────────────────
  useEffect(() => {
    if (!usuarioId) return

    const loadData = async () => {
      try {
        setIsLoading(true)
        const [prodRes, socRes, serRes, vehRes, condRes] = await Promise.all([
          getProductos(usuarioId),
          getSociosNegocio(usuarioId),
          getSeries(usuarioId),
          getVehiculos(usuarioId),
          getConductores(usuarioId),
        ])
        setProductos(prodRes || [])
        const sociosDisponibles = socRes?.filter(s => s.tipoSocio === 'C' || s.tipoSocio === 'A') || []
        catalogosPedidoRef.current = { productos: prodRes || [], socios: sociosDisponibles }
        setSocios(sociosDisponibles)
        setSeries(serRes?.filter(s => s.activo) || [])
        setVehiculos(vehRes || [])
        setConductores(condRes || [])
      } catch (error) {
        toast.error('Error al cargar datos iniciales')
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [usuarioId])

  useEffect(() => {
    // TanStack serializes search strings as JSON (e.g. pedidos="20"). Accept
    // both its parsed route value and the raw query in case a link was opened directly.
    const rawQueryValue = new URLSearchParams(window.location.search).get('pedidos') ?? ''
    const normalizeIds = (value: string) => {
      let normalized = value.trim()
      try {
        const parsed: unknown = JSON.parse(normalized)
        if (typeof parsed === 'string') normalized = parsed
      } catch {
        // A plain comma-separated value is already usable.
      }
      return normalized
    }
    const queryIds = normalizeIds(pedidosQuery) || normalizeIds(rawQueryValue)
    const ids = queryIds.split(',').map((id) => Number(id.trim())).filter((id) => Number.isInteger(id) && id > 0)
    if (!ids.length || isLoading) return
    const key = [...ids].sort((a, b) => a - b).join(',')
    if (pedidoLoadKey.current === key) return
    pedidoLoadKey.current = key
    let cancelled = false
    setPedidoFacturacionLoading(true)
    setPedidoCargaError('')
    getPedidosSeleccionados(ids).then((pedidos) => {
      if (cancelled) return
      const cliente = pedidos[0]
      if (!cliente) return
      const { productos: productosDisponibles, socios: sociosDisponibles } = catalogosPedidoRef.current
      const comprobante = cliente.tipoComprobante?.toUpperCase() === 'FACTURA' ? '1' : '2'
      setTipoComprobante(comprobante)
      setTipoPago('1')
      setFechaVencimiento(new Date().toISOString().split('T')[0])
      setPedidoTiendaIds(pedidos.map((pedido) => pedido.pedidoId))
      const matchingSocio = sociosDisponibles.find((s) => s.tipoDocumento === cliente.tipoDocumento && s.numeroDocumento === cliente.numeroDocumento)
      if (matchingSocio) {
        setClientePedido(null)
        setClienteId(String(matchingSocio.id))
      }
      else {
        const syntheticClient: SocioNegocio = {
          id: 0, tipoSocio: 'C', tipoDocumento: cliente.tipoDocumento,
          numeroDocumento: cliente.numeroDocumento, nombreRazonSocial: cliente.nombreFacturacion,
          direccionFiscal: cliente.direccionFiscal ?? undefined,
        }
        setClientePedido(syntheticClient)
        setClienteId('0')
      }
      const erroresCatalogo: string[] = []
      const lineasPedido = pedidos.flatMap((pedido) => {
        const lines = pedido.items.flatMap((item) => {
          const itemLines: VentaDetalleRequestDTO[] = []
          const product = productosDisponibles.find((candidate) => candidate.id === item.productoServicioId)
          if (!product) {
            erroresCatalogo.push(`Producto “${item.productoNombre}” no encontrado en el catálogo.`)
            return itemLines
          }
          const addLine = (catalogProduct: Producto, price: number, name: string, quantity = item.cantidad, talla?: string | null) => {
            const unit = Number(price) || 0
            const value = catalogProduct.afectoIgv ? unit / 1.18 : unit
            const total = unit * quantity
            itemLines.push({
              productoId: catalogProduct.id, productoNombre: name || catalogProduct.nombre,
              talla: talla || null, unidadMedida: catalogProduct.unidadMedida, cantidad: quantity,
              precioUnitario: Number(unit.toFixed(2)), valorUnitario: Number(value.toFixed(2)),
              igvLinea: catalogProduct.afectoIgv ? Number(((unit - value) * quantity).toFixed(2)) : 0,
              totalLinea: Number(total.toFixed(2)),
            })
          }
          addLine(product, item.precioProducto, item.productoNombre, item.cantidad, item.talla)
          if (item.servicioEstampadoId && item.precioServicio > 0) {
            const service = productosDisponibles.find((candidate) => candidate.id === item.servicioEstampadoId)
            if (service) addLine(service, item.precioServicio, item.servicioNombre || service.nombre)
            else erroresCatalogo.push(`Servicio “${item.servicioNombre || 'de estampado'}” no encontrado en el catálogo.`)
          }
          return itemLines
        })
        const shipping = Number(pedido.costoEnvio) || 0
        if (shipping > 0) {
          const shippingProduct = productosDisponibles.find((candidate) => candidate.id === pedido.productoServicioEnvioId)
          if (!shippingProduct) erroresCatalogo.push(`No se encontró en el catálogo el servicio de envío ${pedido.nombreServicioEnvio || ''} (${pedido.codigo}).`)
          else {
            const unit = shipping
            const value = shippingProduct.afectoIgv ? unit / 1.18 : unit
            lines.push({
              productoId: shippingProduct.id,
              productoNombre: pedido.nombreServicioEnvio || shippingProduct.nombre,
              talla: null,
              unidadMedida: shippingProduct.unidadMedida,
              cantidad: 1,
              precioUnitario: Number(unit.toFixed(2)),
              valorUnitario: Number(value.toFixed(2)),
              igvLinea: shippingProduct.afectoIgv ? Number((unit - value).toFixed(2)) : 0,
              totalLinea: Number(unit.toFixed(2)),
            })
          }
        }
        return lines
      })
      setDetalles(lineasPedido)
      if (erroresCatalogo.length) {
        const mensaje = [...new Set(erroresCatalogo)].join(' ')
        setPedidoCargaError(mensaje)
        toast.error(mensaje)
      }
      setDirLlegada(cliente.direccionEntrega || '')
      setUbiLlegada(cliente.ubigeoEntrega || '')
      // Show the prefilled delivery data in the guide section immediately.
      // Vehicle, driver, weight and origin still need to be supplied by the operator.
      setGenerarGuia(Boolean(cliente.direccionEntrega || cliente.ubigeoEntrega))
      setObservacion(`Pedidos de tienda: ${pedidos.map((p) => p.codigo).join(', ')}`)
      toast.success(`${pedidos.length} pedido(s) cargados en la venta.`)
    }).catch((error) => {
      pedidoLoadKey.current = ''
      toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los pedidos')
    })
      .finally(() => { if (!cancelled) setPedidoFacturacionLoading(false) })
    return () => { cancelled = true }
  }, [isLoading, pedidosQuery])

  // ─── VARIABLE AUXILIAR ───────────────────────────────────────────────
  const esNotaDeVenta = tipoComprobante === '3'

  // ─── LÓGICA DE LA FILA DE ACCIÓN ──────────────────────────────────────
  const handleProductSelect = (prodId: number) => {
    const prod = productos.find(p => p.id === prodId)
    if (prod) {
      // Regla de negocio: Nota de Venta no admite productos gravados con IGV
      if (esNotaDeVenta && prod.afectoIgv) {
        toast.error('Las Notas de Venta solo admiten productos sin afectación al IGV')
        setOpenProductSearch(false)
        return
      }
      setSelectedProductId(prodId)
      setInputPrecio(prod.precioVenta.toFixed(2))
      setInputCantidad('1')
      setOpenProductSearch(false)
    }
  }

  const handleAgregarLinea = () => {
    if (!selectedProductId) {
      toast.warning('Seleccione un producto primero')
      return
    }
    const producto = productos.find(p => p.id === selectedProductId)
    if (!producto) return

    const cantidad = parseFloat(inputCantidad)
    const precioUnitario = parseFloat(inputPrecio)

    if (isNaN(cantidad) || cantidad <= 0) {
      toast.warning('Ingrese una cantidad válida')
      return
    }
    if (isNaN(precioUnitario) || precioUnitario < 0) {
      toast.warning('Ingrese un precio válido')
      return
    }

    if (producto.tipo === 'B' && cantidad > producto.stockActual) {
      toast.warning(`El stock disponible es ${producto.stockActual}`)
      return
    }

    // Cálculos SUNAT
    const valorUnitario = producto.afectoIgv ? precioUnitario / 1.18 : precioUnitario
    const igvLinea = producto.afectoIgv ? (precioUnitario - valorUnitario) * cantidad : 0
    const totalLinea = precioUnitario * cantidad

    const nuevaLinea: VentaDetalleRequestDTO = {
      productoId: producto.id,
      productoNombre: producto.nombre,
      unidadMedida: producto.unidadMedida,
      cantidad: Number(cantidad.toFixed(2)),
      precioUnitario: Number(precioUnitario.toFixed(2)),
      valorUnitario: Number(valorUnitario.toFixed(2)),
      igvLinea: Number(igvLinea.toFixed(2)),
      totalLinea: Number(totalLinea.toFixed(2)),
    }

    setDetalles(prev => {
      const existingIndex = prev.findIndex(item => item.productoId === producto.id)
      if (existingIndex >= 0) {
        const copy = [...prev]
        const curr = copy[existingIndex]

        const nuevaCantidad = curr.cantidad + nuevaLinea.cantidad
        if (producto.tipo === 'B' && nuevaCantidad > producto.stockActual) {
          toast.error(`Supera el stock. Max: ${producto.stockActual}`)
          return prev
        }

        const nuevoIgv = curr.igvLinea + nuevaLinea.igvLinea
        const nuevoTotal = curr.totalLinea + nuevaLinea.totalLinea

        copy[existingIndex] = {
          ...curr,
          cantidad: nuevaCantidad,
          igvLinea: Number(nuevoIgv.toFixed(2)),
          totalLinea: Number(nuevoTotal.toFixed(2))
        }
        return copy
      }
      return [...prev, nuevaLinea]
    })

    // Resetear fila
    setSelectedProductId(null)
    setInputCantidad('1')
    setInputPrecio('0.00')
  }

  const handleEliminarLinea = (index: number) => {
    setDetalles(prev => prev.filter((_, i) => i !== index))
  }

  // ─── CÁLCULOS TOTALES ─────────────────────────────────────────────────
  const { totalOpGravadas, totalOpInafectas, totalIgv, granTotal } = useMemo(() => {
    let gravadas = 0
    let inafectas = 0
    let igv = 0
    let total = 0

    detalles.forEach(item => {
      const prodOriginal = productos.find(p => p.id === item.productoId)
      if (prodOriginal?.afectoIgv) {
        gravadas += item.valorUnitario * item.cantidad
      } else {
        inafectas += item.totalLinea
      }
      igv += item.igvLinea
      total += item.totalLinea
    })

    return {
      totalOpGravadas: gravadas,
      totalOpInafectas: inafectas,
      totalIgv: igv,
      granTotal: total,
    }
  }, [detalles, productos])

  // ─── VALIDACIÓN Y ENVÍO ───────────────────────────────────────────────
  const seriesDisponibles = series.filter(s => s.tipoComprobanteId.toString() === tipoComprobante)

  // Auto-seleccionar serie si está vacía
  useEffect(() => {
    if (seriesDisponibles.length > 0 && !seriesDisponibles.find(s => s.id.toString() === serieId)) {
      setSerieId(seriesDisponibles[0].id.toString())
    }
  }, [seriesDisponibles, serieId])

  const clienteSeleccionado = socios.find(s => s.id.toString() === clienteId)
    ?? (clienteId === '0' ? clientePedido ?? undefined : undefined)
  const isFacturaValid = tipoComprobante === '1'
    ? clienteSeleccionado?.tipoDocumento === '06' && clienteSeleccionado?.numeroDocumento.length === 11
    : true

  // Nota de Venta: el cliente es opcional (puede ir sin cliente seleccionado)
  const clienteRequerido = esNotaDeVenta ? true : !!clienteId

  const canSubmit = detalles.length > 0 && !pedidoCargaError && clienteRequerido && serieId && isFacturaValid &&
    (!generarGuia || (vehiculoId && conductorId && pesoBruto && dirPartida && ubiPartida && dirLlegada && ubiLlegada))

  const handleGuardar = async () => {
    if (!usuarioId) return

    try {
      const serieObj = series.find(s => s.id.toString() === serieId)

      // La Guía de Remisión nunca aplica para Nota de Venta
      let guiaRemision: GuiaRemisionRequestDTO | null = null
      if (generarGuia && !esNotaDeVenta) {
        guiaRemision = {
          vehiculoId: Number(vehiculoId),
          conductorId: Number(conductorId),
          pesoBrutoTotal: Number(pesoBruto),
          motivoTrasladoCodigo: motivoTraslado,
          direccionPartida: dirPartida,
          ubigeoPartida: ubiPartida,
          direccionLlegada: dirLlegada,
          ubigeoLlegada: ubiLlegada
        }
      }

      const payload: VentaRequestDTO = {
        usuarioId,
        // Nota de Venta: si no hay cliente seleccionado, envía 0 (sin cliente)
        socioNegocioId: clienteId ? Number(clienteId) : 0,
        ...(pedidoTiendaIds.length ? { pedidoTiendaIds } : {}),
        tipoComprobanteId: Number(tipoComprobante),
        tipoOperacionId: 1, // Venta Interna
        monedaId: Number(moneda),
        tipoPagoId: Number(tipoPago),
        serie: serieObj?.serie || '',
        fechaEmision: fechaEmision,
        fechaVencimiento: fechaVencimiento,
        opGravadas: Number(totalOpGravadas.toFixed(2)),
        opExoneradas: 0,
        opInafectas: Number(totalOpInafectas.toFixed(2)),
        igv: Number(totalIgv.toFixed(2)),
        total: Number(granTotal.toFixed(2)),
        detalles,
        guiaRemision
      }

      await registrarVenta(payload)
      toast.success('Venta registrada exitosamente', {
        description: esNotaDeVenta
          ? '📋 Nota de Venta registrada. Documento interno no oficial.'
          : '⚠️ AVISO: Esta venta es solo de prueba y no tiene validez legal.',
        duration: 6000,
      })

      // Limpiar formulario
      setDetalles([])
      setPedidoTiendaIds([])
      setClienteId('')
      setSerieId('')
      setGenerarGuia(false)
      setObservacion('')
      setSelectedProductId(null)
      if (pedidoTiendaIds.length) window.history.replaceState({}, '', window.location.pathname)

    } catch (error: any) {
      toast.error(error.message || 'Error al guardar la venta')
    }
  }

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Cargando formulario...</div>

  return (
    <div className="p-6 space-y-6 animate-in fade-in-0">

      {/* ENCABEZADO */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Nueva Venta</h1>
        <p className="text-slate-500 mt-1 text-sm">Registra un comprobante: factura, boleta o nota de venta.</p>
      </div>
      {(pedidoTiendaIds.length > 0 || pedidoFacturacionLoading) && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-950">
          <p className="font-semibold">{pedidoFacturacionLoading ? 'Cargando pedidos para facturar…' : 'Venta preparada desde pedidos de tienda'}</p>
          {!pedidoFacturacionLoading && <p className="mt-1">Pedidos {pedidoTiendaIds.join(', ')}: cliente, comprobante, productos y dirección de entrega precargados. Revisa los datos antes de guardar.</p>}
          {pedidoCargaError && <p className="mt-2 font-medium text-red-700">{pedidoCargaError} No emitas el comprobante hasta corregir el catálogo.</p>}
        </div>
      )}

      {/* LAYOUT: 1 col en móvil, asimétrico 12 cols en desktop */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 items-start">

        {/* ── COLUMNA IZQUIERDA (col-span-8) ─────────────────────────────── */}
        <div className="lg:col-span-8 space-y-5">

          {/* CARD 1: DATOS DEL COMPROBANTE */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50 border-b pb-3 pt-4 px-5">
              <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                Datos del Comprobante
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                {/* Cliente */}
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-semibold text-slate-600">Cliente</Label>
                  <Select value={clienteId} onValueChange={(value) => {
                    setClienteId(value)
                    if (value !== '0') setClientePedido(null)
                  }}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="-- Seleccione su Cliente --" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientePedido && clienteId === '0' && (
                        <SelectItem key="pedido-cliente" value="0">
                          {clientePedido.numeroDocumento} - {clientePedido.nombreRazonSocial} (pedido de tienda)
                        </SelectItem>
                      )}
                      {socios.filter(s => s.id !== 0).map(s => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.numeroDocumento} - {s.nombreRazonSocial}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {tipoComprobante === '1' && clienteSeleccionado && clienteSeleccionado.numeroDocumento.length !== 11 && (
                    <p className="text-[10px] text-destructive">La factura exige RUC (11 dígitos).</p>
                  )}
                  {esNotaDeVenta && (
                    <p className="text-[10px] text-slate-400">Cliente opcional para Nota de Venta.</p>
                  )}
                </div>

                {/* Fecha Emisión */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Fecha Emisión</Label>
                  <Input type="date" className="h-9" value={fechaEmision} onChange={e => setFechaEmision(e.target.value)} />
                </div>

                {/* Fecha Vencimiento */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Fecha Vencimiento</Label>
                  <Input type="date" className="h-9" value={fechaVencimiento} onChange={e => setFechaVencimiento(e.target.value)} />
                </div>

                {/* Tipo Comprobante */}
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-semibold text-slate-600">Comprobante</Label>
                  <Select
                    value={tipoComprobante}
                    onValueChange={(val) => {
                      setTipoComprobante(val)
                      setSerieId('')
                      // Nota de Venta no tiene guía de remisión
                      if (val === '3') setGenerarGuia(false)
                    }}
                  >
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">01 - FACTURA ELECTRONICA</SelectItem>
                      <SelectItem value="2">03 - BOLETA DE VENTA ELECTRONICA</SelectItem>
                      <SelectItem value="3">NV - NOTA DE VENTA</SelectItem>
                    </SelectContent>
                  </Select>
                  {esNotaDeVenta && (
                    <p className="text-[10px] text-amber-600 font-medium mt-1">
                      ⚠️ Documento interno. Solo productos sin IGV. Cliente opcional.
                    </p>
                  )}
                </div>

                {/* Serie */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Serie</Label>
                  <Select value={serieId} onValueChange={setSerieId}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Seleccione Serie" /></SelectTrigger>
                    <SelectContent>
                      {seriesDisponibles.map(s => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.serie} (Sig: {s.correlativoActual + 1})
                        </SelectItem>
                      ))}
                      {seriesDisponibles.length === 0 && (
                        <SelectItem value="none" disabled>No hay series activas</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Moneda */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Moneda</Label>
                  <Select value={moneda} onValueChange={setMoneda}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">SOLES</SelectItem>
                      <SelectItem value="2">DÓLARES</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tipo Pago */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Tipo Pago</Label>
                  <Select value={tipoPago} onValueChange={setTipoPago}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">CONTADO</SelectItem>
                      <SelectItem value="2">CRÉDITO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Observación */}
                <div className="space-y-1.5 md:col-span-3">
                  <Label className="text-xs font-semibold text-slate-600">Observación</Label>
                  <Input className="h-9" value={observacion} onChange={e => setObservacion(e.target.value)} />
                </div>

              </div>
            </CardContent>
          </Card>

          {/* CARD 2: BUSCADOR + TABLA DE ÍTEMS */}
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50 border-b pb-3 pt-4 px-5">
              <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                Detalle de Productos / Servicios
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">

              {/* Fila Buscador de Producto */}
              <div className="bg-slate-50/50 p-4 border-b flex flex-col md:flex-row gap-3 items-end">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Producto / Servicio</Label>
                  <Popover open={openProductSearch} onOpenChange={setOpenProductSearch}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={openProductSearch} className="w-full justify-between bg-white h-10 border-slate-300">
                        <span className="truncate">
                          {selectedProductId
                            ? productos.find((p) => p.id === selectedProductId)?.nombre
                            : '-- Buscar producto o servicio --'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[420px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar por nombre o código..." />
                        <CommandList>
                          <CommandEmpty>No se encontró el producto.</CommandEmpty>
                          <CommandGroup>
                            {productos.map((prod) => (
                              <CommandItem
                                key={prod.id}
                                value={`${prod.codigo} ${prod.nombre}`}
                                onSelect={() => handleProductSelect(prod.id)}
                              >
                                <Check className={cn('mr-2 h-4 w-4', selectedProductId === prod.id ? 'opacity-100' : 'opacity-0')} />
                                <div className="flex flex-col">
                                  <span className="text-sm">{prod.nombre}</span>
                                  <span className="text-[10px] text-muted-foreground">
                                    Cód: {prod.codigo} | Stock: {prod.stockActual} | S/ {prod.precioVenta.toFixed(2)}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="w-28 space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Cantidad</Label>
                  <Input
                    type="number" min="0.01" step="1"
                    className="h-9 bg-white border-slate-300"
                    value={inputCantidad}
                    onChange={e => setInputCantidad(e.target.value)}
                  />
                </div>

                <div className="w-32 space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Precio Unit.</Label>
                  <Input
                    type="number" min="0" step="0.01"
                    className="h-9 bg-white border-slate-300"
                    value={inputPrecio}
                    onChange={e => setInputPrecio(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleAgregarLinea}
                  className="h-9 bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 shrink-0"
                >
                  + Agregar
                </Button>
              </div>

              {/* Tabla de detalles con scroll horizontal en móvil */}
              <div className="overflow-x-auto pb-1">
              <Table>
                <TableHeader className="bg-slate-800 hover:bg-slate-800">
                  <TableRow className="border-0">
                    <TableHead className="text-slate-200 text-xs h-10 w-10 text-center">#</TableHead>
                    <TableHead className="text-slate-200 text-xs h-10">Producto / Servicio</TableHead>
                    <TableHead className="text-slate-200 text-xs h-10 text-center w-16">IGV</TableHead>
                    <TableHead className="text-slate-200 text-xs h-10 text-right w-20">Cant.</TableHead>
                    <TableHead className="text-slate-200 text-xs h-10 text-right w-24">P. Unit.</TableHead>
                    <TableHead className="text-slate-200 text-xs h-10 text-right w-24">Total</TableHead>
                    <TableHead className="text-slate-200 text-xs h-10 w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detalles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-28 text-center text-slate-400 text-sm bg-white">
                        Agrega productos o servicios al comprobante.
                      </TableCell>
                    </TableRow>
                  ) : (
                    detalles.map((item, idx) => {
                      const esAfecto = productos.find(p => p.id === item.productoId)?.afectoIgv
                      return (
                        <TableRow key={idx} className={`border-b last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'} hover:bg-indigo-50/30`}>
                          <TableCell className="text-center text-xs text-slate-400 py-3">{idx + 1}</TableCell>
                          <TableCell className="text-sm font-medium text-slate-800 py-3">{item.productoNombre}{item.talla && <span className="ml-2 text-xs font-normal text-slate-500">Talla {item.talla}</span>}</TableCell>
                          <TableCell className="text-center py-3">
                            <Badge variant={esAfecto ? 'default' : 'secondary'} className="text-[9px] uppercase px-1.5 py-0">
                              {esAfecto ? 'Afecto' : 'Inafecto'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm text-slate-700 py-3 font-mono">{item.cantidad}</TableCell>
                          <TableCell className="text-right text-sm text-slate-600 py-3 font-mono">{item.precioUnitario.toFixed(2)}</TableCell>
                          <TableCell className="text-right text-sm font-bold text-slate-900 py-3 font-mono">{item.totalLinea.toFixed(2)}</TableCell>
                          <TableCell className="text-center py-3">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50" onClick={() => handleEliminarLinea(idx)}>
                              <Trash2 size={13} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>

          {/* CARD 3: GUÍA DE REMISIÓN — oculta para Nota de Venta */}
          {!esNotaDeVenta && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="bg-slate-50 border-b pb-3 pt-4 px-5 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  Guía de Remisión Remitente
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="guia-switch" className="text-xs font-medium text-slate-600 cursor-pointer">Generar Guía</Label>
                  <Switch id="guia-switch" checked={generarGuia} onCheckedChange={setGenerarGuia} />
                </div>
              </CardHeader>
              {generarGuia && (
                <CardContent className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Vehículo</Label>
                      <Select value={vehiculoId} onValueChange={setVehiculoId}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Seleccione Placa" /></SelectTrigger>
                        <SelectContent>{vehiculos.map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.placa} ({v.marca})</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Conductor</Label>
                      <Select value={conductorId} onValueChange={setConductorId}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Seleccione Conductor" /></SelectTrigger>
                        <SelectContent>{conductores.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.nombreCompleto}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Peso Bruto (KGM)</Label>
                      <Input type="number" step="0.01" className="h-9" value={pesoBruto} onChange={e => setPesoBruto(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600">Motivo Traslado</Label>
                      <Select value={motivoTraslado} onValueChange={setMotivoTraslado}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="01">01 - Venta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 md:col-span-2 lg:col-span-2">
                      <Label className="text-xs font-semibold text-slate-600">Punto de Partida (Ubigeo — Dirección)</Label>
                      <div className="flex gap-2">
                        <Input placeholder="Ubigeo" className="h-9 w-24" value={ubiPartida} onChange={e => setUbiPartida(e.target.value)} />
                        <Input placeholder="Dirección completa" className="h-9 flex-1" value={dirPartida} onChange={e => setDirPartida(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1.5 md:col-span-2 lg:col-span-2">
                      <Label className="text-xs font-semibold text-slate-600">Punto de Llegada (Ubigeo — Dirección)</Label>
                      <div className="flex gap-2">
                        <Input placeholder="Ubigeo" className="h-9 w-24" value={ubiLlegada} onChange={e => setUbiLlegada(e.target.value)} />
                        <Input placeholder="Dirección completa" className="h-9 flex-1" value={dirLlegada} onChange={e => setDirLlegada(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

        </div>{/* fin columna izquierda */}

        {/* ── COLUMNA DERECHA STICKY: RESUMEN (en móvil va después del formulario) ─ */}
        <div className="lg:col-span-4">
          {/* sticky solo desde lg para arriba */}
          <div className="lg:sticky lg:top-6 space-y-4">

            <Card className="shadow-sm border-slate-200 overflow-hidden">
              <CardHeader className="bg-slate-800 pb-3 pt-4 px-5">
                <CardTitle className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
                  Resumen del Comprobante
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">

                {/* Info Cliente */}
                {clienteSeleccionado && (
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Cliente</p>
                    <p className="text-sm font-semibold text-slate-800 leading-tight">{clienteSeleccionado.nombreRazonSocial}</p>
                    <p className="text-xs text-slate-500">{clienteSeleccionado.numeroDocumento}</p>
                  </div>
                )}

                {/* Líneas del carrito */}
                {detalles.length > 0 && (
                  <div className="px-5 py-3 border-b border-slate-100 max-h-40 overflow-y-auto space-y-2">
                    {detalles.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start text-xs gap-2">
                        <span className="text-slate-600 flex-1 leading-tight">{item.productoNombre}{item.talla && <span className="block text-[10px] text-slate-400">Talla {item.talla}</span>}</span>
                        <span className="text-slate-800 font-semibold font-mono whitespace-nowrap">
                          {item.cantidad} × {item.precioUnitario.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Subtotales */}
                <div className="px-5 py-4 space-y-2.5">
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Op. Inafectas</span>
                    <span className="font-mono">S/ {totalOpInafectas.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Op. Gravadas</span>
                    <span className="font-mono">S/ {totalOpGravadas.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>IGV (18%)</span>
                    <span className="font-mono">S/ {totalIgv.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-700 uppercase">Total</span>
                    <span className="text-2xl font-bold text-slate-900 font-mono">
                      S/ {granTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* Botón principal */}
            <Button
              className="w-full h-13 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-sm py-4 rounded-lg"
              disabled={!canSubmit}
              onClick={handleGuardar}
            >
              <Save className="mr-2 h-5 w-5" />
              EMITIR COMPROBANTE
            </Button>

            {!canSubmit && detalles.length > 0 && (
              <p className="text-xs text-center text-slate-400">
                {!serieId
                  ? 'Selecciona una serie.'
                  : !clienteId && !esNotaDeVenta
                    ? 'Selecciona un cliente.'
                    : !isFacturaValid
                      ? 'La factura requiere RUC (11 dígitos).'
                      : 'Completa todos los campos requeridos.'}
              </p>
            )}

          </div>
        </div>

      </div>{/* fin grid-cols-12 */}
    </div>
  )
}

