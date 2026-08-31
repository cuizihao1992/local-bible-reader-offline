$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$data = if ($env:BIBLE_DATA_ROOT) { $env:BIBLE_DATA_ROOT } else { "D:\bibleDownload" }
$stage = Join-Path $root "dist\ios-offline-data"
$zip = Join-Path $root "dist\ios-offline-data.zip"

if (Test-Path $stage) { Remove-Item -Recurse -Force $stage }
if (Test-Path $zip) { Remove-Item -Force $zip }
New-Item -ItemType Directory -Force -Path (Join-Path $stage "bibles"), (Join-Path $stage "orig"), (Join-Path $stage "dictionaries") | Out-Null

$bibleDir = Join-Path $data "bibles"
$hhb = ([char]0x548C).ToString() + [char]0x5408 + [char]0x672C
$rev = $hhb + [char]0x4FEE + [char]0x8BA2 + [char]0x7248
$revT = $hhb + [char]0x4FEE + [char]0x8A02 + [char]0x7248
Get-ChildItem -LiteralPath $bibleDir -Filter "*.db" | Where-Object {
  $_.Name -eq "KJV.db" -or $_.Name -eq "WEB.db" -or $_.Name -eq ($hhb + ".db") -or $_.Name -eq ($rev + ".db") -or $_.Name -eq ($revT + ".db")
} | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $stage "bibles\$($_.Name)") -Force
}

Copy-Item -LiteralPath (Join-Path $data "orig\cbol.db") -Destination (Join-Path $stage "orig\cbol.db") -Force

$cd = Join-Path $data "cd"
if (Test-Path -LiteralPath $cd) {
  Get-ChildItem -LiteralPath $cd -Filter "*.db" | Where-Object { $_.Length -lt 20MB } | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $stage "dictionaries\$($_.Name)") -Force
  }
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($stage, $zip)
$mb = [math]::Round((Get-Item $zip).Length / 1MB, 1)
Write-Host "Packed $zip ($mb MB)"
Get-ChildItem -Recurse $stage -File | ForEach-Object { Write-Host ("  " + $_.FullName.Substring($stage.Length + 1) + " " + $_.Length) }
