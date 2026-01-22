import { useEffect, useMemo, useState } from 'react'
import {
  InteractionRequiredAuthError,
  type AuthenticationResult,
} from '@azure/msal-browser'
import { useIsAuthenticated, useMsal } from '@azure/msal-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { getLoginScopes } from '../auth/msalConfig'

export function Login() {
  const { instance } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const scopes = useMemo(() => getLoginScopes(), [])
  const navigate = useNavigate()

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) return
    void navigate({ to: '/dashboard', replace: true })
  }, [isAuthenticated, navigate])

  const onLogin = async () => {
    setErrorMessage(null)
    try {
      await instance.loginRedirect({
        scopes,
      })
    } catch {
      setErrorMessage('ログインを開始できませんでした。')
    }
  }

  const onLogout = async () => {
    setErrorMessage(null)
    try {
      await instance.logoutRedirect()
    } catch {
      setErrorMessage('ログアウトに失敗しました。')
    }
  }

  const onAcquireToken = async () => {
    setErrorMessage(null)
    const account = instance.getActiveAccount() ?? instance.getAllAccounts()[0]
    if (!account) {
      setErrorMessage('ログイン状態を確認できませんでした。')
      return
    }

    try {
      const result: AuthenticationResult = await instance.acquireTokenSilent({
        account,
        scopes,
      })
      // トークンの表示/ログ出力は禁止。UI表示もしない。
      void result
      setErrorMessage('トークン取得に成功しました（表示はしません）。')
    } catch (e) {
      if (e instanceof InteractionRequiredAuthError) {
        await instance.acquireTokenRedirect({
          account,
          scopes,
        })
        return
      }
      setErrorMessage('トークン取得に失敗しました。')
    }
  }

  return (
    <main className="app">
      <h1>ログイン</h1>

      {errorMessage ? <p style={{ maxWidth: 560 }}>{errorMessage}</p> : null}

      {isAuthenticated ? (
        <>
          <p>ログイン済みです。</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button type="button" onClick={onAcquireToken}>
              トークン取得（silent優先）
            </button>
            <button type="button" onClick={onLogout}>
              ログアウト
            </button>
          </div>
          <p style={{ marginTop: 16 }}>
            <Link to="/">Homeへ</Link>
          </p>
        </>
      ) : (
        <>
          <p>Microsoftアカウントでログインしてください。</p>
          <button type="button" onClick={onLogin}>
            ログイン
          </button>
        </>
      )}
    </main>
  )
}
