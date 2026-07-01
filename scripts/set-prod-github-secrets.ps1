# Requires: gh auth login (account with access to idalovkh/taqseet-auth-app)
# Usage:
#   1. Copy scripts/prod-secrets.env.example to scripts/prod-secrets.env
#   2. Put SSH private key into scripts/prod_ssh_key.pem
#   3. Fill scripts/prod-secrets.env
#   4. .\scripts\set-prod-github-secrets.ps1

$ErrorActionPreference = "Stop"
$Repo = "idalovkh/taqseet-auth-app"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$EnvFile = Join-Path $ScriptDir "prod-secrets.env"
$Utf8NoBom = New-Object System.Text.UTF8Encoding $false

if (-not (Test-Path $EnvFile)) {
    throw "Missing prod-secrets.env. Copy from prod-secrets.env.example"
}

function Set-GhSecretFromString([string]$Name, [string]$Value) {
    if ([string]::IsNullOrWhiteSpace($Value)) { return }
    $path = Join-Path $env:TEMP ("ghsec-" + [guid]::NewGuid().ToString("N"))
    try {
        [System.IO.File]::WriteAllText($path, $Value.Trim(), $Utf8NoBom)
        $cmd = 'gh secret set ' + $Name + ' -R ' + $Repo + ' < "' + $path + '"'
        cmd /c $cmd
        if ($LASTEXITCODE -ne 0) {
            throw ("gh secret set failed for " + $Name + " (exit " + $LASTEXITCODE + ")")
        }
        Write-Host ("set " + $Name)
    } finally {
        if (Test-Path $path) { Remove-Item -Force $path }
    }
}

$vars = @{}
Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq "" -or $line.StartsWith("#")) { return }
    $idx = $line.IndexOf("=")
    if ($idx -lt 1) { return }
    $key = $line.Substring(0, $idx).Trim()
    $val = $line.Substring($idx + 1).Trim()
    $vars[$key] = $val
}

if ($vars.ContainsKey("PROD_SSH_PRIVATE_KEY_FILE")) {
    $keyFile = Join-Path $ScriptDir $vars["PROD_SSH_PRIVATE_KEY_FILE"]
    if (-not (Test-Path $keyFile)) { throw ("SSH key file not found: " + $keyFile) }
    $vars["PROD_SSH_PRIVATE_KEY"] = Get-Content -Raw $keyFile
}

$secretNames = @(
    "PROD_SERVER_HOST",
    "PROD_SERVER_USER",
    "PROD_SSH_PRIVATE_KEY",
    "PROD_AUTH_API_URL",
    "PROD_OIDC_ISSUER",
    "PROD_MANAGER_APP_URL",
    "PROD_ADMIN_APP_URL",
    "PROD_INVEST_APP_URL",
    "PROD_CLIENT_APP_URL",
    "PROD_PARTNER_APP_URL",
    "PROD_AUTH_APP_PATH",
    "PROD_VITE_RECAPTCHA_SITE_KEY",
    "PROD_RECAPTCHA_SITE_KEY"
)

foreach ($name in $secretNames) {
    if ($vars.ContainsKey($name)) {
        Set-GhSecretFromString $name $vars[$name]
    }
}

Write-Host ("Done. Verify: gh secret list -R " + $Repo)
