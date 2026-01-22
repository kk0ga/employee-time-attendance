import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from '@tanstack/react-router'
import App from './App'
import { Attendance } from './routes/Attendance'
import { About } from './routes/About'
import { Dashboard } from './routes/Dashboard'
import { Login } from './routes/Login'
import { RootLayout } from './routes/RootLayout'
import { getSignedInAccount, msalInstance } from './auth/msalInstance'

const rootRoute = createRootRoute({
  component: RootLayout,
})

function requireAuth() {
  const account = getSignedInAccount()
  if (account) {
    msalInstance.setActiveAccount(account)
    return
  }

  throw redirect({
    to: '/login',
  })
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: App,
  beforeLoad: () => {
    requireAuth()
    throw redirect({
      to: '/dashboard',
      replace: true,
    })
  },
})

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: Dashboard,
  beforeLoad: requireAuth,
})

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: About,
  beforeLoad: requireAuth,
})

const attendanceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/attendance',
  component: Attendance,
  beforeLoad: requireAuth,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  aboutRoute,
  attendanceRoute,
  loginRoute,
])

export const router = createRouter({
  routeTree,
  history: createHashHistory(),
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
