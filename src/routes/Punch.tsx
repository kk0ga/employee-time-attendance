import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { weekdayJa, weekdayUtc } from '../lib/tokyoDate'
import { createPunch, listMyPunchesForDate, type PunchType } from '../lib/graph/punches'
import { GraphRequestError } from '../lib/graph/graphClient'

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
    <main className="app">
      <h1>打刻</h1>
      <p style={{ marginTop: 4, opacity: 0.8 }}>※SharePoint リストへ登録します（設定が必要）</p>

      {punchesQuery.isError ? (
        <p style={{ color: '#b00' }}>打刻の読み込みに失敗しました: {punchesErrorMessage}</p>
      ) : null}

      {createPunchMutation.isError ? (
        <p style={{ color: '#b00' }}>打刻に失敗しました: {createErrorMessage}</p>
      ) : null}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 12,
          marginTop: 16,
        }}
      >
        <div style={{ border: '1px solid #8883', borderRadius: 12, padding: 12 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>現在時刻</h2>
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            {now.date}（{weekdayJa(now.weekday)}）
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: 1 }}>{now.time}</div>
          <p style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>Asia/Tokyo</p>
        </div>

        <div style={{ border: '1px solid #8883', borderRadius: 12, padding: 12 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>本日の打刻</h2>
          <div style={{ display: 'grid', gap: 6 }}>
            <div>出勤: {startRecord?.time ?? '—'}</div>
            <div>退勤: {endRecord?.time ?? '—'}</div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => onPunch('start')}
              disabled={!canPunchStart || createPunchMutation.isPending}
            >
              出勤打刻
            </button>
            <button
              type="button"
              onClick={() => onPunch('end')}
              disabled={!canPunchEnd || createPunchMutation.isPending}
            >
              退勤打刻
            </button>
          </div>

          <label style={{ display: 'grid', gap: 6, marginTop: 12 }}>
            <span>備考</span>
            <textarea
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="遅刻・直行直帰などのメモ"
              style={{ resize: 'vertical', padding: 8 }}
            />
          </label>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>打刻履歴</h2>
        {punchesQuery.isPending ? (
          <p>読み込み中...</p>
        ) : (punchesQuery.data?.length ?? 0) === 0 ? (
          <p>まだ打刻がありません。</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
            {(punchesQuery.data ?? []).map((record) => (
              <li key={record.id}>
                {punchLabel[record.type]}: {record.time}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
