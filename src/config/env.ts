/// <reference types="vite/client" />

export type AppType = 'manager' | 'admin' | 'invest' | 'client' | 'partner'

interface EnvConfig {
  authApiUrl: string
  oidcIssuer: string
  managerAppUrl: string
  adminAppUrl: string
  investAppUrl: string
  clientAppUrl: string
  partnerAppUrl: string
  appEnv: 'development' | 'staging' | 'production'
  recaptchaSiteKey: string
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key]
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is not set`)
  }
  return value || defaultValue || ''
}

// Prod: API and OIDC issuer on the same origin as auth portal (nginx → taqseet-auth :8081).
function resolveAuthApiUrl(): string {
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    return `${window.location.origin}/api/v1`
  }
  return getEnvVar('VITE_AUTH_API_URL', '/api/v1')
}

function resolveOidcIssuer(): string {
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    return window.location.origin
  }
  return getEnvVar('VITE_OIDC_ISSUER', 'http://localhost:8081')
}

export const env: EnvConfig = {
  authApiUrl: resolveAuthApiUrl(),
  oidcIssuer: resolveOidcIssuer(),
  managerAppUrl: getEnvVar('VITE_MANAGER_APP_URL', 'http://localhost:3000'),
  adminAppUrl: getEnvVar('VITE_ADMIN_APP_URL', 'http://localhost:3002'),
  investAppUrl: getEnvVar('VITE_INVEST_APP_URL', 'http://localhost:3001'),
  clientAppUrl: getEnvVar('VITE_CLIENT_APP_URL', 'http://localhost:3003'),
  partnerAppUrl: getEnvVar('VITE_PARTNER_APP_URL', 'http://localhost:3004'),
  appEnv: (getEnvVar('VITE_APP_ENV', 'development') as EnvConfig['appEnv']) || 'development',
  recaptchaSiteKey: getEnvVar('VITE_RECAPTCHA_SITE_KEY', ''),
}

export const isDevelopment = env.appEnv === 'development'
