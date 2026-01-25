function requiredEnv(name: string): string {
  const value = import.meta.env[name] as string | undefined
  if (!value) throw new Error(`Missing env: ${name}`)
  return value
}

export function getGoogleCalendarApiKey(): string {
  return requiredEnv('VITE_GCAL_API_KEY')
}

export function getGoogleHolidayCalendarId(): string {
  return requiredEnv('VITE_GCAL_HOLIDAY_CALENDAR_ID')
}
