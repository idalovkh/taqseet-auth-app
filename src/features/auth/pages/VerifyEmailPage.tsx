import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { verifyEmail } from '../api/emailVerificationApi'
import { getErrorMessage } from '@/core/api/client'
import { buildLoginPath, parseAppType, resolveReturnUrl } from '@/shared/utils/appContext'
import './VerifyEmailPage.css'

type VerifyStatus = 'loading' | 'success' | 'error'

export const VerifyEmailPage = () => {
  const { token } = useParams<{ token: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const app = parseAppType(searchParams.get('app'))
  const returnUrl = resolveReturnUrl(searchParams, app)
  const loginPath = buildLoginPath(app, returnUrl)

  const [status, setStatus] = useState<VerifyStatus>('loading')
  const [message, setMessage] = useState('Проверяем ссылку подтверждения...')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Ссылка подтверждения некорректна')
      return
    }

    let isMounted = true

    const run = async () => {
      try {
        const result = await verifyEmail(token)
        if (!isMounted) return
        if (!result.ok) {
          setStatus('error')
          setMessage(getErrorMessage(result.error))
          return
        }
        setStatus('success')
        setMessage(result.data.message || 'Email успешно подтвержден')
        setTimeout(() => {
          navigate(loginPath, { replace: true })
        }, 2500)
      } catch (error) {
        if (!isMounted) return
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Ссылка недействительна или истекла')
      }
    }

    run()
    return () => {
      isMounted = false
    }
  }, [navigate, token, loginPath])

  return (
    <div className="verify-email-page">
      <div className="verify-email-card">
        <h1 className="verify-email-title">Подтверждение email</h1>
        <p className="verify-email-message">
          {status === 'loading' ? 'Проверка...' : message}
        </p>
        {status === 'error' && (
          <Link to={loginPath} className="verify-email-link">
            Перейти ко входу
          </Link>
        )}
      </div>
    </div>
  )
}
