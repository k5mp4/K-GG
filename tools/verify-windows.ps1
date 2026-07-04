$ErrorActionPreference = 'Stop'

$privateKeyPath = Join-Path $env:USERPROFILE '.tauri\k-gg.key'
if (-not (Test-Path -LiteralPath $privateKeyPath)) {
    throw "Tauri updater private key was not found: $privateKeyPath"
}

$password = Read-Host '署名鍵のパスワード' -MaskInput
if ([string]::IsNullOrEmpty($password)) {
    throw '署名鍵のパスワードが入力されていません。'
}

$env:TAURI_SIGNING_PRIVATE_KEY = $privateKeyPath
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = $password

try {
    & npm run verify
    if ($LASTEXITCODE -ne 0) {
        throw "Branch verification failed with exit code $LASTEXITCODE."
    }

    & npm run tauri:build:windows
    if ($LASTEXITCODE -ne 0) {
        throw "Windows installer build failed with exit code $LASTEXITCODE."
    }

    $bundleDirectory = Join-Path $PSScriptRoot '..\src-tauri\target\x86_64-pc-windows-msvc\release\bundle\nsis'
    Write-Host ''
    Write-Host 'Windows verification completed successfully.' -ForegroundColor Green
    Write-Host "Installer and updater signature: $bundleDirectory"
}
finally {
    Remove-Item Env:TAURI_SIGNING_PRIVATE_KEY -ErrorAction SilentlyContinue
    Remove-Item Env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD -ErrorAction SilentlyContinue
    $password = $null
}
