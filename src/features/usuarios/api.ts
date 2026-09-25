import { auth } from '@/lib/firebase'
import type {
  Rol,
  UsuarioCreateRequest,
  UsuarioCreateResponse,
  UsuarioEstadoRequest,
  UsuarioSistema,
  UsuarioUpdateRequest,
  UsuarioUpdateRolRequest,
} from './types'

const API_URL = `${import.meta.env.VITE_API_URL}/api`

const getToken = async (): Promise<string> => {
  const currentUser = auth.currentUser
  if (!currentUser) throw new Error('No hay una sesión activa')
  return currentUser.getIdToken()
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken()
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Error HTTP ${response.status}`)
  }

  return response.json() as Promise<T>
}

export const getRoles = async (): Promise<Rol[]> => {
  return fetchJson<Rol[]>(`${API_URL}/roles`)
}

export const getUsuarios = async (): Promise<UsuarioSistema[]> => {
  return fetchJson<UsuarioSistema[]>(`${API_URL}/usuarios/admin`)
}

export const createUsuario = async (
  payload: UsuarioCreateRequest
): Promise<UsuarioCreateResponse> => {
  return fetchJson<UsuarioCreateResponse>(`${API_URL}/usuarios/admin`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const updateUsuarioNombre = async (
  id: number,
  payload: UsuarioUpdateRequest
): Promise<UsuarioSistema> => {
  return fetchJson<UsuarioSistema>(`${API_URL}/usuarios/admin/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export const updateUsuarioRol = async (
  id: number,
  payload: UsuarioUpdateRolRequest
): Promise<UsuarioSistema> => {
  return fetchJson<UsuarioSistema>(`${API_URL}/usuarios/admin/${id}/rol`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export const updateUsuarioEstado = async (
  id: number,
  payload: UsuarioEstadoRequest
): Promise<UsuarioSistema> => {
  return fetchJson<UsuarioSistema>(`${API_URL}/usuarios/admin/${id}/estado`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}
