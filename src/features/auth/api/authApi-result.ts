import { api } from '@/core/api/client'
import type { ApiResult } from '@/core/api/client'
import type { AppType } from '@/config/env'
import { AUTH_REGISTER_ORGANIZATION_PATH } from '../constants/authEndpoints'

export interface LoginRequest {
  email: string
  password: string
  applicationType?: AppType
}

export interface Person {
  id: string
  firstName: string
  lastName: string
  middleName?: string
  birthDate?: string
  gender?: string
}

export interface Account {
  id: string
  email: string
  accountType: string
  isActive: boolean
  isGlobalAdmin?: boolean
  lastLoginAt?: string
}

export interface Role {
  code: string
  name: string
}

export interface Context {
  organizationId: string
  organizationName: string
  roles: Role[]
  permissions: string[]
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  sessionId: string
  expiresAt: string
  account: Account
  person: Person
  contexts: Context[]
}

export interface RegisterOrganizationPendingResponse {
  message: string
  email: string
  verificationRequired: boolean
  verificationSent: boolean
}

export interface RegisterOrganizationRequest {
  organizationName: string
  email: string
  password: string
  firstName: string
  lastName: string
  middleName?: string
  phone: string
  gender: 'male' | 'female'
  birthDate: string
  recaptchaToken?: string
}

export interface MessageResponse {
  message: string
}

export const authApiResult = {
  async login(options: {
    data: LoginRequest
    applicationType: AppType
  }): Promise<ApiResult<LoginResponse>> {
    return api.post<LoginResponse>('/auth/login', {
      email: options.data.email,
      password: options.data.password,
      applicationType: options.applicationType,
    })
  },

  async registerOrganization(options: {
    data: RegisterOrganizationRequest
  }): Promise<ApiResult<RegisterOrganizationPendingResponse>> {
    return api.post<RegisterOrganizationPendingResponse>(
      AUTH_REGISTER_ORGANIZATION_PATH,
      options.data
    )
  },

  async verifyEmail(token: string): Promise<ApiResult<{ verified: boolean; message: string }>> {
    return api.get<{ verified: boolean; message: string }>(
      `/auth/verify-email/${encodeURIComponent(token)}`
    )
  },

  async resendVerification(email: string): Promise<ApiResult<MessageResponse>> {
    return api.post<MessageResponse>('/auth/resend-verification', { email })
  },
}
