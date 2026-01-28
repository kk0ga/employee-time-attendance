import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { defaultWorkRule } from '../domain/workRule'
import { fetchAttendanceMonth } from '../lib/attendanceRepo'
import { fetchHolidaysForMonth } from '../lib/googleCalendar/holidayCalendar'
import { getTokyoYearMonth, weekdayJa } from '../lib/tokyoDate'
import { fetchMyWorkRule } from '../lib/workRuleRepo'
import { calculateWorkedMinutes } from '../lib/workTime'

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

function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h${String(minutes).padStart(2, '0')}m`
}

function formatRoundingLabel(params: {
  unit: number
  start: string
  end: string
}): string {
  if (!params.unit) return 'なし'
  return `${params.unit}分（開始:${params.start} / 終了:${params.end}）`
}

export function Dashboard() {
  const { year, month } = getTokyoYearMonth()
  const today = getTokyoYyyyMmDd()

  const queryClient = useQueryClient()

  const attendanceQuery = useQuery({
    queryKey: ['attendance', year, month],
    queryFn: () => fetchAttendanceMonth({ year, month }),
  })

  const holidaysQuery = useQuery({
    queryKey: ['holidays', year, month],
    queryFn: () => fetchHolidaysForMonth({ year, month }),
    retry: false,
    staleTime: 1000 * 60 * 60 * 12,
  })

  const workRuleQuery = useQuery({
    queryKey: ['work-rule', 'me'],
    queryFn: () => fetchMyWorkRule(),
    retry: false,
  })

  const todayAttendance = useMemo(() => {
    return attendanceQuery.data?.days.find((d) => d.date === today)
  }, [attendanceQuery.data, today])

  const monthSummary = useMemo(() => {
    const days = attendanceQuery.data?.days ?? []
    const holidays = holidaysQuery.data ?? {}
    const rule = workRuleQuery.data ?? defaultWorkRule

    const isHoliday = (date: string, weekday: number) => {
      if (weekday === 0 || weekday === 6) return true
      return !!holidays[date]
    }

    const businessDays = days.filter(
      (d) => d.weekday >= 1 && d.weekday <= 5 && !isHoliday(d.date, d.weekday),
    )
    const holidayDays = days.filter((d) => isHoliday(d.date, d.weekday))

    const businessAttended = businessDays.filter((d) => d.start)
    const holidayAttended = holidayDays.filter((d) => d.start)

    const businessMinutes = businessDays.reduce((acc, d) => {
      return (
        acc +
        calculateWorkedMinutes({
          start: d.start,
          end: d.end,
          rule,
        })
      )
    }, 0)

    const holidayMinutes = holidayDays.reduce((acc, d) => {
      return (
        acc +
        calculateWorkedMinutes({
          start: d.start,
          end: d.end,
          rule,
        })
      )
    }, 0)

    return {
      businessDayCount: businessDays.length,
      businessAttendedCount: businessAttended.length,
      businessMinutes,
      holidayCount: holidayDays.length,
      holidayAttendedCount: holidayAttended.length,
      holidayMinutes,
      totalAttendedCount: businessAttended.length + holidayAttended.length,
      totalMinutes: businessMinutes + holidayMinutes,
      scheduledDailyMinutes: rule.scheduledDailyMinutes,
      breakMinutes: rule.breakMinutes,
      roundingUnitMinutes: rule.roundingUnitMinutes,
      roundStart: rule.roundStart,
      roundEnd: rule.roundEnd,
    }
  }, [attendanceQuery.data, holidaysQuery.data, workRuleQuery.data])

  const lastUpdatedAt = attendanceQuery.dataUpdatedAt
    ? new Date(attendanceQuery.dataUpdatedAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
    : '-'

  const onRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['attendance', year, month] })
  }

  const summaryCardStyle: React.CSSProperties = {
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: 12,
    background: 'linear-gradient(135deg, rgba(248,250,252,0.9), rgba(255,255,255,0.9))',
  }

  const summaryValueStyle: React.CSSProperties = {
    fontSize: 22,
    fontWeight: 700,
    color: '#0f172a',
  }

  const summaryLabelStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#64748b',
  }

  const summarySubStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
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
          <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>今月サマリ</h2>

          {attendanceQuery.isPending ? (
            <p>読み込み中...</p>
          ) : attendanceQuery.isError ? (
            <p>読み込みに失敗しました</p>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 8,
                  fontSize: 13,
                  color: '#475569',
                }}
              >
                <div>
                  対象: {year}年{month}月
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>法定休日: 日曜日</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>祝日: Google Calendar</span>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 10,
                }}
              >
                <div style={summaryCardStyle}>
                  <div style={summaryLabelStyle}>実出勤日</div>
                  <div style={summaryValueStyle}>{monthSummary.totalAttendedCount}日</div>
                  <div style={summarySubStyle}>
                    平日 {monthSummary.businessAttendedCount} / 休日 {monthSummary.holidayAttendedCount}
                  </div>
                </div>
                <div style={summaryCardStyle}>
                  <div style={summaryLabelStyle}>総労働時間</div>
                  <div style={summaryValueStyle}>{formatMinutes(monthSummary.totalMinutes)}</div>
                  <div style={summarySubStyle}>
                    平日 {formatMinutes(monthSummary.businessMinutes)} / 休日 {formatMinutes(monthSummary.holidayMinutes)}
                  </div>
                </div>
                <div style={summaryCardStyle}>
                  <div style={summaryLabelStyle}>出勤日数（平日）</div>
                  <div style={summaryValueStyle}>
                    {monthSummary.businessAttendedCount} / {monthSummary.businessDayCount}
                  </div>
                  <div style={summarySubStyle}>平日総日数に対する出勤日数</div>
                </div>
                <div style={summaryCardStyle}>
                  <div style={summaryLabelStyle}>出勤日数（休日）</div>
                  <div style={summaryValueStyle}>
                    {monthSummary.holidayAttendedCount} / {monthSummary.holidayCount}
                  </div>
                  <div style={summarySubStyle}>土日祝の出勤日数</div>
                </div>
              </div>

              {workRuleQuery.isError ? (
                <div style={{ color: '#b00', fontSize: 12 }}>
                  勤務ルールの読み込みに失敗しました（デフォルト値で集計）。
                  SharePoint の `VITE_SP_WORK_RULE_LIST_ID` とリスト列を確認してください。
                </div>
              ) : null}

              <div style={{ display: 'grid', gap: 6, fontSize: 13, color: '#0f172a' }}>
                <div>
                  勤務ルール: 所定 {formatMinutes(monthSummary.scheduledDailyMinutes)} / 休憩 {monthSummary.breakMinutes}分 / 丸め{' '}
                  {formatRoundingLabel({
                    unit: monthSummary.roundingUnitMinutes,
                    start: monthSummary.roundStart,
                    end: monthSummary.roundEnd,
                  })}
                  （<Link to="/settings/work-rule">変更</Link>）
                </div>
              </div>

              {holidaysQuery.isError ? (
                <div style={{ color: '#b00', fontSize: 12 }}>
                  祝日カレンダーの読み込みに失敗しました（祝日判定なしで表示）。
                  `VITE_GCAL_HOLIDAY_CALENDAR_ID` の設定が正しいか確認してください。
                </div>
              ) : null}
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
