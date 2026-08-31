$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$dest = Join-Path $root "ios\LocalBible"
$data = if ($env:BIBLE_DATA_ROOT) { $env:BIBLE_DATA_ROOT } else { "D:\bibleDownload" }
$zipUrl = if ($env:IOS_DATA_URL) { $env:IOS_DATA_URL } else { "https://github.com/cuizihao1992/local-bible-reader-offline/releases/download/ios-data-v1/ios-offline-data.zip" }

New-Item -ItemType Directory -Force -Path (Join-Path $dest "www"), (Join-Path $dest "bibles"), (Join-Path $dest "orig"), (Join-Path $dest "dictionaries"), (Join-Path $dest "commentaries") | Out-Null
Remove-Item -Recurse -Force (Join-Path $dest "www")
New-Item -ItemType Directory -Force -Path (Join-Path $dest "www") | Out-Null
Copy-Item -Path (Join-Path $root "static\*") -Destination (Join-Path $dest "www") -Recurse -Force
Remove-Item -Force (Join-Path $dest "www\ai-defaults.js") -ErrorAction SilentlyContinue

$bibleDir = Join-Path $data "bibles"
$hhb = ([char]0x548C).ToString() + [char]0x5408 + [char]0x672C
$rev = $hhb + [char]0x4FEE + [char]0x8BA2 + [char]0x7248
$revT = $hhb + [char]0x4FEE + [char]0x8A02 + [char]0x7248
if (Test-Path -LiteralPath $bibleDir) {
  Get-ChildItem -LiteralPath $bibleDir -Filter "*.db" | Where-Object {
    $_.Name -eq "KJV.db" -or $_.Name -eq "WEB.db" -or $_.Name -eq ($hhb + ".db") -or $_.Name -eq ($rev + ".db") -or $_.Name -eq ($revT + ".db")
  } | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $dest "bibles\$($_.Name)") -Force
  }
}

$orig = Join-Path $data "orig\cbol.db"
if (Test-Path -LiteralPath $orig) {
  Copy-Item -LiteralPath $orig -Destination (Join-Path $dest "orig\cbol.db") -Force
}

$cd = Join-Path $data "cd"
if (Test-Path -LiteralPath $cd) {
  Get-ChildItem -LiteralPath $cd -Filter "*.db" | Where-Object { $_.Length -lt 20MB } | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $dest "dictionaries\$($_.Name)") -Force
  }
}

$kjv = Join-Path $dest "bibles\KJV.db"
if (!(Test-Path -LiteralPath $kjv)) {
  $tmp = Join-Path $root "dist\ios-offline-data.zip"
  New-Item -ItemType Directory -Force -Path (Join-Path $root "dist") | Out-Null
  Write-Host "Downloading iOS data from GitHub Releases..."
  Invoke-WebRequest -Uri $zipUrl -OutFile $tmp
  Expand-Archive -LiteralPath $tmp -DestinationPath $dest -Force
}

Write-Host "iOS assets synced to $dest"
