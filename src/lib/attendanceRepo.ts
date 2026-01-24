import type { AttendanceMonth } from '../domain/attendance'
import { listMyAttendanceMonth } from './graph/attendance'

export async function fetchAttendanceMonth(params: {
  year: number
  month: number
}): Promise<AttendanceMonth> {
  return await listMyAttendanceMonth(params)
}
