import { graphFetch } from './graphClient'

type GraphChoiceColumn = {
  choices?: unknown
}

type GraphColumn = {
  name?: unknown
  displayName?: unknown
  required?: unknown
  // type-specific: Graph returns a discriminator-like object
  choice?: GraphChoiceColumn
  number?: unknown
  text?: unknown
  boolean?: unknown
  dateTime?: unknown
}

type ListColumnsResponse = {
  value: GraphColumn[]
}

export type ListColumnType = 'choice' | 'number' | 'text' | 'boolean' | 'dateTime' | 'unknown'

export type ListColumnInfo = {
  name: string
  displayName?: string
  required: boolean
  type: ListColumnType
  choices?: string[]
}

function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const strings = value.filter((x) => typeof x === 'string') as string[]
  return strings.length > 0 ? strings : undefined
}

function getColumnType(col: GraphColumn): ListColumnType {
  if (col.choice) return 'choice'
  if (col.number) return 'number'
  if (col.text) return 'text'
  if (col.boolean) return 'boolean'
  if (col.dateTime) return 'dateTime'
  return 'unknown'
}

export async function listListColumns(params: {
  siteId: string
  listId: string
}): Promise<ListColumnInfo[]> {
  const res = await graphFetch<ListColumnsResponse>(
    `/sites/${params.siteId}/lists/${params.listId}/columns?$top=200`,
  )

  return (res.value ?? [])
    .map((c): ListColumnInfo => {
      const name = typeof c.name === 'string' ? c.name : ''
      const displayName = typeof c.displayName === 'string' ? c.displayName : undefined
      const required = typeof c.required === 'boolean' ? c.required : false
      const type = getColumnType(c)
      const choices = c.choice ? toStringArray(c.choice.choices) : undefined
      return { name, displayName, required, type, choices }
    })
    .filter((c) => !!c.name)
}

export function toColumnMap(columns: ListColumnInfo[]): Map<string, ListColumnInfo> {
  return new Map(columns.map((c) => [c.name, c]))
}
