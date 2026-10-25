import type { Producto, SocioNegocio, Serie, Vehiculo, Conductor, VentaRequestDTO } from './types'
import { auth } from '@/lib/firebase'

const BASE_URL = `${import.meta.env.VITE_API_URL}/api`

const getToken = async (): Promise<string> => {
  const currentUser = auth.currentUser
  if (!currentUser) throw new Error('No hay una sesión activa')
  return await currentUser.getIdToken()
}

export const getProductos = async (usuarioId: number): Promise<Producto[]> => {
  const token = await getToken()
  const res = await fetch(`${BASE_URL}/productos/usuario/${usuarioId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) throw new Error('Error al cargar productos')
  return res.json()
}

export const getSociosNegocio = async (usuarioId: number): Promise<SocioNegocio[]> => {
  const token = await getToken()
  const res = await fetch(`${BASE_URL}/socios/usuario/${usuarioId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) throw new Error('Error al cargar socios de negocio')
  return res.json()
}

export const getSeries = async (usuarioId: number): Promise<Serie[]> => {
  const token = await getToken()
  const res = await fetch(`${BASE_URL}/series/usuario/${usuarioId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) throw new Error('Error al cargar series')
  return res.json()
}

export const getVehiculos = async (usuarioId: number): Promise<Vehiculo[]> => {
  const token = await getToken()
  const res = await fetch(`${BASE_URL}/vehiculos/usuario/${usuarioId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) throw new Error('Error al cargar vehículos')
  return res.json()
}

export const getConductores = async (usuarioId: number): Promise<Conductor[]> => {
  const token = await getToken()
  const res = await fetch(`${BASE_URL}/conductores/usuario/${usuarioId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) throw new Error('Error al cargar conductores')
  return res.json()
}

export const registrarVenta = async (payload: VentaRequestDTO): Promise<unknown> => {
  const token = await getToken()
  const res = await fetch(`${BASE_URL}/ventas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  
  if (!res.ok) {
    const errorData = await res.text()
    throw new Error(errorData || 'Error al registrar la venta')
  }
  
  return res.json()
}

export interface PedidoFacturacionItem {
  tiendaProductoId: number
  productoServicioId: number | null
  servicioEstampadoId: number | null
  productoNombre: string
  servicioNombre: string | null
  talla: string | null
  cantidad: number
  precioProducto: number
  precioServicio: number
}

export interface PedidoFacturacion {
  pedidoId: number
  codigo: string
  estado: string
  estadoPago: string
  metodoPago: string
  fechaCreacion: string
  subtotal: number
  costoEnvio: number
  productoServicioEnvioId: number | null
  nombreServicioEnvio: string | null
  total: number
  tipoComprobante: 'FACTURA' | 'BOLETA'
  tipoDocumento: string
  numeroDocumento: string
  nombreFacturacion: string
  direccionFiscal: string | null
  ubigeoFiscal: string | null
  emailFacturacion: string
  direccionEntrega: string
  ubigeoEntrega: string
  items: PedidoFacturacionItem[]
}

export const getPedidosPendientesFacturacion = async (): Promise<PedidoFacturacion[]> => {
  const token = await getToken()
  const res = await fetch(`${BASE_URL}/tienda/facturacion/pendientes`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(await res.text() || 'No se pudieron cargar los pedidos pendientes')
  return res.json()
}

export const getPedidosSeleccionados = async (ids: number[]): Promise<PedidoFacturacion[]> => {
  const token = await getToken()
  const params = new URLSearchParams()
  ids.forEach((id) => params.append('ids', String(id)))
  const res = await fetch(`${BASE_URL}/tienda/facturacion/pendientes/seleccionados?${params}`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(await res.text() || 'Los pedidos seleccionados ya no están disponibles')
  return res.json()
}

