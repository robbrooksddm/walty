import {sanity} from '@/sanity/lib/client'

export async function sanityFetch<QueryT>(
  query: string,
  params: Record<string, any> = {},
) {
  return sanity.fetch<QueryT>(query, params, {
    next: {revalidate: 60},
  })
}
