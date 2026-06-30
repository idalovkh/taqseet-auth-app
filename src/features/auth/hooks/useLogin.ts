import { useState } from 'react'
import { authApiResult } from '../api/authApi-result'
import { oidcApi } from '../api/oidcApi'
import { getErrorMessage } from '@/core/api/client'
import { completeAuthHandoff, redirectToApp } from '../utils/ssoHandoff'
import { buildAuthorizeUrl } from '@/shared/utils/oidcContext'
import type { AuthFlowContext } from '@/shared/utils/authFlowContext'
import type { AppType } from '@/config/env'
import { env } from '@/config/env'

interface UseLoginReturn {
  login: (credentials: { email: string; password: string }) => Promise<void>
  isLoading: boolean
  error: string | null
  clearError: () => void
}

export const useLogin = (flow: AuthFlowContext, legacyApp: AppType, legacyReturnUrl: string): UseLoginReturn => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true)
    setError(null)

    try {
      if (flow.mode === 'oidc') {
        const idpResult = await oidcApi.idpLogin(credentials)
        if (!idpResult.ok) {
          const errorMessage = getErrorMessage(idpResult.error)
          setError(errorMessage)
          throw new Error(errorMessage)
        }
        const authorizeUrl = buildAuthorizeUrl(flow.oidc, env.oidcIssuer)
        window.location.href = authorizeUrl
        return
      }

      const result = await authApiResult.login({ data: credentials, applicationType: legacyApp })
      if (!result.ok) {
        const errorMessage = getErrorMessage(result.error)
        setError(errorMessage)
        throw new Error(errorMessage)
      }

      const handoff = await completeAuthHandoff(result.data, legacyReturnUrl, legacyApp)
      if (!handoff.ok) {
        setError(handoff.error)
        throw new Error(handoff.error)
      }

      redirectToApp(handoff.redirectUrl)
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = () => setError(null)

  return { login, isLoading, error, clearError }
}
