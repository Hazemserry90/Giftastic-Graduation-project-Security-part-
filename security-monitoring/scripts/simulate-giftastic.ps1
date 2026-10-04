# Simulate Giftastic application-layer attacks by appending events to the
# security audit log exactly as the backend's SecurityAuditLogger would.
#
# This drives every custom Giftastic rule without touching a live system.
#
#   .\scripts\simulate-giftastic.ps1
param(
    [string]$Log = "logs\giftastic\security-audit.log"
)

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$dir = Split-Path -Parent $Log
if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }

function Write-AuditEvent {
    param(
        [string]$EventType,
        [string]$Outcome,
        [string]$Subject,
        [string]$SourceIp,
        [string]$Method,
        [string]$Path,
        [string]$Reason
    )
    $line = [ordered]@{
        "@timestamp" = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.000Z")
        event_id     = [guid]::NewGuid().ToString()
        event_type   = $EventType
        outcome      = $Outcome
        subject      = $Subject
        source_ip    = $SourceIp
        method       = $Method
        path         = $Path
        reason       = $Reason
    } | ConvertTo-Json -Compress
    Add-Content -Path $Log -Value $line -Encoding UTF8
    Start-Sleep -Milliseconds 200
}

Write-Host "==> Simulating failed logins (brute force) from 203.0.113.10"
1..10 | ForEach-Object {
    Write-AuditEvent -EventType "auth.login.failure" -Outcome "failure" -Subject "victim@giftastic.example" -SourceIp "203.0.113.10" -Method "POST" -Path "/api/v1/auth/login" -Reason "BadCredentialsException"
}

Write-Host "==> Simulating a successful login"
Write-AuditEvent -EventType "auth.login.success" -Outcome "success" -Subject "customer@giftastic.example" -SourceIp "198.51.100.7" -Method "POST" -Path "/api/v1/auth/login" -Reason ""

Write-Host "==> Simulating authorization probing (IDOR / privilege escalation)"
1..6 | ForEach-Object {
    Write-AuditEvent -EventType "authz.access.denied" -Outcome "denied" -Subject "vendor@giftastic.example" -SourceIp "203.0.113.44" -Method "PUT" -Path "/api/v1/admin/permissions" -Reason "AccessDeniedException"
}
Write-AuditEvent -EventType "authz.access.denied" -Outcome "denied" -Subject "vendor@giftastic.example" -SourceIp "203.0.113.44" -Method "GET" -Path "/api/v1/commissions" -Reason "AccessDeniedException"

Write-Host "==> Simulating unauthenticated access to protected resources"
1..12 | ForEach-Object {
    Write-AuditEvent -EventType "authn.required" -Outcome "denied" -Subject "none" -SourceIp "192.0.2.55" -Method "GET" -Path "/api/v1/orders/" -Reason "AdminAuthenticationException"
}

Write-Host "==> Simulating rate-limit violations from one source"
1..6 | ForEach-Object {
    Write-AuditEvent -EventType "ratelimit.exceeded" -Outcome "blocked" -Subject "none" -SourceIp "192.0.2.99" -Method "POST" -Path "/api/v1/auth/login" -Reason "too_many_requests"
}

Write-Host "==> Simulating a suspended account attempting access"
Write-AuditEvent -EventType "authz.account.suspended" -Outcome "blocked" -Subject "banned@giftastic.example" -SourceIp "198.51.100.23" -Method "GET" -Path "/api/v1/orders" -Reason "BannedUserException"

Write-Host ""
Write-Host "Wrote simulated events to $Log"
Write-Host "Open the Wazuh dashboard (https://localhost) and filter on rule.groups: giftastic"
