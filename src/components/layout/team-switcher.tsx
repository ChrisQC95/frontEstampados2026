import { ChevronsUpDown, LogOut, Home, Store } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAuth } from '@/context/AuthContext'

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const { empresaPerfil, signOut } = useAuth()
  const navigate = useNavigate()

  // 1. Lógica dinámica: Si empresaPerfil aún no carga tras el F5, usamos fallbacks limpios
  const nombreEmpresa = empresaPerfil?.nombreComercial || empresaPerfil?.razonSocial || 'Cargando empresa...'
  const logoEmpresaUrl = empresaPerfil?.logoUrl || ''
  const identificadorUnico = empresaPerfil?.ruc ? `RUC: ${empresaPerfil.ruc}` : 'ERP Activo'

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground overflow-hidden bg-slate-900'>
                {logoEmpresaUrl ? (
                  <img
                    src={logoEmpresaUrl}
                    alt={nombreEmpresa}
                    className='h-full w-full object-cover'
                  />
                ) : (
                  <Store className='size-4' />
                )}
              </div>
              <div className='grid flex-1 text-start text-sm leading-tight'>
                <span className='truncate font-semibold'>
                  {nombreEmpresa}
                </span>
                <span className='truncate text-xs text-muted-foreground'>
                  {identificadorUnico}
                </span>
              </div>
              <ChevronsUpDown className='ms-auto' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            align='start'
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className='text-xs text-muted-foreground'>
              Empresa en gestión
            </DropdownMenuLabel>

            {/* Fila Única: Muestra la información sin permitir cambiar de empresa */}
            <DropdownMenuItem className='gap-2 p-2 bg-sidebar-accent/40 cursor-default focus:bg-sidebar-accent/40 focus:text-sidebar-accent-foreground'>
              <div className='flex size-6 items-center justify-center rounded-sm border overflow-hidden bg-background'>
                {logoEmpresaUrl ? (
                  <img src={logoEmpresaUrl} alt={nombreEmpresa} className='h-full w-full object-cover' />
                ) : (
                  <Store className='size-3 text-muted-foreground' />
                )}
              </div>
              <div className='grid flex-1 text-start text-xs leading-tight'>
                <span className='font-medium truncate'>{nombreEmpresa}</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Cambiado: Botón para volver al Landing Page */}
            <DropdownMenuItem
              className='gap-2 p-2 cursor-pointer'
              onClick={() => navigate({ to: '/' })}
            >
              <div className='flex size-6 items-center justify-center rounded-md border bg-background'>
                <Home className='size-4' />
              </div>
              <div className='font-medium text-sm text-foreground'>
                Volver al landing page
              </div>
            </DropdownMenuItem>

            {/* Añadido: Botón para Cerrar Sesión con estilos de alerta */}
            <DropdownMenuItem
              className='gap-2 p-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10'
              onClick={() => {
                if (signOut) signOut();
                navigate({ to: '/' })
              }}
            >
              <div className='flex size-6 items-center justify-center rounded-md border border-destructive/20 bg-background'>
                <LogOut className='size-4' />
              </div>
              <div className='font-medium text-sm'>
                Cerrar sesión
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
