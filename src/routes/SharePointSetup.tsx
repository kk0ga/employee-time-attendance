import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { listLists, resolveSiteByUrl, searchSites, type SharePointList } from '../lib/graph/sharepointDiscovery'
import { Section } from '../components/ui/Section'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Table, Th, Td } from '../components/ui/Table'
import { ErrorMessage } from '../components/ui/ErrorMessage'

function normalizeUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  return `https://${trimmed}`
}

export function SharePointSetup() {
  const [siteUrl, setSiteUrl] = useState('')
  const [siteSearch, setSiteSearch] = useState('')
  const [selectedSiteId, setSelectedSiteId] = useState<string>('')
  const [listNameFilter, setListNameFilter] = useState('')

  const resolveSiteMutation = useMutation({
    mutationFn: async () => {
      const url = normalizeUrl(siteUrl)
      if (!url) throw new Error('サイトURLを入力してください。')
      return await resolveSiteByUrl(url)
    },
    onSuccess: (site) => {
      setSelectedSiteId(site.id)
    },
  })

  const sitesQuery = useQuery({
    queryKey: ['sharepoint-sites-search', siteSearch],
    queryFn: () => searchSites(siteSearch),
    enabled: siteSearch.trim().length >= 2,
  })

  const listsQuery = useQuery({
    queryKey: ['sharepoint-lists', selectedSiteId],
    queryFn: () => listLists(selectedSiteId),
    enabled: !!selectedSiteId,
  })

  const filteredLists = useMemo((): SharePointList[] => {
    const lists = listsQuery.data ?? []
    const q = listNameFilter.trim().toLowerCase()
    if (!q) return lists
    return lists.filter((l) => (l.displayName ?? l.name ?? '').toLowerCase().includes(q))
  }, [listNameFilter, listsQuery.data])

  const onCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
  }

  const envSnippet = useMemo(() => {
    if (!selectedSiteId) return ''
    return (
      `VITE_SP_SITE_ID=${selectedSiteId}` +
      `\nVITE_SP_PUNCH_LIST_ID=<Punches listId>` +
      `\nVITE_SP_ATTENDANCE_LIST_ID=<Attendance listId>` +
      `\nVITE_SP_WORK_RULE_LIST_ID=<WorkRule listId>`
    )
  }, [selectedSiteId])

  return (
    <main className="mx-auto w-full max-w-[960px] p-4">
      <h1>SharePoint 設定</h1>
      <p className="mt-1 opacity-80">
        ※この画面はIDを「表示してコピーする」用途です（.env へ自動保存はできません）
      </p>

      <Section title="1) siteId を取得（URLから）" className="mt-4">
        <label className="grid gap-1.5 font-bold">
          <span>サイトURL</span>
          <Input
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            placeholder="例: https://contoso.sharepoint.com/sites/Attendance"
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            onClick={() => resolveSiteMutation.mutate()}
            disabled={resolveSiteMutation.isPending}
          >
            {resolveSiteMutation.isPending ? '取得中…' : 'siteId を取得'}
          </Button>
        </div>

        {resolveSiteMutation.isError && (
          <ErrorMessage
            title="取得に失敗しました"
            error={resolveSiteMutation.error}
          />
        )}

        {resolveSiteMutation.data ? (
          <div className="mt-4 grid gap-1.5 rounded-[8px] border border-[#8883] p-3">
            <div>
              <strong>siteId:</strong> {resolveSiteMutation.data.id}{' '}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopy(resolveSiteMutation.data!.id)}
              >
                コピー
              </Button>
            </div>
            {resolveSiteMutation.data.webUrl ? <div>webUrl: {resolveSiteMutation.data.webUrl}</div> : null}
          </div>
        ) : null}
      </Section>

      <Section title="代替) サイト検索（名前/キーワード）" className="mt-4">
        <label className="grid gap-1.5 font-bold">
          <span>検索キーワード（2文字以上）</span>
          <Input
            value={siteSearch}
            onChange={(e) => setSiteSearch(e.target.value)}
            placeholder="例: Attendance"
          />
        </label>

        {sitesQuery.isFetching ? <p className="mt-2">検索中...</p> : null}
        {sitesQuery.isError && (
          <ErrorMessage
            title="検索に失敗しました"
            error={sitesQuery.error}
          />
        )}

        {(sitesQuery.data?.length ?? 0) > 0 ? (
          <ul className="mt-4 grid gap-2">
            {(sitesQuery.data ?? []).slice(0, 20).map((s) => (
              <li key={s.id} className="flex items-start gap-2 rounded border border-[#8882] p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSiteId(s.id)}
                >
                  選択
                </Button>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold">
                    {s.name || '(no name)'}
                  </div>
                  <div className="truncate text-[12px] opacity-80">{s.webUrl}</div>
                  <div className="truncate text-[11px] opacity-60">ID: {s.id}</div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </Section>

      <Section title="2) listId を取得（サイト内のリスト一覧）" className="mt-4">
        <div className="grid gap-2.5">
          <div className="rounded-[8px] bg-[#0001] p-2">
            <strong>選択中の siteId:</strong> {selectedSiteId || '（未選択）'}{' '}
            {selectedSiteId ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopy(selectedSiteId)}
              >
                コピー
              </Button>
            ) : null}
          </div>

          <label className="grid gap-1.5 font-bold">
            <span>リスト名フィルタ（任意）</span>
            <Input
              value={listNameFilter}
              onChange={(e) => setListNameFilter(e.target.value)}
              placeholder="例: Punch"
              disabled={!selectedSiteId}
            />
          </label>
        </div>

        {listsQuery.isPending ? <p className="mt-2 text-center">読み込み中...</p> : null}
        {listsQuery.isError && (
          <ErrorMessage
            title="リスト一覧の取得に失敗しました"
            error={listsQuery.error}
          />
        )}

        {(filteredLists.length ?? 0) > 0 ? (
          <div className="mt-4 overflow-hidden rounded-[8px] border border-[#8883]">
            <Table className="w-full">
              <thead>
                <tr>
                  <Th>displayName</Th>
                  <Th>id (listId)</Th>
                  <Th>操作</Th>
                </tr>
              </thead>
              <tbody>
                {filteredLists.map((l) => (
                  <tr key={l.id}>
                    <Td>{l.displayName || l.name || '-'}</Td>
                    <Td className="font-mono text-[11px]">{l.id}</Td>
                    <Td>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCopy(l.id)}
                      >
                        コピー
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ) : null}
      </Section>

      <Section title=".env へ貼り付け" className="mt-4">
        {envSnippet ? (
          <div className="grid gap-2.5">
            <pre className="overflow-x-auto rounded-[8px] bg-[#0001] p-3 text-[13px]">
              {envSnippet}
            </pre>
            <Button
              variant="primary"
              onClick={() => onCopy(envSnippet)}
            >
              まとめてコピー
            </Button>
          </div>
        ) : (
          <p>siteId を取得/選択すると表示されます。</p>
        )}
      </Section>
    </main>
  )
}
