import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Save, Store, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';

import { getEmpresaPerfil, saveEmpresaPerfil, uploadImageFile } from './api';
import type { EmpresaPerfilDTO } from './types';

// Estado inicial vacío para el formulario
const EMPTY_FORM: EmpresaPerfilDTO = {
  usuarioId: 0,
  ruc: '',
  razonSocial: '',
  nombreComercial: '',
  direccionFiscal: '',
  telefono: '',
  emailContacto: '',
  logoUrl: '',
};

/**
 * Mapea un DTO del backend al estado del formulario,
 * normalizando nulls a string vacío para evitar inputs no controlados.
 */
function dtoToForm(data: EmpresaPerfilDTO): EmpresaPerfilDTO {
  return {
    usuarioId: data.usuarioId ?? 0,
    ruc: data.ruc ?? '',
    razonSocial: data.razonSocial ?? '',
    nombreComercial: data.nombreComercial ?? '',
    direccionFiscal: data.direccionFiscal ?? '',
    telefono: data.telefono ?? '',
    emailContacto: data.emailContacto ?? '',
    // Este es el campo clave: si el backend devuelve null, lo dejamos
    // como string vacío para que el JSX muestre el fallback <Store />
    logoUrl: data.logoUrl ?? '',
  };
}

export default function PerfilEmpresa() {
  // empresaPerfil viene del AuthContext y ya se cargó al hacer login/F5.
  // Es nuestra fuente de verdad para la carga inicial.
  const { dbUser, empresaPerfil, setEmpresaPerfil } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<EmpresaPerfilDTO>(EMPTY_FORM);

  // ─────────────────────────────────────────────────────────────────────────────
  // ESTRATEGIA DE CARGA INICIAL (Fix principal del bug de F5)
  //
  // Problema anterior: el useEffect dependía de dbUser?.id, pero al hacer F5
  // el AuthContext tarda en cargar dbUser y empresaPerfil. Si el componente
  // se montaba antes de que llegaran, setForm(EMPTY_FORM) quedaba como estado
  // final y la imagen no aparecía.
  //
  // Solución: usamos dos efectos separados:
  //   1. Si empresaPerfil ya existe en el context (cargado por AuthContext),
  //      lo usamos INMEDIATAMENTE para poblar el formulario.
  //   2. Si no existe todavía (aún se está cargando), esperamos a que dbUser
  //      esté disponible y hacemos el fetch nosotros mismos.
  // ─────────────────────────────────────────────────────────────────────────────

  const populateForm = useCallback((data: EmpresaPerfilDTO) => {
    setForm(dtoToForm(data));
    setLoading(false);
  }, []);

  // Efecto 1: Aprovechar empresaPerfil si el AuthContext ya lo tiene en memoria.
  // Esto es lo que funciona tras el F5 cuando AuthContext termina de cargar
  // ANTES de que el usuario navegue a esta página.
  useEffect(() => {
    if (empresaPerfil) {
      populateForm(empresaPerfil);
    }
  }, [empresaPerfil, populateForm]);

  // Efecto 2: Si el empresaPerfil del context aún no llegó pero ya tenemos
  // el dbUser, hacemos el fetch directamente desde este componente.
  // Esto cubre el caso de navegación directa por URL (F5 en esta página).
  useEffect(() => {
    // Si el context ya tiene el perfil, el Efecto 1 ya lo manejó
    if (empresaPerfil) return;
    // Sin usuario aún, esperamos
    if (!dbUser?.id) return;

    setLoading(true);
    getEmpresaPerfil(dbUser.id)
      .then((data) => {
        populateForm(data);
        // También actualizamos el context para que el Sidebar y otros
        // componentes reflejen el logo sin hacer otro fetch
        setEmpresaPerfil(data);
      })
      .catch(() => {
        toast.error('Error al cargar el perfil de empresa');
        setLoading(false);
      });
  }, [dbUser?.id, empresaPerfil, populateForm, setEmpresaPerfil]);

  // ─────────────────────────────────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'general'); // → logos/general/uuid.ext en Supabase
      const uploadedUrl = await uploadImageFile(formData);

      // Actualizar solo el logoUrl en el estado del formulario
      setForm((prev) => ({ ...prev, logoUrl: uploadedUrl }));
      toast.success('Imagen subida correctamente');
    } catch {
      toast.error('Error al subir la imagen. Intenta de nuevo.');
    } finally {
      setUploadingLogo(false);
      // Limpiar el input para permitir re-seleccionar el mismo archivo
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbUser?.id) return;

    setSaving(true);
    try {
      const updated = await saveEmpresaPerfil({ ...form, usuarioId: dbUser.id });
      // Actualizar el context para que el Sidebar refleje el cambio inmediatamente
      setEmpresaPerfil(updated);
      // Sincronizar el form con la respuesta del servidor (la fuente de verdad)
      setForm(dtoToForm(updated));
      toast.success('Perfil actualizado correctamente');
    } catch {
      toast.error('Ocurrió un error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='flex h-40 items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className='grid grid-cols-1 gap-6 md:grid-cols-3'>
      {/* Columna Izquierda: Logo */}
      <div className='space-y-6 md:col-span-1'>
        <Card>
          <CardHeader>
            <CardTitle>Logo de la Empresa</CardTitle>
            <CardDescription>Sube un logotipo para tu empresa</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col items-center space-y-4'>
            {/* Contenedor de previsualización del logo */}
            <div className='flex aspect-square w-48 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-muted'>
              {uploadingLogo ? (
                // Estado: subiendo imagen al servidor
                <div className='flex flex-col items-center gap-2 text-muted-foreground'>
                  <Loader2 className='h-8 w-8 animate-spin' />
                  <span className='text-xs'>Subiendo...</span>
                </div>
              ) : form.logoUrl ? (
                // Estado: hay URL guardada → mostrar imagen de Supabase
                // Al ser un bucket público, no requiere tokens ni encabezados
                <img
                  src={form.logoUrl}
                  alt='Logo de la empresa'
                  className='h-full w-full object-cover'
                  onError={(e) => {
                    // Si la URL da error (ej. imagen borrada de Supabase),
                    // mostrar el fallback ocultando el img roto
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                // Estado: sin logo configurado → ícono de fallback
                <Store className='h-16 w-16 text-muted-foreground opacity-50' />
              )}
            </div>

            <input
              type='file'
              accept='image/*'
              className='hidden'
              ref={fileInputRef}
              onChange={handleImageChange}
            />
            <Button
              type='button'
              variant='outline'
              onClick={() => fileInputRef.current?.click()}
              className='w-full'
              disabled={uploadingLogo}
            >
              {uploadingLogo ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <UploadCloud className='mr-2 h-4 w-4' />
              )}
              {uploadingLogo ? 'Subiendo...' : 'Cambiar Imagen'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Columna Derecha: Datos */}
      <div className='space-y-6 md:col-span-2'>
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
            <CardDescription>
              Actualiza los datos de facturación y contacto de tu negocio.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='ruc'>RUC</Label>
                <Input
                  id='ruc'
                  name='ruc'
                  placeholder='Ej. 20123456789'
                  value={form.ruc}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='razonSocial'>Razón Social</Label>
                <Input
                  id='razonSocial'
                  name='razonSocial'
                  placeholder='Sabiduría'
                  value={form.razonSocial}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='nombreComercial'>Nombre Comercial</Label>
                <Input
                  id='nombreComercial'
                  name='nombreComercial'
                  placeholder='Mi Tienda'
                  value={form.nombreComercial}
                  onChange={handleChange}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='direccionFiscal'>Dirección Fiscal</Label>
                <Input
                  id='direccionFiscal'
                  name='direccionFiscal'
                  placeholder='Av. Principal 123'
                  value={form.direccionFiscal}
                  onChange={handleChange}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='telefono'>Teléfono</Label>
                <Input
                  id='telefono'
                  name='telefono'
                  placeholder='987654321'
                  value={form.telefono}
                  onChange={handleChange}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='emailContacto'>Email de Contacto</Label>
                <Input
                  id='emailContacto'
                  name='emailContacto'
                  type='email'
                  placeholder='contacto@miempresa.com'
                  value={form.emailContacto}
                  onChange={handleChange}
                />
              </div>
              <div className='space-y-2 md:col-span-2'>
                <Label htmlFor='emailAcceso' className='text-muted-foreground'>
                  Email de Acceso (No editable)
                </Label>
                <Input
                  id='emailAcceso'
                  type='email'
                  value={dbUser?.email ?? ''}
                  disabled
                  className='cursor-not-allowed bg-muted text-muted-foreground'
                />
              </div>
            </div>

            <div className='flex justify-end pt-4'>
              <Button type='submit' disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className='mr-2 h-4 w-4' />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
