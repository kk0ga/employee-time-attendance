export function getTokyoYearMonth(now: Date = new Date()): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now)

  const year = Number(parts.find((p) => p.type === 'year')?.value)
  const month = Number(parts.find((p) => p.type === 'month')?.value)

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    throw new Error('Failed to get Tokyo year/month')
  }

  return { year, month }
}

export function daysInMonthUtc(year: number, month: number): number {
  // month: 1-12
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

export function formatYyyyMmDd(year: number, month: number, day: number): string {
  const yyyy = String(year).padStart(4, '0')
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function weekdayUtc(year: number, month: number, day: number): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  return weekday as 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export function weekdayJa(weekday: number): string {
  return ['日', '月', '火', '水', '木', '金', '土'][weekday] ?? ''
}
