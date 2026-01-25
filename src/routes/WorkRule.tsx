import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { RoundingMode, WorkRule } from '../domain/workRule'
import { fetchMyWorkRule, fetchWorkRuleListColumns, saveMyWorkRule } from '../lib/workRuleRepo'
import { GraphRequestError } from '../lib/graph/graphClient'
import type { ListColumnInfo } from '../lib/graph/listColumns'

const REQUIRED_WORK_RULE_COLUMNS = [
  'UserObjectId',
  'ScheduledDailyMinutes',
  'BreakMinutes',
  'RoundingUnitMinutes',
  'RoundStart',
  'RoundEnd',
] as const

function findColumn(columns: ListColumnInfo[] | undefined, name: string): ListColumnInfo | undefined {
  return (columns ?? []).find((c) => c.name === name)
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.trunc(value)))
}

function splitMinutes(totalMinutes: number): { hours: number; minutes: number } {
  const m = Math.max(0, Math.round(totalMinutes))
  return { hours: Math.floor(m / 60), minutes: m % 60 }
}

function combineMinutes(hours: number, minutes: number): number {
  return clampInt(hours, 0, 24) * 60 + clampInt(minutes, 0, 59)
}

function toMode(value: string): RoundingMode {
  if (value === 'floor' || value === 'ceil' || value === 'nearest' || value === 'none') return value
  return 'none'
}

function WorkRuleForm(props: {
  initialRule: WorkRule
  onSave: (rule: WorkRule) => Promise<void>
  onReload: () => Promise<unknown>
  isSaving: boolean
  isReloading: boolean
}) {
  const { initialRule } = props
  const initialSplit = splitMinutes(initialRule.scheduledDailyMinutes)

  const [scheduledHours, setScheduledHours] = useState<number>(initialSplit.hours)
  const [scheduledMinutes, setScheduledMinutes] = useState<number>(initialSplit.minutes)
  const [breakMinutes, setBreakMinutes] = useState<number>(initialRule.breakMinutes)
  const [roundingUnitMinutes, setRoundingUnitMinutes] = useState<number>(initialRule.roundingUnitMinutes)
  const [roundStart, setRoundStart] = useState<RoundingMode>(initialRule.roundStart)
  const [roundEnd, setRoundEnd] = useState<RoundingMode>(initialRule.roundEnd)

  const onSaveClick = async () => {
    const rule: WorkRule = {
      scheduledDailyMinutes: combineMinutes(scheduledHours, scheduledMinutes),
      breakMinutes: clampInt(breakMinutes, 0, 600),
      roundingUnitMinutes: clampInt(roundingUnitMinutes, 0, 60),
      roundStart,
      roundEnd,
    }
    await props.onSave(rule)
  }

  return (
    <>
      <section style={{ border: '1px solid #8883', borderRadius: 12, padding: 12, marginTop: 16 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>所定労働時間（1日）</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>時間</span>
            <input
              type="number"
              min={0}
              max={24}
              value={scheduledHours}
              onChange={(e) => setScheduledHours(Number(e.target.value))}
              style={{ padding: 8, width: 120 }}
            />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>分</span>
            <input
              type="number"
              min={0}
              max={59}
              step={5}
              value={scheduledMinutes}
              onChange={(e) => setScheduledMinutes(Number(e.target.value))}
              style={{ padding: 8, width: 120 }}
            />
          </label>
        </div>
      </section>

      <section style={{ border: '1px solid #8883', borderRadius: 12, padding: 12, marginTop: 16 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>休憩</h2>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>休憩時間（分）</span>
          <input
            type="number"
            min={0}
            max={600}
            step={5}
            value={breakMinutes}
            onChange={(e) => setBreakMinutes(Number(e.target.value))}
            style={{ padding: 8, width: 180 }}
          />
        </label>
      </section>

      <section style={{ border: '1px solid #8883', borderRadius: 12, padding: 12, marginTop: 16 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>丸め</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>丸め単位（分）</span>
            <input
              type="number"
              min={0}
              max={60}
              step={1}
              value={roundingUnitMinutes}
              onChange={(e) => setRoundingUnitMinutes(Number(e.target.value))}
              style={{ padding: 8, width: 180 }}
            />
            <span style={{ fontSize: 12, opacity: 0.75 }}>
              0 の場合は丸めなし（開始/終了とも）。
            </span>
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span>出勤（開始）の丸め</span>
            <select
              value={roundStart}
              onChange={(e) => setRoundStart(toMode(e.target.value))}
              style={{ padding: 8, width: 240 }}
            >
              <option value="none">なし</option>
              <option value="floor">切り捨て</option>
              <option value="ceil">切り上げ</option>
              <option value="nearest">四捨五入</option>
            </select>
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span>退勤（終了）の丸め</span>
            <select
              value={roundEnd}
              onChange={(e) => setRoundEnd(toMode(e.target.value))}
              style={{ padding: 8, width: 240 }}
            >
              <option value="none">なし</option>
              <option value="floor">切り捨て</option>
              <option value="ceil">切り上げ</option>
              <option value="nearest">四捨五入</option>
            </select>
          </label>
        </div>
      </section>

      <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        <button type="button" onClick={onSaveClick} disabled={props.isSaving || props.isReloading}>
          {props.isSaving ? '保存中…' : '保存'}
        </button>
        <button type="button" onClick={() => props.onReload()} disabled={props.isReloading}>
          {props.isReloading ? '再読み込み中…' : '再読み込み'}
        </button>
      </div>
    </>
  )
}

export function WorkRuleSettings() {
  const ruleQuery = useQuery({
    queryKey: ['work-rule', 'me'],
    queryFn: () => fetchMyWorkRule(),
    retry: false,
  })

  const columnsQuery = useQuery({
    queryKey: ['work-rule', 'columns'],
    queryFn: () => fetchWorkRuleListColumns(),
    retry: false,
  })

  const saveMutation = useMutation({
    mutationFn: async (rule: WorkRule) => {
      const names = new Set((columnsQuery.data ?? []).map((c) => c.name))
      const missing = REQUIRED_WORK_RULE_COLUMNS.filter((c) => !names.has(c))
      if (missing.length > 0) {
        throw new Error(
          `SharePointの勤務ルールリストに必要な列がありません: ${missing.join(', ')}`,
        )
      }
      await saveMyWorkRule(rule)
    },
  })

  const onSave = async (rule: WorkRule) => {
    await saveMutation.mutateAsync(rule)
    await ruleQuery.refetch()
  }

  const loadErrorMessage = useMemo(() => {
    const err = ruleQuery.error
    if (!err) return null
    if (err instanceof GraphRequestError) {
      return `${err.message} (status=${err.status}${err.code ? `, code=${err.code}` : ''})`
    }
    if (err instanceof Error) return err.message
    return '不明なエラー'
  }, [ruleQuery.error])

  const saveErrorMessage = useMemo(() => {
    const err = saveMutation.error
    if (!err) return null
    if (err instanceof GraphRequestError) {
      return `${err.message} (status=${err.status}${err.code ? `, code=${err.code}` : ''})`
    }
    if (err instanceof Error) return err.message
    return '不明なエラー'
  }, [saveMutation.error])

  const columnsStatus = useMemo(() => {
    const names = new Set((columnsQuery.data ?? []).map((c) => c.name))
    const missing = REQUIRED_WORK_RULE_COLUMNS.filter((c) => !names.has(c))
    return { missing, total: REQUIRED_WORK_RULE_COLUMNS.length }
  }, [columnsQuery.data])

  return (
    <main className="app">
      <h1>勤務ルール（個人設定）</h1>
      <p style={{ marginTop: 4, opacity: 0.8 }}>
        ※固定労働制のみ。値は SharePoint List に保存され、集計に反映されます。
      </p>

      {ruleQuery.isPending ? <p>読み込み中...</p> : null}
      {ruleQuery.isError ? (
        <p style={{ color: '#b00' }}>読み込みに失敗しました: {loadErrorMessage}</p>
      ) : null}
      {saveMutation.isError ? (
        <p style={{ color: '#b00' }}>保存に失敗しました: {saveErrorMessage}</p>
      ) : null}
      {saveMutation.isSuccess ? <p style={{ color: '#070' }}>保存しました。</p> : null}

      <section style={{ border: '1px solid #8883', borderRadius: 12, padding: 12, marginTop: 16 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>SharePoint リスト列チェック</h2>
        {columnsQuery.isPending ? <p>確認中...</p> : null}
        {columnsQuery.isError ? (
          <p style={{ color: '#b00' }}>
            列一覧の取得に失敗しました。`VITE_SP_WORK_RULE_LIST_ID` が正しいか、権限があるか確認してください。
          </p>
        ) : null}
        {columnsQuery.data ? (
          <div style={{ display: 'grid', gap: 6 }}>
            <div>
              必須列: {columnsStatus.total}件 / 不足: {columnsStatus.missing.length}件
            </div>
            {columnsStatus.missing.length > 0 ? (
              <div style={{ color: '#b00' }}>
                不足列（内部名）: {columnsStatus.missing.join(', ')}
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                  ※列名は「内部名（Internal name）」が一致している必要があります。
                  Choice列を使う場合は値を none/floor/ceil/nearest に揃えるか、1行テキスト列を推奨します。
                </div>
              </div>
            ) : (
              <div style={{ color: '#070' }}>必須列は揃っています。</div>
            )}

            {(() => {
              const roundStartCol = findColumn(columnsQuery.data, 'RoundStart')
              const roundEndCol = findColumn(columnsQuery.data, 'RoundEnd')

              const roundStartInfo = roundStartCol
                ? `${roundStartCol.type}${roundStartCol.choices ? ` / choices: ${roundStartCol.choices.join(', ')}` : ''}`
                : '（未検出）'
              const roundEndInfo = roundEndCol
                ? `${roundEndCol.type}${roundEndCol.choices ? ` / choices: ${roundEndCol.choices.join(', ')}` : ''}`
                : '（未検出）'

              return (
                <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
                  <div>RoundStart: {roundStartInfo}</div>
                  <div>RoundEnd: {roundEndInfo}</div>
                </div>
              )
            })()}
          </div>
        ) : null}
      </section>

      {ruleQuery.data ? (
        <WorkRuleForm
          key={ruleQuery.dataUpdatedAt}
          initialRule={ruleQuery.data}
          onSave={onSave}
          onReload={() => ruleQuery.refetch()}
          isSaving={saveMutation.isPending}
          isReloading={ruleQuery.isFetching || columnsQuery.isFetching}
        />
      ) : null}

      {!ruleQuery.data && !ruleQuery.isPending ? (
        <p style={{ marginTop: 12 }}>設定が読み込めないため、フォームを表示できません。</p>
      ) : null}
    </main>
  )
}
