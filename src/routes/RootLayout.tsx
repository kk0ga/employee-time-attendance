import { Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export function RootLayout() {
  return (
    <div style={{ padding: 16 }}>
      <nav style={{ display: 'flex', gap: 12 }}>
        <Link to="/" activeProps={{ style: { fontWeight: 700 } }}>
          Home
        </Link>
        <Link to="/attendance" activeProps={{ style: { fontWeight: 700 } }}>
          勤怠一覧
        </Link>
        <Link to="/about" activeProps={{ style: { fontWeight: 700 } }}>
          About
        </Link>
      </nav>

      <hr style={{ margin: '16px 0' }} />

      <Outlet />

      <TanStackRouterDevtools position="bottom-right" />
    </div>
  )
}
