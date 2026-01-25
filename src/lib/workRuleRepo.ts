import type { WorkRule } from '../domain/workRule'
import { getMyWorkRule, upsertMyWorkRule } from './graph/workRule'
import { getSharePointSiteId, getWorkRuleListId } from './graph/config'
import { listListColumns, type ListColumnInfo } from './graph/listColumns'

export async function fetchMyWorkRule(): Promise<WorkRule> {
  return await getMyWorkRule()
}

export async function saveMyWorkRule(rule: WorkRule): Promise<void> {
  await upsertMyWorkRule(rule)
}

export async function fetchWorkRuleListColumns(): Promise<ListColumnInfo[]> {
  const siteId = getSharePointSiteId()
  const listId = getWorkRuleListId()
  return await listListColumns({ siteId, listId })
}
