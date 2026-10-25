"use client"

import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { Menu, X } from "lucide-react"

import { AuthModal } from "@/components/auth/AuthModal"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"

const CLIENTE_TIENDA = "CLIENTE_TIENDA"

const navLinks = [
  { label: "Tienda", href: "/tienda" },
  { label: "Nosotros", href: "/#nosotros" },
  { label: "Misión y Visión", href: "/#mision-vision" },
  { label: "FODA", href: "/#foda" },
  { label: "Nuestros Trabajos", href: "/#trabajos" },
  { label: "Contacto", href: "/#contacto" },
]

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const { user, dbUser, loading, sessionReady, signOut } = useAuth()
  const navigate = useNavigate()
  const isStoreCustomer = dbUser?.rol?.codigo === CLIENTE_TIENDA
  const displayName = dbUser?.nombre || user?.displayName || dbUser?.email?.split('@')[0] || user?.email?.split('@')[0] || 'Usuario'

  const openStoreAuth = () => {
    setMobileMenuOpen(false)
    setAuthModalOpen(true)
  }

  const handlePrimaryAction = () => {
    setMobileMenuOpen(false)

    if (!sessionReady) {
      setAuthModalOpen(true)
      return
    }

    navigate({ to: isStoreCustomer ? "/tienda" : "/dashboard" })
  }

  const panelLabel = sessionReady && isStoreCustomer ? "Ir a tienda" : "Ir al Panel"

  return (
    <header className="sticky top-0 z-50 w-full border-b border-purple-950/10 bg-white/92 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-white/82">
      <nav className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <a href="/" aria-label="Sabiduría - Inicio" className="flex min-w-0 items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-purple-100 bg-white p-1 shadow-sm sm:h-16 sm:w-16">
            <img src="/images/sabiduria-logo.jpeg" alt="Logo Sabiduría" className="h-full w-full rounded-full object-cover" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-lg font-black tracking-wide text-sabiduria-purple sm:text-2xl">Sabiduría</span>
            <span className="block truncate text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Estampados corporativos</span>
          </span>
        </a>

        <div className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-sm text-sm font-semibold text-slate-600 transition-colors hover:text-sabiduria-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sabiduria-purple focus-visible:ring-offset-2"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {!sessionReady ? (
            <>
              <Button
                variant="ghost"
                className="font-semibold text-sabiduria-purple hover:bg-purple-50"
                onClick={openStoreAuth}
                disabled={loading && Boolean(user)}
              >
                Ingresar
              </Button>
              <Button className="bg-sabiduria-purple font-semibold text-white shadow-md hover:bg-sabiduria-purple-soft" onClick={openStoreAuth}>
                Comprar en tienda
              </Button>
            </>
          ) : (
            <>
              <div className="max-w-[180px] truncate rounded-full bg-purple-50 px-3 py-2 text-sm font-semibold text-sabiduria-purple">
                {displayName}
              </div>
              <Button className="bg-sabiduria-purple font-semibold text-white shadow-md hover:bg-sabiduria-purple-soft" onClick={handlePrimaryAction}>
                {panelLabel}
              </Button>
              <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={signOut}>
                Salir
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-2 text-sabiduria-purple hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sabiduria-purple focus-visible:ring-offset-2 lg:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="border-t border-purple-950/10 bg-white lg:hidden">
          <div className="space-y-1 px-4 py-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block rounded-lg px-3 py-2 text-base font-semibold text-slate-600 hover:bg-purple-50 hover:text-sabiduria-purple"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="mt-4 space-y-2 border-t border-purple-950/10 pt-4">
              {!sessionReady ? (
                <>
                  <Button className="w-full bg-sabiduria-purple font-semibold text-white hover:bg-sabiduria-purple-soft" onClick={openStoreAuth}>
                    Comprar en tienda
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full font-semibold"
                    onClick={openStoreAuth}
                    disabled={loading && Boolean(user)}
                  >
                    Ingresar
                  </Button>
                </>
              ) : (
                <>
                  <div className="rounded-lg bg-purple-50 px-3 py-3 text-sm font-semibold text-sabiduria-purple">
                    {displayName}
                  </div>
                  <Button className="w-full bg-sabiduria-purple font-semibold text-white hover:bg-sabiduria-purple-soft" onClick={handlePrimaryAction}>
                    {panelLabel}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      signOut()
                    }}
                  >
                    Salir
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab="login"
        authEndpoint="/api/auth/tienda/login"
        allowedRoleCodes={[CLIENTE_TIENDA]}
        accessDeniedMessage="Este acceso es solo para clientes registrados de la tienda."
        loginTitle="Acceso cliente"
        loginDescription="Ingresa con tu cuenta de cliente para continuar tu compra."
        registerDescription="Crea tu cuenta de cliente para guardar tus pedidos y comprar en la tienda."
      />
    </header>
  )
}
