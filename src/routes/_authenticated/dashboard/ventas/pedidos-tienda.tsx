import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCw, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getPedidosTiendaGestion, type PedidoTiendaResumen } from '@/features/tienda-pedidos/api'

export const Route = createFileRoute('/_authenticated/dashboard/ventas/pedidos-tienda')({ component: PedidosTiendaPage })

type StatusFilter = 'TODOS' | PedidoTiendaResumen['estadoGestion']

function PedidosTiendaPage() {
  const [pedidos, setPedidos] = useState<PedidoTiendaResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('TODOS')

  const load = async () => {
    setLoading(true)
    try { setPedidos(await getPedidosTiendaGestion()) }
    catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los pedidos.') }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const counts = useMemo(() => ({
    TODOS: pedidos.length,
    PENDIENTE: pedidos.filter((p) => p.estadoGestion === 'PENDIENTE').length,
    TERMINADO: pedidos.filter((p) => p.estadoGestion === 'TERMINADO').length,
    CANCELADO: pedidos.filter((p) => p.estadoGestion === 'CANCELADO').length,
  }), [pedidos])

  const filtered = useMemo(() => pedidos.filter((p) => {
    const matchesStatus = status === 'TODOS' || p.estadoGestion === status
    const text = `${p.codigo} ${p.nombreCliente} ${p.emailCliente} ${p.numeroDocumento || ''} ${p.items.map((item) => item.productoNombre).join(' ')}`.toLowerCase()
    return matchesStatus && text.includes(query.trim().toLowerCase())
  }), [pedidos, query, status])

  return <main className='space-y-5 p-4 sm:p-6'>
    <header className='flex flex-wrap items-center justify-between gap-3'><div><p className='text-xs font-bold uppercase tracking-[.18em] text-violet-700'>E-commerce</p><h1 className='mt-1 text-2xl font-bold text-slate-900'>Pedidos de tienda</h1><p className='mt-1 text-sm text-slate-500'>Seguimiento de pedidos, pago, cliente, entrega y diseños enviados.</p></div><Button variant='outline' onClick={() => void load()} disabled={loading}><RefreshCw className='mr-2 h-4 w-4' />Actualizar</Button></header>
    <section className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>{(['TODOS', 'PENDIENTE', 'TERMINADO', 'CANCELADO'] as const).map((key) => <button key={key} type='button' onClick={() => setStatus(key)} className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-violet-300 ${status === key ? 'border-violet-500 ring-2 ring-violet-100' : 'border-slate-200'}`}><p className='text-xs font-bold uppercase tracking-wide text-slate-500'>{key === 'TODOS' ? 'Total pedidos' : key}</p><p className='mt-2 text-2xl font-black text-slate-950'>{counts[key]}</p></button>)}</section>
    <section className='overflow-hidden rounded-2xl border bg-white shadow-sm'>
      <div className='flex flex-wrap items-center justify-between gap-3 border-b p-4'><div className='font-semibold'>{filtered.length} pedidos mostrados</div><div className='relative w-full sm:max-w-sm'><Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' /><Input value={query} onChange={(e) => setQuery(e.target.value)} className='pl-9' placeholder='Buscar pedido, cliente o producto' /></div></div>
      {loading ? <div className='p-12 text-center text-slate-500'><Loader2 className='mx-auto mb-2 h-5 w-5 animate-spin' />Cargando pedidos...</div> : filtered.length === 0 ? <div className='p-12 text-center text-slate-500'>No se encontraron pedidos con estos filtros.</div> : <div className='overflow-x-auto'><table className='w-full min-w-[1150px] text-left text-sm'><thead className='bg-slate-50 text-xs uppercase text-slate-500'><tr><th className='p-3'>Pedido / fecha</th><th className='p-3'>Cliente</th><th className='p-3'>Detalle</th><th className='p-3'>Estado</th><th className='p-3'>Pago</th><th className='p-3'>Comprobante</th><th className='p-3'>Entrega</th><th className='p-3 text-right'>Importe</th></tr></thead><tbody className='divide-y'>{filtered.map((p) => <tr key={p.pedidoId} className='align-top hover:bg-slate-50'><td className='p-3 font-semibold'>{p.codigo}<div className='mt-1 text-xs font-normal text-slate-500'>{new Date(p.fechaCreacion).toLocaleString('es-PE')}</div></td><td className='p-3'>{p.nombreCliente}<div className='text-xs text-slate-500'>{p.emailCliente}</div><div className='text-xs text-slate-500'>{p.tipoDocumento} · {p.numeroDocumento}</div></td><td className='max-w-sm p-3'><ul className='space-y-2'>{p.items.map((item) => <li key={item.id} className='flex items-center gap-2'>{item.imagenClientePath && <a href={item.imagenClientePath} target='_blank' rel='noreferrer'><img src={item.imagenClientePath} alt='Diseño del pedido' className='h-9 w-9 rounded border object-cover' /></a>}<span>{item.cantidad} × {item.productoNombre}{item.talla ? ` · ${item.talla}` : ''}{item.color ? ` · ${item.color}` : ''}{item.servicioNombre ? ` + ${item.servicioNombre}` : ''}</span></li>)}</ul></td><td className='p-3'><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.estadoGestion === 'TERMINADO' ? 'bg-emerald-100 text-emerald-800' : p.estadoGestion === 'CANCELADO' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>{p.estadoGestion}</span></td><td className='p-3'>{p.estadoPago || '—'}<div className='text-xs text-slate-500'>{p.metodoPago || '—'}</div></td><td className='p-3'>{p.tipoComprobante || '—'}<div className='text-xs text-slate-500'>{p.nombreFacturacion || p.nombreCliente}</div></td><td className='max-w-xs p-3'>{p.direccionEntrega || '—'}<div className='text-xs text-slate-500'>{p.ubigeoEntrega || ''}</div></td><td className='p-3 text-right font-semibold'>S/ {Number(p.total || 0).toFixed(2)}<div className='text-xs font-normal text-slate-500'>Envío S/ {Number(p.costoEnvio || 0).toFixed(2)}</div></td></tr>)}</tbody></table></div>}
    </section>
  </main>
}
