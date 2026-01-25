import { getSignedInAccount } from '../../auth/msalInstance'
import { defaultWorkRule, type RoundingMode, type WorkRule } from '../../domain/workRule'
import { graphFetch } from './graphClient'
import { getSharePointSiteId, getWorkRuleListId } from './config'
import { listListColumns, toColumnMap } from './listColumns'

type GraphListItem = {
  id: string
  fields?: Record<string, unknown>
}

type ListItemsResponse = {
  value: GraphListItem[]
}

type WorkRuleFields = {
  id?: string
  userObjectId?: string
  scheduledDailyMinutes?: number
  breakMinutes?: number
  roundingUnitMinutes?: number
  roundStart?: RoundingMode
  roundEnd?: RoundingMode
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

function toRoundingMode(value: unknown): RoundingMode | undefined {
  if (value === 'none' || value === 'floor' || value === 'ceil' || value === 'nearest') return value
  return undefined
}

function toWorkRuleFields(item: GraphListItem): WorkRuleFields | null {
  const fields = item.fields ?? {}

  const userObjectId = fields['UserObjectId']
  const scheduledDailyMinutes = toNumber(fields['ScheduledDailyMinutes'])
  const breakMinutes = toNumber(fields['BreakMinutes'])
  const roundingUnitMinutes = toNumber(fields['RoundingUnitMinutes'])
  const roundStart = toRoundingMode(fields['RoundStart'])
  const roundEnd = toRoundingMode(fields['RoundEnd'])

  return {
    id: item.id,
    userObjectId: typeof userObjectId === 'string' ? userObjectId : undefined,
    scheduledDailyMinutes,
    breakMinutes,
    roundingUnitMinutes,
    roundStart,
    roundEnd,
  }
}

function sanitizeWorkRule(input: Partial<WorkRule>): WorkRule {
  const scheduledDailyMinutes =
    typeof input.scheduledDailyMinutes === 'number' && Number.isFinite(input.scheduledDailyMinutes)
      ? Math.max(0, Math.round(input.scheduledDailyMinutes))
      : defaultWorkRule.scheduledDailyMinutes

  const breakMinutes =
    typeof input.breakMinutes === 'number' && Number.isFinite(input.breakMinutes)
      ? Math.max(0, Math.round(input.breakMinutes))
      : defaultWorkRule.breakMinutes

  const roundingUnitMinutes =
    typeof input.roundingUnitMinutes === 'number' && Number.isFinite(input.roundingUnitMinutes)
      ? Math.max(0, Math.round(input.roundingUnitMinutes))
      : defaultWorkRule.roundingUnitMinutes

  const roundStart = input.roundStart ?? defaultWorkRule.roundStart
  const roundEnd = input.roundEnd ?? defaultWorkRule.roundEnd

  return {
    scheduledDailyMinutes,
    breakMinutes,
    roundingUnitMinutes,
    roundStart,
    roundEnd,
  }
}

export async function getMyWorkRule(): Promise<WorkRule> {
  const siteId = getSharePointSiteId()
  const listId = getWorkRuleListId()

  const account = getSignedInAccount()
  if (!account) throw new Error('Not signed in')

  const res = await graphFetch<ListItemsResponse>(
    `/sites/${siteId}/lists/${listId}/items` +
      `?$top=200&$orderby=createdDateTime desc&$expand=fields($select=UserObjectId,ScheduledDailyMinutes,BreakMinutes,RoundingUnitMinutes,RoundStart,RoundEnd)`,
  )

  const mine = res.value
    .map(toWorkRuleFields)
    .find((x) => x && x.userObjectId === account.localAccountId)

  return sanitizeWorkRule({
    scheduledDailyMinutes: mine?.scheduledDailyMinutes,
    breakMinutes: mine?.breakMinutes,
    roundingUnitMinutes: mine?.roundingUnitMinutes,
    roundStart: mine?.roundStart,
    roundEnd: mine?.roundEnd,
  })
}

export async function upsertMyWorkRule(rule: WorkRule): Promise<void> {
  const siteId = getSharePointSiteId()
  const listId = getWorkRuleListId()

  const account = getSignedInAccount()
  if (!account) throw new Error('Not signed in')

  const normalized = sanitizeWorkRule(rule)

  const columns = await listListColumns({ siteId, listId })
  const columnMap = toColumnMap(columns)

  const normalizeChoice = (value: RoundingMode, columnName: string): string => {
    const col = columnMap.get(columnName)
    if (!col || col.type !== 'choice') return value

    const choices = col.choices ?? []
    if (choices.length === 0) return value

    // if exact match exists, use it
    if (choices.includes(value)) return value

    const jpMap: Record<RoundingMode, string[]> = {
      none: ['なし', '無', 'なし（丸めなし）'],
      floor: ['切り捨て', '切捨て', '切り下げ', '切下げ'],
      ceil: ['切り上げ', '切上げ'],
      nearest: ['四捨五入'],
    }

    const candidates = jpMap[value] ?? []
    const match = candidates.find((c) => choices.includes(c))
    if (match) return match

    throw new Error(
      `${columnName} のChoice値が一致しません。許容値: ${choices.join(', ')}`,
    )
  }

  const numberOrString = (value: number, columnName: string): number | string => {
    const col = columnMap.get(columnName)
    if (!col) return value
    if (col.type === 'number') return value
    if (col.type === 'text' || col.type === 'choice') return String(value)
    return value
  }

  const res = await graphFetch<ListItemsResponse>(
    `/sites/${siteId}/lists/${listId}/items` +
      `?$top=200&$orderby=createdDateTime desc&$expand=fields($select=UserObjectId)`,
  )

  const existing = res.value
    .map(toWorkRuleFields)
    .find((x) => x && x.userObjectId === account.localAccountId)

  const fields: Record<string, unknown> = {
    UserObjectId: account.localAccountId,
    ScheduledDailyMinutes: numberOrString(normalized.scheduledDailyMinutes, 'ScheduledDailyMinutes'),
    BreakMinutes: numberOrString(normalized.breakMinutes, 'BreakMinutes'),
    RoundingUnitMinutes: numberOrString(normalized.roundingUnitMinutes, 'RoundingUnitMinutes'),
    RoundStart: normalizeChoice(normalized.roundStart, 'RoundStart'),
    RoundEnd: normalizeChoice(normalized.roundEnd, 'RoundEnd'),
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
        Title: account.username,
        ...fields,
      },
    }),
  })
}
