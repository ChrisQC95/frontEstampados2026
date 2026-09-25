import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import {
  Ban,
  CheckCircle2,
  Download,
  ImageIcon,
  Images,
  Loader2,
  Move,
  Palette,
  Plus,
  RotateCcw,
  Save,
  Shirt,
  Sparkles,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/context/AuthContext'

import {
  cambiarEstadoProductoBase,
  crearMockupProyecto,
  crearProductoBase,
  getMockupProyectos,
  getProductosBase,
  getProductosBaseTodos,
  guardarResultadoMockup,
} from './api'
import type { MockupProductoBase, MockupProyecto, ProductoBaseForm } from './types'


const HANDLE_SIZE = 18
const MIN_DESIGN_SIZE = 32

type Placement = {
  x: number
  y: number
  width: number
  height: number
  aspectRatio: number
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se'

type DragState =
  | { mode: 'move'; startX: number; startY: number; startPlacement: Placement }
  | { mode: 'resize'; handle: ResizeHandle; startX: number; startY: number; startPlacement: Placement }

const EMPTY_BASE_FORM: ProductoBaseForm = {
  nombre: '',
  tipoProducto: 'PRENDAS',
  coloresDisponibles: ['Blanco', 'Negro', 'Azul'],
  areaX: 250,
  areaY: 190,
  areaWidth: 300,
  areaHeight: 340,
  activo: true,
  imagenBase: null,
}


const PRODUCT_TYPE_OPTIONS = [
  { value: 'PRENDAS', label: 'Prendas' },
  { value: 'ACCESORIOS', label: 'Accesorios' },
  { value: 'MERCHANDISING', label: 'Merchandising' },
  { value: 'VARIOS', label: 'Varios' },
]

const BASE_COLOR_OPTIONS = [
  { value: 'Blanco', hex: '#f8fafc' },
  { value: 'Negro', hex: '#111827' },
  { value: 'Azul', hex: '#2563eb' },
  { value: 'Rojo', hex: '#dc2626' },
  { value: 'Verde', hex: '#16a34a' },
  { value: 'Amarillo', hex: '#facc15' },
  { value: 'Naranja', hex: '#f97316' },
  { value: 'Gris', hex: '#64748b' },
  { value: 'Rosado', hex: '#ec4899' },
  { value: 'Morado', hex: '#7c3aed' },
]
const colorMap: Record<string, string> = {
  blanco: '#f8fafc',
  negro: '#111827',
  azul: '#2563eb',
  rojo: '#dc2626',
  verde: '#16a34a',
  amarillo: '#facc15',
  naranja: '#f97316',
  gris: '#64748b',
  rosado: '#ec4899',
  morado: '#7c3aed',
}

function colorToHex(color: string) {
  const normalized = color.trim()
  if (normalized.startsWith('#')) return normalized
  const key = normalized.toLowerCase()
  return colorMap[key] ?? '#cbd5e1'
}

function fileToObjectUrl(file: File | null) {
  return file ? URL.createObjectURL(file) : null
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('No se pudo cargar la imagen.'))
    image.src = src
  })
}
function getCanvasPoint(canvas: HTMLCanvasElement, event: PointerEvent<HTMLCanvasElement>) {
  const rect = canvas.getBoundingClientRect()
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  }
}

function pointInside(point: { x: number; y: number }, placement: Placement) {
  return (
    point.x >= placement.x &&
    point.x <= placement.x + placement.width &&
    point.y >= placement.y &&
    point.y <= placement.y + placement.height
  )
}

function getHandleAtPoint(point: { x: number; y: number }, placement: Placement): ResizeHandle | null {
  const handles: Array<{ handle: ResizeHandle; x: number; y: number }> = [
    { handle: 'nw', x: placement.x, y: placement.y },
    { handle: 'ne', x: placement.x + placement.width, y: placement.y },
    { handle: 'sw', x: placement.x, y: placement.y + placement.height },
    { handle: 'se', x: placement.x + placement.width, y: placement.y + placement.height },
  ]
  const radius = HANDLE_SIZE * 1.25
  return handles.find((item) => Math.abs(point.x - item.x) <= radius && Math.abs(point.y - item.y) <= radius)?.handle ?? null
}

function clampPlacement(placement: Placement, canvas: HTMLCanvasElement): Placement {
  const width = Math.min(Math.max(placement.width, MIN_DESIGN_SIZE), canvas.width)
  const height = Math.min(Math.max(placement.height, MIN_DESIGN_SIZE), canvas.height)
  return {
    ...placement,
    width,
    height,
    x: Math.min(Math.max(placement.x, 0), canvas.width - width),
    y: Math.min(Math.max(placement.y, 0), canvas.height - height),
  }
}

function getDefaultPlacement(producto: MockupProductoBase, image: HTMLImageElement): Placement {
  const areaX = Number(producto.areaX)
  const areaY = Number(producto.areaY)
  const areaWidth = Number(producto.areaWidth)
  const areaHeight = Number(producto.areaHeight)
  const aspectRatio = image.width / image.height || 1
  const scale = Math.min(areaWidth / image.width, areaHeight / image.height, 1)
  const width = Math.max(image.width * scale, MIN_DESIGN_SIZE)
  const height = width / aspectRatio

  return {
    x: areaX + (areaWidth - width) / 2,
    y: areaY + (areaHeight - height) / 2,
    width,
    height,
    aspectRatio,
  }
}


function getProductTypeLabel(value: string) {
  return PRODUCT_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value
}

function getProductColors(producto: MockupProductoBase | null) {
  if (!producto) return []
  if (producto.coloresDisponibles?.length) return producto.coloresDisponibles
  return producto.color && producto.color !== 'VARIABLE' ? [producto.color] : []
}

function drawTintedBaseImage(context: CanvasRenderingContext2D, image: HTMLImageElement, color: string | null) {
  const width = context.canvas.width
  const height = context.canvas.height
  if (!color) {
    context.drawImage(image, 0, 0, width, height)
    return
  }

  const buffer = document.createElement('canvas')
  buffer.width = width
  buffer.height = height
  const bufferContext = buffer.getContext('2d')
  if (!bufferContext) {
    context.drawImage(image, 0, 0, width, height)
    return
  }

  bufferContext.drawImage(image, 0, 0, width, height)
  bufferContext.globalCompositeOperation = 'source-atop'
  bufferContext.fillStyle = colorToHex(color)
  bufferContext.fillRect(0, 0, width, height)
  bufferContext.globalCompositeOperation = 'multiply'
  bufferContext.drawImage(image, 0, 0, width, height)
  bufferContext.globalCompositeOperation = 'destination-in'
  bufferContext.drawImage(image, 0, 0, width, height)

  context.drawImage(buffer, 0, 0)
}
function resizePlacement(start: Placement, deltaX: number, handle: ResizeHandle): Placement {
  const directionX = handle.endsWith('e') ? 1 : -1
  const width = Math.max(MIN_DESIGN_SIZE, start.width + deltaX * directionX)
  const height = width / start.aspectRatio
  const x = handle.endsWith('e') ? start.x : start.x + start.width - width
  const y = handle.startsWith('s') ? start.y : start.y + start.height - height
  return { ...start, x, y, width, height }
}

export default function MockupsPage() {
  const { dbUser } = useAuth()
  const canUseModule = ['ADMIN', 'MARKETING'].includes(dbUser?.rol?.codigo ?? '')

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const dragStateRef = useRef<DragState | null>(null)
  const [canvasCursor, setCanvasCursor] = useState('default')
  const [designPlacement, setDesignPlacement] = useState<Placement | null>(null)
  const [productosBase, setProductosBase] = useState<MockupProductoBase[]>([])
  const [productosBaseTodos, setProductosBaseTodos] = useState<MockupProductoBase[]>([])
  const [proyectos, setProyectos] = useState<MockupProyecto[]>([])
  const [loading, setLoading] = useState(true)

  const [tipoSeleccionado, setTipoSeleccionado] = useState('')
  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState<number | null>(null)
  const [colorSeleccionado, setColorSeleccionado] = useState('')
  const [nombreProyecto, setNombreProyecto] = useState('Mockup para cliente')
  const [designFile, setDesignFile] = useState<File | null>(null)
  const [designUrl, setDesignUrl] = useState<string | null>(null)
  const [rendering, setRendering] = useState(false)
  const [saving, setSaving] = useState(false)

  const [baseDialogOpen, setBaseDialogOpen] = useState(false)
  const [baseSaving, setBaseSaving] = useState(false)
  const [baseForm, setBaseForm] = useState<ProductoBaseForm>(EMPTY_BASE_FORM)

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    try {
      const [basesActivas, basesTodas, proyectosData] = await Promise.all([
        getProductosBase(),
        getProductosBaseTodos(),
        getMockupProyectos(),
      ])
      setProductosBase(basesActivas)
      setProductosBaseTodos(basesTodas)
      setProyectos(proyectosData)

      const first = basesActivas[0]
      if (first) {
        setTipoSeleccionado((prev) => prev || first.tipoProducto)
        setProductoSeleccionadoId((prev) => prev ?? first.id)
      }
    } catch {
      toast.error('No se pudo cargar el estudio de mockups.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (canUseModule) cargarDatos()
  }, [canUseModule, cargarDatos])

  useEffect(() => {
    const objectUrl = fileToObjectUrl(designFile)
    setDesignUrl(objectUrl)
    setDesignPlacement(null)
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [designFile])

  const tiposProducto = useMemo(() => {
    return Array.from(new Set(productosBase.map((producto) => producto.tipoProducto)))
  }, [productosBase])

  const productosPorTipo = useMemo(() => {
    return productosBase.filter((producto) => producto.tipoProducto === tipoSeleccionado)
  }, [productosBase, tipoSeleccionado])

  const productoSeleccionado = useMemo(() => {
    return productosBase.find((producto) => producto.id === productoSeleccionadoId) ?? productosPorTipo[0] ?? null
  }, [productosBase, productosPorTipo, productoSeleccionadoId])


  useEffect(() => {
    setDesignPlacement(null)
    const colors = getProductColors(productoSeleccionado)
    setColorSeleccionado((prev) => colors.includes(prev) ? prev : colors[0] ?? '')
  }, [productoSeleccionado])
  useEffect(() => {
    if (!productoSeleccionado && productosPorTipo[0]) {
      setProductoSeleccionadoId(productosPorTipo[0].id)
    }
  }, [productoSeleccionado, productosPorTipo])

  const resetDesignPlacement = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas || !productoSeleccionado || !designUrl) return

    try {
      const designImage = await loadImage(designUrl)
      setDesignPlacement(getDefaultPlacement(productoSeleccionado, designImage))
    } catch {
      toast.error('No se pudo ajustar el diseño cargado.')
    }
  }, [designUrl, productoSeleccionado])

  const renderCanvas = useCallback(async (showEditorControls = true) => {
    const canvas = canvasRef.current
    if (!canvas || !productoSeleccionado) return

    setRendering(true)
    try {
      const baseImage = await loadImage(productoSeleccionado.imagenBasePath)
      canvas.width = baseImage.naturalWidth || baseImage.width
      canvas.height = baseImage.naturalHeight || baseImage.height

      const context = canvas.getContext('2d')
      if (!context) return

      context.clearRect(0, 0, canvas.width, canvas.height)
      drawTintedBaseImage(context, baseImage, colorSeleccionado)



      if (!designUrl) return

      const designImage = await loadImage(designUrl)
      const placement = designPlacement ?? getDefaultPlacement(productoSeleccionado, designImage)
      const safePlacement = clampPlacement(placement, canvas)

      context.save()
      context.globalAlpha = 0.96
      context.drawImage(designImage, safePlacement.x, safePlacement.y, safePlacement.width, safePlacement.height)
      context.restore()

      if (showEditorControls) {
        context.save()
        context.strokeStyle = '#2563eb'
        context.fillStyle = '#ffffff'
        context.lineWidth = Math.max(2, canvas.width * 0.0025)

        const handles = [
          [safePlacement.x, safePlacement.y],
          [safePlacement.x + safePlacement.width, safePlacement.y],
          [safePlacement.x, safePlacement.y + safePlacement.height],
          [safePlacement.x + safePlacement.width, safePlacement.y + safePlacement.height],
        ]
        handles.forEach(([x, y]) => {
          context.fillRect(x - HANDLE_SIZE / 2, y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE)
          context.strokeRect(x - HANDLE_SIZE / 2, y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE)
        })
        context.restore()
      }
    } catch {
      toast.error('No se pudo renderizar el mockup. Revisa las imágenes cargadas.')
    } finally {
      setRendering(false)
    }
  }, [colorSeleccionado, designPlacement, designUrl, productoSeleccionado])

  useEffect(() => {
    renderCanvas()
  }, [renderCanvas])

  useEffect(() => {
    if (designUrl && productoSeleccionado) {
      resetDesignPlacement()
    }
  }, [designUrl, productoSeleccionado, resetDesignPlacement])

  const handleCanvasPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !designPlacement) return

    const point = getCanvasPoint(canvas, event)
    const handle = getHandleAtPoint(point, designPlacement)
    if (handle) {
      dragStateRef.current = { mode: 'resize', handle, startX: point.x, startY: point.y, startPlacement: designPlacement }
      event.currentTarget.setPointerCapture(event.pointerId)
      setCanvasCursor(handle === 'nw' || handle === 'se' ? 'nwse-resize' : 'nesw-resize')
      return
    }

    if (pointInside(point, designPlacement)) {
      dragStateRef.current = { mode: 'move', startX: point.x, startY: point.y, startPlacement: designPlacement }
      event.currentTarget.setPointerCapture(event.pointerId)
      setCanvasCursor('grabbing')
    }
  }

  const handleCanvasPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !designPlacement) return

    const point = getCanvasPoint(canvas, event)
    const dragState = dragStateRef.current
    if (!dragState) {
      const handle = getHandleAtPoint(point, designPlacement)
      if (handle) {
        setCanvasCursor(handle === 'nw' || handle === 'se' ? 'nwse-resize' : 'nesw-resize')
      } else {
        setCanvasCursor(pointInside(point, designPlacement) ? 'grab' : 'default')
      }
      return
    }

    const deltaX = point.x - dragState.startX
    const deltaY = point.y - dragState.startY
    const nextPlacement = dragState.mode === 'move'
      ? { ...dragState.startPlacement, x: dragState.startPlacement.x + deltaX, y: dragState.startPlacement.y + deltaY }
      : resizePlacement(dragState.startPlacement, deltaX, dragState.handle)

    setDesignPlacement(clampPlacement(nextPlacement, canvas))
  }

  const handleCanvasPointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    dragStateRef.current = null
    setCanvasCursor('grab')
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }
  const handleDownload = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      await renderCanvas(false)
      const link = document.createElement('a')
      link.download = `${nombreProyecto || 'mockup'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      await renderCanvas(true)
    }
  }

  const canvasToBlob = async () => {
    const canvas = canvasRef.current
    if (!canvas) throw new Error('No hay mockup generado.')

    await renderCanvas(false)
    try {
      return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) reject(new Error('No se pudo exportar el canvas.'))
          else resolve(blob)
        }, 'image/png', 0.95)
      })
    } finally {
      await renderCanvas(true)
    }
  }

  const handleGuardarMockup = async () => {
    if (!productoSeleccionado) {
      toast.error('Selecciona un producto base.')
      return
    }
    if (!designFile) {
      toast.error('Sube el diseño del cliente.')
      return
    }

    setSaving(true)
    try {
      const proyecto = await crearMockupProyecto({
        nombre: nombreProyecto.trim() || 'Mockup para cliente',
        productoBaseId: productoSeleccionado.id,
        colorSeleccionado,
        imagenCliente: designFile,
      })
      const resultBlob = await canvasToBlob()
      await guardarResultadoMockup(proyecto.id, resultBlob)
      toast.success('Mockup guardado correctamente.')
      await cargarDatos()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el mockup.')
    } finally {
      setSaving(false)
    }
  }

  const handleCrearProductoBase = async (event: React.FormEvent) => {
    event.preventDefault()
    setBaseSaving(true)
    try {
      if (baseForm.coloresDisponibles.length === 0) {
        toast.error('Selecciona al menos un color disponible.')
        return
      }
      await crearProductoBase(baseForm)
      toast.success('Producto base creado correctamente.')
      setBaseDialogOpen(false)
      setBaseForm(EMPTY_BASE_FORM)
      await cargarDatos()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo crear el producto base.')
    } finally {
      setBaseSaving(false)
    }
  }

  const handleEstadoBase = async (producto: MockupProductoBase) => {
    try {
      await cambiarEstadoProductoBase(producto.id, !producto.activo)
      toast.success(producto.activo ? 'Producto base inactivado.' : 'Producto base activado.')
      await cargarDatos()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cambiar el estado.')
    }
  }

  if (!canUseModule && !loading) {
    return (
      <div className='flex min-h-[55vh] items-center justify-center p-6'>
        <div className='max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm'>
          <Palette className='mx-auto h-10 w-10 text-slate-400' />
          <h1 className='mt-4 text-xl font-semibold text-slate-900'>Acceso restringido</h1>
          <p className='mt-2 text-sm text-slate-500'>Solo ADMIN o MARKETING puede usar el estudio de mockups.</p>
        </div>
      </div>
    )
  }

  return (
    <div className='animate-in fade-in-0 space-y-6 p-4 sm:p-6'>
      <div className='flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between'>
        <div>
          <h1 className='text-royal-blue flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl'>
            <Sparkles className='h-7 w-7 sm:h-8 sm:w-8' />
            Mockups
          </h1>
          <p className='mt-1 text-sm text-slate-500'>
            Crea prototipos visuales con producto base, color y diseño del cliente.
          </p>
        </div>
        <Button className='bg-vibrant-orange hover:bg-vibrant-orange/90 text-white' onClick={() => setBaseDialogOpen(true)}>
          <Plus className='mr-2 h-4 w-4' />
          Producto base
        </Button>
      </div>

      <div className='grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]'>
        <aside className='space-y-4'>
          <section className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm'>
            <div className='mb-4 flex items-center gap-2'>
              <Shirt className='h-5 w-5 text-royal-blue' />
              <h2 className='font-semibold text-slate-900'>Producto</h2>
            </div>

            {loading ? (
              <div className='flex items-center gap-2 text-sm text-slate-400'>
                <Loader2 className='h-4 w-4 animate-spin' />
                Cargando productos base...
              </div>
            ) : productosBase.length === 0 ? (
              <div className='rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500'>
                Crea tu primer producto base para empezar a modelar imágenes.
              </div>
            ) : (
              <div className='space-y-4'>
                <div className='space-y-1.5'>
                  <Label>Tipo</Label>
                  <Select
                    value={tipoSeleccionado}
                    onValueChange={(value) => {
                      setTipoSeleccionado(value)
                      const first = productosBase.find((producto) => producto.tipoProducto === value)
                      setProductoSeleccionadoId(first?.id ?? null)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Selecciona tipo' />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposProducto.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>{getProductTypeLabel(tipo)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label>Producto base</Label>
                  <div className='grid gap-2'>
                    {productosPorTipo.map((producto) => {
                      const selected = producto.id === productoSeleccionado?.id
                      return (
                        <button
                          key={producto.id}
                          type='button'
                          className={`rounded-lg border p-3 text-left text-sm transition ${selected ? 'border-royal-blue bg-blue-50 text-royal-blue' : 'border-slate-200 hover:bg-slate-50'}`}
                          onClick={() => setProductoSeleccionadoId(producto.id)}
                        >
                          <span className='block truncate font-medium'>{producto.nombre}</span>
                          <span className='mt-1 flex flex-wrap gap-1'>
                            {getProductColors(producto).slice(0, 5).map((color) => (
                              <span key={color} className='h-4 w-4 rounded-full border border-slate-300' style={{ backgroundColor: colorToHex(color) }} />
                            ))}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label>Color del producto</Label>
                  <div className='grid grid-cols-2 gap-2'>
                    {getProductColors(productoSeleccionado).map((color) => {
                      const selected = color === colorSeleccionado
                      return (
                        <button
                          key={color}
                          type='button'
                          className={`flex items-center gap-2 rounded-lg border p-2 text-left text-sm transition ${selected ? 'border-royal-blue bg-blue-50 text-royal-blue' : 'border-slate-200 hover:bg-slate-50'}`}
                          onClick={() => setColorSeleccionado(color)}
                        >
                          <span className='h-5 w-5 shrink-0 rounded-full border border-slate-300' style={{ backgroundColor: colorToHex(color) }} />
                          <span className='min-w-0 truncate'>{color}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm'>
            <div className='mb-4 flex items-center gap-2'>
              <Upload className='h-5 w-5 text-royal-blue' />
              <h2 className='font-semibold text-slate-900'>Diseño</h2>
            </div>
            <div className='space-y-4'>
              <div className='space-y-1.5'>
                <Label htmlFor='nombreProyecto'>Nombre</Label>
                <Input
                  id='nombreProyecto'
                  value={nombreProyecto}
                  onChange={(event) => setNombreProyecto(event.target.value)}
                  placeholder='Ej: Logo Empresa ABC'
                />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='designFile'>Imagen del cliente</Label>
                <Input
                  id='designFile'
                  type='file'
                  accept='image/*'
                  onChange={(event) => setDesignFile(event.target.files?.[0] ?? null)}
                />
              </div>
              {designUrl && (
                <div className='space-y-3'>
                  <div className='rounded-lg border border-slate-200 bg-slate-50 p-3'>
                    <img src={designUrl} alt='Diseño cargado' className='mx-auto max-h-32 object-contain' />
                  </div>
                  <div className='flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700'>
                    <Move className='mt-0.5 h-4 w-4 shrink-0' />
                    <span>Arrastra el diseño sobre el producto. Usa las esquinas del recuadro para agrandarlo o reducirlo.</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm'>
            <h2 className='mb-3 font-semibold text-slate-900'>Acciones</h2>
            <div className='grid gap-2'>
              <Button onClick={handleGuardarMockup} disabled={saving || !productoSeleccionado || !designFile}>
                {saving ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Save className='mr-2 h-4 w-4' />}
                Guardar mockup
              </Button>
              <Button variant='outline' onClick={resetDesignPlacement} disabled={!productoSeleccionado || !designFile}>
                <RotateCcw className='mr-2 h-4 w-4' />
                Centrar diseño
              </Button>
              <Button variant='outline' onClick={handleDownload} disabled={!productoSeleccionado}>
                <Download className='mr-2 h-4 w-4' />
                Descargar PNG
              </Button>
            </div>
          </section>
        </aside>

        <main className='space-y-4'>
          <section className='overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'>
            <div className='flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <p className='font-semibold text-slate-900'>{productoSeleccionado?.nombre ?? 'Sin producto base'}</p>
                <p className='text-xs text-slate-500'>
                  {productoSeleccionado ? `${getProductTypeLabel(productoSeleccionado.tipoProducto)} · ${colorSeleccionado || 'Sin color'}` : 'Selecciona una plantilla para previsualizar'}
                </p>
              </div>
              {rendering && <Badge variant='outline' className='gap-1'><Loader2 className='h-3 w-3 animate-spin' /> Renderizando</Badge>}
            </div>

            <div className='bg-[radial-gradient(circle_at_top,#eef2ff,transparent_32%),linear-gradient(135deg,#f8fafc,#eef2f7)] p-4 sm:p-6'>
              <div className='mx-auto flex min-h-[420px] max-w-5xl items-center justify-center rounded-xl border border-white/80 bg-white/65 p-3 shadow-inner backdrop-blur sm:min-h-[620px] sm:p-6'>
                {productoSeleccionado ? (
                  <canvas
                    ref={canvasRef}
                    className='max-h-[72vh] w-full max-w-full touch-none rounded-lg object-contain shadow-2xl ring-1 ring-slate-200'
                    style={{ cursor: canvasCursor }}
                    onPointerDown={handleCanvasPointerDown}
                    onPointerMove={handleCanvasPointerMove}
                    onPointerUp={handleCanvasPointerUp}
                    onPointerCancel={handleCanvasPointerUp}
                    onPointerLeave={() => {
                      if (!dragStateRef.current) setCanvasCursor('default')
                    }}
                  />
                ) : (
                  <div className='text-center text-slate-400'>
                    <ImageIcon className='mx-auto mb-3 h-12 w-12' />
                    <p>No hay productos base activos.</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm'>
            <div className='mb-3 flex items-center gap-2'>
              <Images className='h-5 w-5 text-royal-blue' />
              <h2 className='font-semibold text-slate-900'>Mockups recientes</h2>
            </div>
            <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
              {proyectos.slice(0, 6).map((proyecto) => (
                <div key={proyecto.id} className='rounded-lg border border-slate-200 p-3'>
                  <div className='aspect-video overflow-hidden rounded-md bg-slate-100'>
                    {proyecto.resultadoPath ? (
                      <img src={proyecto.resultadoPath} alt={proyecto.nombre} className='h-full w-full object-contain' />
                    ) : (
                      <div className='flex h-full items-center justify-center text-xs text-slate-400'>Sin resultado</div>
                    )}
                  </div>
                  <p className='mt-2 truncate text-sm font-medium text-slate-900'>{proyecto.nombre}</p>
                  <p className='text-xs text-slate-500'>{getProductTypeLabel(proyecto.productoBase.tipoProducto)} · {proyecto.colorSeleccionado ?? proyecto.productoBase.color}</p>
                </div>
              ))}
              {!loading && proyectos.length === 0 && (
                <div className='rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500'>
                  Aún no hay mockups guardados.
                </div>
              )}
            </div>
          </section>

          <section className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm'>
            <div className='mb-3 flex items-center justify-between gap-3'>
              <h2 className='font-semibold text-slate-900'>Productos base</h2>
              <Badge variant='outline'>{productosBaseTodos.length} registros</Badge>
            </div>
            <div className='overflow-hidden rounded-lg border border-slate-200'>
              <Table>
                <TableHeader className='bg-slate-50'>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Colores</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className='text-right'>Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productosBaseTodos.map((producto) => (
                    <TableRow key={producto.id}>
                      <TableCell className='font-medium'>{producto.nombre}</TableCell>
                      <TableCell>{getProductTypeLabel(producto.tipoProducto)}</TableCell>
                      <TableCell>
                        <div className='flex flex-wrap gap-1.5'>
                          {getProductColors(producto).slice(0, 6).map((color) => (
                            <span key={color} className='inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-xs'>
                              <span className='h-3 w-3 rounded-full border border-slate-300' style={{ backgroundColor: colorToHex(color) }} />
                              {color}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {producto.activo ? (
                          <Badge variant='outline' className='gap-1 border-emerald-200 bg-emerald-50 text-emerald-700'><CheckCircle2 className='h-3 w-3' /> Activo</Badge>
                        ) : (
                          <Badge variant='outline' className='gap-1 border-slate-200 bg-slate-100 text-slate-500'><Ban className='h-3 w-3' /> Inactivo</Badge>
                        )}
                      </TableCell>
                      <TableCell className='text-right'>
                        <Button variant='outline' size='sm' onClick={() => handleEstadoBase(producto)}>
                          {producto.activo ? 'Inactivar' : 'Activar'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && productosBaseTodos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className='h-24 text-center text-slate-400'>Sin productos base.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        </main>
      </div>

      <Dialog open={baseDialogOpen} onOpenChange={setBaseDialogOpen}>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[620px]'>
          <DialogHeader>
            <DialogTitle>Nuevo producto base</DialogTitle>
            <DialogDescription>
              Registra la plantilla y el área imprimible donde se ubicará el diseño del cliente.
            </DialogDescription>
          </DialogHeader>
          <form className='space-y-4' onSubmit={handleCrearProductoBase}>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-1.5'>
                <Label>Nombre</Label>
                <Input required value={baseForm.nombre} onChange={(event) => setBaseForm((prev) => ({ ...prev, nombre: event.target.value }))} />
              </div>
              <div className='space-y-1.5'>
                <Label>Tipo producto</Label>
                <Select value={baseForm.tipoProducto} onValueChange={(value) => setBaseForm((prev) => ({ ...prev, tipoProducto: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder='Selecciona tipo' />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-1.5 sm:col-span-2'>
                <Label>Colores disponibles</Label>
                <div className='grid gap-2 sm:grid-cols-2'>
                  {BASE_COLOR_OPTIONS.map((color) => {
                    const selected = baseForm.coloresDisponibles.includes(color.value)
                    return (
                      <button
                        key={color.value}
                        type='button'
                        className={`flex items-center gap-2 rounded-lg border p-2 text-left text-sm transition ${selected ? 'border-royal-blue bg-blue-50 text-royal-blue' : 'border-slate-200 hover:bg-slate-50'}`}
                        onClick={() => setBaseForm((prev) => ({
                          ...prev,
                          coloresDisponibles: selected
                            ? prev.coloresDisponibles.filter((item) => item !== color.value)
                            : [...prev.coloresDisponibles, color.value],
                        }))}
                      >
                        <span className='h-5 w-5 rounded-full border border-slate-300' style={{ backgroundColor: color.hex }} />
                        {color.value}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className='space-y-1.5'>
                <Label>Imagen base</Label>
                <Input required type='file' accept='image/*' onChange={(event) => setBaseForm((prev) => ({ ...prev, imagenBase: event.target.files?.[0] ?? null }))} />
              </div>
            </div>
            <div className='grid gap-3 rounded-lg border border-blue-100 bg-blue-50/50 p-3 sm:grid-cols-4'>
              {(['areaX', 'areaY', 'areaWidth', 'areaHeight'] as const).map((field) => (
                <div key={field} className='space-y-1.5'>
                  <Label>{field}</Label>
                  <Input
                    required
                    type='number'
                    min={field === 'areaWidth' || field === 'areaHeight' ? 1 : 0}
                    step='0.01'
                    value={baseForm[field]}
                    onChange={(event) => setBaseForm((prev) => ({ ...prev, [field]: Number(event.target.value) }))}
                  />
                </div>
              ))}
            </div>
            <div className='flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end'>
              <Button type='button' variant='outline' onClick={() => setBaseDialogOpen(false)}>Cancelar</Button>
              <Button type='submit' disabled={baseSaving}>
                {baseSaving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Guardar plantilla
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}























