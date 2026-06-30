import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { parseOidcParams } from '@/shared/utils/oidcContext'
import { oidcApi } from '@/features/auth/api/oidcApi'
import { getErrorMessage } from '@/core/api/client'
import { Alert, Button } from '@idalovkh/taqseet-ui-react'

export const ConsentPage = () => {
  const [searchParams] = useSearchParams()
  const oidc = parseOidcParams(searchParams)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  if (!oidc) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Alert variant="error">Некорректный запрос авторизации</Alert>
      </div>
    )
  }

  const approve = async () => {
    setIsLoading(true)
    setError(null)
    const result = await oidcApi.grantConsent(oidc)
    setIsLoading(false)
    if (!result.ok) {
      setError(getErrorMessage(result.error))
      return
    }
    window.location.href = result.data.redirectUrl
  }

  return (
    <div style={{ padding: 48, maxWidth: 480, margin: '0 auto' }}>
      <h2>Разрешить доступ</h2>
      <p>
        Приложение <strong>{oidc.clientId}</strong> запрашивает доступ: {oidc.scope}
      </p>
      {error && <Alert variant="error">{error}</Alert>}
      <Button type="button" variant="primary" isLoading={isLoading} onClick={approve}>
        Разрешить
      </Button>
    </div>
  )
}
