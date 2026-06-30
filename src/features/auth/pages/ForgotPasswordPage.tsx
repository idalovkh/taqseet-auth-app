import { useSearchParams } from 'react-router-dom'
import { AuthPageLayout } from '@idalovkh/taqseet-ui-react'
import { ForgotPasswordForm } from '../components/ForgotPasswordForm/ForgotPasswordForm'
import { parseAppType, resolveReturnUrl } from '@/shared/utils/appContext'
import './ForgotPasswordPage.css'

export const ForgotPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const app = parseAppType(searchParams.get('app'))
  const returnUrl = resolveReturnUrl(searchParams, app)

  return (
    <AuthPageLayout
      logoText="T"
      title="Taqseet"
      subtitle="Восстановление пароля"
      variant="centered"
    >
      <ForgotPasswordForm app={app} returnUrl={returnUrl} />
    </AuthPageLayout>
  )
}
