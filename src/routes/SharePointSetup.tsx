import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { listLists, resolveSiteByUrl, searchSites, type SharePointList } from '../lib/graph/sharepointDiscovery'
import { GraphRequestError } from '../lib/graph/graphClient'

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

  const resolveErrorMessage = useMemo(() => {
    const err = resolveSiteMutation.error
    if (!err) return null
    if (err instanceof GraphRequestError) {
      return `${err.message} (status=${err.status}${err.code ? `, code=${err.code}` : ''})`
    }
    if (err instanceof Error) return err.message
    return '不明なエラー'
  }, [resolveSiteMutation.error])

  const listsErrorMessage = useMemo(() => {
    const err = listsQuery.error
    if (!err) return null
    if (err instanceof GraphRequestError) {
      return `${err.message} (status=${err.status}${err.code ? `, code=${err.code}` : ''})`
    }
    if (err instanceof Error) return err.message
    return '不明なエラー'
  }, [listsQuery.error])

  return (
    <main className="app">
      <h1>SharePoint 設定（siteId / listId 取得）</h1>
      <p style={{ marginTop: 4, opacity: 0.8 }}>
        ※この画面はIDを「表示してコピーする」用途です（.env へ自動保存はできません）
      </p>

      <section style={{ border: '1px solid #8883', borderRadius: 12, padding: 12, marginTop: 16 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>1) siteId を取得（URLから）</h2>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>サイトURL</span>
          <input
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            placeholder="例: https://contoso.sharepoint.com/sites/Attendance"
            style={{ padding: 8 }}
          />
        </label>

        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => resolveSiteMutation.mutate()} disabled={resolveSiteMutation.isPending}>
            {resolveSiteMutation.isPending ? '取得中…' : 'siteId を取得'}
          </button>
        </div>

        {resolveSiteMutation.isError ? (
          <p style={{ color: '#b00', marginTop: 8 }}>取得に失敗しました: {resolveErrorMessage}</p>
        ) : null}

        {resolveSiteMutation.data ? (
          <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
            <div>
              <strong>siteId:</strong> {resolveSiteMutation.data.id}{' '}
              <button type="button" onClick={() => onCopy(resolveSiteMutation.data!.id)}>
                コピー
              </button>
            </div>
            {resolveSiteMutation.data.webUrl ? <div>webUrl: {resolveSiteMutation.data.webUrl}</div> : null}
          </div>
        ) : null}
      </section>

      <section style={{ border: '1px solid #8883', borderRadius: 12, padding: 12, marginTop: 16 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>代替) サイト検索（名前/キーワード）</h2>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>検索キーワード（2文字以上）</span>
          <input
            value={siteSearch}
            onChange={(e) => setSiteSearch(e.target.value)}
            placeholder="例: Attendance"
            style={{ padding: 8 }}
          />
        </label>

        {sitesQuery.isFetching ? <p style={{ marginTop: 8 }}>検索中...</p> : null}
        {sitesQuery.isError ? <p style={{ marginTop: 8, color: '#b00' }}>検索に失敗しました。</p> : null}

        {(sitesQuery.data?.length ?? 0) > 0 ? (
          <ul style={{ marginTop: 10, paddingLeft: 18, display: 'grid', gap: 6 }}>
            {(sitesQuery.data ?? []).slice(0, 20).map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => setSelectedSiteId(s.id)}>
                  このサイトを選択
                </button>{' '}
                {s.webUrl ?? s.name ?? '(no name)'}
                <div style={{ fontSize: 12, opacity: 0.8 }}>siteId: {s.id}</div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section style={{ border: '1px solid #8883', borderRadius: 12, padding: 12, marginTop: 16 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>2) listId を取得（サイト内のリスト一覧）</h2>

        <div style={{ display: 'grid', gap: 6 }}>
          <div>
            <strong>選択中の siteId:</strong> {selectedSiteId || '（未選択）'}{' '}
            {selectedSiteId ? (
              <button type="button" onClick={() => onCopy(selectedSiteId)}>
                コピー
              </button>
            ) : null}
          </div>

          <label style={{ display: 'grid', gap: 6 }}>
            <span>リスト名フィルタ（任意）</span>
            <input
              value={listNameFilter}
              onChange={(e) => setListNameFilter(e.target.value)}
              placeholder="例: Punch"
              style={{ padding: 8 }}
              disabled={!selectedSiteId}
            />
          </label>
        </div>

        {listsQuery.isPending ? <p style={{ marginTop: 8 }}>読み込み中...</p> : null}
        {listsQuery.isError ? (
          <p style={{ marginTop: 8, color: '#b00' }}>リスト一覧の取得に失敗しました: {listsErrorMessage}</p>
        ) : null}

        {(filteredLists.length ?? 0) > 0 ? (
          <table style={{ borderCollapse: 'collapse', width: 'min(960px, 100%)', marginTop: 10 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #8884', padding: '8px 10px' }}>displayName</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #8884', padding: '8px 10px' }}>id (listId)</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #8884', padding: '8px 10px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredLists.map((l) => (
                <tr key={l.id}>
                  <td style={{ borderBottom: '1px solid #8882', padding: '8px 10px' }}>{l.displayName ?? l.name ?? '-'}</td>
                  <td style={{ borderBottom: '1px solid #8882', padding: '8px 10px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>
                    {l.id}
                  </td>
                  <td style={{ borderBottom: '1px solid #8882', padding: '8px 10px' }}>
                    <button type="button" onClick={() => onCopy(l.id)}>
                      listId をコピー
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>

      <section style={{ border: '1px solid #8883', borderRadius: 12, padding: 12, marginTop: 16 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>.env へ貼り付け</h2>
        {envSnippet ? (
          <div style={{ display: 'grid', gap: 8 }}>
            <pre style={{ margin: 0, padding: 12, background: '#00000008', borderRadius: 8, overflowX: 'auto' }}>
              {envSnippet}
            </pre>
            <button type="button" onClick={() => onCopy(envSnippet)}>
              まとめてコピー
            </button>
          </div>
        ) : (
          <p>siteId を取得/選択すると表示されます。</p>
        )}
      </section>
    </main>
  )
}
