import type { AttendanceMonth } from '../domain/attendance'
import { listMyAttendanceMonth, upsertAttendanceCategory } from './graph/attendance'

export async function fetchAttendanceMonth(params: {
  year: number
  month: number
}): Promise<AttendanceMonth> {
  return await listMyAttendanceMonth(params)
}

export async function updateAttendanceCategory(params: {
  date: string
  workCategory: string | null
}): Promise<void> {
  await upsertAttendanceCategory(params)
}
