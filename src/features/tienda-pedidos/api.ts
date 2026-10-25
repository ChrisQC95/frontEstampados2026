import { auth } from '@/lib/firebase'

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/tienda/pedidos`

export interface PedidoTiendaItem {
  id: number
  productoNombre: string
  servicioNombre: string | null
  cantidad: number
  color: string | null
  talla: string | null
  precioProducto: number
  precioEstampado: number
  subtotal: number
  imagenClientePath: string | null
  resultadoMockupPath: string | null
}

export interface PedidoTiendaResumen {
  pedidoId: number
  codigo: string
  estadoGestion: 'PENDIENTE' | 'TERMINADO' | 'CANCELADO'
  estadoPedido: string
  estadoPago: string | null
  metodoPago: string | null
  fechaCreacion: string
  clienteId: number
  nombreCliente: string
  emailCliente: string
  tipoComprobante: string | null
  tipoDocumento: string | null
  numeroDocumento: string | null
  nombreFacturacion: string | null
  direccionEntrega: string | null
  ubigeoEntrega: string | null
  subtotal: number
  costoEnvio: number
  total: number
  items: PedidoTiendaItem[]
}

async function request<T>(path: string, method = 'GET'): Promise<T> {
  const user = auth.currentUser
  if (!user) throw new Error('Inicia sesión para consultar tus pedidos.')
  const token = await user.getIdToken()
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    let message = `No se pudo completar la solicitud (${response.status}).`
    try {
      const body = await response.json()
      message = body.message || body.detail || message
    } catch { /* Keep the readable fallback for non-JSON errors. */ }
    throw new Error(message)
  }
  return response.json() as Promise<T>
}

export const getMisPedidosTienda = () => request<PedidoTiendaResumen[]>('/mis')
export const getPedidosTiendaGestion = () => request<PedidoTiendaResumen[]>('/gestion')
export const cancelarPedidoTienda = (id: number) => request<PedidoTiendaResumen>(`/${id}/cancelar`, 'POST')
