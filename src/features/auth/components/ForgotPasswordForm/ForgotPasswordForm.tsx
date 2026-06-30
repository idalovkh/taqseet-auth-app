import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../../api/passwordResetApi'
import { getErrorMessage } from '@/core/api/client'
import { Alert, Button, Input } from '@idalovkh/taqseet-ui-react'
import type { AppType } from '@/config/env'
import { buildLoginPath } from '@/shared/utils/appContext'
import './ForgotPasswordForm.css'

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Обязательное поле').email('Введите корректный email'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

interface ForgotPasswordFormProps {
  app: AppType
  returnUrl: string
}

export const ForgotPasswordForm = ({ app, returnUrl }: ForgotPasswordFormProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const loginPath = buildLoginPath(app, returnUrl)

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError(null)
    setIsLoading(true)

    try {
      const result = await requestPasswordReset(data.email, app)
      if (!result.ok) {
        setError(getErrorMessage(result.error))
        return
      }
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить запрос. Попробуйте позже')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="forgot-password-success">
        <div className="success-icon">✓</div>
        <h4>Проверьте вашу почту</h4>
        <p className="success-message">
          Если указанный email зарегистрирован в системе, на него будет отправлено письмо с
          инструкциями по восстановлению пароля.
        </p>
        <Link to={loginPath} className="back-to-login-link">
          Вернуться ко входу
        </Link>
      </div>
    )
  }

  return (
    <form className="forgot-password-form" onSubmit={handleSubmit(onSubmit)}>
      <div className="forgot-password-form-header">
        <h4>Забыли пароль?</h4>
        <p className="forgot-password-form-hint">
          Введите email, и мы отправим вам инструкции по восстановлению пароля
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="forgot-password-form-fields">
        <Input
          {...register('email')}
          label="Email"
          type="email"
          placeholder="Введите свою почту"
          autoComplete="email"
          error={errors.email?.message}
          disabled={isLoading}
          autoFocus
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="large"
        isLoading={isLoading}
        className="forgot-password-submit-button"
      >
        Отправить инструкции
      </Button>

      <div className="forgot-password-actions">
        <Link to={loginPath} className="back-to-login-link">
          ← Вернуться ко входу
        </Link>
      </div>
    </form>
  )
}
