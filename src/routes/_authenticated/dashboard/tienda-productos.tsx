import { createFileRoute } from '@tanstack/react-router'
import TiendaProductosPage from '@/features/tienda-productos/index'

export const Route = createFileRoute('/_authenticated/dashboard/tienda-productos')({
  component: TiendaProductosPage,
})
