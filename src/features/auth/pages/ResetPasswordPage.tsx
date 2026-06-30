import { useSearchParams, useParams } from 'react-router-dom'
import { AuthPageLayout } from '@idalovkh/taqseet-ui-react'
import { ResetPasswordForm } from '../components/ResetPasswordForm/ResetPasswordForm'
import { parseAppType, resolveReturnUrl } from '@/shared/utils/appContext'
import './ResetPasswordPage.css'

export const ResetPasswordPage = () => {
  const { token } = useParams<{ token: string }>()
  const [searchParams] = useSearchParams()
  const app = parseAppType(searchParams.get('app'))
  const returnUrl = resolveReturnUrl(searchParams, app)

  if (!token) {
    return null
  }

  return (
    <AuthPageLayout
      logoText="T"
      title="Taqseet"
      subtitle="Сброс пароля"
      variant="centered"
    >
      <ResetPasswordForm token={token} app={app} returnUrl={returnUrl} />
    </AuthPageLayout>
  )
}
