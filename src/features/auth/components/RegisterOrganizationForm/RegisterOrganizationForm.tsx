import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { Alert, Button, Input, Select } from '@idalovkh/taqseet-ui-react'
import { PasswordInput } from '@idalovkh/taqseet-ui-react'
import type { AppType } from '@/config/env'
import { buildLoginPath } from '@/shared/utils/appContext'
import { useRegisterOrganization } from '../../hooks/useRegisterOrganization'
import { env } from '@/config/env'
import {
  executeRecaptcha,
  isRecaptchaConfigured,
  loadRecaptcha,
  RECAPTCHA_ACTION_REGISTER_ORGANIZATION,
  setRecaptchaBadgeVisibility,
} from '@/shared/lib/recaptcha/recaptcha'
import '../LoginForm/LoginForm.css'
import './RegisterOrganizationForm.css'

const recaptchaSiteKey = env.recaptchaSiteKey.trim()
const recaptchaEnabled = isRecaptchaConfigured(recaptchaSiteKey)

const passwordPolicy = z
  .string()
  .min(8, 'Пароль должен содержать минимум 8 символов')
  .regex(/[A-ZА-ЯЁ]/, 'Пароль должен содержать заглавную букву')
  .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/, 'Пароль должен содержать специальный символ')

const registerOrganizationSchema = z
  .object({
    organizationName: z.string().min(1, 'Укажите название компании'),
    email: z.string().min(1, 'Обязательное поле').email('Введите корректный email'),
    firstName: z
      .string()
      .min(2, 'Минимум 2 символа')
      .max(255, 'Максимум 255 символов'),
    lastName: z
      .string()
      .min(2, 'Минимум 2 символа')
      .max(255, 'Максимум 255 символов'),
    middleName: z.string().max(255, 'Максимум 255 символов').optional(),
    phone: z
      .string()
      .min(1, 'Укажите телефон')
      .refine((v) => v.replace(/\D/g, '').length >= 11, 'Номер должен содержать не менее 11 цифр'),
    gender: z
      .string()
      .refine((v) => v === 'male' || v === 'female', 'Выберите пол'),
    birthDate: z.string().min(1, 'Укажите дату рождения'),
    password: passwordPolicy,
    confirmPassword: z.string().min(1, 'Подтвердите пароль'),
    offerAccepted: z.boolean(),
    personalDataAccepted: z.boolean(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })
  .refine((d) => d.offerAccepted, {
    message: 'Необходимо принять условия',
    path: ['offerAccepted'],
  })
  .refine((d) => d.personalDataAccepted, {
    message: 'Необходимо дать согласие на обработку персональных данных',
    path: ['personalDataAccepted'],
  })
  .superRefine((data, ctx) => {
    const birth = new Date(data.birthDate)
    if (Number.isNaN(birth.getTime())) {
      ctx.addIssue({ code: 'custom', message: 'Некорректная дата', path: ['birthDate'] })
      return
    }
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    if (age < 18) {
      ctx.addIssue({ code: 'custom', message: 'Вам должно быть не менее 18 лет', path: ['birthDate'] })
    } else if (age > 120) {
      ctx.addIssue({ code: 'custom', message: 'Некорректная дата рождения', path: ['birthDate'] })
    }
  })

type RegisterOrganizationFormValues = z.infer<typeof registerOrganizationSchema>

interface RegisterOrganizationFormProps {
  app: AppType
  returnUrl: string
}

export function RegisterOrganizationForm({ app, returnUrl }: RegisterOrganizationFormProps) {
  const navigate = useNavigate()
  const loginPath = buildLoginPath(app, returnUrl)
  const { registerOrganization, isLoading, error, clearError, emailConflict } = useRegisterOrganization()
  const [recaptchaClientError, setRecaptchaClientError] = useState<string | null>(null)
  const [isRegistrationSuccess, setIsRegistrationSuccess] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')

  useEffect(() => {
    if (!recaptchaEnabled) return
    setRecaptchaBadgeVisibility(true)
    loadRecaptcha(recaptchaSiteKey).catch(() => {
      // Ошибка покажем при отправке формы
    })

    return () => {
      setRecaptchaBadgeVisibility(false)
    }
  }, [])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterOrganizationFormValues>({
    resolver: zodResolver(registerOrganizationSchema),
    defaultValues: {
      organizationName: '',
      email: '',
      firstName: '',
      lastName: '',
      middleName: '',
      phone: '',
      gender: '' as 'male' | 'female',
      birthDate: '',
      password: '',
      confirmPassword: '',
      offerAccepted: false,
      personalDataAccepted: false,
    },
  })

  const onSubmit = async (values: RegisterOrganizationFormValues) => {
    clearError()
    setRecaptchaClientError(null)

    if (!recaptchaEnabled && env.appEnv === 'production') {
      setRecaptchaClientError('Регистрация временно недоступна: не настроена защита reCAPTCHA.')
      return
    }

    const payload = {
      organizationName: values.organizationName.trim(),
      email: values.email.trim(),
      password: values.password,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      middleName: values.middleName?.trim() || undefined,
      phone: values.phone.replace(/\D/g, ''),
      gender: values.gender as 'male' | 'female',
      birthDate: values.birthDate,
    }

    const maxRecaptchaAttempts = recaptchaEnabled ? 2 : 1
    try {
      for (let attempt = 0; attempt < maxRecaptchaAttempts; attempt++) {
        let recaptchaToken: string | undefined
        if (recaptchaEnabled) {
          try {
            recaptchaToken = await executeRecaptcha(
              recaptchaSiteKey,
              RECAPTCHA_ACTION_REGISTER_ORGANIZATION
            )
          } catch {
            setRecaptchaClientError(
              'Не удалось выполнить проверку безопасности. Обновите страницу и попробуйте снова.'
            )
            return
          }
        }

        try {
          await registerOrganization({ ...payload, recaptchaToken })
          setRegisteredEmail(payload.email)
          setIsRegistrationSuccess(true)
          return
        } catch (err) {
          const isRecaptcha =
            err instanceof Error && err.message === 'recaptcha'
          if (recaptchaEnabled && isRecaptcha && attempt + 1 < maxRecaptchaAttempts) {
            clearError()
            continue
          }
          break
        }
      }
    } catch {
      // сообщение уже в error из хука
    }
  }

  if (isRegistrationSuccess) {
    return (
      <div className="login-form register-success-screen">
        <div className="login-form-header">
          <h4>Почти готово</h4>
          <p className="login-form-hint">Подтвердите почту, чтобы завершить регистрацию</p>
        </div>

        <div className="register-success-message">
          <p>Письмо для подтверждения отправлено на почту:</p>
          <p className="register-success-email">{registeredEmail}</p>
        </div>

        <Button type="button" variant="primary" size="large" onClick={() => navigate(loginPath)}>
          OK
        </Button>
      </div>
    )
  }

  return (
    <form className="login-form register-org-form" onSubmit={handleSubmit(onSubmit)}>
      <div className="login-form-header">
        <h4>Регистрация компании</h4>
        <p className="login-form-hint">Создайте организацию и войдите в Taqseet Manager</p>
      </div>

      {(error || recaptchaClientError) && (
        <Alert variant="error">
          {recaptchaClientError ?? error}
          {emailConflict && (
            <div style={{ marginTop: 12 }}>
              <Link to={loginPath} className="login-link-button">
                Перейти ко входу
              </Link>
            </div>
          )}
        </Alert>
      )}

      <div className="login-form-fields">
        <Input
          {...register('organizationName')}
          label="Название компании"
          placeholder="ООО «…»"
          autoComplete="organization"
          error={errors.organizationName?.message}
          disabled={isLoading}
        />

        <Input
          {...register('email')}
          label="Email"
          type="email"
          placeholder="Рабочая почта"
          autoComplete="email"
          error={errors.email?.message}
          disabled={isLoading}
        />

        <Input
          {...register('lastName')}
          label="Фамилия"
          autoComplete="family-name"
          error={errors.lastName?.message}
          disabled={isLoading}
        />

        <Input
          {...register('firstName')}
          label="Имя"
          autoComplete="given-name"
          error={errors.firstName?.message}
          disabled={isLoading}
        />

        <Input
          {...register('middleName')}
          label="Отчество"
          placeholder="Необязательно"
          autoComplete="additional-name"
          error={errors.middleName?.message}
          disabled={isLoading}
        />

        <Input
          {...register('phone')}
          label="Телефон"
          type="tel"
          placeholder="+7 …"
          autoComplete="tel"
          error={errors.phone?.message}
          disabled={isLoading}
        />

        <Controller
          name="gender"
          control={control}
          render={({ field }) => (
            <Select
              label="Пол"
              options={[
                { value: '', label: 'Выберите' },
                { value: 'male', label: 'Мужской' },
                { value: 'female', label: 'Женский' },
              ]}
              value={field.value ?? ''}
              onChange={(e) => {
                const v = e.target.value
                field.onChange(v)
              }}
              error={errors.gender?.message}
              disabled={isLoading}
            />
          )}
        />

        <Controller
          name="birthDate"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label="Дата рождения"
              type="date"
              autoComplete="bday"
              error={errors.birthDate?.message}
              disabled={isLoading}
            />
          )}
        />

        <PasswordInput
          {...register('password')}
          label="Пароль"
          placeholder="Не менее 8 символов"
          autoComplete="new-password"
          error={errors.password?.message}
          disabled={isLoading}
        />

        <PasswordInput
          {...register('confirmPassword')}
          label="Повтор пароля"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          disabled={isLoading}
        />
      </div>

      <div className="register-org-form-consents">
        <label className="register-org-form-consent">
          <input
            type="checkbox"
            {...register('offerAccepted')}
            disabled={isLoading}
            className="register-org-form-consent-input"
          />
          <span className="register-org-form-consent-text">
            Я согласен с{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer">
              условиями предоставления сервиса
            </a>
          </span>
        </label>
        {errors.offerAccepted && (
          <span className="register-org-form-consent-error">{errors.offerAccepted.message}</span>
        )}

        <label className="register-org-form-consent">
          <input
            type="checkbox"
            {...register('personalDataAccepted')}
            disabled={isLoading}
            className="register-org-form-consent-input"
          />
          <span className="register-org-form-consent-text">
            Я даю согласие на обработку персональных данных в соответствии с{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer">
              Политикой конфиденциальности
            </a>
          </span>
        </label>
        {errors.personalDataAccepted && (
          <span className="register-org-form-consent-error">{errors.personalDataAccepted.message}</span>
        )}
      </div>

      <Button type="submit" variant="primary" size="large" isLoading={isLoading} className="login-submit-button">
        Зарегистрироваться
      </Button>

      <div className="login-actions">
        <Link to={loginPath} className="login-link-button">
          Уже есть аккаунт? Войти
        </Link>
      </div>

      {recaptchaEnabled && (
        <p className="register-recaptcha-notice">
          Этот сайт защищён reCAPTCHA. Применяются{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
            Политика конфиденциальности
          </a>{' '}
          и{' '}
          <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">
            Условия использования
          </a>{' '}
          Google.
        </p>
      )}
    </form>
  )
}
