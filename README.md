# 本地圣经阅读器

离线圣经阅读器。电脑版用 Node.js 读取本地 SQLite 译本；Android 版把常用译本打进 APK，安装后不依赖电脑后台。

- 仓库：https://github.com/cuizihao1992/local-bible-reader-offline
- 默认网页端口：`8766`
- Android 包名：`local.bible.reader.next`
- 当前版本：`1.33.0`

## 下载 Android APK

从 [Releases](https://github.com/cuizihao1992/local-bible-reader-offline/releases) 下载：

```text
local-bible-reader-offline-1.33.0-release.apk
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
D:\bible-reader\dist\android\local-bible-reader-offline-1.33.0-release.apk
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
- 注释联动；加密注释不再显示乱码，史地图等配图可看
- Strong 编号和原文释义
- 收藏、高亮、笔记、标签
- 阅读进度、已读章节、下一未读章
- 系统朗读本章（手机 TTS，优先 Google / 讯飞，小米逐节朗读并可真正停止）；电脑版可读本地 MP3
- 辞典 / 百科搜索和图片
- 夜间模式、配色、字号、行距、衬线/无衬线、页边距、双指缩放
- 经文右键 / 长按菜单、多选复制
- 搜索当前书卷优先；从搜索/查经/注释跳转后可返回
- 金句分享浅色/深色模板；换译本保留当前节
- 打开后回到上次读到的节；我的里可继续读、看高亮
- 易混书卷口令会弹出确认（以斯拉/以斯帖等）
- 智能查经过程可见；阅读时可并排对照译本
- 批注挂在经文上；查经记录来自助手整理，可编辑、继续问。支持 Markdown 导入导出，也可从网页链接提取正文。经文只从本机译本取
- 对话模型可切换小米 / DeepSeek / Grok / GPT / Claude / 自定义兼容接口；口令识别仍用小米
- 导入 / 导出个人数据
- 左上角齿轮打开设置；手机上设置从底部弹出，和朗读/我的一样。内容仍是「助手 / 辞典 / 系统」；「我的」分「标注 / 经文库 / 资源 / 更新」；底栏可直接打开助手
- 经文库收录适合反复读的短经文，按主题浏览，正文从当前译本取。每日一节尚未启用
- 本地诊断
- Electron 桌面入口

## 和原版的差别

原版路径：`C:\Users\Administrator\Documents\Codex\2026-08-09\d-bibledownload\work\bible_reader_app`

本版做了这些整理：

- 后台拆成 `lib/books.js`、`lib/sources.js`、`lib/reader.js`、`lib/user.js`
- 包含 Android 离线 APK、GitHub 资源包下载和应用内更新
- 支持小米 MiMo 语音识别跳转（需在设置里填写本机 Key）
- 查经和讲解可换 DeepSeek / Grok / GPT / Claude 或 OpenAI 兼容中转，经文仍从本机译本取
- 使用独立端口和独立用户数据库

数据格式兼容原版的收藏、笔记、历史和阅读进度 JSON。
