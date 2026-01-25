export type RoundingMode = 'none' | 'floor' | 'ceil' | 'nearest'

export type WorkRule = {
  scheduledDailyMinutes: number
  breakMinutes: number
  roundingUnitMinutes: number
  roundStart: RoundingMode
  roundEnd: RoundingMode
}

export const defaultWorkRule: WorkRule = {
  scheduledDailyMinutes: 8 * 60,
  breakMinutes: 60,
  roundingUnitMinutes: 0,
  roundStart: 'none',
  roundEnd: 'none',
}
