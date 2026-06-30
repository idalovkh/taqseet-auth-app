/** Действие reCAPTCHA v3 для публичной регистрации (должно совпадать с проверкой на бэкенде). */
export const RECAPTCHA_ACTION_REGISTER_ORGANIZATION = 'register_organization'

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
    }
  }
}

let scriptLoadPromise: Promise<void> | null = null
let recaptchaBadgeVisible = false

function applyRecaptchaBadgeVisibility(): void {
  if (typeof document === 'undefined') return
  const badges = document.querySelectorAll<HTMLElement>('.grecaptcha-badge')
  badges.forEach((badge) => {
    badge.style.visibility = recaptchaBadgeVisible ? 'visible' : 'hidden'
    badge.style.opacity = recaptchaBadgeVisible ? '1' : '0'
    badge.style.pointerEvents = recaptchaBadgeVisible ? 'auto' : 'none'
  })
}

/**
 * По умолчанию бейдж скрыт во всём приложении.
 * Экран, где реально используется reCAPTCHA (например регистрация), должен включать его явно.
 */
export function setRecaptchaBadgeVisibility(visible: boolean): void {
  recaptchaBadgeVisible = visible
  applyRecaptchaBadgeVisibility()

  // Бейдж может появиться асинхронно после инъекции скрипта.
  window.setTimeout(applyRecaptchaBadgeVisibility, 0)
  window.setTimeout(applyRecaptchaBadgeVisibility, 250)
}

export function isRecaptchaConfigured(siteKey: string | undefined): boolean {
  return Boolean(siteKey?.trim())
}

export function loadRecaptcha(siteKey: string): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('reCAPTCHA доступна только в браузере'))
  }

  if (window.grecaptcha) {
    return new Promise((resolve) => {
      window.grecaptcha!.ready(() => {
        applyRecaptchaBadgeVisibility()
        resolve()
      })
    })
  }

  if (!scriptLoadPromise) {
    scriptLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`
      script.async = true
      script.defer = true
      script.onload = () => {
        if (!window.grecaptcha) {
          reject(new Error('reCAPTCHA не инициализировалась'))
          return
        }
        window.grecaptcha.ready(() => {
          applyRecaptchaBadgeVisibility()
          resolve()
        })
      }
      script.onerror = () => reject(new Error('Не удалось загрузить reCAPTCHA'))
      document.head.appendChild(script)
    })
  }

  return scriptLoadPromise
}

export async function executeRecaptcha(siteKey: string, action: string): Promise<string> {
  await loadRecaptcha(siteKey)
  if (!window.grecaptcha) {
    throw new Error('reCAPTCHA не инициализировалась')
  }
  return window.grecaptcha.execute(siteKey, { action })
}
