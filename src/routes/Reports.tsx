import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSignedInAccount } from '../auth/msalInstance'
import type { AttendanceMonth } from '../domain/attendance'
import type { WorkRule } from '../domain/workRule'
import { defaultWorkRule } from '../domain/workRule'
import { fetchAttendanceMonth } from '../lib/attendanceRepo'
import { fetchHolidaysForMonth } from '../lib/googleCalendar/holidayCalendar'
import { getTokyoYearMonth, weekdayJa } from '../lib/tokyoDate'
import { fetchMyWorkRule } from '../lib/workRuleRepo'
import { calculateWorkedMinutes } from '../lib/workTime'
import logoUrl from '../assets/company-logo.svg'

function toYearMonthValue(params: { year: number; month: number }): string {
  return `${params.year}-${String(params.month).padStart(2, '0')}`
}

function parseYearMonth(value: string): { year: number; month: number } | null {
  const [yyyy, mm] = value.split('-')
  const year = Number(yyyy)
  const month = Number(mm)
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null
  if (month < 1 || month > 12) return null
  return { year, month }
}

function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h${String(minutes).padStart(2, '0')}m`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildReportHtml(params: {
  month: AttendanceMonth
  holidays: Record<string, string>
  rule: WorkRule
  accountName: string
  accountUpn: string
  logo: string
}): string {
  const { month, holidays, rule, accountName, accountUpn, logo } = params
  const rows = month.days
    .map((day) => {
      const holidayName = holidays[day.date]
      const weekdayLabel = weekdayJa(day.weekday)
      const holidayLabel = holidayName ? `（祝: ${holidayName}）` : ''
      const workedMinutes = calculateWorkedMinutes({ start: day.start, end: day.end, rule })
      return {
        date: day.date,
        weekday: `${weekdayLabel}${holidayLabel}`,
        start: day.start ?? '—',
        end: day.end ?? '—',
        worked: formatMinutes(workedMinutes),
      }
    })
    .map(
      (row) =>
        `<tr>
          <td>${escapeHtml(row.date)}</td>
          <td>${escapeHtml(row.weekday)}</td>
          <td>${escapeHtml(row.start)}</td>
          <td>${escapeHtml(row.end)}</td>
          <td style="text-align:right;">${escapeHtml(row.worked)}</td>
        </tr>`,
    )
    .join('')

  const totalMinutes = month.days.reduce((acc, day) => {
    return acc + calculateWorkedMinutes({ start: day.start, end: day.end, rule })
  }, 0)

  const html = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <title>勤務表 ${month.year}年${month.month}月</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; }
    body { font-family: "Noto Sans JP", "Hiragino Sans", "Yu Gothic", "Meiryo", system-ui, sans-serif; color: #0f172a; margin: 0; }
    .header { display: flex; align-items: center; gap: 16px; padding-bottom: 12px; border-bottom: 1px solid #cbd5f5; }
    .logo { height: 42px; }
    .meta { margin-left: auto; text-align: right; font-size: 12px; color: #475569; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .info { margin-top: 12px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; font-size: 12px; }
    .summary { margin-top: 12px; display: flex; gap: 16px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
    th, td { border: 1px solid #e2e8f0; padding: 6px 8px; }
    th { background: #f8fafc; text-align: left; }
    tfoot td { font-weight: 700; }
    .footer { margin-top: 16px; font-size: 11px; color: #64748b; }
  </style>
</head>
<body>
  <div class="header">
    <img class="logo" src="${logo}" alt="Company Logo" />
    <div>
      <h1>勤務表（${month.year}年${month.month}月）</h1>
      <div style="font-size: 12px; color: #475569;">A4 縦 / ロゴ入り</div>
    </div>
    <div class="meta">
      <div>氏名: ${escapeHtml(accountName)}</div>
      <div>UPN: ${escapeHtml(accountUpn)}</div>
    </div>
  </div>

  <div class="info">
    <div>所定労働時間: ${formatMinutes(rule.scheduledDailyMinutes)}</div>
    <div>休憩: ${rule.breakMinutes}分</div>
    <div>丸め単位: ${rule.roundingUnitMinutes || 0}分</div>
    <div>丸め: 開始 ${escapeHtml(rule.roundStart)} / 終了 ${escapeHtml(rule.roundEnd)}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 18%;">日付</th>
        <th style="width: 30%;">曜日</th>
        <th style="width: 14%;">出勤</th>
        <th style="width: 14%;">退勤</th>
        <th style="width: 14%; text-align: right;">実働</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="4">合計</td>
        <td style="text-align:right;">${escapeHtml(formatMinutes(totalMinutes))}</td>
      </tr>
    </tfoot>
  </table>

  <div class="footer">
    ※ 祝日判定はGoogle Calendarの取得結果に依存します。取得に失敗した場合は土日判定のみで集計されます。
  </div>

  <script>
    window.onload = () => {
      setTimeout(() => {
        window.print()
      }, 300)
    }
  </script>
</body>
</html>`

  return html
}

export function Reports() {
  const { year: defaultYear, month: defaultMonth } = getTokyoYearMonth()
  const [yearMonth, setYearMonth] = useState(() => toYearMonthValue({ year: defaultYear, month: defaultMonth }))

  const parsed = useMemo(() => parseYearMonth(yearMonth), [yearMonth])
  const year = parsed?.year ?? defaultYear
  const month = parsed?.month ?? defaultMonth

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

  const account = getSignedInAccount()
  const accountName = account?.name ?? '未設定'
  const accountUpn = account?.username ?? '未設定'

  const canGenerate = !attendanceQuery.isPending && !attendanceQuery.isError

  const onGeneratePdf = () => {
    const attendance = attendanceQuery.data
    if (!attendance) return
    const holidays = holidaysQuery.data ?? {}
    const rule = workRuleQuery.data ?? defaultWorkRule

    const html = buildReportHtml({
      month: attendance,
      holidays,
      rule,
      accountName,
      accountUpn,
      logo: logoUrl,
    })

    const win = window.open('', '_blank', 'noopener,noreferrer,width=960,height=720')
    if (!win) return
    win.document.open()
    win.document.write(html)
    win.document.close()
  }

  return (
    <main className="app">
      <h1>勤務表PDF出力</h1>

      <section style={{ border: '1px solid #8883', borderRadius: 12, padding: 12, marginTop: 16 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>対象月</h2>
        <label style={{ display: 'grid', gap: 6, maxWidth: 240 }}>
          <span>年月（YYYY-MM）</span>
          <input
            type="month"
            value={yearMonth}
            onChange={(event) => setYearMonth(event.target.value)}
          />
        </label>

        {attendanceQuery.isError ? <p style={{ color: '#b00' }}>勤怠データの取得に失敗しました。</p> : null}
        {workRuleQuery.isError ? (
          <p style={{ color: '#b00' }}>勤務ルールの取得に失敗しました（デフォルト値で出力）。</p>
        ) : null}
        {holidaysQuery.isError ? (
          <p style={{ color: '#b00' }}>祝日取得に失敗しました（祝日判定なしで出力）。</p>
        ) : null}

        <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" onClick={onGeneratePdf} disabled={!canGenerate}>
            PDF出力（印刷）
          </button>
          <span style={{ fontSize: 12, color: '#475569' }}>
            ※ ブラウザの印刷ダイアログから PDF として保存してください
          </span>
        </div>
      </section>

      <section style={{ border: '1px solid #8883', borderRadius: 12, padding: 12, marginTop: 16 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>出力プレビュー（抜粋）</h2>
        {attendanceQuery.isPending ? (
          <p>読み込み中...</p>
        ) : attendanceQuery.data ? (
          <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
            <div>
              対象: {attendanceQuery.data.year}年{attendanceQuery.data.month}月
            </div>
            <div>氏名: {accountName}</div>
            <div>UPN: {accountUpn}</div>
            <div>
              勤務ルール: 所定 {formatMinutes((workRuleQuery.data ?? defaultWorkRule).scheduledDailyMinutes)} / 休憩{' '}
              {(workRuleQuery.data ?? defaultWorkRule).breakMinutes}分
            </div>
            <div>日数: {attendanceQuery.data.days.length}日</div>
          </div>
        ) : (
          <p>データがありません。</p>
        )}
      </section>
    </main>
  )
}
