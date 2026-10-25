import { createFileRoute } from '@tanstack/react-router'

import LoginSistema from '@/features/auth/login-sistema'

export const Route = createFileRoute('/login')({
  component: LoginSistema,
})
