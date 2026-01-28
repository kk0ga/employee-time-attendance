import { graphFetch } from './graphClient'
import { getSharePointSiteId, getWorkCategoryListId } from './config'

type GraphListItem = {
  id: string
  fields?: Record<string, unknown>
}

type ListItemsResponse = {
  value: GraphListItem[]
}

type WorkCategoryItem = {
  id: string
  title: string
}

function toWorkCategoryItem(item: GraphListItem): WorkCategoryItem | null {
  const fields = item.fields ?? {}
  const title = fields['Title']
  if (typeof title !== 'string') return null
  return { id: item.id, title }
}

export async function listWorkCategories(): Promise<WorkCategoryItem[]> {
  const siteId = getSharePointSiteId()
  const listId = getWorkCategoryListId()

  const res = await graphFetch<ListItemsResponse>(
    `/sites/${siteId}/lists/${listId}/items` +
      `?$top=200&$expand=fields($select=Title)`,
  )

  return res.value.map(toWorkCategoryItem).filter((item): item is WorkCategoryItem => !!item)
}
