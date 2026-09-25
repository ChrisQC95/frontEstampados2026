import type { Conductor } from './types'
import { auth } from '@/lib/firebase'

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/conductores`

const getToken = async (): Promise<string> => {
  const currentUser = auth.currentUser
  if (!currentUser) throw new Error('No hay una sesión activa')
  return currentUser.getIdToken()
}

export const getConductores = async (usuarioId: number): Promise<Conductor[]> => {
  const token = await getToken()
  const res = await fetch(`${BASE_URL}/usuario/${usuarioId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) throw new Error('Error al cargar los conductores')
  return res.json()
}

export const saveConductor = async (
  conductor: Omit<Conductor, 'id'> & { id?: number },
  usuarioId: number
): Promise<Conductor> => {
  const token = await getToken()
  const payload: Conductor = { ...conductor, usuarioId }

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) throw new Error('Error al guardar el conductor')
  return res.json()
}

export const deleteConductor = async (id: number): Promise<void> => {
  const token = await getToken()
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) throw new Error('Error al eliminar el conductor')
}
