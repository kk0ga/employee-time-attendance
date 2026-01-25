import type { RoundingMode, WorkRule } from '../domain/workRule'

export function toMinutesFromHhmm(value: string): number | null {
  const parts = value.split(':')
  if (parts.length < 2) return null

  const hours = Number(parts[0])
  const minutes = Number(parts[1])

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null

  return hours * 60 + minutes
}

export function roundMinutes(value: number, unit: number, mode: RoundingMode): number {
  if (!Number.isFinite(value)) return 0
  if (!Number.isFinite(unit) || unit <= 0) return Math.round(value)
  if (mode === 'none') return Math.round(value)

  const v = value / unit

  if (mode === 'floor') return Math.floor(v) * unit
  if (mode === 'ceil') return Math.ceil(v) * unit
  // nearest
  return Math.round(v) * unit
}

export function calculateWorkedMinutes(params: {
  start?: string
  end?: string
  rule: WorkRule
}): number {
  const { start, end, rule } = params

  if (!start || !end) return 0

  const startMin = toMinutesFromHhmm(start)
  const endMin = toMinutesFromHhmm(end)

  if (startMin === null || endMin === null) return 0

  const unit = rule.roundingUnitMinutes
  const startRounded = roundMinutes(startMin, unit, unit > 0 ? rule.roundStart : 'none')
  const endRounded = roundMinutes(endMin, unit, unit > 0 ? rule.roundEnd : 'none')

  const raw = endRounded - startRounded
  const withBreak = raw - rule.breakMinutes

  return Math.max(0, withBreak)
}
