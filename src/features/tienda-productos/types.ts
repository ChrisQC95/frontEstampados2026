import type { MockupProductoBase } from '@/features/mockups/types'

export interface ProductoResumen {
  id: number
  codigo?: string | null
  nombre: string
  tipo: 'B' | 'S'
  unidadMedida: string
  precioVenta: number
  precioCompra?: number | null
  stockActual?: number | null
}

export interface TiendaProducto {
  id: number
  productoServicio: ProductoResumen
  servicioEstampado?: ProductoResumen | null
  mockupProductoBase: MockupProductoBase
  slug: string
  descripcionTienda?: string | null
  publicado: boolean
  destacado: boolean
  permitePersonalizacion: boolean
  manejaTallas: boolean
  orden: number
  creadoEn?: string | null
  actualizadoEn?: string | null
}

export interface TiendaProductoForm {
  id?: number
  productoServicioId: number | null
  servicioEstampadoId: number | null
  mockupProductoBaseId: number | null
  slug: string
  descripcionTienda: string
  publicado: boolean
  destacado: boolean
  permitePersonalizacion: boolean
  manejaTallas: boolean
  orden: number
}
