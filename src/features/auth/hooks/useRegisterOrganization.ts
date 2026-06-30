import { useState, useCallback } from 'react'
import {
  authApiResult,
  type RegisterOrganizationRequest,
  type RegisterOrganizationPendingResponse,
} from '../api/authApi-result'
import { getErrorMessage } from '@/core/api/client'

export function useRegisterOrganization() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailConflict, setEmailConflict] = useState(false)

  const clearError = useCallback(() => {
    setError(null)
    setEmailConflict(false)
  }, [])

  const registerOrganization = useCallback(
    async (data: RegisterOrganizationRequest): Promise<RegisterOrganizationPendingResponse> => {
      setIsLoading(true)
      setError(null)
      setEmailConflict(false)

      try {
        const result = await authApiResult.registerOrganization({ data })

        if (!result.ok) {
          if (result.error.code === 'CONFLICT' || result.error.message.includes('зарегистрирован')) {
            setEmailConflict(true)
            setError('Этот email уже зарегистрирован.')
            throw new Error('conflict')
          }
          const msg = getErrorMessage(result.error)
          setError(msg)
          throw new Error(msg)
        }

        return result.data
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return { registerOrganization, isLoading, error, clearError, emailConflict }
}
