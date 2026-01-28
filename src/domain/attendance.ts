export type AttendanceDay = {
  date: string // YYYY-MM-DD (Tokyo)
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0=Sun
  start?: string // HH:mm
  end?: string // HH:mm
  workCategory?: string
}

export type AttendanceMonth = {
  year: number
  month: number // 1-12
  days: AttendanceDay[]
}
