import client from './client'

export interface AuthUser {
  id: string
  email: string
  nombreCompleto: string
  fotoBase64: string | null
  credito: number
  rolIds: string[]
  roles: string[]
  biografia: string | null
  createdAt: string
  updatedAt: string
}

export interface LoginResponse {
  token: string
  usuario: AuthUser
}

export interface RegisterRequest {
  nombreCompleto: string
  email: string
  password: string
}

export interface ModificarPerfilRequest {
  id: string
  nombreCompleto?: string
  email?: string
  password?: string
  biografia?: string
  fotoBase64?: string
  credito?: number
  rolIds?: string[]
}

export const authService = {
  login: (email: string, password: string) =>
    client.post<LoginResponse>('/auth/login', { email, password }).then(r => r.data),

  registerCliente: (data: RegisterRequest) =>
    client.post<AuthUser>('/auth/register-cliente', data).then(r => r.data),

  obtenerPerfil: (id: string) =>
    client.post<AuthUser>('/auth/perfil/obtener', { id }).then(r => r.data),

  modificarPerfil: (data: ModificarPerfilRequest) =>
    client.put<AuthUser>('/auth/perfil/modificar', data).then(r => r.data),
}