import { api, type ApiResult } from '@/core/api/client'
import type { AppType } from '@/config/env'

export interface ForgotPasswordResponse {
  message: string
}

export interface ResetPasswordResponse {
  message: string
}

export interface ValidateTokenResponse {
  valid: boolean
}

export const passwordResetApi = {
  requestPasswordReset(email: string, appType: AppType): Promise<ApiResult<ForgotPasswordResponse>> {
    return api.post<ForgotPasswordResponse>('/auth/forgot-password', { email, appType })
  },

  validateResetToken(token: string): Promise<ApiResult<ValidateTokenResponse>> {
    return api.get<ValidateTokenResponse>(
      `/auth/validate-reset-token/${encodeURIComponent(token)}`
    )
  },

  resetPassword(token: string, newPassword: string): Promise<ApiResult<ResetPasswordResponse>> {
    return api.post<ResetPasswordResponse>('/auth/reset-password', { token, newPassword })
  },
}

// Backward-compatible named exports
export const requestPasswordReset = passwordResetApi.requestPasswordReset
export const validateResetToken = passwordResetApi.validateResetToken
export const resetPassword = passwordResetApi.resetPassword
