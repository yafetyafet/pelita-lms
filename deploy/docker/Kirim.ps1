<#
    Pembungkus PowerShell untuk kirim.sh (build + kirim ke server).

    Pakai:
        .\deploy\docker\Kirim.ps1              # build lalu kirim
        .\deploy\docker\Kirim.ps1 --tanpa-build
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

$akar = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Push-Location $akar
try {
    & $bash "deploy/docker/kirim.sh" @args
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
    Pop-Location
}
