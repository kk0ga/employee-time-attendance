import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { defaultWorkRule } from '../domain/workRule'
import { fetchAttendanceMonth } from '../lib/attendanceRepo'
import { fetchHolidaysForMonth } from '../lib/googleCalendar/holidayCalendar'
import { getTokyoYearMonth, weekdayJa } from '../lib/tokyoDate'
import { fetchMyWorkRule } from '../lib/workRuleRepo'
import { calculateWorkedMinutes } from '../lib/workTime'
import { Section } from '@/components/ui/Section'
import { StatsCard } from '@/components/ui/StatsCard'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Button } from '@/components/ui/button'

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

  return (
    <main className="mx-auto w-full max-w-[1200px] p-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <h1>ダッシュボード</h1>
        <span className="text-[14px] opacity-80 JST">最終更新: {lastUpdatedAt}</span>
        <span className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={attendanceQuery.isFetching}
        >
          {attendanceQuery.isFetching ? '更新中…' : '再読み込み'}
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 items-start gap-6 md:grid-cols-3">
        <Section title="今日" className="h-full">
          {attendanceQuery.isPending ? (
            <p>読み込み中...</p>
          ) : attendanceQuery.isError ? (
            <ErrorMessage title="読み込みに失敗しました" error={attendanceQuery.error} />
          ) : todayAttendance ? (
            <div className="grid gap-3 py-2">
              <div className="text-[16px] font-bold">
                {todayAttendance.date}（{weekdayJa(todayAttendance.weekday)}）
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between border-b border-[#8882] pb-1">
                  <span className="opacity-60">出勤</span>
                  <span className="font-mono text-[18px]">{todayAttendance.start ?? '—'}</span>
                </div>
                <div className="flex justify-between border-b border-[#8882] pb-1">
                  <span className="opacity-60">退勤</span>
                  <span className="font-mono text-[18px]">{todayAttendance.end ?? '—'}</span>
                </div>
              </div>
              <div className="mt-2">
                <Link to="/punch">
                  <Button variant="primary" size="sm" className="w-full">
                    打刻画面へ
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <p>今日の勤怠が見つかりませんでした。</p>
          )}
        </Section>

        <Section title="今月サマリ" className="h-full">
          {attendanceQuery.isPending ? (
            <p>読み込み中...</p>
          ) : attendanceQuery.isError ? (
            <ErrorMessage title="読み込みに失敗しました" error={attendanceQuery.error} />
          ) : (
            <div className="grid gap-4">
              <div className="text-[13px] text-[#475569]">
                対象: {year}年{month}月
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                <StatsCard
                  label="実出勤日"
                  value={`${monthSummary.totalAttendedCount}日`}
                  subtext={`平日 ${monthSummary.businessAttendedCount} / 休日 ${monthSummary.holidayAttendedCount}`}
                />
                <StatsCard
                  label="総労働時間"
                  value={formatMinutes(monthSummary.totalMinutes)}
                  subtext={`平日 ${formatMinutes(monthSummary.businessMinutes)} / 休日 ${formatMinutes(monthSummary.holidayMinutes)}`}
                />
              </div>

              <div className="text-[12px] leading-relaxed text-[#0f172a]">
                <div className="font-bold opacity-60">勤務ルール</div>
                <div>
                  所定 {formatMinutes(monthSummary.scheduledDailyMinutes)} / 休憩 {monthSummary.breakMinutes}分
                </div>
                <div className="flex flex-wrap gap-2">
                  <span>丸め: {formatRoundingLabel({
                    unit: monthSummary.roundingUnitMinutes,
                    start: monthSummary.roundStart,
                    end: monthSummary.roundEnd,
                  })}</span>
                  <Link to="/settings/work-rule" className="text-[#2563eb] hover:underline">変更</Link>
                </div>
              </div>

              {workRuleQuery.isError && (
                <ErrorMessage title="勤務ルールの読み込み不備">
                  デフォルト値を使用中。設定を確認してください。
                </ErrorMessage>
              )}
            </div>
          )}
        </Section>

        <Section title="クイックリンク" className="h-full font-bold">
          <ul className="m-0 grid gap-1 pl-0 list-none">
            <li>
              <Link to="/punch" className="flex items-center rounded-md p-2 transition-colors hover:bg-[#8881]">
                <span className="mr-2">🕒</span> 打刻画面
              </Link>
            </li>
            <li>
              <Link to="/attendance" className="flex items-center rounded-md p-2 transition-colors hover:bg-[#8881]">
                <span className="mr-2">📅</span> 勤怠一覧
              </Link>
            </li>
            <li>
              <Link to="/reports" className="flex items-center rounded-md p-2 transition-colors hover:bg-[#8881]">
                <span className="mr-2">📄</span> 勤務表出力
              </Link>
            </li>
            <li className="mt-2 border-t border-[#8882] pt-2">
              <Link to="/settings/work-rule" className="flex items-center rounded-md p-2 transition-colors hover:bg-[#8881]">
                <span className="mr-2">⚙️</span> 勤務ルール設定
              </Link>
            </li>
            <li>
              <Link to="/about" className="flex items-center rounded-md p-2 transition-colors hover:bg-[#8881]">
                <span className="mr-2">ℹ️</span> About
              </Link>
            </li>
          </ul>
        </Section>
      </div>
    </main>
  )
}
