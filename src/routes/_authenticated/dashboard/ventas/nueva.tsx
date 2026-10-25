import { createFileRoute } from '@tanstack/react-router'
import NuevaVenta from '@/features/ventas/nueva-venta'

export const Route = createFileRoute('/_authenticated/dashboard/ventas/nueva')({
  validateSearch: (search: Record<string, unknown>) => ({
    pedidos: typeof search.pedidos === 'string' ? search.pedidos : '',
  }),
  component: NuevaVentaComponent,
})

function NuevaVentaComponent() {
  const { pedidos } = Route.useSearch()
  return <NuevaVenta pedidosQuery={pedidos} />
}
