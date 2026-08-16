$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path "D:\bibleDownload\bibles")) {
  Write-Error "找不到 D:\bibleDownload\bibles，请先确认圣经数据目录存在。"
}

Write-Host "启动本地圣经阅读器: http://127.0.0.1:8766"
node --no-warnings .\server.js
