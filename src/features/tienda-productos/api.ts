import { auth } from '@/lib/firebase'
import type { TiendaProducto, TiendaProductoForm } from './types'

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/tienda-productos`

const getToken = async (): Promise<string> => {
  const currentUser = auth.currentUser
  if (!currentUser) throw new Error('No hay una sesión activa')
  return currentUser.getIdToken()
}

async function requestJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken()
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(url, { ...options, headers })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Error HTTP ${response.status}`)
  }
  return response.json() as Promise<T>
}

export const getTiendaProductos = async (): Promise<TiendaProducto[]> => {
  return requestJson<TiendaProducto[]>(BASE_URL)
}

export const saveTiendaProducto = async (
  form: TiendaProductoForm
): Promise<TiendaProducto> => {
  const payload = {
    productoServicioId: form.productoServicioId,
    servicioEstampadoId: form.servicioEstampadoId,
    mockupProductoBaseId: form.mockupProductoBaseId,
    slug: form.slug,
    descripcionTienda: form.descripcionTienda,
    publicado: form.publicado,
    destacado: form.destacado,
    permitePersonalizacion: form.permitePersonalizacion,
    manejaTallas: form.manejaTallas,
    orden: form.orden,
  }

  return requestJson<TiendaProducto>(form.id ? `${BASE_URL}/${form.id}` : BASE_URL, {
    method: form.id ? 'PUT' : 'POST',
    body: JSON.stringify(payload),
  })
}

export const deleteTiendaProducto = async (id: number): Promise<void> => {
  const token = await getToken()
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Error al eliminar el producto de tienda')
  }
}
