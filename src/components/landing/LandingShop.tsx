import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Filter,
  ImagePlus,
  Loader2,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  Truck,
  Upload,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { AuthModal } from '@/components/auth/AuthModal'
import { SimulatedPaymentModal } from '@/components/landing/SimulatedPaymentModal'
import { CustomerOrdersTable } from '@/components/landing/CustomerOrdersTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import { getDepartamentos, getProvincias, getDistritos } from '@/features/socios/api'
import type { Ubigeo } from '@/features/socios/types'

const PUBLIC_SHOP_URL = `${import.meta.env.VITE_API_URL}/api/public/tienda/productos`
const PUBLIC_SHIPPING_URL = `${import.meta.env.VITE_API_URL}/api/public/tienda/envios`
const SIZES = ['S', 'M', 'L', 'XL']

interface DeliveryZone {
  id: string
  nombre: string
  codigoServicio: string
  precio: number
}

interface ShopProduct {
  id: number
  slug: string
  title: string
  category: string
  basePrice: number
  price: number
  servicePrice: number
  tag: string
  description: string
  image: string
  colors: string[]
  stockLabel: string
  destacado: boolean
  permitePersonalizacion: boolean
  manejaTallas: boolean
  areaX?: number
  areaY?: number
  areaWidth?: number
  areaHeight?: number
}

interface TiendaProductoPublicoApi {
  id: number
  slug: string
  nombre: string
  categoria: string
  descripcion?: string | null
  precioProducto: number
  precioServicioEstampado: number
  precioTotal: number
  etiqueta: string
  destacado: boolean
  permitePersonalizacion: boolean
  manejaTallas: boolean
  imagenBasePath: string
  coloresDisponibles: string[]
  areaX?: number
  areaY?: number
  areaWidth?: number
  areaHeight?: number
}

interface CartItem {
  product: ShopProduct
  quantity: number
  size: string
  color: string
  deliveryZone: string
  deliveryAddress: string
  customerImage?: string
  mockupScale: number
  mockupX: number
  mockupY: number
  subtotal: number
  shipping: number
  total: number
}

interface CheckoutResponse {
  pedidoId: number
  codigo: string
  estado: string
  estadoPago: string
  subtotal: number
  costoEnvio: number
  total: number
  moneda: string
}

interface SimulatedPaymentResponse {
  estadoPago: string
  mensaje: string
}

function toShopProduct(item: TiendaProductoPublicoApi): ShopProduct {
  return {
    id: item.id,
    slug: item.slug,
    title: item.nombre,
    category: item.categoria || 'Varios',
    basePrice: Number(item.precioProducto ?? 0),
    price: Number(item.precioTotal ?? (item.precioProducto ?? 0) + (item.precioServicioEstampado ?? 0)),
    servicePrice: Number(item.precioServicioEstampado ?? 0),
    tag: item.etiqueta || (item.destacado ? 'Destacado' : 'Personalizable'),
    description: item.descripcion || 'Producto personalizable disponible para pedidos online.',
    image: item.imagenBasePath || '/images/sabiduria-productos.png',
    colors: item.coloresDisponibles?.length ? item.coloresDisponibles : ['Blanco'],
    stockLabel: item.permitePersonalizacion ? 'Personalizable' : 'Producto base',
    destacado: Boolean(item.destacado),
    permitePersonalizacion: Boolean(item.permitePersonalizacion),
    manejaTallas: Boolean(item.manejaTallas),
    areaX: item.areaX,
    areaY: item.areaY,
    areaWidth: item.areaWidth,
    areaHeight: item.areaHeight,
  }
}

async function fetchShopProducts(): Promise<ShopProduct[]> {
  const response = await fetch(PUBLIC_SHOP_URL)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Error HTTP ${response.status}`)
  }
  const data = (await response.json()) as TiendaProductoPublicoApi[]
  return data.map(toShopProduct)
}

async function fetchDeliveryZones(): Promise<DeliveryZone[]> {
  const response = await fetch(PUBLIC_SHIPPING_URL)
  if (!response.ok) throw new Error(await response.text() || 'No se pudieron cargar las tarifas de envío.')
  return response.json() as Promise<DeliveryZone[]>
}

function money(value: number) {
  return `S/ ${value.toFixed(2)}`
}

function productColorClass(color: string) {
  const map: Record<string, string> = {
    Blanco: 'bg-white',
    Negro: 'bg-slate-950',
    Morado: 'bg-sabiduria-purple',
    Azul: 'bg-blue-600',
    Amarillo: 'bg-yellow-400',
    Rojo: 'bg-red-500',
  }
  return map[color] ?? 'bg-slate-300'
}

const productColorHexMap: Record<string, string> = {
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

function productColorHex(color: string) {
  const normalized = color.trim()
  if (normalized.startsWith('#')) return normalized
  return productColorHexMap[normalized.toLowerCase()] ?? '#cbd5e1'
}

function drawTintedProductImage(context: CanvasRenderingContext2D, image: HTMLImageElement, color: string) {
  const width = context.canvas.width
  const height = context.canvas.height
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
  bufferContext.fillStyle = productColorHex(color)
  bufferContext.fillRect(0, 0, width, height)
  bufferContext.globalCompositeOperation = 'multiply'
  bufferContext.drawImage(image, 0, 0, width, height)
  bufferContext.globalCompositeOperation = 'destination-in'
  bufferContext.drawImage(image, 0, 0, width, height)
  context.drawImage(buffer, 0, 0)
}

export function LandingShop() {
  const { sessionReady, dbUser, signOut } = useAuth()
  const isStoreCustomer = dbUser?.rol?.codigo === 'CLIENTE_TIENDA'
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todos')
  const [maxPrice, setMaxPrice] = useState(500)
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [pendingCheckout, setPendingCheckout] = useState(false)
  const [confirmedOrder, setConfirmedOrder] = useState<CheckoutResponse | null>(null)
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0)
  const [pendingPayment, setPendingPayment] = useState<{
    order: CheckoutResponse
    method: 'TARJETA' | 'YAPE_PLIN'
  } | null>(null)
  const checkoutKeyRef = useRef<string | null>(null)

  useEffect(() => {
    checkoutKeyRef.current = null
  }, [cart])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setLoadError('')

    Promise.all([fetchShopProducts(), fetchDeliveryZones()])
      .then(([data, zones]) => {
        if (!mounted) return
        setProducts(data)
        setDeliveryZones(zones)
        const highest = Math.max(...data.map((product) => product.price), 100)
        setMaxPrice(Math.ceil(highest / 10) * 10)
      })
      .catch((error) => {
        if (!mounted) return
        setLoadError(error instanceof Error ? error.message : 'No se pudo cargar la tienda.')
        setProducts([])
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (pendingCheckout && sessionReady && isStoreCustomer) {
      setPendingCheckout(false)
      setAuthOpen(false)
      setCheckoutOpen(true)
      toast.success('Sesión validada. Continuemos con tu pedido.')
    }
  }, [isStoreCustomer, pendingCheckout, sessionReady])

  const categories = useMemo(() => ['Todos', ...Array.from(new Set(products.map((product) => product.category)))], [products])

  const highestPrice = useMemo(() => Math.max(...products.map((product) => product.price), 100), [products])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery = product.title.toLowerCase().includes(query.trim().toLowerCase())
      const matchesCategory = category === 'Todos' || product.category === category
      const matchesPrice = product.price <= maxPrice
      return matchesQuery && matchesCategory && matchesPrice
    })
  }, [category, maxPrice, products, query])
  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
    // El backend cobra un envío por pedido; cada artículo debe usar la misma zona.
    const shipping = cart[0]?.shipping ?? 0
    return { subtotal, shipping, total: subtotal + shipping }
  }, [cart])

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Agrega al menos un producto al carrito.')
      return
    }
    if (!sessionReady || !isStoreCustomer) {
      if (sessionReady && !isStoreCustomer) {
        toast.info('Para comprar, inicia sesión con una cuenta de cliente de tienda.')
      }
      void requireCheckoutLogin()
      return
    }
    setCartOpen(false)
    setCheckoutOpen(true)
  }

  const requireCheckoutLogin = async () => {
    setPendingCheckout(true)
    setCheckoutOpen(false)
    setCartOpen(false)
    await signOut()
    setAuthOpen(true)
  }

  const handleCheckoutSuccess = (order: CheckoutResponse, method: 'TARJETA' | 'YAPE_PLIN') => {
    setPendingPayment({ order, method })
    setCheckoutOpen(false)
    setCartOpen(false)
    toast.success(`Pedido ${order.codigo} creado. Completa el pago para continuar.`)
  }

  const handleSimulatedPaymentSuccess = (payment: SimulatedPaymentResponse) => {
    if (!pendingPayment) return
    const paidOrder: CheckoutResponse = {
      ...pendingPayment.order,
      estado: 'EN_PRODUCCION',
      estadoPago: payment.estadoPago,
    }
    setCart([])
    checkoutKeyRef.current = null
    setPendingPayment(null)
    setConfirmedOrder(paidOrder)
    setOrdersRefreshKey((key) => key + 1)
    toast.success(payment.mensaje)
  }

  return (
    <section id='tienda' className='bg-[#f7f0ff] py-20'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between'>
          <div className='max-w-3xl'>
            <p className='text-sm font-black uppercase tracking-[0.22em] text-sabiduria-purple'>Tienda</p>
            <h2 className='mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl'>Crea tu mockup y arma tu pedido en minutos.</h2>
            <p className='mt-4 text-base leading-8 text-slate-600'>
              Explora productos, sube tu diseño, cotiza entrega y prepara tu compra desde una experiencia rápida y autogestionable.
            </p>
          </div>
          <Button onClick={() => setCartOpen(true)} className='bg-sabiduria-purple text-white hover:bg-sabiduria-purple-soft' aria-label={`Abrir carrito con ${cart.length} productos`}>
            <ShoppingCart className='mr-2 h-4 w-4' />
            Carrito ({cart.length})
          </Button>
        </div>

        <div className='grid gap-6 lg:grid-cols-[280px_1fr]'>
          <aside className='h-fit rounded-2xl border border-purple-100 bg-white p-5 shadow-sm'>
            <div className='mb-5 flex items-center gap-2 font-black text-slate-900'>
              <Filter className='h-5 w-5 text-sabiduria-purple' />
              Filtros
            </div>
            <div className='space-y-5'>
              <div className='space-y-2'>
                <Label htmlFor='shop-search'>Buscar producto</Label>
                <div className='relative'>
                  <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400' />
                  <Input id='shop-search' value={query} onChange={(event) => setQuery(event.target.value)} placeholder='Polo, taza, gorra...' className='pl-9' />
                </div>
              </div>
              <div className='space-y-2'>
                <Label>Categoría</Label>
                <div className='flex flex-wrap gap-2 lg:flex-col'>
                  {categories.map((item) => (
                    <button
                      key={item}
                      type='button'
                      onClick={() => setCategory(item)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${category === item ? 'border-sabiduria-purple bg-sabiduria-purple text-white' : 'border-purple-100 bg-white text-slate-600 hover:bg-purple-50'}`}
                      aria-pressed={category === item}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div className='space-y-2'>
                <div className='flex items-center justify-between gap-3'>
                  <Label htmlFor='max-price'>Precio máximo</Label>
                  <span className='text-sm font-bold text-sabiduria-purple'>{money(maxPrice)}</span>
                </div>
                <input id='max-price' aria-label='Precio máximo' type='range' min='10' max={highestPrice || 100} step='5' value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} className='w-full accent-sabiduria-purple' />
              </div>
            </div>
          </aside>

          <div className='space-y-5'>
            <div className='flex flex-col gap-3 rounded-2xl border border-purple-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <p className='font-black text-slate-900'>{filteredProducts.length} productos disponibles</p>
                <p className='text-sm text-slate-500'>Filtros en tiempo real, sin recargar la página.</p>
              </div>
              <Badge className='w-fit bg-emerald-50 text-emerald-700'>Mockups interactivos</Badge>
            </div>

            {loading ? (
              <ProductSkeleton />
            ) : loadError ? (
              <div className='rounded-2xl border border-red-100 bg-white p-10 text-center'>
                <Package className='mx-auto h-10 w-10 text-red-300' />
                <h3 className='mt-4 text-xl font-black text-slate-900'>No pudimos cargar la tienda</h3>
                <p className='mt-2 text-sm text-slate-500'>{loadError}</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className='rounded-2xl border border-dashed border-purple-200 bg-white p-10 text-center'>
                <Package className='mx-auto h-10 w-10 text-slate-300' />
                <h3 className='mt-4 text-xl font-black text-slate-900'>No se encontraron productos</h3>
                <p className='mt-2 text-sm text-slate-500'>Prueba cambiando la categoría, búsqueda o rango de precio.</p>
              </div>
            ) : (
              <div className='grid gap-5 sm:grid-cols-2 xl:grid-cols-3'>
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onSelect={() => setSelectedProduct(product)} />
                ))}
              </div>
            )}
          </div>
        </div>

        {sessionReady && isStoreCustomer && <CustomerOrdersTable refreshKey={ordersRefreshKey} />}
      </div>

      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          deliveryZones={deliveryZones}
          onClose={() => setSelectedProduct(null)}
          onAdd={(item) => {
            setCart((prev) => [...prev, item])
            setSelectedProduct(null)
            setCartOpen(true)
            toast.success('Producto agregado al carrito.')
          }}
        />
      )}

      {cartOpen && (
        <CartDrawer
          cart={cart}
          totals={cartTotals}
          onClose={() => setCartOpen(false)}
          onCheckout={handleCheckout}
          onRemove={(index) => setCart((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
          onQuantityChange={(index, quantity) => {
            setCart((prev) => prev.map((item, itemIndex) => {
              if (itemIndex !== index) return item
              const nextQuantity = Math.max(1, quantity)
              return { ...item, quantity: nextQuantity, subtotal: item.product.price * nextQuantity, total: item.product.price * nextQuantity + item.shipping }
            }))
          }}
        />
      )}

      {checkoutOpen && (
        <CheckoutModal
          totals={cartTotals}
          cart={cart}
          checkoutKeyRef={checkoutKeyRef}
          onClose={() => setCheckoutOpen(false)}
          onRequireAuth={requireCheckoutLogin}
          onSuccess={handleCheckoutSuccess}
        />
      )}

      {pendingPayment && (
        <SimulatedPaymentModal
          paymentOrder={pendingPayment.order}
          paymentMethodId={pendingPayment.method}
          onClose={() => {
            setPendingPayment(null)
            setCheckoutOpen(true)
          }}
          onPaid={handleSimulatedPaymentSuccess}
        />
      )}

      {confirmedOrder && (
        <div className='fixed inset-0 z-[95] grid place-items-center bg-slate-950/55 p-4' role='dialog' aria-modal='true' aria-label='Pedido confirmado'>
          <div className='w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl'>
            <CheckCircle2 className='mx-auto h-12 w-12 text-emerald-600' />
            <h3 className='mt-4 text-2xl font-black text-slate-950'>Pedido registrado</h3>
            <p className='mt-2 text-slate-600'>Código: <strong>{confirmedOrder.codigo}</strong></p>
            <p className='mt-1 text-sm text-slate-500'>El pedido está {confirmedOrder.estado}; el pago está {confirmedOrder.estadoPago}.</p>
            <p className='mt-4 text-xl font-black text-slate-950'>{money(confirmedOrder.total)}</p>
            <Button type='button' onClick={() => setConfirmedOrder(null)} className='mt-6 w-full bg-slate-800 text-white hover:bg-slate-700'>Continuar comprando</Button>
          </div>
        </div>
      )}

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultTab='login'
        authEndpoint='/api/auth/tienda/login'
        allowedRoleCodes={['CLIENTE_TIENDA']}
        accessDeniedMessage='Este acceso es solo para clientes registrados de la tienda.'
        loginTitle='Acceso cliente'
        loginDescription='Ingresa con tu cuenta de cliente para continuar la compra.'
        registerDescription='Crea tu cuenta de cliente para guardar tus pedidos y continuar con el pago.'
      />
    </section>
  )
}

function ProductSkeleton() {
  return (
    <div className='grid gap-5 sm:grid-cols-2 xl:grid-cols-3' aria-label='Cargando productos'>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className='animate-pulse rounded-2xl border border-purple-100 bg-white p-4 shadow-sm'>
          <div className='aspect-[4/3] rounded-xl bg-purple-100' />
          <div className='mt-4 h-4 w-2/3 rounded bg-purple-100' />
          <div className='mt-3 h-3 w-full rounded bg-purple-50' />
          <div className='mt-4 h-10 rounded bg-purple-100' />
        </div>
      ))}
    </div>
  )
}

function ProductCard({ product, onSelect }: { product: ShopProduct; onSelect: () => void }) {
  return (
    <article className='group overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg'>
      <button type='button' onClick={onSelect} className='block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sabiduria-purple focus-visible:ring-offset-2' aria-label={`Ver detalle de ${product.title}`}>
        <div className='relative aspect-[4/3] bg-purple-50'>
          <img src={product.image} alt={product.title} className='h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]' />
          <Badge className='absolute top-3 left-3 bg-sabiduria-gold text-sabiduria-purple'>{product.tag}</Badge>
        </div>
        <div className='space-y-3 p-5'>
          <div>
            <p className='text-xs font-black uppercase tracking-[0.18em] text-sabiduria-purple'>{product.category}</p>
            <h3 className='mt-1 text-lg font-black text-slate-950'>{product.title}</h3>
          </div>
          <p className='line-clamp-2 text-sm leading-6 text-slate-500'>{product.description}</p>
          <div className='flex items-center justify-between gap-3'>
            <div>
              <p className='text-xs text-slate-500'>Producto {money(product.basePrice)} · Estampado {money(product.servicePrice)}</p>
              <span className='text-xl font-black text-slate-950'>{money(product.price)} / unidad</span>
            </div>
            <span className='rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700'>{product.stockLabel}</span>
          </div>
        </div>
      </button>
    </article>
  )
}

function ProductDetail({ product, deliveryZones, onClose, onAdd }: { product: ShopProduct; deliveryZones: DeliveryZone[]; onClose: () => void; onAdd: (item: CartItem) => void }) {
  const [quantity, setQuantity] = useState(1)
  const [size, setSize] = useState(SIZES[1])
  const [color, setColor] = useState(product.colors[0])
  const [deliveryZone, setDeliveryZone] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [customerImage, setCustomerImage] = useState<string>()
  const [mockupScale, setMockupScale] = useState(42)
  const [mockupX, setMockupX] = useState(50)
  const [mockupY, setMockupY] = useState(46)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const productCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const canCustomizeProduct = product.permitePersonalizacion && product.servicePrice > 0

  useEffect(() => {
    const canvas = productCanvasRef.current
    if (!canvas) return

    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      canvas.width = image.naturalWidth || image.width
      canvas.height = image.naturalHeight || image.height
      const context = canvas.getContext('2d')
      if (!context) return
      context.clearRect(0, 0, canvas.width, canvas.height)
      drawTintedProductImage(context, image, color)
    }
    image.src = product.image

    return () => {
      image.onload = null
    }
  }, [color, product.image])

  useEffect(() => {
    if (deliveryZones.length && !deliveryZones.some((zone) => zone.id === deliveryZone)) {
      setDeliveryZone(deliveryZones[0].id)
    }
  }, [deliveryZones, deliveryZone])
  const shipping = deliveryZones.find((zone) => zone.id === deliveryZone)?.precio ?? 0
  const subtotal = product.price * quantity
  const total = subtotal + shipping

  const handleFile = (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Solo puedes subir imágenes.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar 5 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setCustomerImage(String(reader.result))
    reader.readAsDataURL(file)
  }

  const handleAdd = () => {
    if (quantity <= 0) {
      toast.error('La cantidad debe ser mayor a 0.')
      return
    }
    if (!deliveryAddress.trim()) {
      toast.error('Ingresa el lugar o dirección de entrega.')
      return
    }
    if (!deliveryZone) {
      toast.error('No hay zonas de envío disponibles.')
      return
    }
    onAdd({ product, quantity, size: product.manejaTallas ? size : '', color, deliveryZone, deliveryAddress, customerImage, mockupScale, mockupX, mockupY, subtotal, shipping, total })
  }

  return (
    <div className='fixed inset-0 z-[80] overflow-y-auto bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6' role='dialog' aria-modal='true' aria-label={`Detalle de ${product.title}`}>
      <div className='mx-auto max-w-6xl rounded-3xl bg-white shadow-2xl'>
        <div className='sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-white/95 px-4 py-4 backdrop-blur sm:px-6'>
          <Button variant='ghost' onClick={onClose} className='gap-2'>
            <ArrowLeft className='h-4 w-4' />
            Volver
          </Button>
          <button type='button' onClick={onClose} className='rounded-full p-2 text-slate-500 hover:bg-slate-100' aria-label='Cerrar detalle'>
            <X className='h-5 w-5' />
          </button>
        </div>

        <div className='grid gap-8 p-4 sm:p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8'>
          <div className='space-y-4'>
            <div className='rounded-2xl border border-purple-100 bg-[#fbf8ff] p-4'>
              <div className='relative mx-auto flex aspect-square max-h-[620px] items-center justify-center overflow-hidden rounded-xl bg-white'>
                <img src={product.image} alt={product.title} className='absolute inset-0 h-full w-full object-cover opacity-95' />
                <canvas ref={productCanvasRef} aria-hidden='true' className='absolute inset-0 h-full w-full object-cover' />
                {canCustomizeProduct && customerImage ? (
                  <img
                    src={customerImage}
                    alt='Diseño del cliente aplicado al mockup'
                    className='absolute -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-md'
                    style={{ left: `${mockupX}%`, top: `${mockupY}%`, width: `${mockupScale}%`, maxHeight: `${mockupScale}%` }}
                  />
                ) : canCustomizeProduct ? (
                  <div className='absolute left-1/2 top-[46%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-2xl border border-dashed border-sabiduria-purple/35 bg-white/80 px-5 py-4 text-center text-sm font-semibold text-sabiduria-purple'>
                    <ImagePlus className='mb-2 h-6 w-6' />
                    Sube tu diseño
                  </div>
                ) : null}
              </div>
            </div>

            {canCustomizeProduct && <div className='grid gap-3 rounded-2xl border border-purple-100 bg-white p-4 sm:grid-cols-3'>
              <ControlRange label='Tamaño diseño' value={mockupScale} min={18} max={70} onChange={setMockupScale} />
              <ControlRange label='Posición X' value={mockupX} min={20} max={80} onChange={setMockupX} />
              <ControlRange label='Posición Y' value={mockupY} min={20} max={75} onChange={setMockupY} />
            </div>}
          </div>

          <div className='space-y-6'>
            <div>
              <Badge className='bg-sabiduria-gold text-sabiduria-purple'>{product.tag}</Badge>
              <h3 className='mt-3 text-3xl font-black tracking-tight text-slate-950'>{product.title}</h3>
              <p className='mt-3 text-base leading-7 text-slate-600'>{product.description}</p>
              <p className='mt-5 text-3xl font-black text-slate-950'>{money(product.price)} <span className='text-base font-semibold text-slate-500'>/ unidad</span></p>
              <p className='mt-1 text-sm text-slate-500'>Producto {money(product.basePrice)} · Estampado {money(product.servicePrice)}</p>
            </div>

            <div className='space-y-4 rounded-2xl border border-purple-100 bg-purple-50/40 p-4'>
              {canCustomizeProduct && <div className='space-y-2'>
                <Label>Imagen o logo del cliente</Label>
                <input ref={inputRef} type='file' accept='image/*' className='hidden' onChange={(event) => handleFile(event.target.files?.[0])} />
                <Button type='button' variant='outline' className='w-full justify-center gap-2 bg-white' onClick={() => inputRef.current?.click()}>
                  <Upload className='h-4 w-4' />
                  {customerImage ? 'Cambiar imagen' : 'Subir imagen'}
                </Button>
              </div>}

              <div className='space-y-2'>
                <Label>Color</Label>
                <div className='flex flex-wrap gap-2'>
                  {product.colors.map((item) => (
                    <button key={item} type='button' onClick={() => setColor(item)} aria-pressed={color === item} className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold ${color === item ? 'border-sabiduria-purple bg-white text-sabiduria-purple' : 'border-purple-100 bg-white text-slate-600'}`}>
                      <span className={`h-4 w-4 rounded-full border ${productColorClass(item)}`} style={{ backgroundColor: productColorHex(item) }} />
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {product.manejaTallas && <div className='space-y-2'>
                <Label>Talla</Label>
                <div className='grid grid-cols-4 gap-2'>
                  {SIZES.map((item) => (
                    <button key={item} type='button' onClick={() => setSize(item)} aria-pressed={size === item} className={`rounded-xl border px-3 py-2 text-sm font-black ${size === item ? 'border-sabiduria-purple bg-sabiduria-purple text-white' : 'border-purple-100 bg-white text-slate-600'}`}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>}

              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='quantity'>Cantidad</Label>
                  <Input id='quantity' type='number' min={1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='delivery-zone'>Zona de entrega</Label>
                  <select id='delivery-zone' value={deliveryZone} onChange={(event) => setDeliveryZone(event.target.value)} className='h-10 w-full rounded-md border border-input bg-background px-3 text-sm'>
                    {deliveryZones.map((zone) => <option key={zone.id} value={zone.id}>{zone.nombre} · {money(zone.precio)}</option>)}
                  </select>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='delivery-address'>Lugar de entrega *</Label>
                <Textarea id='delivery-address' value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} placeholder='Ej: Calle Angamos 448, Santa Anita, referencia...' rows={3} />
              </div>
            </div>

            <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
              <h4 className='mb-4 flex items-center gap-2 font-black text-slate-950'><CreditCard className='h-5 w-5 text-sabiduria-purple' /> Cotización</h4>
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between'><span>Producto ({quantity} × {money(product.basePrice)})</span><strong>{money(product.basePrice * quantity)}</strong></div>
                <div className='flex justify-between'><span>Estampado ({quantity} × {money(product.servicePrice)})</span><strong>{money(product.servicePrice * quantity)}</strong></div>
                <div className='flex justify-between'><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
                <div className='flex justify-between'><span>Envío</span><strong>{money(shipping)}</strong></div>
                <div className='mt-3 flex justify-between border-t pt-3 text-lg'><span>Total</span><strong>{money(total)}</strong></div>
              </div>
              <Button type='button' onClick={handleAdd} className='mt-5 w-full bg-sabiduria-purple py-6 text-white hover:bg-sabiduria-purple-soft'>
                <ShoppingCart className='mr-2 h-4 w-4' />
                Agregar al carrito
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ControlRange({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <label className='space-y-2 text-sm font-semibold text-slate-700'>
      <span className='flex items-center justify-between gap-3'><span>{label}</span><span className='text-sabiduria-purple'>{value}%</span></span>
      <input type='range' min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} className='w-full accent-sabiduria-purple' />
    </label>
  )
}

function CartDrawer({ cart, totals, onClose, onCheckout, onRemove, onQuantityChange }: { cart: CartItem[]; totals: { subtotal: number; shipping: number; total: number }; onClose: () => void; onCheckout: () => void; onRemove: (index: number) => void; onQuantityChange: (index: number, quantity: number) => void }) {
  return (
    <div className='fixed inset-0 z-[85] bg-slate-950/50 backdrop-blur-sm' role='dialog' aria-modal='true' aria-label='Carrito de compras'>
      <div className='ml-auto flex h-full w-full max-w-xl flex-col bg-white shadow-2xl'>
        <div className='flex items-center justify-between border-b p-4 sm:p-6'>
          <h3 className='text-2xl font-black text-slate-950'>Carrito</h3>
          <button type='button' onClick={onClose} className='rounded-full p-2 hover:bg-slate-100' aria-label='Cerrar carrito'><X className='h-5 w-5' /></button>
        </div>
        <div className='flex-1 overflow-y-auto p-4 sm:p-6'>
          {cart.length === 0 ? (
            <div className='rounded-2xl border border-dashed border-purple-200 p-8 text-center text-slate-500'>Tu carrito está vacío.</div>
          ) : (
            <div className='space-y-4'>
              {cart.map((item, index) => (
                <div key={`${item.product.id}-${index}`} className='rounded-2xl border border-purple-100 p-4'>
                  <div className='flex gap-4'>
                    <img src={item.customerImage || item.product.image} alt={item.product.title} className='h-20 w-20 rounded-xl object-cover' />
                    <div className='min-w-0 flex-1'>
                      <h4 className='font-black text-slate-950'>{item.product.title}</h4>
                      <p className='text-sm text-slate-500'>{item.color} · Talla {item.size}</p>
                      <p className='text-xs text-slate-500'>Producto {money(item.product.basePrice)} · Estampado {money(item.product.servicePrice)} por unidad</p>
                      <p className='text-sm text-slate-500'><Truck className='mr-1 inline h-3.5 w-3.5' />{item.deliveryAddress}</p>
                    </div>
                    <button type='button' onClick={() => onRemove(index)} aria-label='Eliminar producto' className='h-9 rounded-full p-2 text-red-500 hover:bg-red-50'><Trash2 className='h-4 w-4' /></button>
                  </div>
                  <div className='mt-4 flex items-center justify-between gap-3'>
                    <div className='flex items-center rounded-full border'>
                      <button type='button' onClick={() => onQuantityChange(index, item.quantity - 1)} className='p-2' aria-label='Disminuir cantidad'><Minus className='h-4 w-4' /></button>
                      <span className='w-8 text-center text-sm font-bold'>{item.quantity}</span>
                      <button type='button' onClick={() => onQuantityChange(index, item.quantity + 1)} className='p-2' aria-label='Aumentar cantidad'><Plus className='h-4 w-4' /></button>
                    </div>
                    <strong>{money(item.total)}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className='border-t p-4 sm:p-6'>
          <div className='space-y-2 text-sm'>
            <div className='flex justify-between'><span>Productos</span><strong>{money(totals.subtotal)}</strong></div>
            <div className='flex justify-between'><span>Entregas</span><strong>{money(totals.shipping)}</strong></div>
            <div className='flex justify-between border-t pt-3 text-lg'><span>Total</span><strong>{money(totals.total)}</strong></div>
          </div>
          <Button type='button' onClick={onCheckout} className='mt-5 w-full bg-slate-800 py-6 text-white hover:bg-slate-700'>Continuar compra</Button>
        </div>
      </div>
    </div>
  )
}

class CheckoutAuthError extends Error {}

async function responseMessage(response: Response) {
  const text = await response.text()
  if (!text) return `Error HTTP ${response.status}`
  try {
    const body = JSON.parse(text) as { detail?: string; message?: string; error?: string }
    return body.detail || body.message || body.error || text
  } catch {
    return text
  }
}

async function uploadCheckoutImage(dataUrl: string, token: string, index: number): Promise<string> {
  const blob = await fetch(dataUrl).then((response) => response.blob())
  const extension = blob.type.split('/')[1]?.replace('jpeg', 'jpg') || 'png'
  const formData = new FormData()
  formData.append('file', new File([blob], `design-${index}.${extension}`, { type: blob.type || 'image/png' }))
  formData.append('folder', 'checkout')

  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/storage/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  if (response.status === 401) throw new CheckoutAuthError('Tu sesión venció. Inicia sesión para continuar.')
  if (!response.ok) throw new Error(await responseMessage(response))

  const result = await response.json() as { url?: string }
  if (!result.url) throw new Error('El servidor no devolvió la URL de la imagen.')
  return result.url
}

function CheckoutModal({ cart, totals, checkoutKeyRef, onClose, onRequireAuth, onSuccess }: {
  cart: CartItem[]
  totals: { subtotal: number; shipping: number; total: number }
  checkoutKeyRef: { current: string | null }
  onClose: () => void
  onRequireAuth: () => void | Promise<void>
  onSuccess: (order: CheckoutResponse, method: 'TARJETA' | 'YAPE_PLIN') => void
}) {
  const { user } = useAuth()
  const [accepted, setAccepted] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'TARJETA' | 'YAPE_PLIN'>('TARJETA')
  const [processing, setProcessing] = useState(false)
  const [invoiceType, setInvoiceType] = useState<'FACTURA' | 'BOLETA'>('BOLETA')
  const [documentType, setDocumentType] = useState('01')
  const [documentNumber, setDocumentNumber] = useState('')
  const [fullName, setFullName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [fiscalAddress, setFiscalAddress] = useState('')
  const [billingEmail, setBillingEmail] = useState(user?.email ?? '')
  const [deliveryUbigeo, setDeliveryUbigeo] = useState('')
  const [departments, setDepartments] = useState<string[]>([])
  const [provinces, setProvinces] = useState<string[]>([])
  const [districts, setDistricts] = useState<Ubigeo[]>([])
  const [deliveryDepartment, setDeliveryDepartment] = useState('')
  const [deliveryProvince, setDeliveryProvince] = useState('')

  useEffect(() => {
    if (user?.email && !billingEmail) setBillingEmail(user.email)
  }, [user?.email, billingEmail])

  useEffect(() => {
    if (!user) return
    getDepartamentos().then(setDepartments).catch(() => toast.error('No se pudieron cargar los departamentos.'))
  }, [user])

  useEffect(() => {
    if (!deliveryDepartment) { setProvinces([]); setDeliveryProvince(''); return }
    getProvincias(deliveryDepartment).then(setProvinces).catch(() => toast.error('No se pudieron cargar las provincias.'))
  }, [deliveryDepartment])

  useEffect(() => {
    if (!deliveryDepartment || !deliveryProvince) { setDistricts([]); setDeliveryUbigeo(''); return }
    getDistritos(deliveryDepartment, deliveryProvince).then(setDistricts).catch(() => toast.error('No se pudieron cargar los distritos.'))
  }, [deliveryDepartment, deliveryProvince])

  const submitCheckout = async () => {
    if (processing) return
    if (!accepted) {
      toast.error('Debes aceptar los términos para continuar.')
      return
    }

    if (!/^\d{6}$/.test(deliveryUbigeo)) {
      toast.error('Ingresa el ubigeo de seis dígitos del distrito de entrega.')
      return
    }
    if (invoiceType === 'FACTURA') {
      if (documentType !== '06' || !/^\d{11}$/.test(documentNumber) || !businessName.trim() || !fiscalAddress.trim()) {
        toast.error('Completa RUC, razón social y dirección fiscal para emitir factura.')
        return
      }
    } else {
      if (!documentNumber.trim() || !fullName.trim() || documentType === '06') {
        toast.error('Completa el documento y nombre del cliente para emitir boleta.')
        return
      }
      if (documentType === '01' && !/^\d{8}$/.test(documentNumber.trim())) {
        toast.error('El DNI debe tener exactamente 8 dígitos. Si usarás otro documento, selecciónalo en el tipo de documento.')
        return
      }
      if (!/^[0-9A-Za-z-]{8,20}$/.test(documentNumber.trim())) {
        toast.error('El número de documento debe tener entre 8 y 20 caracteres válidos.')
        return
      }
    }
    if (!billingEmail.trim()) {
      toast.error('Ingresa el correo para el comprobante.')
      return
    }

    if (!user) {
      await onRequireAuth()
      return
    }

    const firstItem = cart[0]
    const sameDelivery = cart.every((item) =>
      item.deliveryZone === firstItem.deliveryZone
      && item.deliveryAddress.trim() === firstItem.deliveryAddress.trim(),
    )
    if (!sameDelivery) {
      toast.error('Agrupa en un pedido productos con la misma dirección y zona de entrega.')
      return
    }

    setProcessing(true)
    try {
      const token = await user.getIdToken()
      const idempotencyKey = checkoutKeyRef.current ?? crypto.randomUUID()
      checkoutKeyRef.current = idempotencyKey

      const items = await Promise.all(cart.map(async (item, index) => ({
        tiendaProductoId: item.product.id,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
        customerImagePath: item.customerImage
          ? await uploadCheckoutImage(item.customerImage, token, index)
          : undefined,
        mockup: {
          scale: item.mockupScale,
          x: item.mockupX,
          y: item.mockupY,
        },
      })))

      const payload = {
        idempotencyKey,
        termsAccepted: accepted,
        delivery: {
          address: firstItem.deliveryAddress.trim(),
          reference: '',
          zoneId: firstItem.deliveryZone,
          ubigeo: deliveryUbigeo,
        },
        billingDetails: {
          invoiceType,
          documentType,
          documentNumber: documentNumber.trim(),
          fullName: invoiceType === 'BOLETA' ? fullName.trim() : undefined,
          businessName: invoiceType === 'FACTURA' ? businessName.trim() : undefined,
          fiscalAddress: invoiceType === 'FACTURA' ? fiscalAddress.trim() : undefined,
          email: billingEmail.trim(),
        },
        paymentMethod,
        items,
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tienda/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      if (response.status === 401) throw new CheckoutAuthError('Tu sesión venció. Inicia sesión para continuar.')
      if (response.status !== 201) throw new Error(await responseMessage(response))

      const order = await response.json() as CheckoutResponse
      onSuccess(order, paymentMethod)
    } catch (error) {
      if (error instanceof CheckoutAuthError) {
        toast.error(error.message)
        await onRequireAuth()
      } else {
        toast.error(error instanceof Error ? error.message : 'No se pudo registrar el pedido.')
      }
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className='fixed inset-0 z-[90] overflow-y-auto bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6' role='dialog' aria-modal='true' aria-label='Checkout'>
      <div className='mx-auto max-w-5xl rounded-3xl bg-[#f5f5f5] shadow-2xl'>
        <div className='flex items-center justify-between border-b bg-white px-4 py-4 sm:px-6'>
          <h3 className='text-2xl font-black text-slate-950'>Revisa y paga tu compra</h3>
          <button type='button' onClick={onClose} disabled={processing} className='rounded-full p-2 hover:bg-slate-100 disabled:opacity-50' aria-label='Cerrar checkout'><X className='h-5 w-5' /></button>
        </div>
        <div className='grid gap-6 p-4 sm:p-6 lg:grid-cols-[1fr_380px]'>
          <div className='space-y-5'>
            <div className='rounded-2xl bg-white p-5 shadow-sm'>
              <h4 className='font-black text-slate-950'>Dirección de entrega</h4>
              <p className='mt-3 text-sm leading-6 text-slate-600'>{cart[0]?.deliveryAddress || 'Sin dirección registrada'}</p>
              <div className='mt-4 grid gap-3 sm:grid-cols-3'>
                <label className='text-sm font-semibold text-slate-700'>Departamento<select value={deliveryDepartment} onChange={(event) => { setDeliveryDepartment(event.target.value); setDeliveryProvince(''); setDeliveryUbigeo('') }} className='mt-1 h-10 w-full rounded-md border bg-white px-3 text-sm font-normal'><option value=''>Selecciona</option>{departments.map((department) => <option key={department} value={department}>{department}</option>)}</select></label>
                <label className='text-sm font-semibold text-slate-700'>Provincia<select value={deliveryProvince} onChange={(event) => { setDeliveryProvince(event.target.value); setDeliveryUbigeo('') }} disabled={!deliveryDepartment} className='mt-1 h-10 w-full rounded-md border bg-white px-3 text-sm font-normal'><option value=''>Selecciona</option>{provinces.map((province) => <option key={province} value={province}>{province}</option>)}</select></label>
                <label className='text-sm font-semibold text-slate-700'>Distrito<select value={deliveryUbigeo} onChange={(event) => setDeliveryUbigeo(event.target.value)} disabled={!deliveryProvince} className='mt-1 h-10 w-full rounded-md border bg-white px-3 text-sm font-normal'><option value=''>Selecciona</option>{districts.map((district) => <option key={district.ubigeo} value={district.ubigeo}>{district.distrito}</option>)}</select></label>
              </div>
              <div className='mt-4 rounded-xl bg-purple-50 p-4 text-sm text-sabiduria-purple'>Entrega estimada según zona seleccionada. La validación logística final se realizará al confirmar el pedido.</div>
            </div>
            <div className='rounded-2xl bg-white p-5 shadow-sm'>
              <h4 className='font-black text-slate-950'>Datos para facturación</h4>
              <p className='mt-1 text-sm text-slate-500'>Estos datos permitirán preparar el comprobante después del pago.</p>
              <div className='mt-4 grid grid-cols-2 gap-2'>
                {(['BOLETA', 'FACTURA'] as const).map((type) => <button key={type} type='button' disabled={processing} onClick={() => { setInvoiceType(type); setDocumentType(type === 'FACTURA' ? '06' : '01') }} className={`rounded-lg border px-3 py-2 text-sm font-bold ${invoiceType === type ? 'border-sabiduria-purple bg-purple-50 text-sabiduria-purple' : 'border-slate-200'}`}>{type}</button>)}
              </div>
              {invoiceType === 'BOLETA' ? <div className='mt-3 grid gap-3 sm:grid-cols-[140px_1fr]'>
                <select value={documentType} onChange={(event) => setDocumentType(event.target.value)} className='h-10 rounded-md border bg-white px-3 text-sm'><option value='01'>DNI</option><option value='04'>CE</option><option value='07'>Pasaporte</option><option value='A4'>Doc. diplomático</option></select>
                <Input value={documentNumber} onChange={(event) => {
                  const value = event.target.value.replace(/[^0-9A-Za-z-]/g, '').slice(0, 20)
                  setDocumentNumber(value)
                  if (/^\d{11}$/.test(value)) { setInvoiceType('FACTURA'); setDocumentType('06') }
                }} placeholder='Número de documento' />
                <Input className='sm:col-span-2' value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder='Nombres y apellidos' />
              </div> : <div className='mt-3 space-y-3'>
                <Input value={documentNumber} onChange={(event) => setDocumentNumber(event.target.value.replace(/\D/g, '').slice(0, 11))} placeholder='RUC (11 dígitos)' inputMode='numeric' />
                <Input value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder='Razón social' />
                <Input value={fiscalAddress} onChange={(event) => setFiscalAddress(event.target.value)} placeholder='Dirección fiscal' />
              </div>}
              <Input className='mt-3' type='email' value={billingEmail} onChange={(event) => setBillingEmail(event.target.value)} placeholder='Correo para el comprobante' />
            </div>
            <div className='rounded-2xl bg-white p-5 shadow-sm'>
              <h4 className='font-black text-slate-950'>Productos</h4>
              <div className='mt-4 space-y-3'>
                {cart.map((item, index) => (
                  <div key={index} className='flex items-center gap-3 rounded-xl border p-3'>
                    <img src={item.customerImage || item.product.image} alt={item.product.title} className='h-14 w-14 rounded-lg object-cover' />
                    <div className='min-w-0 flex-1'>
                      <p className='truncate font-bold text-slate-900'>{item.product.title}</p>
                      <p className='text-xs text-slate-500'>Cant. {item.quantity} · {item.color} · {item.size}</p>
                    </div>
                    <strong>{money(item.total)}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div className='rounded-2xl bg-white p-5 shadow-sm'>
              <h4 className='font-black text-slate-950'>Medio de pago</h4>
              <div className='mt-4 grid gap-3 sm:grid-cols-2'>
                {(['TARJETA', 'YAPE_PLIN'] as const).map((method) => (
                  <button key={method} type='button' disabled={processing} onClick={() => setPaymentMethod(method)} className={`rounded-xl border p-4 text-left font-bold disabled:opacity-50 ${paymentMethod === method ? 'border-sabiduria-purple bg-purple-50 text-sabiduria-purple' : 'border-slate-200 bg-white text-slate-700'}`}>
                    {method === 'TARJETA' ? 'Tarjeta' : 'Yape / Plin'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside className='h-fit space-y-4'>
            <div className='rounded-2xl bg-white p-5 shadow-sm'>
              <h4 className='text-xl font-black text-slate-950'>Resumen de la compra</h4>
              <div className='mt-5 space-y-3 text-sm'>
                <div className='flex justify-between'><span>Productos ({cart.length})</span><strong>{money(totals.subtotal)}</strong></div>
                <div className='flex justify-between'><span>Entregas</span><strong>{money(totals.shipping)}</strong></div>
                <div className='flex justify-between border-t pt-3 text-lg'><span>Total</span><strong>{money(totals.total)}</strong></div>
              </div>
              <label className='mt-5 flex items-start gap-3 text-sm text-slate-600'>
                <input type='checkbox' checked={accepted} disabled={processing} onChange={(event) => setAccepted(event.target.checked)} className='mt-1 accent-sabiduria-purple' />
                Acepto los términos y condiciones para preparar mi pedido.
              </label>
              <Button type='button' onClick={() => void submitCheckout()} disabled={processing} className='mt-5 w-full bg-slate-800 py-6 text-white hover:bg-slate-700'>
                {processing ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <CheckCircle2 className='mr-2 h-4 w-4' />}
                {processing ? 'Procesando...' : 'Confirmar pedido'}
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}






