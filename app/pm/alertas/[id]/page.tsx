import { AlertDetailView } from '@/features/pm/alerts/alert-detail-view'

interface AlertDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AlertDetailPage({ params }: AlertDetailPageProps) {
  const { id } = await params
  return <AlertDetailView alertId={id} />
}
