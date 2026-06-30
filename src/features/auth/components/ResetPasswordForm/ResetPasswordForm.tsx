import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { validateResetToken, resetPassword } from '../../api/passwordResetApi'
import { getErrorMessage } from '@/core/api/client'
import { Alert, Button } from '@idalovkh/taqseet-ui-react'
import { PasswordInput } from '@idalovkh/taqseet-ui-react'
import type { AppType } from '@/config/env'
import { buildLoginPath } from '@/shared/utils/appContext'
import './ResetPasswordForm.css'

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Пароль должен содержать минимум 8 символов')
      .max(100, 'Пароль слишком длинный'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

interface ResetPasswordFormProps {
  token: string
  app: AppType
  returnUrl: string
}

export const ResetPasswordForm = ({ token, app, returnUrl }: ResetPasswordFormProps) => {
  const navigate = useNavigate()
  const loginPath = buildLoginPath(app, returnUrl)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  // Validate token on mount
  useEffect(() => {
    const checkToken = async () => {
      try {
        const result = await validateResetToken(token)
        if (!result.ok || !result.data.valid) {
          setTokenValid(false)
          setError(result.ok ? 'Ссылка для сброса пароля недействительна или истекла' : getErrorMessage(result.error))
        } else {
          setTokenValid(true)
        }
      } catch (err: unknown) {
        setTokenValid(false)
        setError(err instanceof Error ? err.message : 'Ссылка для сброса пароля недействительна или истекла')
      } finally {
        setIsValidating(false)
      }
    }

    checkToken()
  }, [token])

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError(null)
    setIsLoading(true)

    try {
      const result = await resetPassword(token, data.newPassword)
      if (!result.ok) {
        setError(getErrorMessage(result.error))
        return
      }
      setSuccess(true)
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate(loginPath)
      }, 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось сбросить пароль. Попробуйте запросить новую ссылку')
    } finally {
      setIsLoading(false)
    }
  }

  if (isValidating) {
    return (
      <div className="reset-password-loading">
        <div className="loading-spinner"></div>
        <p>Проверка ссылки...</p>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="reset-password-invalid">
        <div className="error-icon">✕</div>
        <h4>Недействительная ссылка</h4>
        <p className="error-message">{error}</p>
        <Link to="/auth/forgot-password" className="action-link">
          Запросить новую ссылку
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="reset-password-success">
        <div className="success-icon">✓</div>
        <h4>Пароль успешно изменён!</h4>
        <p className="success-message">
          Теперь вы можете войти в систему с новым паролем.
        </p>
        <p className="redirect-hint">Перенаправление на страницу входа...</p>
      </div>
    )
  }

  return (
    <form className="reset-password-form" onSubmit={handleSubmit(onSubmit)}>
      <div className="reset-password-form-header">
        <h4>Создайте новый пароль</h4>
        <p className="reset-password-form-hint">
          Введите новый пароль для вашего аккаунта
        </p>
      </div>

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      <div className="reset-password-form-fields">
        <PasswordInput
          {...register('newPassword')}
          label="Новый пароль"
          placeholder="Минимум 8 символов"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          disabled={isLoading}
          autoFocus
        />

        <PasswordInput
          {...register('confirmPassword')}
          label="Подтвердите пароль"
          placeholder="Введите пароль еще раз"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          disabled={isLoading}
        />
      </div>

      <div className="password-requirements">
        <p className="requirements-title">Требования к паролю:</p>
        <ul>
          <li>Минимум 8 символов</li>
          <li>Рекомендуется использовать буквы, цифры и символы</li>
        </ul>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="large"
        isLoading={isLoading}
        className="reset-password-submit-button"
      >
        Сбросить пароль
      </Button>

      <div className="reset-password-actions">
        <Link to={loginPath} className="back-to-login-link">
          ← Вернуться ко входу
        </Link>
      </div>
    </form>
  )
}
