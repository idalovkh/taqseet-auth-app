import { useSearchParams } from 'react-router-dom'
import { AuthPageLayout } from '@idalovkh/taqseet-ui-react'
import { LoginForm } from '../components/LoginForm/LoginForm'
import { getAppBranding, parseAppType, resolveReturnUrl } from '@/shared/utils/appContext'
import { resolveAuthFlowContext } from '@/shared/utils/authFlowContext'
import './LoginPage.css'

export const LoginPage = () => {
  const [searchParams] = useSearchParams()
  const app = parseAppType(searchParams.get('app'))
  const returnUrl = resolveReturnUrl(searchParams, app)
  const flow = resolveAuthFlowContext(searchParams, app, returnUrl)
  const branding = getAppBranding(app)

  const registerParams = new URLSearchParams({ app, returnUrl })

  return (
    <AuthPageLayout
      logoText="T"
      title={branding.title}
      subtitle={branding.subtitle}
      variant="centered"
      footer={
        <div className="login-footer-content">
          <div className="login-footer-links">
            {app === 'manager' && (
              <a href={`/register-organization?${registerParams.toString()}`} className="login-footer-link">
                Зарегистрировать компанию
              </a>
            )}
          </div>
          <p className="login-footer-copyright">© 2026 Taqseet. Все права защищены.</p>
        </div>
      }
    >
      <LoginForm flow={flow} app={app} returnUrl={returnUrl} />
    </AuthPageLayout>
  )
}
