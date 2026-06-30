import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'
import { VerifyEmailPage } from '@/features/auth/pages/VerifyEmailPage'
import { AcceptInvitationPage } from '@/features/auth/pages/AcceptInvitationPage'
import { RegisterCompanyPage } from '@/features/auth/pages/RegisterCompanyPage'
import { ConsentPage } from '@/features/auth/pages/ConsentPage'
import { PrivacyPage } from '@/features/auth/pages/PrivacyPage'
import { TermsPage } from '@/features/auth/pages/TermsPage'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/consent', element: <ConsentPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password/:token', element: <ResetPasswordPage /> },
  { path: '/verify-email/:token', element: <VerifyEmailPage /> },
  { path: '/invitation/:token', element: <AcceptInvitationPage /> },
  { path: '/register-organization', element: <RegisterCompanyPage /> },
  { path: '/privacy', element: <PrivacyPage /> },
  { path: '/terms', element: <TermsPage /> },
  { path: '*', element: <Navigate to="/login" replace /> },
])
