import { Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { useIsAuthenticated, useMsal } from '@azure/msal-react'
import { Button } from '@/components/ui/button'

export function RootLayout() {
  const isAuthenticated = useIsAuthenticated()
  const { instance } = useMsal()

  const onLogout = async () => {
    await instance.logoutRedirect()
  }

  const activeClassName = 'font-bold underline'

  return (
    <div className="flex min-h-screen flex-col bg-[#fdfdfd] text-[#0f172a]">
      <header className="sticky top-0 z-50 border-b border-[#8883] bg-[#ffffffcc] px-4 py-3 backdrop-blur-md">
        <nav className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-6 gap-y-2">
          <Link to="/dashboard" activeProps={{ className: activeClassName }} className="hover:opacity-70">
            ダッシュボード
          </Link>
          <Link to="/attendance" activeProps={{ className: activeClassName }} className="hover:opacity-70">
            勤怠一覧
          </Link>
          <Link to="/punch" activeProps={{ className: activeClassName }} className="hover:opacity-70">
            打刻
          </Link>
          <Link to="/reports" activeProps={{ className: activeClassName }} className="hover:opacity-70">
            PDF出力
          </Link>
          <Link to="/settings/work-rule" activeProps={{ className: activeClassName }} className="hover:opacity-70">
            勤務ルール
          </Link>
          <Link to="/about" activeProps={{ className: activeClassName }} className="hover:opacity-70">
            About
          </Link>

          <span className="flex-1" />

          {isAuthenticated ? (
            <Button variant="ghost" size="sm" onClick={onLogout}>
              ログアウト
            </Button>
          ) : (
            <Link to="/login" activeProps={{ className: activeClassName }} className="hover:opacity-70">
              ログイン
            </Link>
          )}
        </nav>
      </header>

      <div className="flex-1">
        <Outlet />
      </div>

      <footer className="border-t border-[#8882] px-4 py-4 text-center text-[12px] opacity-60">
        &copy; 2024 Employee Time Attendance System
      </footer>

      <TanStackRouterDevtools position="bottom-right" />
    </div>
  )
}
