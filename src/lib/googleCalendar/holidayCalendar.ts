import { getGoogleCalendarApiKey, getGoogleHolidayCalendarId } from './config'

type GoogleCalendarEvent = {
  summary?: string
  start?: { date?: string; dateTime?: string }
  end?: { date?: string; dateTime?: string }
}

type GoogleCalendarEventsResponse = {
  items?: GoogleCalendarEvent[]
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function toTokyoOffsetRfc3339(year: number, month: number, day: number): string {
  // Asia/Tokyo is fixed offset +09:00
  const yyyy = String(year).padStart(4, '0')
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T00:00:00+09:00`
}

function firstDayNextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 12) return { year: year + 1, month: 1 }
  return { year, month: month + 1 }
}

function normalizeDateFromEvent(event: GoogleCalendarEvent): string | null {
  const raw = event.start?.date ?? event.start?.dateTime
  if (!raw) return null
  // dateTime: 2026-01-24T00:00:00+09:00 -> 2026-01-24
  return raw.slice(0, 10)
}

async function fetchJsonWithRetry(url: string, init?: RequestInit): Promise<Response> {
  const maxAttempts = 4
  let lastError: unknown = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, init)
      if (res.ok) return res

      // Retry on rate limit / transient server errors
      if (res.status === 429 || res.status === 500 || res.status === 502 || res.status === 503) {
        const backoffMs = Math.min(2000, 250 * 2 ** (attempt - 1))
        await sleep(backoffMs)
        continue
      }

      return res
    } catch (e) {
      lastError = e
      const backoffMs = Math.min(2000, 250 * 2 ** (attempt - 1))
      await sleep(backoffMs)
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to fetch Google Calendar')
}

export type HolidayMap = Record<string, string>

export async function fetchHolidaysForMonth(params: {
  year: number
  month: number
}): Promise<HolidayMap> {
  const { year, month } = params

  const apiKey = getGoogleCalendarApiKey()
  const calendarId = getGoogleHolidayCalendarId()

  const timeMin = toTokyoOffsetRfc3339(year, month, 1)
  const next = firstDayNextMonth(year, month)
  const timeMax = toTokyoOffsetRfc3339(next.year, next.month, 1)

  const baseUrl = 'https://www.googleapis.com/calendar/v3'
  const url =
    `${baseUrl}/calendars/${encodeURIComponent(calendarId)}/events` +
    `?key=${encodeURIComponent(apiKey)}` +
    `&singleEvents=true&orderBy=startTime` +
    `&timeMin=${encodeURIComponent(timeMin)}` +
    `&timeMax=${encodeURIComponent(timeMax)}`

  const res = await fetchJsonWithRetry(url, { method: 'GET' })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Google Calendar API error: status=${res.status} ${text}`)
  }

  const json = (await res.json()) as GoogleCalendarEventsResponse
  const map: HolidayMap = {}

  for (const item of json.items ?? []) {
    const date = normalizeDateFromEvent(item)
    if (!date) continue
    const name = (item.summary ?? '').trim()
    if (!name) continue
    map[date] = name
  }

  return map
}
