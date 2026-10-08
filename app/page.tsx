import { redirect } from 'next/navigation'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const params = new URLSearchParams()
  for (const [key, val] of Object.entries(resolvedParams)) {
    if (typeof val === 'string') {
      params.set(key, val)
    }
  }
  const query = params.toString()
  redirect(query ? `/pm?${query}` : '/pm')
}

