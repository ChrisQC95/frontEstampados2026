export interface Rol {
  id: number
  codigo: string
  nombre: string
  descripcion?: string | null
  activo: boolean
}

export interface UsuarioSistema {
  id: number
  firebaseUid: string
  email: string
  nombre: string
  activo: boolean
  rol: Rol
}

export interface UsuarioCreateRequest {
  email: string
  nombre: string
  rolId: number
}

export interface UsuarioCreateResponse {
  usuario: UsuarioSistema
  passwordResetLink: string
}

export interface UsuarioUpdateRequest {
  nombre: string
}

export interface UsuarioUpdateRolRequest {
  rolId: number
}

export interface UsuarioEstadoRequest {
  activo: boolean
}
