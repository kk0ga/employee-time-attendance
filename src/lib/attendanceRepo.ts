import type { AttendanceMonth } from '../domain/attendance'
import {
  daysInMonthUtc,
  formatYyyyMmDd,
  weekdayUtc,
} from './tokyoDate'

export async function fetchAttendanceMonth(params: {
  year: number
  month: number
}): Promise<AttendanceMonth> {
  const { year, month } = params
  const lastDay = daysInMonthUtc(year, month)

  const days = Array.from({ length: lastDay }, (_, index) => {
    const day = index + 1
    const weekday = weekdayUtc(year, month, day)

    // モック: 平日は09:00-18:00、それ以外は空
    const isWeekday = weekday >= 1 && weekday <= 5
    const start = isWeekday ? '09:00' : undefined
    const end = isWeekday ? '18:00' : undefined

    return {
      date: formatYyyyMmDd(year, month, day),
      weekday,
      start,
      end,
    }
  })

  // 擬似的な非同期
  await new Promise((r) => setTimeout(r, 150))

  return {
    year,
    month,
    days,
  }
}
