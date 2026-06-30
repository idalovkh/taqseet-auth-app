import type { AppType } from '@/config/env'
import { isOidcFlow, parseOidcParams, type OidcAuthorizeParams } from './oidcContext'

export type AuthFlowMode = 'legacy' | 'oidc'

export interface LegacyAuthContext {
  mode: 'legacy'
  app: AppType
  returnUrl: string
}

export interface OidcAuthContext {
  mode: 'oidc'
  oidc: OidcAuthorizeParams
}

export type AuthFlowContext = LegacyAuthContext | OidcAuthContext

export function resolveAuthFlowContext(searchParams: URLSearchParams, app: AppType, returnUrl: string): AuthFlowContext {
  if (isOidcFlow(searchParams)) {
    const oidc = parseOidcParams(searchParams)
    if (oidc) {
      return { mode: 'oidc', oidc }
    }
  }
  return { mode: 'legacy', app, returnUrl }
}
