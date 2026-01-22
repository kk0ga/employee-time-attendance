import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { MsalProvider } from '@azure/msal-react'
import './index.css'
import { router } from './router'
import { msalInstance } from './auth/msalInstance'

const queryClient = new QueryClient()

async function bootstrap() {
  await msalInstance.initialize()

  const result = await msalInstance.handleRedirectPromise()
  if (result?.account) {
    msalInstance.setActiveAccount(result.account)
  } else {
    const existing = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0]
    if (existing) msalInstance.setActiveAccount(existing)
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </MsalProvider>
    </StrictMode>,
  )
}

void bootstrap()
