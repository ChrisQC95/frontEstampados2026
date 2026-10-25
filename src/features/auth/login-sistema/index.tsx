import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { FirebaseError } from 'firebase/app'
import { signInWithEmailAndPassword, signOut as firebaseSignOut, type User } from 'firebase/auth'
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL
const REMEMBER_EMAIL_KEY = 'sabiduria_login_sistema_email'
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const CLIENTE_TIENDA = 'CLIENTE_TIENDA'

type Rol = {
  id: number
  codigo: string
  nombre: string
  descripcion?: string | null
  activo: boolean
}

type LoginUser = {
  id: number
  firebaseUid: string
  email: string
  nombre?: string | null
  rol?: Rol | null
  activo?: boolean
}

function authErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    if (error.code === 'auth/invalid-credential') return 'Correo o contraseña incorrectos.'
    if (error.code === 'auth/user-disabled') return 'Esta cuenta está deshabilitada en Firebase.'
    if (error.code === 'auth/too-many-requests') return 'Demasiados intentos. Intenta nuevamente en unos minutos.'
    if (error.code === 'auth/network-request-failed') return 'No se pudo conectar con Firebase. Revisa tu conexión.'
  }

  if (error instanceof Error) return error.message
  return 'No se pudo iniciar sesión. Inténtalo nuevamente.'
}

async function fetchSystemRoles(): Promise<Rol[]> {
  const response = await fetch(`${API_URL}/api/public/roles/sistema`)

  if (!response.ok) {
    throw new Error('No se pudieron cargar los accesos permitidos del sistema.')
  }

  return response.json()
}

async function syncUserWithBackend(firebaseUser: User): Promise<LoginUser> {
  const token = await firebaseUser.getIdToken()
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      nombre: firebaseUser.displayName || '',
    }),
  })

  if (!response.ok) {
    throw new Error('Tu cuenta existe en Firebase, pero no está autorizada en el sistema.')
  }

  return response.json()
}

export default function LoginSistema() {
  const navigate = useNavigate()
  const { loading: authLoading, sessionReady, dbUser, setDbUser, resetPassword } = useAuth()
  const [roles, setRoles] = useState<Rol[]>([])
  const [rolesLoading, setRolesLoading] = useState(true)
  const [rolesError, setRolesError] = useState<string | null>(null)
  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBER_EMAIL_KEY) || '')
  const [password, setPassword] = useState('')
  const [rememberEmail, setRememberEmail] = useState(() => Boolean(localStorage.getItem(REMEMBER_EMAIL_KEY)))
  const [showPassword, setShowPassword] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const allowedRoleCodes = useMemo(() => roles.map((rol) => rol.codigo), [roles])
  const canSubmit = !authLoading && !rolesLoading && !rolesError && roles.length > 0 && !submitting

  useEffect(() => {
    let mounted = true

    fetchSystemRoles()
      .then((data) => {
        if (!mounted) return
        setRoles(data.filter((rol) => rol.activo && rol.codigo !== CLIENTE_TIENDA))
        setRolesError(null)
      })
      .catch((error) => {
        if (!mounted) return
        setRolesError(authErrorMessage(error))
      })
      .finally(() => {
        if (mounted) setRolesLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (authLoading || !sessionReady || !dbUser) return

    if (dbUser.rol?.codigo === CLIENTE_TIENDA) {
      navigate({ to: '/tienda' })
      return
    }

    navigate({ to: '/dashboard' })
  }, [authLoading, sessionReady, dbUser, navigate])

  const validateCredentials = () => {
    const trimmedEmail = email.trim()

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      toast.error('Ingresa un correo válido.')
      return false
    }

    if (password.length < 6) {
      toast.error('Ingresa una contraseña válida de al menos 6 caracteres.')
      return false
    }

    if (!allowedRoleCodes.length) {
      toast.error('No hay roles del sistema disponibles para iniciar sesión.')
      return false
    }

    return true
  }

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!validateCredentials()) return

    setSubmitting(true)
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
      const userData = await syncUserWithBackend(credential.user)
      const roleCode = userData.rol?.codigo

      if (!roleCode || !allowedRoleCodes.includes(roleCode)) {
        await firebaseSignOut(auth)
        setDbUser(null)
        throw new Error('Este acceso es solo para personal interno autorizado.')
      }

      if (rememberEmail) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim())
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY)
      }

      setDbUser(userData)
      toast.success('Sesión iniciada correctamente.')
      navigate({ to: '/dashboard' })
    } catch (error) {
      toast.error(authErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmedEmail = email.trim()

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      toast.error('Ingresa un correo válido para recuperar tu contraseña.')
      return
    }

    setSubmitting(true)
    try {
      await resetPassword(trimmedEmail)
      toast.success('Correo de recuperación enviado. Revisa tu bandeja de entrada.')
      setForgotMode(false)
    } catch (error) {
      toast.error(authErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className='relative min-h-screen overflow-hidden bg-[#f5efff] text-slate-950'>
      <div className='absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top_left,rgba(255,206,84,0.32),transparent_28%),linear-gradient(135deg,#2f145d_0%,#4b2184_52%,#7c4ed8_100%)]' />
      <div className='relative mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8'>
        <section className='hidden animate-in fade-in-0 slide-in-from-left-3 duration-500 lg:block'>
          <Button
            type='button'
            variant='ghost'
            className='mb-8 gap-2 text-white hover:bg-white/10 hover:text-white'
            onClick={() => navigate({ to: '/' })}
          >
            <ArrowLeft className='h-4 w-4' />
            Volver al sitio
          </Button>

          <div className='max-w-lg rounded-3xl border border-white/15 bg-[#32115f] p-8 text-white shadow-2xl ring-1 ring-white/10'>
            <div className='mb-8 flex items-center gap-4'>
              <span className='flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-white/30 bg-white p-1 shadow-lg'>
                <img src='/images/sabiduria-logo.jpeg' alt='Sabiduría' className='h-full w-full rounded-full object-cover' />
              </span>
              <div>
                <p className='text-sm font-semibold uppercase tracking-[0.28em] text-amber-200'>Acceso interno</p>
                <h1 className='text-4xl font-black leading-tight'>LoginSistema</h1>
              </div>
            </div>
            <p className='text-lg leading-8 text-purple-50'>
              Ingreso reservado para el equipo que gestiona ventas, contabilidad, marketing y administración de Sabiduría.
            </p>
            <div className='mt-8 grid gap-3'>
              <div className='flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.12] p-4'>
                <ShieldCheck className='mt-0.5 h-5 w-5 shrink-0 text-amber-200' />
                <p className='text-sm leading-6 text-purple-50'>Los accesos se validan contra Firebase y contra el rol activo registrado en la base de datos.</p>
              </div>
              <div className='flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.12] p-4'>
                <CheckCircle2 className='mt-0.5 h-5 w-5 shrink-0 text-emerald-200' />
                <p className='text-sm leading-6 text-purple-50'>Si se agrega un nuevo rol interno activo, el login lo reconocerá sin cambiar código.</p>
              </div>
            </div>
          </div>
        </section>

        <section className='animate-in fade-in-0 slide-in-from-bottom-3 duration-500'>
          <Card className='mx-auto w-full max-w-xl overflow-hidden rounded-3xl border-purple-950/10 bg-white/95 shadow-2xl backdrop-blur'>
            <CardContent className='p-0'>
              <div className='border-b border-purple-950/10 bg-white px-6 py-6 sm:px-8'>
                <button
                  type='button'
                  className='mb-5 inline-flex items-center gap-2 text-sm font-semibold text-sabiduria-purple hover:underline lg:hidden'
                  onClick={() => navigate({ to: '/' })}
                >
                  <ArrowLeft className='h-4 w-4' />
                  Volver al sitio
                </button>
                <div className='flex items-center gap-4'>
                  <span className='flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-purple-100 bg-white p-1 shadow-sm'>
                    <img src='/images/sabiduria-logo.jpeg' alt='Logo Sabiduría' className='h-full w-full rounded-full object-cover' />
                  </span>
                  <div className='min-w-0'>
                    <p className='text-sm font-semibold uppercase tracking-[0.22em] text-slate-500'>Sabiduría</p>
                    <h2 className='text-2xl font-black text-sabiduria-purple sm:text-3xl'>Acceso al sistema</h2>
                  </div>
                </div>
              </div>

              <div className='space-y-6 px-6 py-6 sm:px-8 sm:py-8'>
                {rolesError ? (
                  <Alert variant='destructive' className='animate-in fade-in-0 duration-300'>
                    <RefreshCw className='h-4 w-4' />
                    <AlertTitle>No se cargaron los accesos</AlertTitle>
                    <AlertDescription>{rolesError}</AlertDescription>
                  </Alert>
                ) : (
                  <div className='rounded-2xl border border-purple-100 bg-purple-50/60 p-4'>
                    <p className='mb-3 text-sm font-semibold text-sabiduria-purple'>Roles permitidos</p>
                    <div className='flex flex-wrap gap-2' aria-live='polite'>
                      {rolesLoading ? (
                        <span className='inline-flex items-center gap-2 text-sm text-slate-500'>
                          <Loader2 className='h-4 w-4 animate-spin' />
                          Cargando accesos...
                        </span>
                      ) : (
                        roles.map((rol) => (
                          <Badge key={rol.id} variant='outline' className='border-purple-200 bg-white text-sabiduria-purple'>
                            {rol.nombre}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                )}

                <div className='transition-all duration-300'>
                  {forgotMode ? (
                    <form onSubmit={handleResetPassword} className='animate-in fade-in-0 slide-in-from-right-2 space-y-5 duration-300'>
                      <div>
                        <h3 className='text-xl font-black text-slate-950'>Recuperar contraseña</h3>
                        <p className='mt-1 text-sm text-slate-500'>Te enviaremos el enlace de restablecimiento al correo registrado.</p>
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='system-reset-email'>Correo electrónico</Label>
                        <div className='relative'>
                          <Mail className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
                          <Input
                            id='system-reset-email'
                            type='email'
                            inputMode='email'
                            autoComplete='email'
                            className='pl-10'
                            placeholder='usuario@empresa.com'
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <Button type='submit' className='w-full bg-sabiduria-purple font-semibold text-white hover:bg-sabiduria-purple-soft' disabled={submitting}>
                        {submitting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
                        Enviar enlace
                      </Button>
                      <Button type='button' variant='ghost' className='w-full' onClick={() => setForgotMode(false)}>
                        <ArrowLeft className='mr-2 h-4 w-4' />
                        Volver al inicio de sesión
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleLogin} className='animate-in fade-in-0 slide-in-from-left-2 space-y-5 duration-300'>
                      <div className='space-y-2'>
                        <Label htmlFor='system-email'>Correo electrónico</Label>
                        <div className='relative'>
                          <Mail className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
                          <Input
                            id='system-email'
                            type='email'
                            inputMode='email'
                            autoComplete='email'
                            className='pl-10'
                            placeholder='usuario@empresa.com'
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className='space-y-2'>
                        <div className='flex items-center justify-between gap-3'>
                          <Label htmlFor='system-password'>Contraseña</Label>
                          <button
                            type='button'
                            className='text-sm font-semibold text-sabiduria-purple hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sabiduria-purple focus-visible:ring-offset-2'
                            onClick={() => setForgotMode(true)}
                          >
                            ¿Olvidaste tu contraseña?
                          </button>
                        </div>
                        <div className='relative'>
                          <LockKeyhole className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
                          <Input
                            id='system-password'
                            type={showPassword ? 'text' : 'password'}
                            autoComplete='current-password'
                            className='pl-10 pr-11'
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                            minLength={6}
                          />
                          <button
                            type='button'
                            className='absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sabiduria-purple'
                            onClick={() => setShowPassword((prev) => !prev)}
                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          >
                            {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                          </button>
                        </div>
                      </div>

                      <div className='flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3'>
                        <Checkbox
                          id='remember-system-email'
                          checked={rememberEmail}
                          onCheckedChange={(checked) => setRememberEmail(Boolean(checked))}
                        />
                        <Label htmlFor='remember-system-email' className='cursor-pointer text-sm font-medium text-slate-600'>
                          Recordar mi correo en este equipo
                        </Label>
                      </div>

                      <Button type='submit' className='w-full bg-sabiduria-purple font-semibold text-white hover:bg-sabiduria-purple-soft' disabled={!canSubmit}>
                        {submitting ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <ShieldCheck className='mr-2 h-4 w-4' />}
                        {submitting ? 'Validando acceso...' : 'Ingresar al sistema'}
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}


