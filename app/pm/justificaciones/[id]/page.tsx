import { JustificationDetailView } from '@/features/pm/justifications/justification-detail-view'

interface JustificationDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function JustificationDetailPage({
  params,
}: JustificationDetailPageProps) {
  const { id } = await params
  return <JustificationDetailView justificationId={id} />
}
