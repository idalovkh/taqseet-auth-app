import { useSearchParams } from 'react-router-dom'
import { AuthPageLayout } from '@idalovkh/taqseet-ui-react'
import { RegisterOrganizationForm } from '../components/RegisterOrganizationForm/RegisterOrganizationForm'
import { parseAppType, resolveReturnUrl } from '@/shared/utils/appContext'
import './LoginPage.css'
import './RegisterCompanyPage.css'

export const RegisterCompanyPage = () => {
  const [searchParams] = useSearchParams()
  const app = parseAppType(searchParams.get('app'))
  const returnUrl = resolveReturnUrl(searchParams, app)

  return (
    <AuthPageLayout
      logoText="T"
      title="Taqseet Manager"
      subtitle="Регистрация новой компании"
      variant="centered"
      className="register-company-page"
    >
      <RegisterOrganizationForm app={app} returnUrl={returnUrl} />
    </AuthPageLayout>
  )
}
