# Giftastic security monitoring lab - first-time setup (Windows / PowerShell).
#
# Run from the security-monitoring directory:
#   .\scripts\init.ps1
#   .\scripts\init.ps1 -WazuhOnly
param(
    [switch]$WazuhOnly
)

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "docker is not installed or not on PATH."
}

if (-not (Test-Path ".env")) {
    Write-Host "==> Creating .env from .env.example"
    Copy-Item ".env.example" ".env"
    Write-Host "    Review security-monitoring\.env and change the passwords."
}

Write-Host "==> Creating log directories"
New-Item -ItemType Directory -Force -Path "logs\giftastic", "logs\cowrie", "config\wazuh_indexer_ssl_certs" | Out-Null

if (-not (Test-Path "config\wazuh_indexer_ssl_certs\admin.pem")) {
    Write-Host "==> Generating Wazuh TLS certificates (one-time)"
    docker compose --profile certs run --rm generator
} else {
    Write-Host "==> TLS certificates already present, skipping generation"
}

New-Item -ItemType File -Force -Path "logs\giftastic\security-audit.log" | Out-Null
New-Item -ItemType File -Force -Path "logs\cowrie\cowrie.json" | Out-Null

Write-Host "==> Starting the Wazuh stack"
docker compose up -d wazuh.indexer wazuh.manager wazuh.dashboard

if (-not $WazuhOnly) {
    Write-Host "==> Starting the Cowrie honeypot"
    docker compose --profile cowrie up -d cowrie
}

Write-Host @"

The lab is starting. The Wazuh dashboard is available at:
    https://localhost
(accept the self-signed certificate; log in with the credentials in .env)

Allow 1-3 minutes for the indexer and dashboard to become ready. Then:
    .\scripts\simulate-giftastic.ps1   # application-layer attack simulation
    .\scripts\simulate-cowrie.ps1      # honeypot interaction
"@
