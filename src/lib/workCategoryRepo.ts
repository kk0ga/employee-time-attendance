import { listWorkCategories } from './graph/workCategories'

export async function fetchWorkCategories(): Promise<string[]> {
  const items = await listWorkCategories()
  const unique = new Set<string>()
  for (const item of items) {
    const trimmed = item.title.trim()
    if (!trimmed) continue
    unique.add(trimmed)
  }
  return Array.from(unique).sort((a, b) => a.localeCompare(b, 'ja'))
}
