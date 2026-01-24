import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { fetchAttendanceMonth } from '../lib/attendanceRepo'
import { getTokyoYearMonth, weekdayJa } from '../lib/tokyoDate'

function getTokyoYyyyMmDd(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)

  const year = parts.find((p) => p.type === 'year')?.value
  const month = parts.find((p) => p.type === 'month')?.value
  const day = parts.find((p) => p.type === 'day')?.value

  if (!year || !month || !day) throw new Error('Failed to get Tokyo date')
  return `${year}-${month}-${day}`
}

function toMinutes(hhmm: string): number {
  const [hh, mm] = hhmm.split(':')
  const hours = Number(hh)
  const minutes = Number(mm)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0
  return hours * 60 + minutes
}

function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h${String(minutes).padStart(2, '0')}m`
}

export function Dashboard() {
  const { year, month } = getTokyoYearMonth()
  const today = getTokyoYyyyMmDd()

  const queryClient = useQueryClient()

  const attendanceQuery = useQuery({
    queryKey: ['attendance', year, month],
    queryFn: () => fetchAttendanceMonth({ year, month }),
  })

  const todayAttendance = useMemo(() => {
    return attendanceQuery.data?.days.find((d) => d.date === today)
  }, [attendanceQuery.data, today])

  const monthSummary = useMemo(() => {
    const days = attendanceQuery.data?.days ?? []

    const workdays = days.filter((d) => d.weekday >= 1 && d.weekday <= 5)
    const attended = workdays.filter((d) => d.start)

    const totalMinutes = workdays.reduce((acc, d) => {
      if (!d.start || !d.end) return acc
      const minutes = Math.max(0, toMinutes(d.end) - toMinutes(d.start))
      return acc + minutes
    }, 0)

    return {
      workdayCount: workdays.length,
      attendedCount: attended.length,
      totalMinutes,
    }
  }, [attendanceQuery.data])

  const lastUpdatedAt = attendanceQuery.dataUpdatedAt
    ? new Date(attendanceQuery.dataUpdatedAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
    : '-'

  const onRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['attendance', year, month] })
  }

  return (
    <main className="app">
      <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>ダッシュボード</h1>
        <span style={{ fontSize: 14, opacity: 0.8 }}>最終更新: {lastUpdatedAt}</span>
        <span style={{ flex: 1 }} />
        <button type="button" onClick={onRefresh} disabled={attendanceQuery.isFetching}>
          {attendanceQuery.isFetching ? '更新中…' : '再読み込み'}
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 12,
          marginTop: 16,
        }}
      >
        <section style={{ border: '1px solid #8883', borderRadius: 12, padding: 12 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>今日</h2>

          {attendanceQuery.isPending ? (
            <p>読み込み中...</p>
          ) : attendanceQuery.isError ? (
            <p>読み込みに失敗しました</p>
          ) : todayAttendance ? (
            <div style={{ display: 'grid', gap: 6 }}>
              <div>
                日付: {todayAttendance.date}（{weekdayJa(todayAttendance.weekday)}）
              </div>
              <div>出勤: {todayAttendance.start ?? '—'}</div>
              <div>退勤: {todayAttendance.end ?? '—'}</div>
            </div>
          ) : (
            <p>今日の勤怠が見つかりませんでした。</p>
          )}
        </section>

        <section style={{ border: '1px solid #8883', borderRadius: 12, padding: 12 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>今月サマリ（モック）</h2>

          {attendanceQuery.isPending ? (
            <p>読み込み中...</p>
          ) : attendanceQuery.isError ? (
            <p>読み込みに失敗しました</p>
          ) : (
            <div style={{ display: 'grid', gap: 6 }}>
              <div>
                対象: {year}年{month}月
              </div>
              <div>
                出勤日: {monthSummary.attendedCount} / {monthSummary.workdayCount}
              </div>
              <div>総労働時間: {formatMinutes(monthSummary.totalMinutes)}</div>
            </div>
          )}
        </section>

        <section style={{ border: '1px solid #8883', borderRadius: 12, padding: 12 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>クイックリンク</h2>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
            <li>
              <Link to="/punch">打刻へ</Link>
            </li>
            <li>
              <Link to="/attendance">勤怠一覧へ</Link>
            </li>
            <li>
              <Link to="/about">Aboutへ</Link>
            </li>
          </ul>
        </section>
      </div>
    </main>
  )
}
