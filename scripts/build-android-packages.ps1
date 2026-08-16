param(
  [string]$DataRoot = "D:\bibleDownload",
  [string]$Version = "1.3.0"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

function New-ZipPackage {
  param([System.IO.FileInfo[]]$Files, [string]$DestinationPath)
  if (!$Files -or !$Files.Count) { throw "No files to package: $DestinationPath" }
  $stream = [System.IO.File]::Open($DestinationPath, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)
  try {
    $archive = [System.IO.Compression.ZipArchive]::new($stream, [System.IO.Compression.ZipArchiveMode]::Create, $false)
    try {
      foreach ($file in $Files) {
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $file.FullName, $file.Name, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
      }
    } finally { $archive.Dispose() }
  } finally { $stream.Dispose() }
}

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$outDir = Join-Path $root "dist\android"
$biblesDir = Join-Path $DataRoot "bibles"
$commentariesDir = Join-Path $DataRoot "cj"
$bundled = @("和合本.db", "和合本修订版.db", "KJV.db", "WEB.db")

New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$bibleFiles = @(Get-ChildItem -LiteralPath $biblesDir -Filter *.db | Where-Object { $bundled -notcontains $_.Name })
$commentaryFiles = @(Get-ChildItem -LiteralPath $commentariesDir -Filter *.db | Where-Object { $_.Length -lt 40MB })

$biblesZip = Join-Path $outDir "bibles-extra-v$Version.zip"
$commentariesZip = Join-Path $outDir "commentaries-v$Version.zip"
if (Test-Path $biblesZip) { Remove-Item -LiteralPath $biblesZip -Force }
if (Test-Path $commentariesZip) { Remove-Item -LiteralPath $commentariesZip -Force }

New-ZipPackage -Files $bibleFiles -DestinationPath $biblesZip
New-ZipPackage -Files $commentaryFiles -DestinationPath $commentariesZip

Write-Host "Built package: $biblesZip ($($bibleFiles.Count) db files)"
Write-Host "Built package: $commentariesZip ($($commentaryFiles.Count) db files)"
