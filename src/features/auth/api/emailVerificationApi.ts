import { api, type ApiResult } from '@/core/api/client'

export interface VerifyEmailResponse {
  verified: boolean
  message: string
}

export const emailVerificationApi = {
  verifyEmail(token: string): Promise<ApiResult<VerifyEmailResponse>> {
    return api.get<VerifyEmailResponse>(`/auth/verify-email/${encodeURIComponent(token)}`)
  },
}

export const verifyEmail = emailVerificationApi.verifyEmail
