# iOS 壳

和安卓一样：WKWebView 打开同一套 `static/` 网页，`/api/` 在 Swift 里读本地 SQLite。

包名：`local.bible.reader.ios`  
系统：iOS 15+  
本仓库 Windows 上不能编译 iOS，需要 Mac + Xcode。

## 第一次编译

1. 把本仓库拷到 Mac（或 git clone）。
2. 译本数据不必整盘拷到 Mac。同步脚本会：
   - 若本机有 `BIBLE_DATA_ROOT`（默认 `~/bibleDownload`），从本地拷
   - 否则从 GitHub Release `ios-data-v1` 下载约 60MB 的 `ios-offline-data.zip`（和合本、修订版、KJV、WEB、原文库、证主百科）
3. 同步资源：

```bash
cd /path/to/bible-reader
chmod +x scripts/sync-ios-assets.sh
./scripts/sync-ios-assets.sh
```

Windows 上可先同步再拷到 Mac：

```powershell
$env:BIBLE_DATA_ROOT="D:\bibleDownload"
powershell -ExecutionPolicy Bypass -File scripts/sync-ios-assets.ps1
```

4. 用 Xcode 打开 `ios/LocalBible.xcodeproj`
5. 选自己的 Team 签名（Signing & Capabilities）
6. 选模拟器或真机，Run

Xcode 每次编译也会跑 `scripts/sync-ios-assets.sh`。若 Mac 上没有 `BIBLE_DATA_ROOT`，脚本会尝试 `$HOME/bibleDownload`。

## 已接上的

- 读经、搜索、收藏/高亮/批注、进度、经文库、原文 Strong、辞典
- 系统朗读（锁屏可停）、分享图片/文本
- 口令录音并走小米识别（需麦克风权限和 Key）

## 首版没有的

- 不能像安卓那样下载 GitHub APK 直接安装，更新走 TestFlight / App Store
- 注释资源包 zip 安装（可把 `.db` 手动放进 `ios/LocalBible/commentaries/` 再同步）
- App Store 图标集（可先用默认，再补 `Assets.xcassets`）

## 网页地址

应用用自定义协议加载：`bible://app/index.html`，避免 iOS 对 `file://` 的限制。
