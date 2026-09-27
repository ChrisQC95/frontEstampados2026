/**
 * Logo.tsx — Sabiduría
 *
 * Composición: ícono SVG geométrico (bloque ascendente) + tipografía bicolor
 * Prop `size`: "sm" | "md" | "lg"  (default: "md")
 * Prop `className`: clases adicionales para el wrapper
 * Dark mode: usa tokens CSS del tema (text-foreground, colores inline variables)
 */

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Oculta el texto y muestra solo el ícono (útil en sidebar colapsado) */
  iconOnly?: boolean
}

// ── Escala de tamaños ─────────────────────────────────────────────────────────
const sizeMap = {
  sm: {
    wrapper: 'gap-1.5',
    icon:    'h-6 w-6',
    text:    'text-base',
    badge:   'text-[8px] px-1 py-px',
  },
  md: {
    wrapper: 'gap-2',
    icon:    'h-8 w-8',
    text:    'text-xl',
    badge:   'text-[9px] px-1.5 py-px',
  },
  lg: {
    wrapper: 'gap-3',
    icon:    'h-11 w-11',
    text:    'text-3xl',
    badge:   'text-[10px] px-1.5 py-0.5',
  },
}

// ── Ícono SVG puro — Bloques apilados en ascenso ──────────────────────────────
function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/*
        Concepto: tres bloques/pilares que crecen de izquierda a derecha,
        como un gráfico de barras ascendente dentro de una figura de cubo.
        Paleta: morado de marca + acentos cálidos de Sabiduría
      */}

      {/* Fondo del ícono — círculo con gradiente sutil */}
      <defs>
        <linearGradient id="fe-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#2f1764" />   {/* morado marca */}
          <stop offset="100%" stopColor="#1f1147" />   {/* morado oscuro */}
        </linearGradient>
        <linearGradient id="fe-bar-accent" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#f6cf5a" />   {/* dorado marca */}
          <stop offset="100%" stopColor="#ee4b3f" />   {/* coral marca */}
        </linearGradient>
        <linearGradient id="fe-bar-blue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#57bfd6" />   {/* cian marca */}
          <stop offset="100%" stopColor="#5b2f91" />   {/* violeta marca */}
        </linearGradient>
      </defs>

      {/* Fondo redondeado */}
      <rect width="32" height="32" rx="8" fill="url(#fe-bg)" />

      {/* Barra izquierda — pequeña, blanca semitransparente */}
      <rect x="5"  y="20" width="5" height="7"  rx="1.5" fill="white" fillOpacity="0.35" />

      {/* Barra central — media, azul claro */}
      <rect x="13" y="15" width="5" height="12" rx="1.5" fill="url(#fe-bar-blue)" />

      {/* Barra derecha — alta, naranja (acento de marca) */}
      <rect x="21" y="9"  width="5" height="18" rx="1.5" fill="url(#fe-bar-accent)" />

      {/* Flecha de tendencia — línea diagonal con punta */}
      <polyline
        points="7.5,21 15.5,16 24,10"
        stroke="white"
        strokeOpacity="0.6"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Componente principal ───────────────────────────────────────────────────────
export function Logo({ size = 'md', className = '', iconOnly = false }: LogoProps) {
  const s = sizeMap[size]

  return (
    <div
      className={`inline-flex items-center ${s.wrapper} ${className}`}
      role="img"
      aria-label="Sabiduría — Gestión de sublimados personalizados"
    >
      {/* Ícono */}
      <LogoIcon className={`${s.icon} shrink-0`} />

      {/* Texto (ocultable en sidebar colapsado) */}
      {!iconOnly && (
        <span className={`${s.text} font-extrabold leading-none tracking-tight select-none`}>
          {/* "Forma" en color foreground (se adapta a dark mode automáticamente) */}
          <span className="text-foreground">Sabidur</span>
          {/*
            "ía" en azul vibrante en modo claro, naranja/acento en modo oscuro.
            Usamos clases de Tailwind estándar para full dark mode support.
          */}
          <span className="text-violet-600 dark:text-amber-300 font-light">
            ía
          </span>
        </span>
      )}
    </div>
  )
}
