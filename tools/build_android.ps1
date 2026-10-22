$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
Push-Location $projectRoot
try {
    # A device-specific flutter run can overwrite app-release.apk with x86 only.
    & flutter build apk --release --target-platform android-arm,android-arm64,android-x64 --build-number 3
    if ($LASTEXITCODE -ne 0) { throw 'Android build failed.' }

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $apkPath = Join-Path $projectRoot 'build/app/outputs/flutter-apk/app-release.apk'
    $archive = [IO.Compression.ZipFile]::OpenRead($apkPath)
    try {
        foreach ($abi in @('armeabi-v7a', 'arm64-v8a', 'x86_64')) {
            foreach ($library in @('libapp.so', 'libflutter.so', 'libfastdev_quickjs_runtime.so', 'libdartjni.so')) {
                $entry = $archive.GetEntry("lib/$abi/$library")
                if ($null -eq $entry -or $entry.Length -eq 0) {
                    throw "APK incomplete: lib/$abi/$library"
                }
            }
        }
    } finally {
        $archive.Dispose()
    }

    $distPath = Join-Path $projectRoot 'dist'
    New-Item -ItemType Directory -Path $distPath -Force | Out-Null
    $outputPath = Join-Path $distPath 'Aera-Skybound-Roots.apk'
    Copy-Item -LiteralPath $apkPath -Destination $outputPath -Force
    $hash = (Get-FileHash -LiteralPath $outputPath -Algorithm SHA256).Hash.ToLowerInvariant()
    Set-Content -LiteralPath (Join-Path $distPath 'Aera-Skybound-Roots.sha256') -Value "$hash  Aera-Skybound-Roots.apk" -Encoding ascii
    Write-Output "Verified Android APK: $outputPath"
} finally {
    Pop-Location
}
