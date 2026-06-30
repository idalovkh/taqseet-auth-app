import { api } from '@/core/api/client'
import type { AppType } from '@/config/env'
import type { LoginResponse } from '@/features/auth/types/auth.types'

export interface SSOCodeResponse {
  code: string
  redirectUrl: string
}

export async function createSSOCode(options: {
  accessToken: string
  sessionId: string
  returnUrl: string
  app: AppType
}): Promise<{ ok: true; data: SSOCodeResponse } | { ok: false; error: { message: string } }> {
  const result = await api.post<SSOCodeResponse>(
    '/auth/sso/code',
    {
      sessionId: options.sessionId,
      returnUrl: options.returnUrl,
      app: options.app,
    },
    options.accessToken
  )
  if (!result.ok) {
    return { ok: false, error: { message: result.error.message } }
  }
  return { ok: true, data: result.data }
}

export async function completeAuthHandoff(
  loginData: LoginResponse,
  returnUrl: string,
  app: AppType
): Promise<{ ok: true; redirectUrl: string } | { ok: false; error: string }> {
  const ssoResult = await createSSOCode({
    accessToken: loginData.accessToken,
    sessionId: loginData.sessionId,
    returnUrl,
    app,
  })
  if (!ssoResult.ok) {
    return { ok: false, error: ssoResult.error.message }
  }
  return { ok: true, redirectUrl: ssoResult.data.redirectUrl }
}

export function redirectToApp(url: string): void {
  window.location.href = url
}
