import type { Categoria } from './types'
import { auth } from '@/lib/firebase'

const API_URL = `${import.meta.env.VITE_API_URL}/api/categorias`

const getToken = async (): Promise<string> => {
  const currentUser = auth.currentUser
  if (!currentUser) throw new Error('No hay una sesión activa')
  return currentUser.getIdToken()
}

export const getCategorias = async (usuarioId: number): Promise<Categoria[]> => {
  const token = await getToken()
  const response = await fetch(`${API_URL}/usuario/${usuarioId}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) throw new Error('Error al cargar las categorías')
  return response.json()
}

export const saveCategoria = async (categoria: Categoria, usuarioId: number): Promise<Categoria> => {
  const token = await getToken()
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ...categoria, usuarioId }),
  })

  if (!response.ok) throw new Error('Error al guardar la categoría')
  return response.json()
}

export const deleteCategoria = async (id: number): Promise<void> => {
  const token = await getToken()
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) throw new Error('Error al eliminar la categoría')
}

