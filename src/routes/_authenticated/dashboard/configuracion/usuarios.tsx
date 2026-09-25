import { createFileRoute } from '@tanstack/react-router'
import UsuariosPage from '@/features/usuarios'

export const Route = createFileRoute(
  '/_authenticated/dashboard/configuracion/usuarios',
)({
  component: () => <UsuariosPage />,
})
