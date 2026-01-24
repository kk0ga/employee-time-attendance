import { graphFetch } from './graphClient'

export type SharePointSite = {
  id: string
  name?: string
  webUrl?: string
}

export type SharePointList = {
  id: string
  displayName?: string
  name?: string
}

type GraphSiteResponse = {
  id: string
  name?: string
  webUrl?: string
}

type SearchSitesResponse = {
  value: GraphSiteResponse[]
}

type ListListsResponse = {
  value: SharePointList[]
}

export function parseSharePointSiteUrl(siteUrl: string): {
  hostname: string
  sitePath: string
} {
  const url = new URL(siteUrl)
  const hostname = url.hostname

  // ex: /sites/Attendance
  // ex: /teams/Engineering
  const parts = url.pathname.split('/').filter(Boolean)
  if (parts.length < 2) {
    throw new Error('SharePointサイトURLは /sites/... または /teams/... の形式にしてください。')
  }

  const prefix = parts[0]
  if (prefix !== 'sites' && prefix !== 'teams') {
    throw new Error('SharePointサイトURLは /sites/... または /teams/... の形式にしてください。')
  }

  const siteName = parts[1]
  const sitePath = `/${prefix}/${siteName}`

  return { hostname, sitePath }
}

export async function resolveSiteByUrl(siteUrl: string): Promise<SharePointSite> {
  const { hostname, sitePath } = parseSharePointSiteUrl(siteUrl)
  const site = await graphFetch<GraphSiteResponse>(`/sites/${hostname}:${sitePath}`)
  return { id: site.id, name: site.name, webUrl: site.webUrl }
}

export async function searchSites(query: string): Promise<SharePointSite[]> {
  const q = query.trim()
  if (!q) return []

  const res = await graphFetch<SearchSitesResponse>(`/sites?search=${encodeURIComponent(q)}`)
  return res.value.map((s) => ({ id: s.id, name: s.name, webUrl: s.webUrl }))
}

export async function listLists(siteId: string): Promise<SharePointList[]> {
  const res = await graphFetch<ListListsResponse>(
    `/sites/${siteId}/lists?$select=id,displayName,name&$top=200`,
  )
  return res.value
}
