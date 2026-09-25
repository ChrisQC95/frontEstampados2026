import { useEffect } from 'react'
import { Outlet, useNavigate } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SkipToMain } from '@/components/skip-to-main'
import { Header } from '@/components/layout/header'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'

const CONTENT_LAYOUT_CLASSES = [
  '@container/content',
  'has-data-[layout=fixed]:h-svh',
  'peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]',
]

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  const { loading, sessionReady } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !sessionReady) {
      navigate({ to: '/' })
    }
  }, [loading, sessionReady, navigate])

  if (loading) {
    return (
      <main className='flex min-h-screen items-center justify-center bg-background px-4 text-center'>
        <div className='space-y-2'>
          <p className='text-sm font-medium text-foreground'>Validando sesión...</p>
          <p className='text-xs text-muted-foreground'>Estamos confirmando tu acceso con el servidor.</p>
        </div>
      </main>
    )
  }

  if (!sessionReady) {
    return null
  }

  return (
    <SearchProvider>
      <LayoutProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <SkipToMain />
          <AppSidebar />
          <SidebarInset className={cn(CONTENT_LAYOUT_CLASSES)}>
            <Header>
              <div className='ms-auto flex items-center space-x-4'>
                <ThemeSwitch />
                <ProfileDropdown />
              </div>
            </Header>
            {children ?? <Outlet />}
          </SidebarInset>
        </SidebarProvider>
      </LayoutProvider>
    </SearchProvider>
  )
}

