export interface VentaDetalle {
  id: number
  productoId: number
  productoNombre: string
  talla?: string | null
  unidadMedida: string
  cantidad: number
  precioUnitario: number
  valorUnitario: number
  igvLinea: number
  totalLinea: number
}

export interface GuiaRemision {
  id: number
  ventaId: number
  motivoTrasladoCodigo: string
  conductorId: number
  vehiculoId: number
  pesoBrutoTotal: number
  ubigeoPartida: string
  direccionPartida: string
  ubigeoLlegada: string
  direccionLlegada: string
}

export interface Venta {
  id: number
  usuarioId: number
  socioNegocioId: number
  tipoComprobanteId: number
  tipoOperacionId: number
  serie: string
  correlativo: number
  fechaEmision: string // LocalDate o LocalDateTime en ISO string
  fechaVencimiento: string | null
  monedaId: number
  tipoPagoId: number
  opGravadas: number
  opExoneradas: number
  opInafectas: number
  igv: number
  total: number
  estadoSunat: string | null
  sunatHashCdr: string | null
  documentoModificadoId: number | null
  motivoNcCodigo: string | null
  sustentoNota: string | null
  documentoOrigenId: number | null
  detalles: VentaDetalle[]
  guiaRemision?: GuiaRemision | null
}

/** Fila plana del reporte Excel — refleja ReporteVentaExcelDTO del backend */
export interface ReporteVentaExcelRow {
  fechaEmision: string        // ISO datetime string del backend
  tipoComprobante: string
  serie: string
  correlativo: number
  rucCliente: string
  razonSocialCliente: string
  productoNombre: string
  cantidad: number
  precioUnitario: number
  subtotalItem: number
  estadoSunat: string | null
}
