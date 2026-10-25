import { useEffect, useState } from 'react'
import { Loader2, RefreshCw, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cancelarPedidoTienda, getMisPedidosTienda, type PedidoTiendaResumen } from '@/features/tienda-pedidos/api'

function money(value: number) {
  return `S/ ${Number(value || 0).toFixed(2)}`
}

function statusClass(status: PedidoTiendaResumen['estadoGestion']) {
  if (status === 'TERMINADO') return 'bg-emerald-100 text-emerald-800'
  if (status === 'CANCELADO') return 'bg-rose-100 text-rose-800'
  return 'bg-amber-100 text-amber-800'
}

export function CustomerOrdersTable({ refreshKey }: { refreshKey: number }) {
  const [orders, setOrders] = useState<PedidoTiendaResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelingId, setCancelingId] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    try { setOrders(await getMisPedidosTienda()) }
    catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudieron cargar tus pedidos.') }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [refreshKey])

  const cancel = async (order: PedidoTiendaResumen) => {
    if (!window.confirm(`¿Cancelar el pedido ${order.codigo}? Esta acción devolverá los productos al stock.`)) return
    setCancelingId(order.pedidoId)
    try {
      const updated = await cancelarPedidoTienda(order.pedidoId)
      setOrders((current) => current.map((item) => item.pedidoId === updated.pedidoId ? updated : item))
      toast.success(`El pedido ${order.codigo} fue cancelado.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cancelar el pedido.')
    } finally { setCancelingId(null) }
  }

  return <section className='mt-10 overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm'>
    <div className='flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6'>
      <div><p className='text-xs font-bold uppercase tracking-[.18em] text-violet-700'>Tu cuenta</p><h3 className='mt-1 text-xl font-black text-slate-950'>Mis pedidos</h3><p className='mt-1 text-sm text-slate-500'>Consulta el avance y cancela tus pedidos pendientes.</p></div>
      <Button type='button' variant='outline' onClick={() => void load()} disabled={loading}><RefreshCw className='mr-2 h-4 w-4' />Actualizar</Button>
    </div>
    {loading ? <div className='p-10 text-center text-slate-500'><Loader2 className='mx-auto mb-2 h-5 w-5 animate-spin' />Cargando pedidos...</div>
      : orders.length === 0 ? <p className='p-10 text-center text-sm text-slate-500'>Aún no tienes pedidos registrados.</p>
        : <div className='overflow-x-auto'><table className='w-full min-w-[850px] text-left text-sm'><thead className='bg-slate-50 text-xs uppercase text-slate-500'><tr><th className='p-4'>Pedido</th><th className='p-4'>Fecha</th><th className='p-4'>Productos</th><th className='p-4'>Estado</th><th className='p-4 text-right'>Total</th><th className='p-4'>Acción</th></tr></thead><tbody className='divide-y divide-slate-100'>
          {orders.map((order) => <tr key={order.pedidoId} className='align-top hover:bg-slate-50/70'>
            <td className='p-4 font-bold text-slate-900'>{order.codigo}<p className='mt-1 text-xs font-normal text-slate-500'>{order.estadoPago || 'Pago pendiente'} · {order.metodoPago || 'Online'}</p></td>
            <td className='p-4 whitespace-nowrap'>{new Date(order.fechaCreacion).toLocaleString('es-PE')}</td>
            <td className='max-w-sm p-4'><ul className='space-y-2'>{order.items.map((item) => <li key={item.id} className='flex items-center gap-3'>
              {item.imagenClientePath ? <a href={item.imagenClientePath} target='_blank' rel='noreferrer' title='Abrir diseño del cliente'><img src={item.imagenClientePath} alt='Diseño enviado' className='h-10 w-10 rounded-lg border object-cover' /></a> : null}
              <span>{item.cantidad} × {item.productoNombre}{item.talla ? ` · Talla ${item.talla}` : ''}{item.color ? ` · ${item.color}` : ''}</span>
            </li>)}</ul><p className='mt-2 text-xs text-slate-500'>Entrega: {order.direccionEntrega || 'No indicada'}</p></td>
            <td className='p-4'><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(order.estadoGestion)}`}>{order.estadoGestion}</span></td>
            <td className='p-4 text-right font-bold'>{money(order.total)}</td>
            <td className='p-4'>{order.estadoGestion === 'PENDIENTE' ? <Button type='button' variant='outline' size='sm' className='text-rose-700 hover:bg-rose-50' disabled={cancelingId === order.pedidoId} onClick={() => void cancel(order)}>{cancelingId === order.pedidoId ? <Loader2 className='mr-1 h-4 w-4 animate-spin' /> : <XCircle className='mr-1 h-4 w-4' />}Cancelar</Button> : <span className='text-xs text-slate-400'>—</span>}</td>
          </tr>)}
        </tbody></table></div>}
  </section>
}
