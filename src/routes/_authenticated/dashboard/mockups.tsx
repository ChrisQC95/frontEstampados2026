import { createFileRoute } from '@tanstack/react-router'
import MockupsPage from '@/features/mockups'

export const Route = createFileRoute('/_authenticated/dashboard/mockups')({
  component: () => <MockupsPage />,
})
