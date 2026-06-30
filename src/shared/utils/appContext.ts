import type { AppType } from '@/config/env'
import { env } from '@/config/env'

const APP_URLS: Record<AppType, string> = {
  manager: env.managerAppUrl,
  admin: env.adminAppUrl,
  invest: env.investAppUrl,
  client: env.clientAppUrl,
  partner: env.partnerAppUrl,
}

const APP_LABELS: Record<AppType, { title: string; subtitle: string }> = {
  manager: {
    title: 'Taqseet Manager',
    subtitle: 'Управление рассрочками, платежами и контрагентами',
  },
  admin: {
    title: 'Taqseet Admin',
    subtitle: 'Администрирование платформы',
  },
  invest: {
    title: 'Taqseet Invest',
    subtitle: 'Кабинет инвестора',
  },
  client: {
    title: 'Taqseet',
    subtitle: 'Личный кабинет клиента',
  },
  partner: {
    title: 'Taqseet Partner',
    subtitle: 'Кабинет партнёра',
  },
}

export function parseAppType(value: string | null): AppType {
  if (value && value in APP_URLS) {
    return value as AppType
  }
  return 'manager'
}

export function getDefaultReturnUrl(app: AppType): string {
  return APP_URLS[app]
}

export function getAppBranding(app: AppType) {
  return APP_LABELS[app]
}

export function resolveReturnUrl(searchParams: URLSearchParams, app: AppType): string {
  const fromQuery = searchParams.get('returnUrl')
  if (fromQuery) {
    try {
      const parsed = new URL(fromQuery)
      const allowedOrigin = new URL(APP_URLS[app]).origin
      if (parsed.origin === allowedOrigin) {
        return fromQuery
      }
    } catch {
      // fall through
    }
  }
  return getDefaultReturnUrl(app)
}

export function buildLoginPath(app: AppType, returnUrl: string): string {
  const params = new URLSearchParams()
  params.set('app', app)
  params.set('returnUrl', returnUrl)
  return `/login?${params.toString()}`
}
