<#
    Pembungkus PowerShell untuk skrip migrasi.

    Skrip migrasinya ditulis untuk bash karena memakai ssh/scp dan heredoc.
    PowerShell di Windows tidak punya `bash` di PATH meski Git Bash terpasang,
    jadi berkas ini mencari sendiri bash.exe milik Git lalu memanggilnya.

    Pakai:
        .\deploy\migrasi\Jalankan.ps1
#>

$ErrorActionPreference = 'Stop'

$kandidat = @(
    "$env:ProgramFiles\Git\bin\bash.exe",
    "${env:ProgramFiles(x86)}\Git\bin\bash.exe",
    "$env:LOCALAPPDATA\Programs\Git\bin\bash.exe"
)

$bash = $kandidat | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $bash) {
    Write-Error "bash.exe milik Git tidak ditemukan. Pasang Git for Windows, lalu ulangi."
    exit 1
}

# Jalankan dari akar repo, apa pun folder aktif pemanggilnya.
$akar = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Push-Location $akar
try {
    & $bash "deploy/migrasi/jalankan.sh"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
    Pop-Location
}
