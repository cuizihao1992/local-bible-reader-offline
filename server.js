import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MIME_TYPES, parsePositiveInt, readJsonBody, sendJson } from "./lib/http.js";
import { createSources } from "./lib/sources.js";
import { createReader } from "./lib/reader.js";
import { createUserStore } from "./lib/user.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.BIBLE_DATA_ROOT || "D:\\bibleDownload";
const BIBLES_DIR = path.join(ROOT, "bibles");
const COMMENTARIES_DIR = path.join(ROOT, "cj");
const DICTIONARIES_DIR = path.join(ROOT, "cd");
const AUDIO_DIR = path.join(ROOT, "ld");
const ORIG_DB = path.join(ROOT, "orig", "cbol.db");
const STATIC_DIR = path.join(__dirname, "static");
const USER_DATA_DIR = process.env.BIBLE_READER_USER_DATA_DIR || path.join(__dirname, "data");
const USER_DB = path.join(USER_DATA_DIR, "user.sqlite");
const HOST = process.env.BIBLE_READER_HOST || "127.0.0.1";
const PORT = Number(process.env.BIBLE_READER_PORT || 8766);

const sources = createSources({
  biblesDir: BIBLES_DIR,
  commentariesDir: COMMENTARIES_DIR,
  dictionariesDir: DICTIONARIES_DIR,
  audioDir: AUDIO_DIR,
  origDb: ORIG_DB,
});
const reader = createReader(sources);
const user = createUserStore({
  userDbPath: USER_DB,
  userDataDir: USER_DATA_DIR,
  biblePath: sources.biblePath,
});

async function sendStatic(res, pathname) {
  const safePath = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
  const filePath = path.resolve(STATIC_DIR, `.${safePath}`);
  const relativePath = path.relative(STATIC_DIR, filePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("Not file");
    const ext = path.extname(filePath).toLowerCase();
    const body = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": MIME_TYPES.get(ext) || "application/octet-stream",
      "Content-Length": body.length,
      "Cache-Control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || `${HOST}:${PORT}`}`);
  try {
    if (url.pathname === "/api/health") {
      sendJson(res, {
        ok: true,
        app: "bible-reader",
        version: "1.1.0",
        dataRoot: ROOT,
        biblesDir: BIBLES_DIR,
        commentariesDir: COMMENTARIES_DIR,
        dictionariesDir: DICTIONARIES_DIR,
        audioDir: AUDIO_DIR,
        origDb: ORIG_DB,
        userDb: USER_DB,
        versionCount: sources.bibleFiles().length,
        commentaryCount: sources.commentaryFiles().length,
        dictionaryCount: sources.dictionaryFiles().length,
        audioCount: sources.audioFiles().length,
      });
      return;
    }
    if (url.pathname === "/api/versions") {
      sendJson(res, { versions: sources.bibleFiles() });
      return;
    }
    if (url.pathname === "/api/books") {
      sendJson(res, { books: sources.getBooks(url.searchParams.get("version")) });
      return;
    }
    if (url.pathname === "/api/chapter") {
      sendJson(
        res,
        reader.getChapter(
          url.searchParams.get("version") || "",
          parsePositiveInt(url.searchParams.get("book") || 1, "book"),
          parsePositiveInt(url.searchParams.get("chapter") || 1, "chapter"),
        ),
      );
      return;
    }
    if (url.pathname === "/api/chapters") {
      sendJson(
        res,
        reader.getChapters(
          url.searchParams.getAll("version"),
          parsePositiveInt(url.searchParams.get("book") || 1, "book"),
          parsePositiveInt(url.searchParams.get("chapter") || 1, "chapter"),
        ),
      );
      return;
    }
    if (url.pathname === "/api/search") {
      sendJson(
        res,
        reader.searchBible(url.searchParams.get("version") || "", url.searchParams.get("q") || "", {
          scope: url.searchParams.get("scope") || "all",
          book: Number(url.searchParams.get("book") || 0),
          limit: url.searchParams.get("limit") || 40,
          offset: url.searchParams.get("offset") || 0,
        }),
      );
      return;
    }
    if (url.pathname === "/api/commentaries") {
      sendJson(res, { commentaries: sources.commentaryFiles() });
      return;
    }
    if (url.pathname === "/api/commentary") {
      sendJson(
        res,
        reader.getCommentary(
          url.searchParams.get("source") || "",
          parsePositiveInt(url.searchParams.get("book") || 1, "book"),
          parsePositiveInt(url.searchParams.get("chapter") || 1, "chapter"),
        ),
      );
      return;
    }
    if (url.pathname === "/api/strong") {
      sendJson(res, reader.lookupStrong(url.searchParams.get("code") || ""));
      return;
    }
    if (url.pathname === "/api/user/marks") {
      sendJson(res, {
        marks: user.getMarks(
          url.searchParams.get("version") || "",
          parsePositiveInt(url.searchParams.get("book") || 1, "book"),
          parsePositiveInt(url.searchParams.get("chapter") || 1, "chapter"),
        ),
      });
      return;
    }
    if (url.pathname === "/api/user/marks/all") {
      sendJson(res, {
        marks: user.getAllMarks({
          kind: url.searchParams.get("kind") || "",
          tag: url.searchParams.get("tag") || "",
          limit: url.searchParams.get("limit") || 200,
        }),
      });
      return;
    }
    if (url.pathname === "/api/user/history" && req.method === "GET") {
      sendJson(res, { history: user.getHistory() });
      return;
    }
    if (url.pathname === "/api/user/progress" && req.method === "GET") {
      sendJson(res, user.getReadingProgress(url.searchParams.get("version") || ""));
      return;
    }
    if (url.pathname === "/api/user/export") {
      sendJson(res, user.exportUserData());
      return;
    }
    if (url.pathname === "/api/user/mark" && req.method === "POST") {
      sendJson(res, { mark: user.saveMark(await readJsonBody(req)) });
      return;
    }
    if (url.pathname === "/api/user/history" && req.method === "POST") {
      sendJson(res, { history: user.saveHistory(await readJsonBody(req)) });
      return;
    }
    if (url.pathname === "/api/user/progress" && req.method === "POST") {
      sendJson(res, user.setChapterRead(await readJsonBody(req)));
      return;
    }
    if (url.pathname === "/api/user/import" && req.method === "POST") {
      sendJson(res, user.importUserData(await readJsonBody(req)));
      return;
    }
    if (url.pathname === "/api/audio") {
      const book = parsePositiveInt(url.searchParams.get("book") || 1, "book");
      const chapter = parsePositiveInt(url.searchParams.get("chapter") || 1, "chapter");
      const matches = sources
        .audioFiles()
        .filter((audio) => audio.book === book && audio.chapter === chapter)
        .map((audio) => ({ ...audio, url: `/api/audio/file?id=${encodeURIComponent(audio.id)}` }));
      sendJson(res, { audio: matches });
      return;
    }
    if (url.pathname === "/api/audio/file") {
      reader.sendAudio(res, url.searchParams.get("id") || "");
      return;
    }
    if (url.pathname === "/api/dictionaries") {
      sendJson(res, { dictionaries: sources.dictionaryFiles() });
      return;
    }
    if (url.pathname === "/api/dictionary/search") {
      sendJson(
        res,
        reader.searchDictionary(
          url.searchParams.get("source") || "",
          url.searchParams.get("q") || "",
          url.searchParams.get("limit") || 30,
        ),
      );
      return;
    }
    if (url.pathname === "/api/dictionary/image") {
      reader.sendDictionaryImage(res, url.searchParams.get("source") || "", url.searchParams.get("name") || "");
      return;
    }
    if (url.pathname === "/api/diagnostics") {
      const report = sources.diagnostics();
      report.checks.push({ name: "用户数据库", ok: existsSync(USER_DB), detail: USER_DB });
      report.ok = report.checks.every((check) => check.ok);
      sendJson(res, report);
      return;
    }
    await sendStatic(res, url.pathname);
  } catch (error) {
    sendJson(res, { error: error.message || "服务器错误" }, error.status || 400);
  }
});

if (!existsSync(BIBLES_DIR)) {
  console.error(`Bible directory not found: ${BIBLES_DIR}`);
  process.exit(1);
}

user.initUserDb();

server.listen(PORT, HOST, () => {
  console.log(`Bible Reader running at http://${HOST}:${PORT}`);
  console.log(`Reading databases from ${BIBLES_DIR}`);
});
