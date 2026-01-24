import { getSignedInAccount } from '../../auth/msalInstance'
import { graphFetch } from './graphClient'
import { getPunchListId, getSharePointSiteId } from './config'

export type PunchType = 'start' | 'end'

export type PunchItem = {
  id: string
  type: PunchType
  date: string // YYYY-MM-DD (Tokyo)
  time: string // HH:mm:ss (Tokyo)
  note?: string
  userObjectId?: string
}

type GraphListItem = {
  id: string
  fields?: Record<string, unknown>
}

type ListItemsResponse = {
  value: GraphListItem[]
}

function toPunchItem(item: GraphListItem): PunchItem | null {
  const fields = item.fields ?? {}

  const type = fields['PunchType']
  const date = fields['PunchDate']
  const time = fields['PunchTime']
  const note = fields['Note']
  const userObjectId = fields['UserObjectId']

  if (type !== 'start' && type !== 'end') return null
  if (typeof date !== 'string' || typeof time !== 'string') return null

  const normalizedDate = date.includes('T') ? date.slice(0, 10) : date

  return {
    id: item.id,
    type,
    date: normalizedDate,
    time,
    note: typeof note === 'string' ? note : undefined,
    userObjectId: typeof userObjectId === 'string' ? userObjectId : undefined,
  }
}

export async function createPunch(params: {
  type: PunchType
  date: string
  time: string
  note?: string
}): Promise<void> {
  const siteId = getSharePointSiteId()
  const listId = getPunchListId()

  const account = getSignedInAccount()
  if (!account) throw new Error('Not signed in')

  const fields: Record<string, unknown> = {
    Title: `${params.date} ${params.type}`,
    PunchType: params.type,
    PunchDate: params.date,
    PunchTime: params.time,
    UserObjectId: account.localAccountId,
    UserPrincipalName: account.username,
  }

  if (params.note) fields['Note'] = params.note

  await graphFetch(`/sites/${siteId}/lists/${listId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
}

export async function listMyPunchesForDate(params: { date: string }): Promise<PunchItem[]> {
  const siteId = getSharePointSiteId()
  const listId = getPunchListId()

  const account = getSignedInAccount()
  if (!account) throw new Error('Not signed in')

  // 低トラフィック前提: まずは直近を取得してクライアントでフィルタ。
  // 将来的には OData filter でサーバー側絞り込みに変更可能。
  const res = await graphFetch<ListItemsResponse>(
    `/sites/${siteId}/lists/${listId}/items` +
      `?$top=200&$orderby=createdDateTime desc&$expand=fields($select=PunchType,PunchDate,PunchTime,Note,UserObjectId)`,
  )

  return res.value
    .map(toPunchItem)
    .filter((x): x is PunchItem => !!x)
    .filter((x) => x.date === params.date)
    .filter((x) => x.userObjectId === account.localAccountId)
}
