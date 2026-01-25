function requiredEnv(name: string): string {
  const value = import.meta.env[name] as string | undefined
  if (!value) throw new Error(`Missing env: ${name}`)
  return value
}

export function getSharePointSiteId(): string {
  return requiredEnv('VITE_SP_SITE_ID')
}

export function getPunchListId(): string {
  return requiredEnv('VITE_SP_PUNCH_LIST_ID')
}

export function getAttendanceListId(): string {
  return requiredEnv('VITE_SP_ATTENDANCE_LIST_ID')
}

export function getWorkRuleListId(): string {
  return requiredEnv('VITE_SP_WORK_RULE_LIST_ID')
}

export function getGraphScopes(): string[] {
  const raw = requiredEnv('VITE_GRAPH_SCOPES')
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}
