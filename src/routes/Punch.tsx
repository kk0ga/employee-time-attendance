import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { weekdayJa, weekdayUtc } from '../lib/tokyoDate'
import { createPunch, listMyPunchesForDate, type PunchType } from '../lib/graph/punches'
import { GraphRequestError } from '../lib/graph/graphClient'
import { Section } from '../components/ui/Section'
import { Button } from '../components/ui/Button'
import { TextArea } from '../components/ui/TextArea'
import { ErrorMessage } from '../components/ui/ErrorMessage'

function getTokyoNowParts(now: Date = new Date()): {
  date: string
  time: string
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6
} {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now)

  const year = Number(parts.find((p) => p.type === 'year')?.value)
  const month = Number(parts.find((p) => p.type === 'month')?.value)
  const day = Number(parts.find((p) => p.type === 'day')?.value)
  const hour = parts.find((p) => p.type === 'hour')?.value
  const minute = parts.find((p) => p.type === 'minute')?.value
  const second = parts.find((p) => p.type === 'second')?.value

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    throw new Error('Failed to get Tokyo date')
  }
  if (!hour || !minute || !second) {
    throw new Error('Failed to get Tokyo time')
  }

  return {
    date: `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(
      day,
    ).padStart(2, '0')}`,
    time: `${hour}:${minute}:${second}`,
    weekday: weekdayUtc(year, month, day),
  }
}

const punchLabel: Record<PunchType, string> = {
  start: '出勤',
  end: '退勤',
}

export function Punch() {
  const [now, setNow] = useState(() => getTokyoNowParts())
  const [note, setNote] = useState('')

  const queryClient = useQueryClient()

  const punchesQuery = useQuery({
    queryKey: ['punches', now.date],
    queryFn: () => listMyPunchesForDate({ date: now.date }),
  })

  const createPunchMutation = useMutation({
    mutationFn: (type: PunchType) => createPunch({ type, date: now.date, time: now.time, note }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['punches', now.date] })
    },
  })

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(getTokyoNowParts())
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  const startRecord = useMemo(() => {
    return punchesQuery.data?.find((record) => record.type === 'start')
  }, [punchesQuery.data])

  const endRecord = useMemo(() => {
    return punchesQuery.data?.find((record) => record.type === 'end')
  }, [punchesQuery.data])

  const canPunchStart = !startRecord
  const canPunchEnd = !!startRecord && !endRecord

  const onPunch = async (type: PunchType) => {
    await createPunchMutation.mutateAsync(type)
  }

  const punchesErrorMessage = useMemo(() => {
    const err = punchesQuery.error
    if (!err) return null
    if (err instanceof GraphRequestError) {
      return `${err.message} (status=${err.status}${err.code ? `, code=${err.code}` : ''})`
    }
    if (err instanceof Error) return err.message
    return '不明なエラー'
  }, [punchesQuery.error])

  const createErrorMessage = useMemo(() => {
    const err = createPunchMutation.error
    if (!err) return null
    if (err instanceof GraphRequestError) {
      return `${err.message} (status=${err.status}${err.code ? `, code=${err.code}` : ''})`
    }
    if (err instanceof Error) return err.message
    return '不明なエラー'
  }, [createPunchMutation.error])

  return (
    <main className="mx-auto w-full max-w-[960px] p-4">
      <h1>打刻</h1>
      <p className="mt-1 opacity-80">※SharePoint リストへ登録します（設定が必要）</p>

      {punchesQuery.isError ? (
        <ErrorMessage className="mb-2">打刻の読み込みに失敗しました: {punchesErrorMessage}</ErrorMessage>
      ) : null}

      {createPunchMutation.isError ? (
        <ErrorMessage className="mb-2">打刻に失敗しました: {createErrorMessage}</ErrorMessage>
      ) : null}

      <div className="mt-4 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
        <Section title="現在時刻">
          <div className="text-[18px] font-semibold">
            {now.date}（{weekdayJa(now.weekday)}）
          </div>
          <div className="text-[32px] font-bold tracking-[1px]">{now.time}</div>
          <p className="mt-2 text-[12px] opacity-70">Asia/Tokyo</p>
        </Section>

        <Section title="本日の打刻">
          <div className="grid gap-1.5">
            <div>出勤: {startRecord?.time ?? '—'}</div>
            <div>退勤: {endRecord?.time ?? '—'}</div>
          </div>

          <div className="mt-3 flex flex-wrap gap-4">
            <Button
              variant="punch"
              size="punch"
              onClick={() => onPunch('start')}
              disabled={!canPunchStart || createPunchMutation.isPending}
            >
              出勤
            </Button>
            <Button
              variant="punch"
              size="punch"
              onClick={() => onPunch('end')}
              disabled={!canPunchEnd || createPunchMutation.isPending}
            >
              退勤
            </Button>
          </div>

          <label className="mt-4 grid gap-1.5 ">
            <span className="text-sm font-medium">備考</span>
            <TextArea
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="遅刻・直行直帰などのメモ"
              className="resize-y"
            />
          </label>
        </Section>
      </div>

      <Section title="打刻履歴" className="mt-6">
        {punchesQuery.isPending ? (
          <p>読み込み中...</p>
        ) : (punchesQuery.data?.length ?? 0) === 0 ? (
          <p>まだ打刻がありません。</p>
        ) : (
          <ul className="m-0 grid gap-1.5 pl-[18px]">
            {(punchesQuery.data ?? []).map((record) => (
              <li key={record.id}>
                {punchLabel[record.type]}: {record.time}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </main>
  )
}
