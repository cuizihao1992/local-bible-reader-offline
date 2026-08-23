param(
  [ValidateSet("debug", "release")]
  [string]$BuildType = "release"
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$toolRoot = "C:\Users\Administrator\Documents\Codex\2026-08-09\d-bibledownload\work\bible_reader_app\.tools"
$javaHome = Join-Path $toolRoot "jdk17"
$sdkRoot = Join-Path $toolRoot "android-sdk"
$gradle = Join-Path $toolRoot "gradle-8.10.2\bin\gradle.bat"
$apkDir = Join-Path $root "dist\android"
$version = "1.20.0"
$apkSource = Join-Path $root "android\app\build\outputs\apk\$BuildType\app-$BuildType.apk"
$apkTarget = Join-Path $apkDir "local-bible-reader-offline-$version-$BuildType.apk"
$localProperties = Join-Path $root "android\local.properties"

if (!(Test-Path $javaHome)) {
  throw "Missing JDK at $javaHome"
}

if (!(Test-Path $sdkRoot)) {
  throw "Missing Android SDK at $sdkRoot"
}

if (!(Test-Path $gradle)) {
  throw "Missing Gradle at $gradle"
}

$sdkDirEscaped = ($sdkRoot -replace "\\", "/")
Set-Content -LiteralPath $localProperties -Value "sdk.dir=$sdkDirEscaped" -Encoding ASCII

$env:JAVA_HOME = $javaHome
$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:PATH = "$javaHome\bin;$env:PATH"

$gradleArgs = @("-p", (Join-Path $root "android"), "-PbibleDataRoot=D:/bibleDownload")

if ($BuildType -eq "release") {
  $keystore = Join-Path $root ".tools\android-release-key.jks"
  $passwordFile = Join-Path $root ".tools\android-release-key.pass"
  $alias = "local-bible-reader"

  if (!(Test-Path $passwordFile)) {
    New-Item -ItemType Directory -Force -Path (Split-Path $passwordFile) | Out-Null
    $password = ([Guid]::NewGuid().ToString("N") + [Guid]::NewGuid().ToString("N")).Substring(0, 32)
    Set-Content -LiteralPath $passwordFile -Value $password -Encoding ASCII
  } else {
    $password = (Get-Content -LiteralPath $passwordFile -Raw).Trim()
  }

  if (!(Test-Path $keystore)) {
    & (Join-Path $javaHome "bin\keytool.exe") -genkeypair -v `
      -keystore $keystore `
      -storepass $password `
      -keypass $password `
      -alias $alias `
      -keyalg RSA `
      -keysize 2048 `
      -validity 10000 `
      -dname "CN=Local Bible Reader, OU=Offline, O=Local, L=Local, S=Local, C=US"
  }

  $gradleArgs += @(
    "-PreleaseStoreFile=$keystore",
    "-PreleaseStorePassword=$password",
    "-PreleaseKeyAlias=$alias",
    "-PreleaseKeyPassword=$password"
  )
}

$task = "assemble" + $BuildType.Substring(0, 1).ToUpperInvariant() + $BuildType.Substring(1)
& $gradle @gradleArgs $task
if ($LASTEXITCODE -ne 0) {
  throw "Gradle $task failed with exit code $LASTEXITCODE"
}

New-Item -ItemType Directory -Force -Path $apkDir | Out-Null
Copy-Item -LiteralPath $apkSource -Destination $apkTarget -Force

Write-Host "APK built: $apkTarget"
