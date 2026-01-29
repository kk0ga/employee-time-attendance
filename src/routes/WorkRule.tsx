import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { RoundingMode, WorkRule } from '../domain/workRule'
import { fetchMyWorkRule, saveMyWorkRule } from '../lib/workRuleRepo'
import { Button } from '@/components/ui/button'
import { Section } from '@/components/ui/Section'
import { Input } from '@/components/ui/input'
import { SelectNative as Select } from '@/components/ui/select-native'
import { ErrorMessage } from '@/components/ui/ErrorMessage'

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
      <Section title="所定労働時間（1日）">
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="grid gap-1.5">
            <span>時間</span>
            <Input
              type="number"
              min={0}
              max={24}
              value={scheduledHours}
              onChange={(e) => setScheduledHours(Number(e.target.value))}
              className="w-[120px]"
            />
          </label>
          <label className="grid gap-1.5">
            <span>分</span>
            <Input
              type="number"
              min={0}
              max={59}
              step={5}
              value={scheduledMinutes}
              onChange={(e) => setScheduledMinutes(Number(e.target.value))}
              className="w-[120px]"
            />
          </label>
        </div>
      </Section>

      <Section title="休憩">
        <label className="grid gap-1.5">
          <span>休憩時間（分）</span>
          <Input
            type="number"
            min={0}
            max={600}
            step={5}
            value={breakMinutes}
            onChange={(e) => setBreakMinutes(Number(e.target.value))}
            className="w-[180px]"
          />
        </label>
      </Section>

      <Section title="丸め">
        <div className="grid gap-2.5">
          <label className="grid gap-1.5">
            <span>丸め単位（分）</span>
            <Input
              type="number"
              min={0}
              max={60}
              step={1}
              value={roundingUnitMinutes}
              onChange={(e) => setRoundingUnitMinutes(Number(e.target.value))}
              className="w-[180px]"
            />
            <span className="text-[12px] opacity-75">
              0 の場合は丸めなし（開始/終了とも）。
            </span>
          </label>

          <label className="grid gap-1.5">
            <span>出勤（開始）の丸め</span>
            <Select
              value={roundStart}
              onChange={(e) => setRoundStart(toMode(e.target.value))}
              className="w-[240px]"
            >
              <option value="none">なし</option>
              <option value="floor">切り捨て</option>
              <option value="ceil">切り上げ</option>
              <option value="nearest">四捨五入</option>
            </Select>
          </label>

          <label className="grid gap-1.5">
            <span>退勤（終了）の丸め</span>
            <Select
              value={roundEnd}
              onChange={(e) => setRoundEnd(toMode(e.target.value))}
              className="w-[240px]"
            >
              <option value="none">なし</option>
              <option value="floor">切り捨て</option>
              <option value="ceil">切り上げ</option>
              <option value="nearest">四捨五入</option>
            </Select>
          </label>
        </div>
      </Section>

      <div className="mt-4 flex flex-wrap gap-2.5">
        <Button onClick={onSaveClick} disabled={props.isSaving || props.isReloading}>
          {props.isSaving ? '保存中…' : '保存'}
        </Button>
        <Button variant="ghost" onClick={() => props.onReload()} disabled={props.isReloading}>
          {props.isReloading ? '再読み込み中…' : '再読み込み'}
        </Button>
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

  const saveMutation = useMutation({
    mutationFn: async (rule: WorkRule) => {
      await saveMyWorkRule(rule)
    },
  })

  const onSave = async (rule: WorkRule) => {
    await saveMutation.mutateAsync(rule)
    await ruleQuery.refetch()
  }

  return (
    <main className="mx-auto w-full max-w-[960px] p-4">
      <h1>勤務ルール（個人設定）</h1>
      <p className="mt-1 opacity-80">
        ※固定労働制のみ。値は SharePoint List に保存され、集計に反映されます。
      </p>

      {ruleQuery.isPending && <p>読み込み中...</p>}

      {ruleQuery.isError && (
        <ErrorMessage
          title="読み込みに失敗しました"
          error={ruleQuery.error}
          onRetry={() => ruleQuery.refetch()}
        />
      )}

      {saveMutation.isError && (
        <ErrorMessage
          title="保存に失敗しました"
          error={saveMutation.error}
        />
      )}

      {saveMutation.isSuccess && <p className="mt-4 text-[#070]">保存しました。</p>}

      {ruleQuery.data ? (
        <WorkRuleForm
          key={ruleQuery.dataUpdatedAt}
          initialRule={ruleQuery.data}
          onSave={onSave}
          onReload={() => ruleQuery.refetch()}
          isSaving={saveMutation.isPending}
          isReloading={ruleQuery.isFetching}
        />
      ) : null}

      {!ruleQuery.data && !ruleQuery.isPending && !ruleQuery.isError ? (
        <p className="mt-3">設定が読み込めないため、フォームを表示できません。</p>
      ) : null}
    </main>
  )
}
