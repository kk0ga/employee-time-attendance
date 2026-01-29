import { useEffect, useMemo, useState } from 'react'
import {
  InteractionRequiredAuthError,
  type AuthenticationResult,
} from '@azure/msal-browser'
import { useIsAuthenticated, useMsal } from '@azure/msal-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { getLoginScopes } from '../auth/msalConfig'
import { Button } from '@/components/ui/button'
import { Section } from '@/components/ui/Section'
import { ErrorMessage } from '@/components/ui/ErrorMessage'

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
    <main className="mx-auto w-full max-w-[960px] p-4 text-center">
      <h1>ログイン</h1>

      {errorMessage && (
        <div className="mx-auto max-w-[560px]">
          <ErrorMessage title="認証エラー" message={errorMessage} />
        </div>
      )}

      <Section className="mx-auto mt-6 max-w-[480px] py-10">
        {isAuthenticated ? (
          <>
            <p className="mb-6 font-bold text-[#070]">ログイン済みです。</p>
            <div className="flex flex-col gap-3">
              <Button onClick={onAcquireToken}>
                トークン取得テスト
              </Button>
              <Button variant="ghost" onClick={onLogout}>
                ログアウト
              </Button>
            </div>
            <p className="mt-8">
              <Link to="/" className="text-[#2563eb] hover:underline">ダッシュボードへ</Link>
            </p>
          </>
        ) : (
          <>
            <p className="mb-6 text-[18px]">
              勤怠管理システムを利用するには、<br /> Microsoft アカウントでログインしてください。
            </p>
            <Button onClick={onLogin} className="w-full max-w-[240px] py-4 text-[18px]">
              ログイン
            </Button>
          </>
        )}
      </Section>
    </main>
  )
}
