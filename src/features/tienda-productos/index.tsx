import { useEffect, useMemo, useState } from 'react'
import { useConfirmStore } from '@/stores/useConfirmStore'
import {
  Edit,
  Eye,
  ImageIcon,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  Wrench,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import { getProductos } from '@/features/productos/api'
import type { Producto } from '@/features/productos/types'
import { getProductosBaseTodos } from '@/features/mockups/api'
import type { MockupProductoBase } from '@/features/mockups/types'

import {
  deleteTiendaProducto,
  getTiendaProductos,
  saveTiendaProducto,
} from './api'
import type { TiendaProducto, TiendaProductoForm } from './types'

const EMPTY_FORM: TiendaProductoForm = {
  productoServicioId: null,
  servicioEstampadoId: null,
  mockupProductoBaseId: null,
  slug: '',
  descripcionTienda: '',
  publicado: true,
  destacado: false,
  permitePersonalizacion: true,
  manejaTallas: false,
  orden: 0,
}

function formatMoney(value?: number | null) {
  return `S/ ${Number(value ?? 0).toFixed(2)}`
}

function buildSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function coloresLabel(mockup?: MockupProductoBase | null) {
  if (!mockup?.coloresDisponibles?.length) return 'Sin colores'
  return mockup.coloresDisponibles.slice(0, 3).join(', ')
}

export default function TiendaProductosPage() {
  const { dbUser } = useAuth()
  const currentUserId = dbUser?.id
  const openConfirm = useConfirmStore((state) => state.openConfirm)

  const [items, setItems] = useState<TiendaProducto[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [mockups, setMockups] = useState<MockupProductoBase[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState<TiendaProductoForm>(EMPTY_FORM)

  const bienes = useMemo(
    () => productos.filter((producto) => producto.tipo === 'B'),
    [productos]
  )

  const servicios = useMemo(
    () => productos.filter((producto) => producto.tipo === 'S'),
    [productos]
  )

  const selectedProducto = bienes.find((producto) => producto.id === formData.productoServicioId)
  const selectedServicio = servicios.find((producto) => producto.id === formData.servicioEstampadoId)
  const selectedMockup = mockups.find((mockup) => mockup.id === formData.mockupProductoBaseId)

  const filteredItems = items.filter((item) => {
    const term = search.trim().toLowerCase()
    if (!term) return true
    return (
      item.productoServicio.nombre.toLowerCase().includes(term) ||
      item.slug.toLowerCase().includes(term) ||
      item.mockupProductoBase.nombre.toLowerCase().includes(term)
    )
  })

  const cargarDatos = async () => {
    if (!currentUserId) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const [tiendaItems, productosData, mockupsData] = await Promise.all([
        getTiendaProductos(),
        getProductos(currentUserId),
        getProductosBaseTodos(),
      ])
      setItems(tiendaItems)
      setProductos(productosData)
      setMockups(mockupsData)
    } catch {
      toast.error('No se pudo cargar el catálogo de tienda.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId])

  const openCreate = () => {
    setFormData(EMPTY_FORM)
    setIsOpen(true)
  }

  const openEdit = (item: TiendaProducto) => {
    setFormData({
      id: item.id,
      productoServicioId: item.productoServicio.id,
      servicioEstampadoId: item.servicioEstampado?.id ?? null,
      mockupProductoBaseId: item.mockupProductoBase.id,
      slug: item.slug,
      descripcionTienda: item.descripcionTienda ?? '',
      publicado: item.publicado,
      destacado: item.destacado,
      permitePersonalizacion: item.permitePersonalizacion,
      manejaTallas: item.manejaTallas,
      orden: item.orden ?? 0,
    })
    setIsOpen(true)
  }

  const set = <K extends keyof TiendaProductoForm>(key: K, value: TiendaProductoForm[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleProductoChange = (value: string) => {
    const productoId = Number(value)
    const producto = bienes.find((item) => item.id === productoId)
    setFormData((prev) => ({
      ...prev,
      productoServicioId: productoId,
      slug: prev.slug || buildSlug(producto?.nombre ?? ''),
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!formData.productoServicioId || !formData.mockupProductoBaseId) {
      toast.error('Selecciona producto y mockup base antes de guardar.')
      return
    }

    setSaving(true)
    try {
      await saveTiendaProducto(formData)
      toast.success(formData.id ? 'Producto de tienda actualizado.' : 'Producto de tienda publicado.')
      setIsOpen(false)
      await cargarDatos()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar el producto de tienda.'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (id: number) => {
    openConfirm({
      title: '¿Eliminar este producto de tienda?',
      description: 'Se quitará del catálogo online. No elimina el producto base ni el producto contable.',
      onConfirm: async () => {
        try {
          await deleteTiendaProducto(id)
          toast.success('Producto retirado del catálogo de tienda.')
          await cargarDatos()
        } catch {
          toast.error('No se pudo eliminar. Puede estar relacionado a un carrito o pedido.')
        }
      },
    })
  }

  return (
    <div className='animate-in fade-in-0 space-y-6 p-4 sm:p-6'>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <div>
          <h1 className='text-royal-blue text-2xl font-bold tracking-tight sm:text-3xl'>
            Productos de tienda
          </h1>
          <p className='mt-1 max-w-2xl text-sm text-slate-500'>
            Publica productos del catálogo interno y vincúlalos con una imagen base de mockup para la tienda online.
          </p>
        </div>
        <Button
          className='bg-vibrant-orange hover:bg-vibrant-orange/90 text-white'
          onClick={openCreate}
        >
          <Plus className='mr-2 h-4 w-4' />
          Nuevo producto de tienda
        </Button>
      </div>

      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div className='relative w-full md:max-w-md'>
          <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400' />
          <Input
            className='pl-9'
            placeholder='Buscar por producto, mockup o slug...'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className='flex flex-wrap gap-2 text-xs text-slate-500'>
          <Badge variant='outline'>{items.length} publicados/configurados</Badge>
          <Badge variant='outline'>{bienes.length} bienes disponibles</Badge>
          <Badge variant='outline'>{mockups.length} mockups base</Badge>
        </div>
      </div>

      <div className='overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader className='bg-slate-50'>
              <TableRow>
                <TableHead className='w-[96px] font-semibold text-slate-700'>Imagen</TableHead>
                <TableHead className='min-w-[220px] font-semibold text-slate-700'>Producto</TableHead>
                <TableHead className='min-w-[170px] font-semibold text-slate-700'>Mockup base</TableHead>
                <TableHead className='font-semibold text-slate-700'>Precio</TableHead>
                <TableHead className='font-semibold text-slate-700'>Estado</TableHead>
                <TableHead className='text-right font-semibold text-slate-700'>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className='h-28 text-center text-slate-400'>
                    Cargando catálogo de tienda...
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='h-28 text-center text-slate-400'>
                    {search ? 'No se encontraron coincidencias.' : 'Aún no hay productos publicados para tienda.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id} className='hover:bg-slate-50'>
                    <TableCell>
                      <div className='flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border bg-slate-50'>
                        {item.mockupProductoBase.imagenBasePath ? (
                          <img
                            src={item.mockupProductoBase.imagenBasePath}
                            alt={item.mockupProductoBase.nombre}
                            className='h-full w-full object-contain p-1'
                          />
                        ) : (
                          <ImageIcon className='h-6 w-6 text-slate-300' />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='space-y-1'>
                        <div className='font-semibold text-slate-900'>{item.productoServicio.nombre}</div>
                        <div className='font-mono text-xs text-slate-400'>{item.slug}</div>
                        {item.servicioEstampado && (
                          <div className='flex items-center gap-1 text-xs text-violet-600'>
                            <Wrench className='h-3 w-3' />
                            {item.servicioEstampado.nombre}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='space-y-1 text-sm'>
                        <div className='font-medium text-slate-700'>{item.mockupProductoBase.nombre}</div>
                        <div className='text-xs text-slate-400'>{item.mockupProductoBase.tipoProducto} · {coloresLabel(item.mockupProductoBase)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='space-y-1 text-sm'>
                        <div className='font-semibold text-slate-900'>{formatMoney(item.productoServicio.precioVenta)}</div>
                        {item.servicioEstampado && (
                          <div className='text-xs text-slate-500'>+ {formatMoney(item.servicioEstampado.precioVenta)}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-wrap gap-1'>
                        <Badge className={item.publicado ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
                          {item.publicado ? 'Publicado' : 'Oculto'}
                        </Badge>
                        {item.destacado && <Badge className='bg-amber-50 text-amber-700'>Destacado</Badge>}
                        {item.permitePersonalizacion && <Badge className='bg-blue-50 text-blue-700'>Personalizable</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex justify-end gap-1'>
                        <Button variant='outline' size='icon' title='Editar' onClick={() => openEdit(item)}>
                          <Edit className='h-4 w-4' />
                        </Button>
                        <Button variant='destructive' size='icon' title='Eliminar' onClick={() => handleDelete(item.id)}>
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className='max-h-[92vh] overflow-y-auto sm:max-w-[980px]'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-xl font-bold'>
              <ShoppingBag className='h-5 w-5 text-vibrant-orange' />
              {formData.id ? 'Editar producto de tienda' : 'Nuevo producto de tienda'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className='mt-4 grid gap-6 lg:grid-cols-[1fr_360px]'>
            <div className='space-y-5'>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div className='space-y-1.5'>
                  <Label>Producto del catálogo *</Label>
                  <Select
                    value={formData.productoServicioId?.toString() ?? ''}
                    onValueChange={handleProductoChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Selecciona un bien' />
                    </SelectTrigger>
                    <SelectContent>
                      {bienes.map((producto) => (
                        <SelectItem key={producto.id} value={String(producto.id)}>
                          {producto.nombre} · {formatMoney(producto.precioVenta)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-1.5'>
                  <Label>Servicio de estampado</Label>
                  <Select
                    value={formData.servicioEstampadoId?.toString() ?? '__none__'}
                    onValueChange={(value) => set('servicioEstampadoId', value === '__none__' ? null : Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Sin servicio adicional' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='__none__'>Sin servicio adicional</SelectItem>
                      {servicios.map((servicio) => (
                        <SelectItem key={servicio.id} value={String(servicio.id)}>
                          {servicio.nombre} · {formatMoney(servicio.precioVenta)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-[1fr_140px]'>
                <div className='space-y-1.5'>
                  <Label htmlFor='slug'>Slug *</Label>
                  <Input
                    id='slug'
                    required
                    placeholder='polo-personalizado-blanco'
                    value={formData.slug}
                    onChange={(event) => set('slug', buildSlug(event.target.value))}
                  />
                </div>
                <div className='space-y-1.5'>
                  <Label htmlFor='orden'>Orden</Label>
                  <Input
                    id='orden'
                    type='number'
                    min={0}
                    value={formData.orden}
                    onChange={(event) => set('orden', Number(event.target.value))}
                  />
                </div>
              </div>

              <div className='space-y-1.5'>
                <Label>Producto base de mockup *</Label>
                <Select
                  value={formData.mockupProductoBaseId?.toString() ?? ''}
                  onValueChange={(value) => set('mockupProductoBaseId', Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Selecciona la imagen base visible en tienda' />
                  </SelectTrigger>
                  <SelectContent>
                    {mockups.map((mockup) => (
                      <SelectItem key={mockup.id} value={String(mockup.id)}>
                        {mockup.nombre} · {mockup.tipoProducto} · {coloresLabel(mockup)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor='descripcionTienda'>Descripción para tienda</Label>
                <Textarea
                  id='descripcionTienda'
                  rows={4}
                  placeholder='Describe el producto como lo verá el cliente en la tienda online.'
                  value={formData.descripcionTienda}
                  onChange={(event) => set('descripcionTienda', event.target.value)}
                />
              </div>

              <div className='grid gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-2'>
                <label className='flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm'>
                  <span>Publicado</span>
                  <Switch checked={formData.publicado} onCheckedChange={(checked) => set('publicado', checked)} />
                </label>
                <label className='flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm'>
                  <span>Destacado</span>
                  <Switch checked={formData.destacado} onCheckedChange={(checked) => set('destacado', checked)} />
                </label>
                <label className='flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm'>
                  <span>Personalizable</span>
                  <Switch checked={formData.permitePersonalizacion} onCheckedChange={(checked) => set('permitePersonalizacion', checked)} />
                </label>
                <label className='flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm'>
                  <span>Maneja tallas (S, M, L, XL)</span>
                  <Switch checked={formData.manejaTallas} onCheckedChange={(checked) => set('manejaTallas', checked)} />
                </label>
              </div>

              <Button type='submit' disabled={saving} className='bg-royal-blue hover:bg-royal-blue/90 w-full text-white'>
                {saving ? 'Guardando...' : formData.id ? 'Guardar cambios' : 'Publicar producto'}
              </Button>
            </div>

            <aside className='space-y-4'>
              <div className='rounded-xl border border-slate-200 bg-slate-50 p-4'>
                <div className='mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700'>
                  <Eye className='h-4 w-4' />
                  Previsualización
                </div>
                <div className='flex aspect-square items-center justify-center overflow-hidden rounded-lg border bg-white'>
                  {selectedMockup?.imagenBasePath ? (
                    <img
                      src={selectedMockup.imagenBasePath}
                      alt={selectedMockup.nombre}
                      className='h-full w-full object-contain p-4'
                    />
                  ) : (
                    <div className='flex flex-col items-center gap-2 text-center text-sm text-slate-400'>
                      <ImageIcon className='h-9 w-9' />
                      Selecciona un producto base
                    </div>
                  )}
                </div>
                <div className='mt-4 space-y-2 text-sm'>
                  <div className='font-semibold text-slate-900'>
                    {selectedProducto?.nombre ?? 'Producto sin seleccionar'}
                  </div>
                  <div className='text-slate-500'>
                    {selectedMockup ? `${selectedMockup.nombre} · ${selectedMockup.tipoProducto}` : 'Mockup pendiente'}
                  </div>
                  <div className='flex flex-wrap gap-1'>
                    {selectedMockup?.coloresDisponibles?.map((color) => (
                      <Badge key={color} variant='outline'>{color}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className='rounded-xl border border-slate-200 bg-white p-4 text-sm'>
                <div className='mb-2 flex items-center gap-2 font-semibold text-slate-700'>
                  <Sparkles className='h-4 w-4 text-amber-500' />
                  Precio referencial
                </div>
                <div className='space-y-1 text-slate-600'>
                  <div className='flex justify-between'>
                    <span>Producto</span>
                    <span>{formatMoney(selectedProducto?.precioVenta)}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Estampado</span>
                    <span>{selectedServicio ? formatMoney(selectedServicio.precioVenta) : 'S/ 0.00'}</span>
                  </div>
                  <div className='mt-2 flex justify-between border-t pt-2 font-semibold text-slate-900'>
                    <span>Total base</span>
                    <span>{formatMoney(Number(selectedProducto?.precioVenta ?? 0) + Number(selectedServicio?.precioVenta ?? 0))}</span>
                  </div>
                </div>
              </div>
            </aside>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
