import { api, type ApiResult } from '@/core/api/client'
import type { LoginResponse } from './authApi-result'

export interface InvitationInfo {
  invitationId: string
  organizationId: string
  organizationName: string
  inviteeEmail: string
  targetRole: 'investor' | 'employee'
  profitShareRate?: number
  minInvestment?: number
  message?: string
  position?: string
  requiresRegistration: boolean
  expiresAt: string
}

export interface RegisterWithInvitationRequest {
  invitationToken: string
  password: string
  firstName: string
  lastName: string
  middleName?: string
  phone: string
  gender: 'male' | 'female'
  birthDate: string
  recaptchaToken?: string
}

export const invitationApi = {
  getInvitationInfo(token: string): Promise<ApiResult<InvitationInfo>> {
    return api.get<InvitationInfo>(`/auth/invitation/${encodeURIComponent(token)}`)
  },

  registerWithInvitation(data: RegisterWithInvitationRequest): Promise<ApiResult<LoginResponse>> {
    return api.post<LoginResponse>('/auth/register-with-invitation', data)
  },
}
