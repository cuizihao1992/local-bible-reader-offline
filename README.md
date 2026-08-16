# 本地圣经阅读器

离线圣经阅读器。电脑版用 Node.js 读取本地 SQLite 译本；Android 版把常用译本打进 APK，安装后不依赖电脑后台。

- 仓库：https://github.com/cuizihao1992/local-bible-reader-offline
- 默认网页端口：`8766`
- Android 包名：`local.bible.reader.next`
- 当前版本：`1.11.0`

## 下载 Android APK

从 [Releases](https://github.com/cuizihao1992/local-bible-reader-offline/releases) 下载：

```text
local-bible-reader-offline-1.11.0-release.apk
```

内置译本：和合本、和合本修订版、KJV、WEB。

## 运行

```powershell
cd D:\bible-reader
npm start
```

或：

```powershell
powershell -ExecutionPolicy Bypass -File D:\bible-reader\start.ps1
```

默认地址：

```text
http://127.0.0.1:8766
```

## 桌面版

```powershell
npm install
npm run desktop
```

打包 Windows 便携版：

```powershell
npm run dist:win
```

## Android 离线 APK

```powershell
npm run dist:android
```

生成文件：

```text
D:\bible-reader\dist\android\local-bible-reader-offline-1.11.0-release.apk
```

APK 内置 `和合本`、`和合本修订版`、`KJV`、`WEB` 四个译本。安装后独立运行，不读电脑 D 盘。包名是 `local.bible.reader.next`，可以和原版同时安装。

## 配置

默认数据目录是 `D:\bibleDownload`。可用环境变量覆盖：

```powershell
$env:BIBLE_DATA_ROOT="D:\bibleDownload"
$env:BIBLE_READER_HOST="127.0.0.1"
$env:BIBLE_READER_PORT="8766"
npm start
```

## 已支持

- 多译本阅读、最多 3 个对照译本
- 书卷搜索 / 旧约新约筛选 / 章节网格
- `约3:16` 快速跳转和关键词搜索
- 章节小标题（本译本或参考译本）
- 注释联动
- Strong 编号和原文释义
- 收藏、高亮、笔记、标签
- 阅读进度、已读章节、下一未读章
- 章节音频播放
- 辞典 / 百科搜索和图片
- 夜间模式、配色、字号、行距
- 经文右键 / 长按菜单、多选复制
- 左右滑翻章、键盘左右键
- 口令默认本地快跳；可打开智能口令用大模型理解。长按经文可讲解、摘要、提问、润色笔记
- 导入 / 导出个人数据
- 本地诊断
- Electron 桌面入口

## 和原版的差别

原版路径：`C:\Users\Administrator\Documents\Codex\2026-08-09\d-bibledownload\work\bible_reader_app`

本版做了这些整理：

- 后台拆成 `lib/books.js`、`lib/sources.js`、`lib/reader.js`、`lib/user.js`
- 包含 Android 离线 APK、GitHub 资源包下载和应用内更新
- 支持小米 MiMo 语音识别跳转（需在设置里填写本机 Key）
- 不包含 DeepSeek / OpenAI 云端问答
- 使用独立端口和独立用户数据库

数据格式兼容原版的收藏、笔记、历史和阅读进度 JSON。
