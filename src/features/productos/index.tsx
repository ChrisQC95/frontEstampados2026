import { useEffect, useState } from 'react';
import { useConfirmStore } from '@/stores/useConfirmStore'
import {
  AlertTriangle,
  Edit,
  Package,
  Plus,
  Search,
  Trash2,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';

import { getCategorias, deleteProducto, getProductos, saveProducto } from './api';
import type { Categoria, Producto } from './types';

// ─── Constantes ────────────────────────────────────────────────────────────

const UNIDADES: { value: string; label: string }[] = [
  { value: 'NIU', label: 'Unidad (NIU)' },
  { value: 'ZZ', label: 'Servicio (ZZ)' },
  { value: 'KG', label: 'Kilogramo (KG)' },
  { value: 'LT', label: 'Litro (LT)' },
  { value: 'MT', label: 'Metro (MT)' },
  { value: 'BX', label: 'Caja (BX)' },
  { value: 'DZ', label: 'Docena (DZ)' },
];

const EMPTY_FORM: Omit<Producto, 'id'> = {
  usuarioId: 0,
  categoriaId: null,
  codigo: '',
  nombre: '',
  tipo: 'B',
  unidadMedida: 'NIU',
  precioVenta: 0,
  precioCompra: null,
  afectoIgv: true,
  stockActual: 0,
  stockMinimo: 0,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function stockEnAlerta(p: Producto): boolean {
  if (p.tipo !== 'B') return false;
  if (p.stockActual == null || p.stockMinimo == null) return false;
  return Number(p.stockActual) <= Number(p.stockMinimo);
}

// ─── Componente Principal ───────────────────────────────────────────────────

export default function ProductosPage() {
  const { dbUser } = useAuth();
  const currentUserId = dbUser?.id;
  const openConfirm = useConfirmStore((state) => state.openConfirm)

  // ── Estado principal ──
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // ── Modal ──
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Omit<Producto, 'id'> & { id?: number }>(
    EMPTY_FORM
  );

  // ─── Carga de datos ──────────────────────────────────────────────────────

  const cargarDatos = async () => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        getProductos(currentUserId),
        getCategorias(currentUserId),
      ]);
      setProductos(prods);
      setCategorias(cats);
    } catch {
      toast.error('Error al cargar los datos desde el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  // ─── Filtro de búsqueda ─────────────────────────────────────────────────

  const productosFiltrados = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (p.codigo ?? '').toLowerCase().includes(search.toLowerCase())
  );

  // ─── Handlers ───────────────────────────────────────────────────────────

  const openCreate = () => {
    setFormData({ ...EMPTY_FORM, usuarioId: currentUserId ?? 0 });
    setIsOpen(true);
  };

  const openEdit = (p: Producto) => {
    setFormData({ ...p });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) return;
    setSaving(true);
    try {
      await saveProducto(formData, currentUserId);
      toast.success(
        formData.id ? 'Producto actualizado con éxito.' : 'Producto creado con éxito.'
      );
      setIsOpen(false);
      await cargarDatos();
    } catch {
      toast.error('Ocurrió un error al intentar guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    openConfirm({
      title: '¿Eliminar este producto?',
      description: 'Esta acción no se puede deshacer. El producto se borrará permanentemente del inventario.',
      onConfirm: async () => {
        try {
          await deleteProducto(id)
          toast.success('Producto eliminado correctamente.')
          await cargarDatos()
        } catch {
          toast.error('No se pudo eliminar. Puede estar referenciado en algún documento.')
        }
      },
    })
  }

  // ─── Helpers de formulario ───────────────────────────────────────────────

  const set = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const nombreCategoria = (id?: number | null) =>
    categorias.find((c) => c.id === id)?.nombre ?? '—';

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className='animate-in fade-in-0 space-y-6 p-6'>
      {/* ── Encabezado ── */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-royal-blue text-3xl font-bold tracking-tight'>
            Productos
          </h1>
          <p className='mt-1 text-sm text-slate-500'>
            Gestiona tu catálogo de productos
          </p>
        </div>
        <Button
          className='bg-vibrant-orange hover:bg-vibrant-orange/90 text-white'
          onClick={openCreate}
        >
          <Plus className='mr-2 h-4 w-4' />
          Nuevo Producto
        </Button>
      </div>

      {/* ── Barra de búsqueda ── */}
      <div className='relative max-w-sm'>
        <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400' />
        <Input
          className='pl-9'
          placeholder='Buscar por nombre o código...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Tabla ── */}
      <div className='overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'>
        <Table>
          <TableHeader className='bg-slate-50'>
            <TableRow>
              <TableHead className='w-[90px] font-semibold text-slate-700'>Código</TableHead>
              <TableHead className='font-semibold text-slate-700'>Nombre</TableHead>
              <TableHead className='font-semibold text-slate-700'>Tipo</TableHead>
              <TableHead className='font-semibold text-slate-700'>Categoría</TableHead>
              <TableHead className='font-semibold text-slate-700'>U.M.</TableHead>
              <TableHead className='text-right font-semibold text-slate-700'>
                P. Venta
              </TableHead>
              <TableHead className='text-right font-semibold text-slate-700'>
                P. Compra
              </TableHead>
              <TableHead className='text-right font-semibold text-slate-700'>
                Stock
              </TableHead>
              <TableHead className='text-right font-semibold text-slate-700'>
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className='h-28 text-center text-slate-400'>
                  <div className='flex items-center justify-center gap-2'>
                    <span className='inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600' />
                    Cargando catálogo...
                  </div>
                </TableCell>
              </TableRow>
            ) : productosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className='h-28 text-center text-slate-400'>
                  {search
                    ? 'No se encontraron coincidencias.'
                    : 'No hay productos registrados. Haz clic en "Nuevo Producto" para empezar.'}
                </TableCell>
              </TableRow>
            ) : (
              productosFiltrados.map((p) => {
                const alerta = stockEnAlerta(p);
                return (
                  <TableRow key={p.id} className='transition-colors hover:bg-slate-50'>
                    {/* Código */}
                    <TableCell className='font-mono text-xs text-slate-500'>
                      {p.codigo || '—'}
                    </TableCell>

                    {/* Nombre */}
                    <TableCell className='font-medium text-slate-900'>{p.nombre}</TableCell>

                    {/* Tipo Badge */}
                    <TableCell>
                      {p.tipo === 'B' ? (
                        <Badge className='gap-1 border-blue-200 bg-blue-50 text-blue-700'>
                          <Package className='h-3 w-3' />
                          Bien
                        </Badge>
                      ) : (
                        <Badge className='gap-1 border-violet-200 bg-violet-50 text-violet-700'>
                          <Wrench className='h-3 w-3' />
                          Servicio
                        </Badge>
                      )}
                    </TableCell>

                    {/* Categoría */}
                    <TableCell className='text-sm text-slate-600'>
                      {nombreCategoria(p.categoriaId)}
                    </TableCell>

                    {/* Unidad de Medida */}
                    <TableCell className='text-sm text-slate-500'>{p.unidadMedida}</TableCell>

                    {/* Precio Venta */}
                    <TableCell className='text-right text-sm font-semibold text-slate-800'>
                      S/ {Number(p.precioVenta).toFixed(2)}
                    </TableCell>

                    {/* Precio Compra */}
                    <TableCell className='text-right text-sm text-slate-600'>
                      {p.precioCompra != null ? `S/ ${Number(p.precioCompra).toFixed(2)}` : '—'}
                    </TableCell>

                    {/* Stock con alerta */}
                    <TableCell className='text-right'>
                      {p.tipo === 'B' ? (
                        <span
                          className={`inline-flex items-center gap-1 text-sm font-medium ${alerta ? 'text-red-600' : 'text-slate-700'
                            }`}
                        >
                          {alerta && <AlertTriangle className='h-3.5 w-3.5' />}
                          {p.stockActual ?? '0'}
                        </span>
                      ) : (
                        <span className='text-sm text-slate-400'>N/A</span>
                      )}
                    </TableCell>

                    {/* Acciones */}
                    <TableCell className='text-right'>
                      <div className='flex justify-end gap-1'>
                        <Button
                          variant='outline'
                          size='icon'
                          title='Editar'
                          onClick={() => openEdit(p)}
                        >
                          <Edit className='h-4 w-4 text-slate-600' />
                        </Button>
                        <Button
                          variant='destructive'
                          size='icon'
                          title='Eliminar'
                          onClick={() => handleDelete(p.id!)}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Resumen de contadores ── */}
      {!loading && productosFiltrados.length > 0 && (
        <p className='text-xs text-slate-400'>
          Mostrando{' '}
          <span className='font-medium text-slate-600'>{productosFiltrados.length}</span>{' '}
          registro(s) —{' '}
          <span className='text-blue-600'>
            {productosFiltrados.filter((p) => p.tipo === 'B').length} Bienes
          </span>{' '}
          /{' '}
          <span className='text-violet-600'>
            {productosFiltrados.filter((p) => p.tipo === 'S').length} Servicios
          </span>
        </p>
      )}

      {/* ── Modal Crear / Editar ── */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[600px]'>
          <DialogHeader>
            <DialogTitle className='text-xl font-bold'>
              {formData.id ? ' Editar Producto' : ' Nuevo Producto / Servicio'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className='mt-4 space-y-5'>
            {/* ── Fila 1: Nombre + Código ── */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
              <div className='space-y-1.5 sm:col-span-2'>
                <Label htmlFor='nombre'>
                  Nombre <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='nombre'
                  required
                  placeholder='Ej: Laptop Asus VivoBook 15'
                  value={formData.nombre}
                  onChange={(e) => set('nombre', e.target.value)}
                />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='codigo'>Código</Label>
                <Input
                  id='codigo'
                  placeholder='Ej: PROD-001'
                  value={formData.codigo ?? ''}
                  onChange={(e) => set('codigo', e.target.value)}
                />
              </div>
            </div>

            {/* ── Fila 2: Tipo + Categoría ── */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div className='space-y-1.5'>
                <Label htmlFor='tipo'>
                  Tipo <span className='text-red-500'>*</span>
                </Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(v) => {
                    set('tipo', v as 'B' | 'S');
                    // Auto-ajustar unidad de medida según tipo
                    if (v === 'S') set('unidadMedida', 'ZZ');
                    else if (formData.unidadMedida === 'ZZ') set('unidadMedida', 'NIU');
                  }}
                >
                  <SelectTrigger id='tipo'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='B'>
                      <span className='flex items-center gap-2'>
                        <Package className='h-4 w-4 text-blue-600' /> Bien
                      </span>
                    </SelectItem>
                    <SelectItem value='S'>
                      <span className='flex items-center gap-2'>
                        <Wrench className='h-4 w-4 text-violet-600' /> Servicio
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor='categoriaId'>Categoría</Label>
                <Select
                  value={formData.categoriaId?.toString() ?? '__none__'}
                  onValueChange={(v) =>
                    set('categoriaId', v === '__none__' ? null : Number(v))
                  }
                >
                  <SelectTrigger id='categoriaId'>
                    <SelectValue placeholder='Sin categoría' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='__none__'>Sin categoría</SelectItem>
                    {categorias.map((c) => (
                      <SelectItem key={c.id} value={c.id!.toString()}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── Fila 3: Unidad de Medida + Afecto IGV ── */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div className='space-y-1.5'>
                <Label htmlFor='unidadMedida'>
                  Unidad de Medida <span className='text-red-500'>*</span>
                </Label>
                <Select
                  disabled={formData.tipo === 'S'} // <-- EL BLOQUEO
                  value={formData.tipo === 'S' ? 'ZZ' : formData.unidadMedida} // <-- FUERZA EL VALOR VISUAL
                  onValueChange={(v) => set('unidadMedida', v)}
                >
                  <SelectTrigger
                    id='unidadMedida'
                    className={formData.tipo === 'S' ? 'bg-slate-50 text-slate-500' : ''}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIDADES.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Mensaje de ayuda visual (UX) */}
                {formData.tipo === 'S' && (
                  <p className="text-[11px] text-violet-600 mt-1 font-medium">
                    * Los servicios usan la unidad ZZ por defecto (SUNAT).
                  </p>
                )}
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor='afectoIgv'>Afecto a IGV</Label>
                <Select
                  value={formData.afectoIgv ? 'true' : 'false'}
                  onValueChange={(v) => set('afectoIgv', v === 'true')}
                >
                  <SelectTrigger id='afectoIgv'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='true'>Sí (Gravado)</SelectItem>
                    <SelectItem value='false'>No (Exonerado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── Fila 4: Precio Venta + Precio Compra ── */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div className='space-y-1.5'>
                <Label htmlFor='precioVenta'>
                  Precio de Venta (S/) <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='precioVenta'
                  type='number'
                  required
                  min={0}
                  step='0.01'
                  placeholder='0.00'
                  value={formData.precioVenta}
                  onChange={(e) => {
                    const nuevoPrecioVenta = Number(e.target.value);
                    set('precioVenta', nuevoPrecioVenta);

                    // UX: Si el precio de venta baja, obligamos al de compra a bajar también
                    // CORRECCIÓN TYPESCRIPT: Verificamos que sea un número válido en lugar de null/undefined
                    if (typeof formData.precioCompra === 'number' && formData.precioCompra > nuevoPrecioVenta) {
                      set('precioCompra', nuevoPrecioVenta);
                    }
                  }}
                />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='precioCompra'>Precio de Compra (S/)</Label>
                <Input
                  id='precioCompra'
                  type='number'
                  min={0}
                  max={formData.precioVenta || ''}
                  step='0.01'
                  placeholder='0.00'
                  value={formData.precioCompra ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : Number(e.target.value);

                    // UX: Si digitan un valor mayor al de venta, lo topamos al máximo permitido
                    if (val !== null && val > formData.precioVenta) {
                      set('precioCompra', formData.precioVenta);
                    } else {
                      set('precioCompra', val);
                    }
                  }}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  * No puede ser mayor al precio de venta.
                </p>
              </div>
            </div>

            {/* ── Fila 5: Stock (solo para Bienes) ── */}
            {formData.tipo === 'B' && (
              <div className='grid grid-cols-1 gap-4 rounded-lg border border-blue-100 bg-blue-50/50 p-4 sm:grid-cols-2'>
                <div className='space-y-1.5'>
                  <Label htmlFor='stockActual' className='text-blue-800'>
                    Stock Actual
                  </Label>
                  <Input
                    id='stockActual'
                    type='number'
                    min={0}
                    step='0.01'
                    placeholder='0'
                    value={formData.stockActual ?? ''}
                    onChange={(e) =>
                      set('stockActual', e.target.value === '' ? null : Number(e.target.value))
                    }
                  />
                </div>
                <div className='space-y-1.5'>
                  <Label htmlFor='stockMinimo' className='text-blue-800'>
                    Stock Mínimo
                    <span className='ml-1 text-xs font-normal text-blue-500'>
                      (alerta de reposición)
                    </span>
                  </Label>
                  <Input
                    id='stockMinimo'
                    type='number'
                    min={0}
                    step='0.01'
                    placeholder='0'
                    value={formData.stockMinimo ?? ''}
                    onChange={(e) =>
                      set('stockMinimo', e.target.value === '' ? null : Number(e.target.value))
                    }
                  />
                </div>
              </div>
            )}

            {/* ── Botón de envío ── */}
            <Button
              type='submit'
              disabled={saving}
              className='bg-royal-blue hover:bg-royal-blue/90 w-full text-white'
            >
              {saving ? (
                <span className='flex items-center gap-2'>
                  <span className='inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                  Guardando...
                </span>
              ) : formData.id ? (
                'Guardar Cambios'
              ) : (
                'Registrar Producto'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
