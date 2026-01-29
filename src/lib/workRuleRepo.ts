import type { WorkRule } from '../domain/workRule'
import { getMyWorkRule, upsertMyWorkRule } from './graph/workRule'

export async function fetchMyWorkRule(): Promise<WorkRule> {
  return await getMyWorkRule()
}

export async function saveMyWorkRule(rule: WorkRule): Promise<void> {
  await upsertMyWorkRule(rule)
}
