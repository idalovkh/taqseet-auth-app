import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useLocation } from 'react-router-dom'
import { useLogin } from '../../hooks/useLogin'
import { Alert, Button, Input } from '@idalovkh/taqseet-ui-react'
import { PasswordInput } from '@idalovkh/taqseet-ui-react'
import type { AuthFlowContext } from '@/shared/utils/authFlowContext'
import type { AppType } from '@/config/env'
import { buildLoginPath } from '@/shared/utils/appContext'
import { appendOidcParamsToPath } from '@/shared/utils/oidcContext'
import './LoginForm.css'

const loginSchema = z.object({
  email: z.string().min(1, 'Обязательное поле').email('Введите корректный email'),
  password: z.string().min(1, 'Обязательное поле'),
})

type LoginFormData = z.infer<typeof loginSchema>

type RegistrationPendingLocationState = {
  registrationPending?: boolean
  email?: string
  message?: string
  verificationSent?: boolean
}

interface LoginFormProps {
  flow: AuthFlowContext
  app: AppType
  returnUrl: string
}

export const LoginForm = ({ flow, app, returnUrl }: LoginFormProps) => {
  const location = useLocation()
  const registrationNotice = location.state as RegistrationPendingLocationState | null
  const { login, isLoading, error, clearError } = useLogin(flow, app, returnUrl)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    clearError()
    try {
      await login(data)
    } catch {
      // handled in hook
    }
  }

  const forgotPath =
    flow.mode === 'oidc'
      ? appendOidcParamsToPath('/forgot-password', flow.oidc)
      : `/forgot-password?${new URLSearchParams({ app, returnUrl }).toString()}`

  return (
    <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
      <div className="login-form-header">
        <h4>Вход в систему</h4>
        <p className="login-form-hint">Введите email и пароль вашего аккаунта</p>
      </div>

      {registrationNotice?.registrationPending && (
        <Alert variant="success">
          {registrationNotice.message ??
            'Регистрация почти завершена. Перейдите по ссылке из письма, чтобы активировать аккаунт.'}
          {registrationNotice.email && (
            <div style={{ marginTop: 8 }}>
              Письмо отправлено на <strong>{registrationNotice.email}</strong>
            </div>
          )}
        </Alert>
      )}

      {error && <Alert variant="error">{error}</Alert>}

      <div className="login-form-fields">
        <Input
          {...register('email')}
          label="Email"
          type="email"
          placeholder="Введите свою почту"
          autoComplete="email"
          error={errors.email?.message}
          disabled={isLoading}
        />

        <PasswordInput
          {...register('password')}
          label="Пароль"
          placeholder="Введите пароль"
          autoComplete="current-password"
          error={errors.password?.message}
          disabled={isLoading}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="large"
        isLoading={isLoading}
        className="login-submit-button"
      >
        Войти
      </Button>

      <div className="login-actions">
        <Link to={forgotPath} className="login-link-button">
          Забыли пароль?
        </Link>
      </div>
    </form>
  )
}

export { buildLoginPath }
