export interface Producto {
  id: number
  codigo: string
  nombre: string
  tipo: string // 'B' o 'S'
  unidadMedida: string
  precioVenta: number
  precioCompra?: number
  afectoIgv: boolean
  stockActual: number
  stockMinimo?: number
}

export interface SocioNegocio {
  id: number
  tipoSocio: string
  tipoDocumento: string
  numeroDocumento: string
  nombreRazonSocial: string
  direccionFiscal?: string
}

export interface Serie {
  id: number
  serie: string
  correlativoActual: number
  activo: boolean
  tipoComprobanteId: number
}

export interface Vehiculo {
  id: number
  placa: string
  marca: string
}

export interface Conductor {
  id: number
  tipoDocumento: string
  numeroDocumento: string
  nombreCompleto: string
  licenciaConducir: string
}

export interface CartItem {
  producto: Producto
  cantidad: number
  precioUnitario: number // Con IGV si aplica
  valorUnitario: number  // Sin IGV si aplica
  igvLinea: number
  totalLinea: number
}

export interface VentaDetalleRequestDTO {
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

export interface GuiaRemisionRequestDTO {
  vehiculoId: number
  conductorId: number
  pesoBrutoTotal: number
  motivoTrasladoCodigo: string
  direccionPartida: string
  ubigeoPartida: string
  direccionLlegada: string
  ubigeoLlegada: string
}

export interface VentaRequestDTO {
  usuarioId: number
  socioNegocioId: number
  pedidoTiendaIds?: number[]
  tipoComprobanteId: number
  tipoOperacionId: number
  monedaId: number
  tipoPagoId: number
  serie: string
  fechaEmision: string // ISO date string 'YYYY-MM-DD'
  fechaVencimiento: string // ISO date string 'YYYY-MM-DD'
  opGravadas: number
  opExoneradas: number
  opInafectas: number
  igv: number
  total: number
  detalles: VentaDetalleRequestDTO[]
  guiaRemision: GuiaRemisionRequestDTO | null
}
