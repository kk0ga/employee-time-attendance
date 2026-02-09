import { requiredEnv } from '../env.ts'

export function getGoogleCalendarApiKey(): string {
  return requiredEnv('VITE_GCAL_API_KEY')
}

export function getGoogleHolidayCalendarId(): string {
  return requiredEnv('VITE_GCAL_HOLIDAY_CALENDAR_ID')
}

