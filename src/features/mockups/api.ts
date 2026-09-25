import { auth } from '@/lib/firebase'
import type {
  MockupProductoBase,
  MockupProyecto,
  MockupResultadoResponse,
  ProductoBaseForm,
} from './types'

const API_URL = `${import.meta.env.VITE_API_URL}/api/mockups`

const getToken = async (): Promise<string> => {
  const currentUser = auth.currentUser
  if (!currentUser) throw new Error('No hay una sesión activa')
  return currentUser.getIdToken()
}

async function authorizedFetch(url: string, options: RequestInit = {}) {
  const token = await getToken()
  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(url, { ...options, headers })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Error HTTP ${response.status}`)
  }
  return response
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await authorizedFetch(url, { ...options, headers })
  return response.json() as Promise<T>
}

export const getProductosBase = async (): Promise<MockupProductoBase[]> => {
  return fetchJson<MockupProductoBase[]>(`${API_URL}/productos-base`)
}

export const getProductosBaseTodos = async (): Promise<MockupProductoBase[]> => {
  return fetchJson<MockupProductoBase[]>(`${API_URL}/productos-base/todos`)
}

export const crearProductoBase = async (
  form: ProductoBaseForm
): Promise<MockupProductoBase> => {
  if (!form.imagenBase) throw new Error('Selecciona una imagen base.')

  const data = new FormData()
  data.append('nombre', form.nombre)
  data.append('tipoProducto', form.tipoProducto)
  form.coloresDisponibles.forEach((color) => data.append('coloresDisponibles', color))
  data.append('areaX', String(form.areaX))
  data.append('areaY', String(form.areaY))
  data.append('areaWidth', String(form.areaWidth))
  data.append('areaHeight', String(form.areaHeight))
  data.append('activo', String(form.activo))
  data.append('imagenBase', form.imagenBase)

  return fetchJson<MockupProductoBase>(`${API_URL}/productos-base`, {
    method: 'POST',
    body: data,
  })
}

export const cambiarEstadoProductoBase = async (
  id: number,
  activo: boolean
): Promise<MockupProductoBase> => {
  return fetchJson<MockupProductoBase>(`${API_URL}/productos-base/${id}/estado?activo=${activo}`, {
    method: 'PUT',
  })
}

export const getMockupProyectos = async (): Promise<MockupProyecto[]> => {
  return fetchJson<MockupProyecto[]>(`${API_URL}/proyectos`)
}

export const crearMockupProyecto = async ({
  nombre,
  productoBaseId,
  colorSeleccionado,
  imagenCliente,
}: {
  nombre: string
  productoBaseId: number
  colorSeleccionado?: string
  imagenCliente: File
}): Promise<MockupProyecto> => {
  const data = new FormData()
  data.append('nombre', nombre)
  data.append('productoBaseId', String(productoBaseId))
  if (colorSeleccionado) data.append('colorSeleccionado', colorSeleccionado)
  data.append('imagenCliente', imagenCliente)

  return fetchJson<MockupProyecto>(`${API_URL}/proyectos`, {
    method: 'POST',
    body: data,
  })
}

export const guardarResultadoMockup = async (
  proyectoId: number,
  resultado: Blob
): Promise<MockupResultadoResponse> => {
  const data = new FormData()
  data.append('resultado', resultado, `mockup-${proyectoId}.png`)

  return fetchJson<MockupResultadoResponse>(`${API_URL}/proyectos/${proyectoId}/resultado`, {
    method: 'POST',
    body: data,
  })
}

