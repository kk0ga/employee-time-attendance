import type { Configuration } from '@azure/msal-browser'

function requiredEnv(name: string): string {
  const value = import.meta.env[name] as string | undefined
  if (!value) throw new Error(`Missing env: ${name}`)
  return value
}

function optionalEnv(name: string, fallback: string): string {
  return (import.meta.env[name] as string | undefined) ?? fallback
}

export function getLoginScopes(): string[] {
  const raw = optionalEnv('VITE_ENTRA_SCOPES', 'openid,profile')
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function getMsalConfig(): Configuration {
  const clientId = requiredEnv('VITE_ENTRA_CLIENT_ID')
  const tenant = optionalEnv('VITE_ENTRA_TENANT', 'common')

  // Hashルーティングでも redirectUri 自体に # を含めない
  // (GitHub Pages / /#/... でも、redirectUri は origin + BASE_URL)
  const redirectUri = `${window.location.origin}${import.meta.env.BASE_URL}`

  return {
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenant}`,
      redirectUri,
    },
    cache: {
      // localStorage永続化は禁止
      cacheLocation: 'sessionStorage',
    },
  }
}
