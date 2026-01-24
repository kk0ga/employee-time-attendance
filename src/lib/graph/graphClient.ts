import { InteractionRequiredAuthError } from '@azure/msal-browser'
import { msalInstance, getSignedInAccount } from '../../auth/msalInstance'
import { getGraphScopes } from './config'

type GraphErrorDetails = {
  error?: {
    code?: string
    message?: string
  }
}

export class GraphRequestError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'GraphRequestError'
    this.status = status
    this.code = code
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 503
}

function backoffMs(attempt: number): number {
  const base = Math.min(8_000, 500 * Math.pow(2, attempt))
  const jitter = Math.floor(Math.random() * 250)
  return base + jitter
}

async function getAccessToken(): Promise<string> {
  const account = getSignedInAccount()
  if (!account) throw new Error('Not signed in')

  msalInstance.setActiveAccount(account)

  const scopes = getGraphScopes()

  try {
    const result = await msalInstance.acquireTokenSilent({
      account,
      scopes,
    })

    return result.accessToken
  } catch (err) {
    // 追加スコープの同意が必要など、サイレント取得できない場合は対話にフォールバック
    if (err instanceof InteractionRequiredAuthError) {
      await msalInstance.acquireTokenRedirect({
        account,
        scopes,
      })
      throw new Error('Interactive authentication required')
    }

    throw err
  }
}

export async function graphFetch<T>(
  path: string,
  init: RequestInit & { retry?: number } = {},
): Promise<T> {
  const retry = init.retry ?? 4
  const url = path.startsWith('http') ? path : `https://graph.microsoft.com/v1.0${path}`

  let lastError: unknown = null

  for (let attempt = 0; attempt <= retry; attempt++) {
    try {
      const token = await getAccessToken()

      const res = await fetch(url, {
        ...init,
        headers: {
          ...(init.headers ?? {}),
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })

      if (res.ok) {
        if (res.status === 204) return undefined as T
        return (await res.json()) as T
      }

      if (isRetryableStatus(res.status) && attempt < retry) {
        const retryAfter = res.headers.get('retry-after')
        const waitMs = retryAfter ? Number(retryAfter) * 1000 : backoffMs(attempt)
        await sleep(Number.isFinite(waitMs) ? waitMs : backoffMs(attempt))
        continue
      }

      let details: GraphErrorDetails | undefined
      try {
        details = (await res.json()) as GraphErrorDetails
      } catch {
        details = undefined
      }

      const message = details?.error?.message || `Graph request failed: ${res.status}`
      throw new GraphRequestError(message, res.status, details?.error?.code)
    } catch (err) {
      lastError = err
      if (attempt < retry) {
        await sleep(backoffMs(attempt))
        continue
      }
      throw lastError
    }
  }

  throw lastError
}
