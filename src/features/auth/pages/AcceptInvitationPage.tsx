import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AuthPageLayout } from '@idalovkh/taqseet-ui-react'
import { invitationApi, InvitationInfo } from '../api/invitationApi'
import { getErrorMessage } from '@/core/api/client'
import { RegisterForm } from '../components/RegisterForm'
import { buildLoginPath, parseAppType, resolveReturnUrl } from '@/shared/utils/appContext'
import '../pages/LoginPage.css'

export const AcceptInvitationPage = () => {
  const { token } = useParams<{ token: string }>()
  const [searchParams] = useSearchParams()
  const app = parseAppType(searchParams.get('app'))
  const returnUrl = resolveReturnUrl(searchParams, app)
  const loginPath = buildLoginPath(app, returnUrl)

  const [invitation, setInvitation] = useState<InvitationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Токен приглашения отсутствует')
      setLoading(false)
      return
    }

    invitationApi
      .getInvitationInfo(token)
      .then((result) => {
        if (!result.ok) {
          setError(getErrorMessage(result.error))
          setLoading(false)
          return
        }
        setInvitation(result.data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Не удалось загрузить приглашение')
        setLoading(false)
      })
  }, [token])

  if (loading) {
    return (
      <AuthPageLayout logoText="T" title="Taqseet" subtitle="Загрузка приглашения" variant="centered">
        <div className="spinner">Загрузка...</div>
      </AuthPageLayout>
    )
  }

  if (error || !invitation) {
    return (
      <AuthPageLayout logoText="T" title="Taqseet" subtitle="Приглашение" variant="centered">
        <h2 className="auth-message-title">Ошибка</h2>
        <p className="auth-message-text">{error || 'Приглашение не найдено'}</p>
        <Link to={loginPath} className="auth-btn-primary">
          Вернуться ко входу
        </Link>
      </AuthPageLayout>
    )
  }

  const expiresAt = new Date(invitation.expiresAt)
  const isExpired = expiresAt < new Date()

  if (isExpired) {
    return (
      <AuthPageLayout logoText="T" title="Taqseet" subtitle="Приглашение" variant="centered">
        <h2 className="auth-message-title">Срок приглашения истек</h2>
        <p className="auth-message-text">Это приглашение больше не действительно.</p>
        <Link to={loginPath} className="auth-btn-primary">
          Вернуться ко входу
        </Link>
      </AuthPageLayout>
    )
  }

  if (invitation.requiresRegistration) {
    return (
      <AuthPageLayout
        logoText="T"
        title="Приглашение в команду"
        subtitle={`${invitation.organizationName} приглашает вас присоединиться к команде`}
        variant="centered"
      >
        <RegisterForm invitation={invitation} token={token!} app={app} returnUrl={returnUrl} />
      </AuthPageLayout>
    )
  }

  return (
    <AuthPageLayout logoText="T" title={`Приглашение в ${invitation.organizationName}`} variant="centered">
      <p className="auth-message-text">
        У вас уже есть аккаунт ({invitation.inviteeEmail}). Войдите, чтобы принять приглашение в
        приложении.
      </p>
      <Link to={loginPath} className="auth-btn-primary">
        Войти
      </Link>
    </AuthPageLayout>
  )
}
