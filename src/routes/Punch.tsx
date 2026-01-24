import { useEffect, useMemo, useState } from 'react'
import { weekdayJa, weekdayUtc } from '../lib/tokyoDate'

type PunchType = 'start' | 'end'

type PunchRecord = {
  type: PunchType
  time: string
}

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
  const [records, setRecords] = useState<PunchRecord[]>([])
  const [note, setNote] = useState('')

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(getTokyoNowParts())
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  const startRecord = useMemo(
    () => records.find((record) => record.type === 'start'),
    [records],
  )
  const endRecord = useMemo(
    () => records.find((record) => record.type === 'end'),
    [records],
  )

  const canPunchStart = !startRecord
  const canPunchEnd = !!startRecord && !endRecord

  const onPunch = (type: PunchType) => {
    setRecords((prev) => {
      if (prev.some((record) => record.type === type)) return prev
      return [...prev, { type, time: getTokyoNowParts().time }]
    })
  }

  const onReset = () => {
    setRecords([])
    setNote('')
  }

  return (
    <main className="app">
      <h1>打刻</h1>
      <p style={{ marginTop: 4, opacity: 0.8 }}>※モック画面（API連携なし）</p>

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
            <button type="button" onClick={() => onPunch('start')} disabled={!canPunchStart}>
              出勤打刻
            </button>
            <button type="button" onClick={() => onPunch('end')} disabled={!canPunchEnd}>
              退勤打刻
            </button>
            <button type="button" onClick={onReset}>
              クリア
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
        {records.length === 0 ? (
          <p>まだ打刻がありません。</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
            {records.map((record) => (
              <li key={record.type}>
                {punchLabel[record.type]}: {record.time}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
