import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Ban,
  CheckCircle2,
  Copy,
  Edit3,
  Loader2,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/context/AuthContext'

import {
  createUsuario,
  getRoles,
  getUsuarios,
  updateUsuarioEstado,
  updateUsuarioNombre,
  updateUsuarioRol,
} from './api'
import type { Rol, UsuarioSistema } from './types'

type FormState = {
  id?: number
  email: string
  nombre: string
  rolId: string
}

const EMPTY_FORM: FormState = {
  email: '',
  nombre: '',
  rolId: '',
}

const roleStyles: Record<string, string> = {
  ADMIN: 'border-blue-200 bg-blue-50 text-blue-700',
  CONTABILIDAD: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  VENTAS: 'border-orange-200 bg-orange-50 text-orange-700',
  MARKETING: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
  LECTURA: 'border-slate-200 bg-slate-50 text-slate-600',
  USUARIO: 'border-slate-200 bg-slate-50 text-slate-600',
}

function getRoleClass(codigo: string) {
  return roleStyles[codigo] ?? 'border-slate-200 bg-slate-50 text-slate-600'
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

export default function UsuariosPage() {
  const { dbUser } = useAuth()
  const isAdmin = dbUser?.rol?.codigo === 'ADMIN'

  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([])
  const [roles, setRoles] = useState<Rol[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'activos' | 'inactivos'>('todos')

  const [isOpen, setIsOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM)

  const [pendingUser, setPendingUser] = useState<UsuarioSistema | null>(null)
  const [statusSavingId, setStatusSavingId] = useState<number | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    try {
      const [usuariosData, rolesData] = await Promise.all([getUsuarios(), getRoles()])
      setUsuarios(usuariosData)
      setRoles(rolesData)
    } catch {
      toast.error('No se pudo cargar la administración de usuarios.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const usuariosFiltrados = useMemo(() => {
    const term = normalize(search)
    return usuarios.filter((usuario) => {
      const matchesText = !term ||
        normalize(usuario.nombre ?? '').includes(term) ||
        normalize(usuario.email).includes(term) ||
        normalize(usuario.rol.nombre).includes(term) ||
        normalize(usuario.rol.codigo).includes(term)

      const matchesStatus =
        statusFilter === 'todos' ||
        (statusFilter === 'activos' && usuario.activo) ||
        (statusFilter === 'inactivos' && !usuario.activo)

      return matchesText && matchesStatus
    })
  }, [usuarios, search, statusFilter])

  const stats = useMemo(() => ({
    total: usuarios.length,
    activos: usuarios.filter((usuario) => usuario.activo).length,
    inactivos: usuarios.filter((usuario) => !usuario.activo).length,
    admins: usuarios.filter((usuario) => usuario.rol.codigo === 'ADMIN' && usuario.activo).length,
  }), [usuarios])

  const openCreate = () => {
    const defaultRole = roles.find((rol) => rol.codigo === 'USUARIO') ?? roles[0]
    setInviteLink(null)
    setFormData({ ...EMPTY_FORM, rolId: defaultRole?.id.toString() ?? '' })
    setIsOpen(true)
  }

  const openEdit = (usuario: UsuarioSistema) => {
    setInviteLink(null)
    setFormData({
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre ?? '',
      rolId: usuario.rol.id.toString(),
    })
    setIsOpen(true)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!formData.rolId) {
      toast.error('Selecciona un rol para el usuario.')
      return
    }

    setSaving(true)
    try {
      if (formData.id) {
        await updateUsuarioNombre(formData.id, { nombre: formData.nombre.trim() })
        await updateUsuarioRol(formData.id, { rolId: Number(formData.rolId) })
        toast.success('Usuario actualizado correctamente.')
      } else {
        const response = await createUsuario({
          email: formData.email.trim(),
          nombre: formData.nombre.trim(),
          rolId: Number(formData.rolId),
        })
        setInviteLink(response.passwordResetLink)
        toast.success('Usuario creado. Comparte el enlace de activación con la persona autorizada.')
      }

      await cargarDatos()
      if (formData.id) setIsOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el usuario.')
    } finally {
      setSaving(false)
    }
  }

  const handleEstado = async (usuario: UsuarioSistema) => {
    setStatusSavingId(usuario.id)
    try {
      await updateUsuarioEstado(usuario.id, { activo: !usuario.activo })
      toast.success(usuario.activo ? 'Usuario inhabilitado.' : 'Usuario activado.')
      setPendingUser(null)
      await cargarDatos()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cambiar el estado.')
    } finally {
      setStatusSavingId(null)
    }
  }

  const copyInviteLink = async () => {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    toast.success('Enlace copiado al portapapeles.')
  }

  if (!isAdmin && !loading) {
    return (
      <div className='flex min-h-[55vh] items-center justify-center p-6'>
        <div className='max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm'>
          <ShieldCheck className='mx-auto h-10 w-10 text-slate-400' />
          <h1 className='mt-4 text-xl font-semibold text-slate-900'>Acceso restringido</h1>
          <p className='mt-2 text-sm text-slate-500'>
            Solo el administrador puede gestionar usuarios del sistema.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='animate-in fade-in-0 space-y-6 p-4 sm:p-6'>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <div>
          <h1 className='text-royal-blue flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl'>
            <UsersRound className='h-7 w-7 sm:h-8 sm:w-8' />
            Usuarios
          </h1>
          <p className='mt-1 text-sm text-slate-500'>
            Administra accesos, roles y estado del personal autorizado.
          </p>
        </div>
        <Button
          className='bg-vibrant-orange hover:bg-vibrant-orange/90 text-white shadow-sm'
          onClick={openCreate}
          disabled={loading || roles.length === 0}
        >
          <Plus className='mr-2 h-4 w-4' />
          Nuevo usuario
        </Button>
      </div>

      <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
        <StatCard label='Usuarios' value={stats.total} icon={<UsersRound className='h-4 w-4' />} />
        <StatCard label='Activos' value={stats.activos} icon={<CheckCircle2 className='h-4 w-4' />} accent='text-emerald-600' />
        <StatCard label='Inactivos' value={stats.inactivos} icon={<Ban className='h-4 w-4' />} accent='text-slate-500' />
        <StatCard label='Administradores' value={stats.admins} icon={<ShieldCheck className='h-4 w-4' />} accent='text-blue-600' />
      </div>

      <div className='flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between'>
        <div className='relative w-full md:max-w-sm'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
          <Input
            className='pl-9'
            placeholder='Buscar por nombre, correo o rol...'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
          <SelectTrigger className='w-full md:w-[180px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='todos'>Todos</SelectItem>
            <SelectItem value='activos'>Activos</SelectItem>
            <SelectItem value='inactivos'>Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block'>
        <Table>
          <TableHeader className='bg-slate-50'>
            <TableRow>
              <TableHead className='font-semibold text-slate-700'>Usuario</TableHead>
              <TableHead className='font-semibold text-slate-700'>Correo</TableHead>
              <TableHead className='font-semibold text-slate-700'>Rol</TableHead>
              <TableHead className='font-semibold text-slate-700'>Estado</TableHead>
              <TableHead className='text-right font-semibold text-slate-700'>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className='h-28 text-center text-slate-400'>
                  <div className='flex items-center justify-center gap-2'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Cargando usuarios...
                  </div>
                </TableCell>
              </TableRow>
            ) : usuariosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className='h-28 text-center text-slate-400'>
                  No se encontraron usuarios con los filtros aplicados.
                </TableCell>
              </TableRow>
            ) : (
              usuariosFiltrados.map((usuario) => (
                <TableRow key={usuario.id} className='transition-colors hover:bg-slate-50'>
                  <TableCell>
                    <div className='flex items-center gap-3'>
                      <div className='flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600'>
                        <UserRound className='h-4 w-4' />
                      </div>
                      <div className='min-w-0'>
                        <p className='truncate font-medium text-slate-900'>{usuario.nombre || 'Sin nombre'}</p>
                        <p className='text-xs text-slate-400'>ID {usuario.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className='text-sm text-slate-600'>{usuario.email}</TableCell>
                  <TableCell>
                    <RoleBadge rol={usuario.rol} />
                  </TableCell>
                  <TableCell>
                    <EstadoBadge activo={usuario.activo} />
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex justify-end gap-1'>
                      <Button variant='outline' size='icon' title='Editar usuario' onClick={() => openEdit(usuario)}>
                        <Edit3 className='h-4 w-4 text-slate-600' />
                      </Button>
                      <Button
                        variant={usuario.activo ? 'destructive' : 'outline'}
                        size='icon'
                        title={usuario.activo ? 'Inhabilitar usuario' : 'Activar usuario'}
                        onClick={() => setPendingUser(usuario)}
                      >
                        {usuario.activo ? <Ban className='h-4 w-4' /> : <CheckCircle2 className='h-4 w-4 text-emerald-600' />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className='space-y-3 md:hidden'>
        {loading ? (
          <div className='rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400 shadow-sm'>
            <Loader2 className='mx-auto mb-2 h-5 w-5 animate-spin' />
            Cargando usuarios...
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className='rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400 shadow-sm'>
            No se encontraron usuarios con los filtros aplicados.
          </div>
        ) : (
          usuariosFiltrados.map((usuario) => (
            <div key={usuario.id} className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm'>
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                  <p className='truncate font-semibold text-slate-900'>{usuario.nombre || 'Sin nombre'}</p>
                  <p className='mt-1 flex items-center gap-1 text-xs text-slate-500'>
                    <Mail className='h-3.5 w-3.5' />
                    <span className='truncate'>{usuario.email}</span>
                  </p>
                </div>
                <EstadoBadge activo={usuario.activo} />
              </div>
              <div className='mt-4 flex items-center justify-between gap-3'>
                <RoleBadge rol={usuario.rol} />
                <div className='flex gap-1'>
                  <Button variant='outline' size='icon' title='Editar usuario' onClick={() => openEdit(usuario)}>
                    <Edit3 className='h-4 w-4' />
                  </Button>
                  <Button
                    variant={usuario.activo ? 'destructive' : 'outline'}
                    size='icon'
                    title={usuario.activo ? 'Inhabilitar usuario' : 'Activar usuario'}
                    onClick={() => setPendingUser(usuario)}
                  >
                    {usuario.activo ? <Ban className='h-4 w-4' /> : <CheckCircle2 className='h-4 w-4 text-emerald-600' />}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[520px]'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-xl font-bold'>
              <UserRound className='text-royal-blue h-5 w-5' />
              {formData.id ? 'Editar usuario' : 'Crear usuario'}
            </DialogTitle>
            <DialogDescription>
              {formData.id
                ? 'Actualiza el nombre y rol del usuario seleccionado.'
                : 'Crea una cuenta autorizada para acceder al sistema privado.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className='mt-2 space-y-4'>
            <div className='space-y-1.5'>
              <Label htmlFor='nombre'>Nombre de usuario</Label>
              <Input
                id='nombre'
                required
                placeholder='Ej: Ana Pérez'
                value={formData.nombre}
                onChange={(event) => setFormData((prev) => ({ ...prev, nombre: event.target.value }))}
              />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='email'>Correo</Label>
              <Input
                id='email'
                type='email'
                required
                disabled={Boolean(formData.id)}
                placeholder='usuario@empresa.com'
                value={formData.email}
                onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
              />
              {formData.id && <p className='text-xs text-slate-400'>El correo está vinculado a Firebase y no se edita desde este formulario.</p>}
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='rol'>Rol</Label>
              <Select
                value={formData.rolId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, rolId: value }))}
              >
                <SelectTrigger id='rol'>
                  <SelectValue placeholder='Seleccione un rol' />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((rol) => (
                    <SelectItem key={rol.id} value={rol.id.toString()}>
                      {rol.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {inviteLink && (
              <div className='rounded-lg border border-blue-200 bg-blue-50 p-3'>
                <p className='text-sm font-medium text-blue-800'>Enlace de activación generado</p>
                <p className='mt-1 break-all text-xs text-blue-700'>{inviteLink}</p>
                <Button type='button' variant='outline' size='sm' className='mt-3 bg-white' onClick={copyInviteLink}>
                  <Copy className='mr-2 h-4 w-4' />
                  Copiar enlace
                </Button>
              </div>
            )}

            <div className='flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end'>
              <Button type='button' variant='outline' onClick={() => setIsOpen(false)}>
                Cerrar
              </Button>
              <Button type='submit' disabled={saving} className='bg-royal-blue hover:bg-royal-blue/90 text-white'>
                {saving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {saving ? 'Guardando...' : formData.id ? 'Guardar cambios' : 'Crear usuario'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingUser} onOpenChange={(open) => !open && setPendingUser(null)}>
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>{pendingUser?.activo ? 'Inhabilitar usuario' : 'Activar usuario'}</DialogTitle>
            <DialogDescription>
              {pendingUser?.activo
                ? 'El usuario no podrá iniciar sesión mientras esté inactivo.'
                : 'El usuario recuperará acceso al sistema.'}
            </DialogDescription>
          </DialogHeader>
          <div className='rounded-lg bg-slate-50 p-3 text-sm text-slate-600'>
            {pendingUser?.nombre} · {pendingUser?.email}
          </div>
          <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
            <Button type='button' variant='outline' onClick={() => setPendingUser(null)}>
              Cancelar
            </Button>
            <Button
              type='button'
              variant={pendingUser?.activo ? 'destructive' : 'default'}
              disabled={!pendingUser || statusSavingId === pendingUser.id}
              onClick={() => pendingUser && handleEstado(pendingUser)}
            >
              {pendingUser && statusSavingId === pendingUser.id && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  accent = 'text-slate-700',
}: {
  label: string
  value: number
  icon: ReactNode
  accent?: string
}) {
  return (
    <div className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm'>
      <div className='flex items-center justify-between'>
        <p className='text-sm text-slate-500'>{label}</p>
        <span className={accent}>{icon}</span>
      </div>
      <p className='mt-2 text-2xl font-bold text-slate-900'>{value}</p>
    </div>
  )
}

function RoleBadge({ rol }: { rol: Rol }) {
  return (
    <Badge variant='outline' className={`gap-1 ${getRoleClass(rol.codigo)}`}>
      <ShieldCheck className='h-3 w-3' />
      {rol.nombre}
    </Badge>
  )
}

function EstadoBadge({ activo }: { activo: boolean }) {
  return activo ? (
    <Badge className='gap-1 border-emerald-200 bg-emerald-50 text-emerald-700' variant='outline'>
      <CheckCircle2 className='h-3 w-3' />
      Activo
    </Badge>
  ) : (
    <Badge className='gap-1 border-slate-200 bg-slate-100 text-slate-500' variant='outline'>
      <Ban className='h-3 w-3' />
      Inactivo
    </Badge>
  )
}

