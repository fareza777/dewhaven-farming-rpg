$ErrorActionPreference = 'Stop'
$workspaceRoot = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $workspaceRoot
try {
    & npm.cmd run android:sync
    if ($LASTEXITCODE -ne 0) { throw 'Android asset sync failed.' }
    Push-Location -LiteralPath (Join-Path $workspaceRoot 'android')
    try {
        & .\gradlew.bat assembleDebug bundleRelease lint --console=plain
        if ($LASTEXITCODE -ne 0) { throw 'Android build or lint failed.' }
    } finally { Pop-Location }
    $releaseDir = Join-Path $workspaceRoot 'release'
    New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $workspaceRoot 'android/app/build/outputs/apk/debug/app-debug.apk') -Destination (Join-Path $releaseDir 'Dewhaven-debug.apk') -Force
    Copy-Item -LiteralPath (Join-Path $workspaceRoot 'android/app/build/outputs/bundle/release/app-release.aab') -Destination (Join-Path $releaseDir 'Dewhaven-unsigned.aab') -Force
    $artifacts = @('Dewhaven-debug.apk','Dewhaven-unsigned.aab') | ForEach-Object {
        $artifact = Get-Item -LiteralPath (Join-Path $releaseDir $_)
        $hashStream = [System.IO.File]::OpenRead($artifact.FullName)
        $hasher = [System.Security.Cryptography.SHA256]::Create()
        try { $sha256 = ([System.BitConverter]::ToString($hasher.ComputeHash($hashStream))).Replace('-','').ToLower() }
        finally { $hashStream.Dispose(); $hasher.Dispose() }
        [ordered]@{ file = $artifact.Name; bytes = $artifact.Length; sha256 = $sha256 }
    }
    [ordered]@{ appId='com.fajar.dewhaven'; version='1.3.0'; orientation='portrait'; builtAt=(Get-Date).ToUniversalTime().ToString('o'); artifacts=$artifacts } |
        ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $releaseDir 'build.json') -Encoding UTF8
    Write-Output 'Android debug APK and unsigned release AAB are in release/.'
} finally { Pop-Location }
