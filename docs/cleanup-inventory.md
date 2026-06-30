# Auth Cleanup Inventory

Scope: `taqseet-auth` and `taqseet-auth-app`

## Confirmed Safe Cleanup Candidates

- `lucide-react` dependency in `taqseet-auth-app/package.json`
  - no imports in `taqseet-auth-app/src`
  - safe to remove via package manager

## Route/Link Mismatch Candidates (Needs Resolution)

- Links to `/privacy` and `/terms` exist in:
  - `taqseet-auth-app/src/features/auth/components/RegisterForm.tsx`
  - `taqseet-auth-app/src/features/auth/components/RegisterOrganizationForm/RegisterOrganizationForm.tsx`
- Pages exist:
  - `taqseet-auth-app/src/features/auth/pages/PrivacyPage.tsx`
  - `taqseet-auth-app/src/features/auth/pages/TermsPage.tsx`
- But routes were missing from:
  - `taqseet-auth-app/src/router/routes.tsx`

## Conditional (Do Not Delete Blindly)

- Local dev artifacts:
  - `.idea/`
  - `node_modules/`
  - `dist/`
- These should be controlled by git tracking policy and `.gitignore`, not removed as part of functional cleanup.

## Out of Scope for This Cleanup

- Backend auth flow in `taqseet-auth` (Go service)
- OIDC / SSO contract and API behavior
- Registration and verification business logic
