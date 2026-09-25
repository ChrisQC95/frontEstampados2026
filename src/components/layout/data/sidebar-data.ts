import {
  Store,
  LayoutDashboard,
  Package,
  Users,
  FileText,
  PlusCircle,
  History,
  Settings,
  UserCog,
  Tags,
  Truck,
  IdCard,
  FileDigit,
  Landmark,
  ShieldCheck,
  Images,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'Usuario MYPE',
    email: 'admin@mype.com',
    avatar: '',
  },
  teams: [
    {
      name: 'Mi Empresa S.A.C.',
      logo: Store,
      plan: 'ERP Light',
    },
  ],
  navGroups: [
    {
      title: 'Principal',
      items: [
        {
          title: 'Dashboard',
          url: '/dashboard',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: 'Catálogos',
      items: [
        {
          title: 'Productos y Servicios',
          url: '/dashboard/productos',
          icon: Package,
        },
        {
          title: 'Categorías',
          url: '/dashboard/categorias',
          icon: Tags,
        },
        {
          title: 'Socios de Negocio',
          url: '/dashboard/socios',
          icon: Users,
        },
        {
          title: 'Series',
          url: '/dashboard/series',
          icon: FileDigit,
        },
      ],
    },
    {
      title: 'Logística',
      items: [
        {
          title: 'Vehículos',
          url: '/dashboard/vehiculos',
          icon: Truck,
        },
        {
          title: 'Conductores',
          url: '/dashboard/conductores',
          icon: IdCard,
        },
        {
          title: 'Mockups',
          url: '/dashboard/mockups',
          icon: Images,
        },
      ],
    },
    {
      title: 'Operaciones',
      items: [
        {
          title: 'Ventas',
          icon: FileText,
          items: [
            {
              title: 'Nueva Venta',
              url: '/dashboard/ventas/nueva',
              icon: PlusCircle,
            },
            {
              title: 'Historial de Ventas',
              url: '/dashboard/ventas/historial',
              icon: History,
            },
          ],
        },
      ],
    },
    {
      title: 'Administración',
      items: [
        {
          title: 'Configuración',
          icon: Settings,
          items: [
            {
              title: 'Mi Perfil',
              url: '/dashboard/configuracion/perfil',
              icon: UserCog,
            },
            {
              title: 'Cuentas Bancarias',
              url: '/dashboard/configuracion/cuentas-bancarias',
              icon: Landmark,
            },
            {
              title: 'Usuarios',
              url: '/dashboard/configuracion/usuarios',
              icon: ShieldCheck,
            },
          ],
        },
      ],
    },
  ],
}

