import { PublicClientApplication } from '@azure/msal-browser'
import { getMsalConfig } from './msalConfig'

export const msalInstance = new PublicClientApplication(getMsalConfig())

export function getSignedInAccount() {
  const active = msalInstance.getActiveAccount()
  if (active) return active

  const accounts = msalInstance.getAllAccounts()
  return accounts[0] ?? null
}
