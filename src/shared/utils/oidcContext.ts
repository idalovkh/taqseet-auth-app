export interface OidcAuthorizeParams {
  clientId: string
  redirectUri: string
  responseType: string
  scope: string
  state: string
  nonce?: string
  codeChallenge: string
  codeChallengeMethod: string
}

const REQUIRED_OIDC_KEYS = [
  'client_id',
  'redirect_uri',
  'response_type',
  'state',
  'code_challenge',
] as const

export function isOidcFlow(searchParams: URLSearchParams): boolean {
  return REQUIRED_OIDC_KEYS.every((key) => searchParams.has(key))
}

export function parseOidcParams(searchParams: URLSearchParams): OidcAuthorizeParams | null {
  if (!isOidcFlow(searchParams)) {
    return null
  }

  const responseType = searchParams.get('response_type') ?? ''
  if (responseType !== 'code') {
    return null
  }

  return {
    clientId: searchParams.get('client_id') ?? '',
    redirectUri: searchParams.get('redirect_uri') ?? '',
    responseType,
    scope: searchParams.get('scope') ?? 'openid profile email',
    state: searchParams.get('state') ?? '',
    nonce: searchParams.get('nonce') ?? undefined,
    codeChallenge: searchParams.get('code_challenge') ?? '',
    codeChallengeMethod: searchParams.get('code_challenge_method') ?? 'S256',
  }
}

export function buildAuthorizeUrl(params: OidcAuthorizeParams, issuer: string): string {
  const query = new URLSearchParams()
  query.set('client_id', params.clientId)
  query.set('redirect_uri', params.redirectUri)
  query.set('response_type', params.responseType)
  query.set('scope', params.scope)
  query.set('state', params.state)
  if (params.nonce) {
    query.set('nonce', params.nonce)
  }
  query.set('code_challenge', params.codeChallenge)
  query.set('code_challenge_method', params.codeChallengeMethod)
  return `${issuer.replace(/\/$/, '')}/oauth2/authorize?${query.toString()}`
}

export function appendOidcParamsToPath(path: string, params: OidcAuthorizeParams): string {
  const query = new URLSearchParams()
  query.set('client_id', params.clientId)
  query.set('redirect_uri', params.redirectUri)
  query.set('response_type', params.responseType)
  query.set('scope', params.scope)
  query.set('state', params.state)
  if (params.nonce) {
    query.set('nonce', params.nonce)
  }
  query.set('code_challenge', params.codeChallenge)
  query.set('code_challenge_method', params.codeChallengeMethod)
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}${query.toString()}`
}
