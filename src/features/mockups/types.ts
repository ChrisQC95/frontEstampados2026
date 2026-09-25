export interface MockupProductoBase {
  id: number
  nombre: string
  tipoProducto: string
  color: string
  coloresDisponibles: string[]
  imagenBasePath: string
  areaX: number
  areaY: number
  areaWidth: number
  areaHeight: number
  activo: boolean
  creadoEn?: string
}

export interface MockupProyecto {
  id: number
  nombre: string
  productoBase: MockupProductoBase
  imagenClientePath: string
  resultadoPath?: string | null
  colorSeleccionado?: string | null
  creadoPorUsuarioId: number
  creadoPorUsuarioNombre?: string | null
  creadoEn?: string
}

export interface MockupResultadoResponse {
  proyectoId: number
  resultadoPath: string
}

export interface ProductoBaseForm {
  nombre: string
  tipoProducto: string
  coloresDisponibles: string[]
  areaX: number
  areaY: number
  areaWidth: number
  areaHeight: number
  activo: boolean
  imagenBase: File | null
}
