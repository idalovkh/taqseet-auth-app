import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { env } from '@/config/env'

export interface ApiError {
  code: string
  message: string
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError }

const CSRF_HEADER = 'X-CSRF-Token'
const CSRF_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/** Public auth endpoints that must not send CSRF token */
const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/logout',
  '/auth/register-organization',
  '/auth/register-with-invitation',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/validate-reset-token',
  '/auth/verify-email',
  '/auth/resend-verification',
  '/auth/sso/exchange',
]

let csrfToken: string | null = null

const client = axios.create({
  baseURL: env.authApiUrl,
  timeout: 30000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

function isPublicAuthPath(url?: string): boolean {
  if (!url) return false
  return PUBLIC_AUTH_PATHS.some((path) => url.startsWith(path) || url.includes(path))
}

function captureCsrfFromResponse(headers: Record<string, unknown>): void {
  const token = headers['x-csrf-token'] ?? headers[CSRF_HEADER.toLowerCase()]
  if (typeof token === 'string' && token.length > 0) {
    csrfToken = token
  }
}

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const method = config.method?.toUpperCase() ?? 'GET'
  if (CSRF_METHODS.has(method) && !isPublicAuthPath(config.url) && csrfToken && config.headers) {
    config.headers[CSRF_HEADER] = csrfToken
  }
  return config
})

client.interceptors.response.use((response) => {
  captureCsrfFromResponse(response.headers as Record<string, unknown>)
  return response
})

function unwrap<T>(data: unknown): T {
  if (data && typeof data === 'object' && 'data' in data) {
    return (data as { data: T }).data
  }
  return data as T
}

function mapError(err: unknown): ApiError {
  const axiosError = err as AxiosError<{ error?: { code?: string; message?: string } }>
  if (axiosError.response?.data?.error) {
    const e = axiosError.response.data.error
    return {
      code: e.code ?? 'UNKNOWN',
      message: e.message ?? 'Ошибка сервера',
    }
  }
  if (!axiosError.response) {
    return { code: 'NETWORK', message: 'Нет связи с сервером' }
  }
  return { code: 'UNKNOWN', message: 'Ошибка сервера' }
}

async function request<T>(
  method: 'get' | 'post',
  url: string,
  body?: unknown,
  accessToken?: string
): Promise<ApiResult<T>> {
  try {
    const headers: Record<string, string> = {}
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`
    }
    const response =
      method === 'get'
        ? await client.get(url, { headers })
        : await client.post(url, body, { headers })
    captureCsrfFromResponse(response.headers as Record<string, unknown>)
    return { ok: true, data: unwrap<T>(response.data) }
  } catch (err) {
    return { ok: false, error: mapError(err) }
  }
}

export const api = {
  get: <T>(url: string) => request<T>('get', url),
  post: <T>(url: string, body?: unknown, accessToken?: string) =>
    request<T>('post', url, body, accessToken),
}

export function getErrorMessage(error: ApiError): string {
  return error.message
}
