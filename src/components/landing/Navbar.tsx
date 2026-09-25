"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu, X, ChevronDown, User } from "lucide-react"
import { Logo } from "@/components/logo"
import { useAuth } from "@/context/AuthContext"
import { AuthModal } from "@/components/auth/AuthModal"
import { useNavigate } from "@tanstack/react-router"

const navLinks = [
  { label: "Inicio", href: "/" },
  { label: "Requisitos", href: "/#requisitos" },
  { label: "Beneficios", href: "/#beneficios" },
  { label: "Recursos", href: "/recursos" },
]

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const { user, dbUser, loading, sessionReady, signOut } = useAuth()
  const navigate = useNavigate()
  const displayName = user?.displayName || dbUser?.email?.split('@')[0] || user?.email?.split('@')[0] || 'Usuario'

  const handlePanelClick = () => {
    if (sessionReady) {
      navigate({ to: "/dashboard" })
      return
    }

    if (!loading) {
      setAuthModalOpen(true)
    }
  }

  const renderPrimaryAction = (isMobile = false) => {
    if (loading && user && !sessionReady) {
      return (
        <Button className={isMobile ? "w-full" : ""} disabled>
          Verificando sesión...
        </Button>
      )
    }

    if (sessionReady) {
      return (
        <Button
          className={`${isMobile ? "w-full " : ""}bg-vibrant-orange hover:bg-vibrant-orange/90 text-white font-semibold shadow-md`}
          onClick={handlePanelClick}
        >
          Ir al Panel
        </Button>
      )
    }

    return (
      <Button
        className={`${isMobile ? "w-full " : ""}bg-vibrant-orange hover:bg-vibrant-orange/90 text-white font-semibold shadow-md`}
        onClick={handlePanelClick}
      >
        ¡Empieza Ahora!
      </Button>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="/" aria-label="FormaEasy - Inicio">
          <Logo size="md" />
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-4 md:flex">
          {!sessionReady ? (
            <>
              <Button
                variant="ghost"
                className="text-foreground font-semibold hover:bg-accent"
                onClick={() => setAuthModalOpen(true)}
                disabled={loading && Boolean(user)}
              >
                Ingresar
              </Button>
              {renderPrimaryAction()}
            </>
          ) : (
            <>
              {renderPrimaryAction()}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 text-foreground font-medium">
                    <User className="h-4 w-4" />
                    {displayName}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem className="cursor-pointer">Mi Perfil</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">Configuración</DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                    onClick={signOut}
                  >
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="border-t border-border bg-card md:hidden">
          <div className="space-y-1 px-4 py-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block rounded-lg px-3 py-2 text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              {!sessionReady ? (
                <>
                  {renderPrimaryAction(true)}
                  <Button
                    variant="outline"
                    className="w-full gap-2 bg-transparent font-semibold border-input"
                    onClick={() => {
                      setAuthModalOpen(true)
                      setMobileMenuOpen(false)
                    }}
                    disabled={loading && Boolean(user)}
                  >
                    Ingresar
                  </Button>
                </>
              ) : (
                <>
                  {renderPrimaryAction(true)}
                  <div className="flex items-center gap-2 px-3 py-3 text-sm font-medium text-foreground bg-muted/50 rounded-md">
                    <User className="h-4 w-4" />
                    {displayName}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full gap-2 bg-transparent text-red-600 border-red-200 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      signOut()
                    }}
                  >
                    Cerrar Sesión
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </header>
  )
}

