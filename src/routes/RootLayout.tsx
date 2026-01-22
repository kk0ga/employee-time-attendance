import { Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { useIsAuthenticated, useMsal } from '@azure/msal-react'

export function RootLayout() {
  const isAuthenticated = useIsAuthenticated()
  const { instance } = useMsal()

  const onLogout = async () => {
    await instance.logoutRedirect()
  }

  return (
    <div style={{ padding: 16 }}>
      <nav style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Link to="/" activeProps={{ style: { fontWeight: 700 } }}>
          Home
        </Link>
        <Link to="/attendance" activeProps={{ style: { fontWeight: 700 } }}>
          勤怠一覧
        </Link>
        <Link to="/about" activeProps={{ style: { fontWeight: 700 } }}>
          About
        </Link>

        <span style={{ flex: 1 }} />

        {isAuthenticated ? (
          <button type="button" onClick={onLogout}>
            ログアウト
          </button>
        ) : (
          <Link to="/login" activeProps={{ style: { fontWeight: 700 } }}>
            ログイン
          </Link>
        )}
      </nav>

      <hr style={{ margin: '16px 0' }} />

      <Outlet />

      <TanStackRouterDevtools position="bottom-right" />
    </div>
  )
}
