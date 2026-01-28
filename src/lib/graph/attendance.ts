import { getSignedInAccount } from '../../auth/msalInstance'
import type { AttendanceMonth } from '../../domain/attendance'
import { daysInMonthUtc, formatYyyyMmDd, weekdayUtc } from '../tokyoDate'
import { graphFetch } from './graphClient'
import { getAttendanceListId, getSharePointSiteId } from './config'

type GraphListItem = {
  id: string
  fields?: Record<string, unknown>
}

type ListItemsResponse = {
  value: GraphListItem[]
}

type AttendanceFields = {
  id?: string
  date: string
  start?: string
  end?: string
  workCategory?: string
  userObjectId?: string
}

function toAttendanceFields(item: GraphListItem): AttendanceFields | null {
  const fields = item.fields ?? {}

  const date = fields['AttendanceDate']
  const start = fields['StartTime']
  const end = fields['EndTime']
  const workCategory = fields['WorkCategory']
  const userObjectId = fields['UserObjectId']

  if (typeof date !== 'string') return null

  const normalizedDate = date.includes('T') ? date.slice(0, 10) : date

  return {
    id: item.id,
    date: normalizedDate,
    start: typeof start === 'string' ? start : undefined,
    end: typeof end === 'string' ? end : undefined,
    workCategory: typeof workCategory === 'string' ? workCategory : undefined,
    userObjectId: typeof userObjectId === 'string' ? userObjectId : undefined,
  }
}

export async function upsertAttendanceFromPunch(params: {
  date: string
  time: string
  type: 'start' | 'end'
}): Promise<void> {
  const siteId = getSharePointSiteId()
  const listId = getAttendanceListId()

  const account = getSignedInAccount()
  if (!account) throw new Error('Not signed in')

  const res = await graphFetch<ListItemsResponse>(
    `/sites/${siteId}/lists/${listId}/items` +
      `?$top=200&$orderby=createdDateTime desc&$expand=fields($select=AttendanceDate,StartTime,EndTime,WorkCategory,UserObjectId)`,
  )

  const existing = res.value
    .map(toAttendanceFields)
    .find(
      (item) =>
        item && item.date === params.date && item.userObjectId === account.localAccountId,
    )

  const fields: Record<string, unknown> = {
    AttendanceDate: params.date,
    UserObjectId: account.localAccountId,
  }

  if (params.type === 'start') {
    fields['StartTime'] = params.time
  } else {
    fields['EndTime'] = params.time
  }

  if (existing?.id) {
    await graphFetch(`/sites/${siteId}/lists/${listId}/items/${existing.id}/fields`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    return
  }

  await graphFetch(`/sites/${siteId}/lists/${listId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        Title: params.date,
        ...fields,
      },
    }),
  })
}

export async function upsertAttendanceCategory(params: {
  date: string
  workCategory: string | null
}): Promise<void> {
  const siteId = getSharePointSiteId()
  const listId = getAttendanceListId()

  const account = getSignedInAccount()
  if (!account) throw new Error('Not signed in')

  const res = await graphFetch<ListItemsResponse>(
    `/sites/${siteId}/lists/${listId}/items` +
      `?$top=200&$orderby=createdDateTime desc&$expand=fields($select=AttendanceDate,WorkCategory,UserObjectId)`,
  )

  const existing = res.value
    .map(toAttendanceFields)
    .find(
      (item) =>
        item && item.date === params.date && item.userObjectId === account.localAccountId,
    )

  const fields: Record<string, unknown> = {
    AttendanceDate: params.date,
    UserObjectId: account.localAccountId,
    WorkCategory: params.workCategory ?? null,
  }

  if (existing?.id) {
    await graphFetch(`/sites/${siteId}/lists/${listId}/items/${existing.id}/fields`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    return
  }

  await graphFetch(`/sites/${siteId}/lists/${listId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        Title: params.date,
        ...fields,
      },
    }),
  })
}

export async function listMyAttendanceMonth(params: {
  year: number
  month: number
}): Promise<AttendanceMonth> {
  const { year, month } = params

  const siteId = getSharePointSiteId()
  const listId = getAttendanceListId()

  const account = getSignedInAccount()
  if (!account) throw new Error('Not signed in')

  const res = await graphFetch<ListItemsResponse>(
    `/sites/${siteId}/lists/${listId}/items` +
      `?$top=400&$orderby=createdDateTime desc&$expand=fields($select=AttendanceDate,StartTime,EndTime,WorkCategory,UserObjectId)`,
  )

  const monthKey = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`
  const map = new Map<string, AttendanceFields>()

  for (const item of res.value) {
    const fields = toAttendanceFields(item)
    if (!fields) continue
    if (fields.userObjectId !== account.localAccountId) continue
    if (!fields.date.startsWith(monthKey)) continue
    if (!map.has(fields.date)) {
      map.set(fields.date, fields)
    }
  }

  const lastDay = daysInMonthUtc(year, month)
  const days = Array.from({ length: lastDay }, (_, index) => {
    const day = index + 1
    const date = formatYyyyMmDd(year, month, day)
    const weekday = weekdayUtc(year, month, day)
    const record = map.get(date)

    return {
      date,
      weekday,
      start: record?.start,
      end: record?.end,
      workCategory: record?.workCategory,
    }
  })

  return {
    year,
    month,
    days,
  }
}
