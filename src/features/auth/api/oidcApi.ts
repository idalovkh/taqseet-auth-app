import { api, type ApiResult } from '@/core/api/client'
import type { OidcAuthorizeParams } from '@/shared/utils/oidcContext'

export const oidcApi = {
  idpLogin(credentials: { email: string; password: string }): Promise<ApiResult<{ success: boolean }>> {
    return api.post<{ success: boolean }>('/oauth2/interaction/login', credentials)
  },

  grantConsent(params: OidcAuthorizeParams): Promise<ApiResult<{ redirectUrl: string }>> {
    const query = new URLSearchParams()
    query.set('client_id', params.clientId)
    query.set('redirect_uri', params.redirectUri)
    query.set('response_type', params.responseType)
    query.set('scope', params.scope)
    query.set('state', params.state)
    if (params.nonce) {
      query.set('nonce', params.nonce)
    }
    query.set('code_challenge', params.codeChallenge)
    query.set('code_challenge_method', params.codeChallengeMethod)
    return api.post<{ redirectUrl: string }>(`/oauth2/interaction/consent?${query.toString()}`)
  },

  idpLogout(): Promise<ApiResult<{ success: boolean }>> {
    return api.post<{ success: boolean }>('/oauth2/interaction/logout')
  },
}
