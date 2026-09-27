
export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 py-16 lg:py-24">

      {/* ── Fondo decorativo: cuadrícula punteada sutil ─────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />
      {/* Glow difuso en esquina superior derecha */}
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
      {/* Glow suave en esquina inferior izquierda */}
      <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-500/15 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* En móvil: flex-col (texto → foto). En desktop: grid 2 columnas */}
        <div className="flex flex-col gap-10 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16">

          {/* ── Columna Izquierda: Texto ──────────────────────────────────── */}
          <div className="text-center lg:text-left order-1">

            {/* Badge / Pill */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-widest text-white/90">
                Gestión de Sublimados
              </span>
            </div>

            {/* Tipografía fluida: 3xl → 5xl → 6xl → 7xl */}
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl">
              Personaliza tu
              <span className="block mt-1 bg-gradient-to-r from-sky-300 to-emerald-300 bg-clip-text text-transparent">
                Marca
              </span>
              con Productos Únicos
            </h1>

            <p className="mt-6 max-w-lg text-base sm:text-lg leading-relaxed text-blue-100/80 lg:mx-0 mx-auto">
              Gestiona pedidos de polos, tazas, gorras y merchandising personalizado.
              Atiende clientes corporativos con catálogo, mockups, ventas
              y comprobantes en un solo lugar.
            </p>

            {/* Stats row */}
            <div className="mt-10 flex flex-wrap justify-center gap-6 lg:justify-start">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-white">3</span>
                <span className="text-sm text-blue-200 leading-tight max-w-[80px]">tipos de producto</span>
              </div>
              <div className="h-10 w-px bg-white/20 hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-white">100%</span>
                <span className="text-sm text-blue-200 leading-tight max-w-[80px]">gestión centralizada</span>
              </div>
              <div className="h-10 w-px bg-white/20 hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-white">∞</span>
                <span className="text-sm text-blue-200 leading-tight max-w-[80px]">diseños posibles</span>
              </div>
            </div>
          </div>

          {/* ── Columna Derecha: Fotografía + Widget flotante ─────────────── */}
          {/* order-2 → foto siempre debajo del texto en mobile */}
          <div className="relative flex justify-center lg:justify-end order-2">

            {/* Contenedor de la foto con padding inferior para dar espacio a la tarjeta flotante */}
            <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-full pb-16 sm:pb-20 lg:pb-0">

              {/* Foto principal del emprendedor */}
              <img
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=800&auto=format&fit=crop"
                alt="Productos sublimados personalizados"
                className="rounded-2xl object-cover shadow-2xl w-full h-[280px] sm:h-[350px] lg:h-[440px] object-top"
              />

              {/* Sombra de profundidad bajo la foto */}
              <div className="absolute -bottom-4 left-4 right-4 h-12 rounded-2xl bg-blue-950/40 blur-xl -z-10" />

              {/* Widget "Control de Ventas" — flotante inferior
                  En móvil: escala 80%, posición centrada debajo de la foto.
                  En desktop: escala 100%, posición absoluta inferior izquierda.
              */}
              <div className="
                absolute bottom-0 left-1/2 -translate-x-1/2
                sm:left-0 sm:translate-x-0 sm:-bottom-2
                lg:-bottom-6 lg:-left-4
                w-56 sm:w-60 lg:w-64
                z-10 shadow-2xl rounded-2xl overflow-hidden
                scale-90 sm:scale-95 lg:scale-100
              ">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl">
                  <div className="pb-3 pt-4 px-5">
                    <p className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                      Control de pedidos personalizados
                    </p>
                  </div>
                  <div className="px-5 pb-4">
                    <ul className="space-y-2.5">
                      {[
                        'Registro de pedidos',
                        'Control de insumos y stock',
                        'Clientes corporativos',
                      ].map((label) => (
                        <li key={label} className="flex items-center gap-3">
                          <svg className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs sm:text-sm font-medium text-slate-700">{label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
