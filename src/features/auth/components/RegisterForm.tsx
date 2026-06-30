import { useState } from 'react';
import { Input } from '@idalovkh/taqseet-ui-react';
import { InvitationInfo, invitationApi } from '../api/invitationApi';
import { getErrorMessage } from '@/core/api/client';
import { completeAuthHandoff, redirectToApp } from '../utils/ssoHandoff';
import type { AppType } from '@/config/env';
import './RegisterForm.css';

interface RegisterFormProps {
  invitation: InvitationInfo;
  token: string;
  app: AppType;
  returnUrl: string;
  onBack?: () => void;
}

export const RegisterForm = ({ invitation, token, app, returnUrl, onBack }: RegisterFormProps) => {

  if (!invitation) {
    return <div>Загрузка данных приглашения...</div>;
  }

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    phone: '',
    gender: '' as 'male' | 'female' | '',
    birthDate: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [offerAccepted, setOfferAccepted] = useState(false);
  const [personalDataAccepted, setPersonalDataAccepted] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Имя обязательно';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Фамилия обязательна';
    }

    if (!formData.middleName.trim()) {
      newErrors.middleName = 'Отчество обязательно';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Номер телефона обязателен';
    } else {
      const digitsOnly = formData.phone.replace(/\D/g, '');
      if (digitsOnly.length < 11) {
        newErrors.phone = 'Номер должен содержать 11 цифр';
      }
    }

    if (!formData.gender) {
      newErrors.gender = 'Пол обязателен';
    }

    if (!formData.birthDate) {
      newErrors.birthDate = 'Дата рождения обязательна';
    } else {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) {
        newErrors.birthDate = 'Вам должно быть не менее 18 лет';
      } else if (age > 120) {
        newErrors.birthDate = 'Некорректная дата рождения';
      }
    }

    if (formData.password.length < 8) {
      newErrors.password = 'Пароль должен содержать минимум 8 символов';
    } else if (!/[A-ZА-ЯЁ]/.test(formData.password)) {
      newErrors.password = 'Пароль должен содержать заглавную букву';
    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
      newErrors.password = 'Пароль должен содержать специальный символ';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    if (!offerAccepted) {
      newErrors.offer = 'Необходимо принять Пользовательское соглашение';
    }

    if (!personalDataAccepted) {
      newErrors.personalData = 'Необходимо дать согласие на обработку персональных данных';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const result = await invitationApi.registerWithInvitation({
        invitationToken: token,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName || undefined,
        phone: formData.phone.replace(/\D/g, ''),
        gender: formData.gender as 'male' | 'female',
        birthDate: formData.birthDate,
      });

      if (!result.ok) {
        setServerError(getErrorMessage(result.error));
        return;
      }

      const handoff = await completeAuthHandoff(result.data, returnUrl, app);
      if (!handoff.ok) {
        setServerError(handoff.error);
        return;
      }
      redirectToApp(handoff.redirectUrl);
    } catch (err: any) {
      const message = err.message || 'Ошибка регистрации';
      const errorCode = err.code;

      // Handle specific error cases
      if (errorCode === 'IDENTIFIER_DUPLICATE' || message.includes('контакт уже зарегистрирован')) {
        // Phone number already exists - highlight phone field
        setErrors({ ...errors, phone: 'Этот номер телефона уже зарегистрирован' });
        setServerError(null);
      } else if (message.includes('телефон')) {
        // Other phone-related errors
        setErrors({ ...errors, phone: message });
        setServerError(null);
      } else if (message.includes('email') || message.includes('Email')) {
        // Email-related errors
        setServerError('Ошибка с email: ' + message);
      } else if (message.includes('пароль') || message.includes('password')) {
        // Password-related errors
        setErrors({ ...errors, password: message });
        setServerError(null);
      } else {
        // Generic server error
        setServerError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="register-form">
      {/* Фамилия */}
      <div>
        <label htmlFor="lastName" className="register-form-label">Фамилия *</label>
        <input
          type="text"
          id="lastName"
          value={formData.lastName}
          onChange={(e) => {
            setFormData({ ...formData, lastName: e.target.value });
            if (errors.lastName) {
              const newErrors = { ...errors };
              delete newErrors.lastName;
              setErrors(newErrors);
            }
          }}
          className={`register-form-input ${errors.lastName ? 'register-form-input--error' : ''}`}
          disabled={submitting}
        />
        {errors.lastName && (
          <span className="register-form-error">
            {errors.lastName}
          </span>
        )}
      </div>

      {/* Имя */}
      <div>
        <label htmlFor="firstName" className="register-form-label">Имя *</label>
        <input
          type="text"
          id="firstName"
          value={formData.firstName}
          onChange={(e) => {
            setFormData({ ...formData, firstName: e.target.value });
            if (errors.firstName) {
              const newErrors = { ...errors };
              delete newErrors.firstName;
              setErrors(newErrors);
            }
          }}
          className={`register-form-input ${errors.firstName ? 'register-form-input--error' : ''}`}
          disabled={submitting}
        />
        {errors.firstName && (
          <span className="register-form-error">
            {errors.firstName}
          </span>
        )}
      </div>

      {/* Отчество */}
      <div>
        <label htmlFor="middleName" className="register-form-label">Отчество *</label>
        <input
          type="text"
          id="middleName"
          value={formData.middleName}
          onChange={(e) => {
            setFormData({ ...formData, middleName: e.target.value });
            if (errors.middleName) {
              const newErrors = { ...errors };
              delete newErrors.middleName;
              setErrors(newErrors);
            }
          }}
          className={`register-form-input ${errors.middleName ? 'register-form-input--error' : ''}`}
          disabled={submitting}
        />
        {errors.middleName && (
          <span className="register-form-error">
            {errors.middleName}
          </span>
        )}
      </div>

      {/* Телефон */}
      <div>
        <label htmlFor="phone" className="register-form-label">Номер телефона *</label>
        <input
          type="tel"
          id="phone"
          value={formData.phone}
          onChange={(e) => {
            let value = e.target.value.replace(/\D/g, '');

            let formatted = '';
            if (value.length > 0) {
              if (value[0] === '7' || value[0] === '8') {
                formatted = '+7';
                value = value.substring(1);
              } else {
                formatted = '+7';
              }

              if (value.length > 0) {
                formatted += ' (' + value.substring(0, 3);
              }
              if (value.length >= 4) {
                formatted += ') ' + value.substring(3, 6);
              }
              if (value.length >= 7) {
                formatted += '-' + value.substring(6, 8);
              }
              if (value.length >= 9) {
                formatted += '-' + value.substring(8, 10);
              }
            }

            setFormData({ ...formData, phone: formatted });
            if (errors.phone) {
              const newErrors = { ...errors };
              delete newErrors.phone;
              setErrors(newErrors);
            }
          }}
          className={`register-form-input ${errors.phone ? 'register-form-input--error' : ''}`}
          disabled={submitting}
          placeholder="+7 (___) ___-__-__"
          maxLength={18}
        />
        {errors.phone && (
          <span className="register-form-error">
            {errors.phone}
          </span>
        )}
      </div>

      {/* Пол */}
      <div>
        <label htmlFor="gender" className="register-form-label">Пол *</label>
        <select
          id="gender"
          value={formData.gender}
          onChange={(e) => {
            setFormData({ ...formData, gender: e.target.value as 'male' | 'female' });
            if (errors.gender) {
              const newErrors = { ...errors };
              delete newErrors.gender;
              setErrors(newErrors);
            }
          }}
          className={`register-form-input ${errors.gender ? 'register-form-input--error' : ''}`}
          disabled={submitting}
        >
          <option value="">Выберите пол</option>
          <option value="male">Мужской</option>
          <option value="female">Женский</option>
        </select>
        {errors.gender && (
          <span className="register-form-error">
            {errors.gender}
          </span>
        )}
      </div>

      {/* Дата рождения */}
      <Input
        id="birthDate"
        label="Дата рождения *"
        type="date"
        className={`register-form-input ${errors.birthDate ? 'register-form-input--error' : ''}`}
        value={formData.birthDate}
        onChange={(e) => {
          setFormData({ ...formData, birthDate: e.target.value });
          if (errors.birthDate) {
            const newErrors = { ...errors };
            delete newErrors.birthDate;
            setErrors(newErrors);
          }
        }}
        error={errors.birthDate}
        disabled={submitting}
        max={new Date().toISOString().split('T')[0]}
      />

      {/* Пароль */}
      <div>
        <label htmlFor="password" className="register-form-label">Пароль *</label>
        <div className="register-form-input-wrap">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            value={formData.password}
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value });
              if (errors.password) {
                const newErrors = { ...errors };
                delete newErrors.password;
                setErrors(newErrors);
              }
            }}
            className={`register-form-input register-form-input--password ${errors.password ? 'register-form-input--error' : ''}`}
            disabled={submitting}
            placeholder="Минимум 8 символов, заглавная буква и символ"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="register-form-toggle-password"
            tabIndex={-1}
          >
            {showPassword ? '👁️‍🗨️' : '👁️'}
          </button>
        </div>
        {errors.password && (
          <span className="register-form-error">
            {errors.password}
          </span>
        )}
      </div>

      {/* Подтверждение пароля */}
      <div>
        <label htmlFor="confirmPassword" className="register-form-label">Подтвердите пароль *</label>
        <div className="register-form-input-wrap">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            value={formData.confirmPassword}
            onChange={(e) => {
              setFormData({ ...formData, confirmPassword: e.target.value });
              if (errors.confirmPassword) {
                const newErrors = { ...errors };
                delete newErrors.confirmPassword;
                setErrors(newErrors);
              }
            }}
            className={`register-form-input register-form-input--password ${errors.confirmPassword ? 'register-form-input--error' : ''}`}
            disabled={submitting}
            placeholder="Повторите пароль"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="register-form-toggle-password"
            tabIndex={-1}
          >
            {showConfirmPassword ? '👁️‍🗨️' : '👁️'}
          </button>
        </div>
        {errors.confirmPassword && (
          <span className="register-form-error">
            {errors.confirmPassword}
          </span>
        )}
      </div>

      {serverError && (
        <div className="register-form-server-error">
          {serverError}
        </div>
      )}

      {/* Согласия */}
      <div className="register-form-consent-block">
        <label className={`register-form-consent-label ${offerAccepted ? 'register-form-consent-label--accepted' : ''} ${errors.offer ? 'register-form-consent-label--error' : ''}`}>
          <input
            type="checkbox"
            checked={offerAccepted}
            onChange={(e) => {
              setOfferAccepted(e.target.checked);
              if (e.target.checked && errors.offer) {
                const newErrors = { ...errors };
                delete newErrors.offer;
                setErrors(newErrors);
              }
            }}
            className="register-form-consent-checkbox"
          />
          <span className="register-form-consent-text">
            Я согласен с{' '}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="register-form-consent-link"
              onClick={(e) => e.stopPropagation()}
            >
              условиями предоставления сервиса
            </a>
          </span>
        </label>
        {errors.offer && (
          <span className="register-form-error register-form-error--checkbox register-form-error--checkbox-tight">
            {errors.offer}
          </span>
        )}

        <label className={`register-form-consent-label ${personalDataAccepted ? 'register-form-consent-label--accepted' : ''} ${errors.personalData ? 'register-form-consent-label--error' : ''}`}>
          <input
            type="checkbox"
            checked={personalDataAccepted}
            onChange={(e) => {
              setPersonalDataAccepted(e.target.checked);
              if (e.target.checked && errors.personalData) {
                const newErrors = { ...errors };
                delete newErrors.personalData;
                setErrors(newErrors);
              }
            }}
            className="register-form-consent-checkbox"
          />
          <span className="register-form-consent-text">
            Я даю согласие на обработку персональных данных в соответствии с{' '}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="register-form-consent-link"
              onClick={(e) => e.stopPropagation()}
            >
              Политикой конфиденциальности
            </a>
          </span>
        </label>
        {errors.personalData && (
          <span className="register-form-error register-form-error--checkbox register-form-error--checkbox-spaced">
            {errors.personalData}
          </span>
        )}
      </div>

      <div className="register-form-actions">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="register-form-btn-back"
            disabled={submitting}
          >
            Назад
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || !offerAccepted || !personalDataAccepted}
          className="register-form-btn-submit"
        >
          {submitting ? 'Завершаем...' : 'Завершить регистрацию'}
        </button>
      </div>
    </form>
  );
};

