import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ClipboardList, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { getPedidosPendientesFacturacion, type PedidoFacturacion } from '@/features/ventas/nueva-venta/api'

export const Route = createFileRoute('/_authenticated/dashboard/ventas/por-facturar')({
  component: PedidosPorFacturar,
})

function PedidosPorFacturar() {
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState<PedidoFacturacion[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [opening, setOpening] = useState(false)

  const load = async () => {
    setLoading(true)
    try { setPedidos(await getPedidosPendientesFacturacion()) }
    catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los pedidos') }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const startInvoice = async () => {
    if (!selected.length) return toast.warning('Selecciona al menos un pedido.')
    const chosen = pedidos.filter((pedido) => selected.includes(pedido.pedidoId))
    const key = (pedido: PedidoFacturacion) => `${pedido.tipoComprobante}:${pedido.tipoDocumento}:${pedido.numeroDocumento}`
    if (new Set(chosen.map(key)).size !== 1) return toast.error('Selecciona pedidos del mismo cliente y tipo de comprobante.')
    setOpening(true)
    try {
      // Verify availability again before taking the user to the invoice form.
      const { getPedidosSeleccionados } = await import('@/features/ventas/nueva-venta/api')
      await getPedidosSeleccionados(selected)
      await navigate({ to: '/dashboard/ventas/nueva', search: { pedidos: selected.join(',') } })
    } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudieron reservar los pedidos') }
    finally { setOpening(false) }
  }

  return <main className='space-y-5 p-4 sm:p-6'>
    <header className='flex flex-wrap items-center justify-between gap-3'>
      <div><p className='text-xs font-bold uppercase tracking-[.18em] text-violet-700'>E-commerce</p><h1 className='mt-1 text-2xl font-bold text-slate-900'>Pedidos por facturar</h1><p className='mt-1 text-sm text-slate-500'>Pedidos pagados listos para convertirse en comprobantes.</p></div>
      <Button variant='outline' onClick={() => void load()} disabled={loading}><RefreshCw className='mr-2 h-4 w-4' />Actualizar</Button>
    </header>
    <section className='overflow-hidden rounded-2xl border bg-white shadow-sm'>
      <div className='flex flex-wrap items-center justify-between gap-3 border-b p-4'><div className='flex items-center gap-2 font-semibold'><ClipboardList className='h-5 w-5 text-violet-700' />{pedidos.length} pedidos disponibles</div><Button onClick={() => void startInvoice()} disabled={!selected.length || opening}>{opening && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}Preparar venta ({selected.length})</Button></div>
      {loading ? <div className='p-12 text-center text-slate-500'><Loader2 className='mx-auto mb-2 h-5 w-5 animate-spin' />Cargando pedidos...</div> : pedidos.length === 0 ? <div className='p-12 text-center text-slate-500'>No hay pedidos pagados pendientes de facturación.</div> : <div className='overflow-x-auto'><table className='w-full min-w-[900px] text-left text-sm'><thead className='bg-slate-50 text-xs uppercase text-slate-500'><tr><th className='p-3'>Sel.</th><th className='p-3'>Pedido</th><th className='p-3'>Fecha</th><th className='p-3'>Cliente / documento</th><th className='p-3'>Comprobante</th><th className='p-3'>Pago</th><th className='p-3 text-right'>Importe</th><th className='p-3'>Entrega</th></tr></thead><tbody className='divide-y'>{pedidos.map((pedido) => <tr key={pedido.pedidoId} className='hover:bg-slate-50'><td className='p-3'><input type='checkbox' checked={selected.includes(pedido.pedidoId)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, pedido.pedidoId] : current.filter((id) => id !== pedido.pedidoId))} aria-label={`Seleccionar ${pedido.codigo}`} /></td><td className='p-3 font-semibold'>{pedido.codigo}</td><td className='p-3'>{new Date(pedido.fechaCreacion).toLocaleDateString()}</td><td className='p-3'>{pedido.nombreFacturacion}<div className='text-xs text-slate-500'>{pedido.tipoDocumento} · {pedido.numeroDocumento}</div></td><td className='p-3'>{pedido.tipoComprobante}</td><td className='p-3'>{pedido.metodoPago || 'Online'}</td><td className='p-3 text-right font-semibold'>S/ {Number(pedido.subtotal).toFixed(2)}</td><td className='p-3'>{pedido.direccionEntrega}</td></tr>)}</tbody></table></div>}
    </section>
  </main>
}
