import { DatabaseSync } from "node:sqlite";
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fallbackBooks } from "./books.js";
import { httpError } from "./http.js";
import { looksReadable } from "./text.js";

export function createSources({
  biblesDir,
  commentariesDir,
  dictionariesDir,
  audioDir,
  origDb,
}) {
  let versionCache = null;
  let commentaryCache = null;
  let dictionaryCache = null;
  let audioCache = null;

  function hasTable(db, tableName) {
    return !!db.prepare("select name from sqlite_master where type='table' and name=?").get(tableName);
  }

  function readMetadata(filePath) {
    const metadata = {};
    try {
      const db = new DatabaseSync(filePath, { readOnly: true });
      try {
        if (hasTable(db, "metadata")) {
          for (const row of db.prepare("select name, value from metadata").all()) {
            metadata[String(row.name)] = row.value == null ? "" : String(row.value);
          }
        }
        if (hasTable(db, "Details")) {
          const row = db.prepare("select * from Details limit 1").get();
          if (row) {
            for (const [key, value] of Object.entries(row)) {
              if (value != null) metadata[key] = String(value);
            }
          }
        }
        metadata.titleCount = hasTable(db, "Titles")
          ? Number(db.prepare("select count(*) as count from Titles").get()?.count || 0)
          : 0;
      } finally {
        db.close();
      }
    } catch {
      return metadata;
    }
    return metadata;
  }

  function bibleFiles() {
    if (versionCache) return versionCache;
    if (!existsSync(biblesDir)) return [];
    versionCache = readdirSync(biblesDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".db"))
      .sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN"))
      .map((entry) => {
        const filePath = path.join(biblesDir, entry.name);
        const metadata = readMetadata(filePath);
        const name = metadata.title || metadata.Title || metadata.Description || entry.name.replace(/\.db$/i, "");
        const shortName = metadata.abbreviation || metadata.Abbreviation || entry.name.replace(/\.db$/i, "");
        return {
          id: entry.name,
          name,
          shortName,
          fileName: entry.name,
          sizeMb: Number((statSync(filePath).size / 1024 / 1024).toFixed(2)),
          titleCount: Number(metadata.titleCount || 0),
        };
      });
    return versionCache;
  }

  function commentaryFiles() {
    if (commentaryCache) return commentaryCache;
    if (!existsSync(commentariesDir)) return [];
    commentaryCache = readdirSync(commentariesDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".db"))
      .sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN"))
      .map((entry) => {
        const filePath = path.join(commentariesDir, entry.name);
        const metadata = readMetadata(filePath);
        let count = 0;
        let readable = true;
        try {
          const db = new DatabaseSync(filePath, { readOnly: true });
          try {
            if (hasTable(db, "commentary")) {
              count = Number(db.prepare("select count(*) count from commentary").get().count);
              const sample = db.prepare("select Data from commentary where Data is not null and Data <> '' limit 1").get();
              readable = looksReadable(sample?.Data || "");
            }
          } finally {
            db.close();
          }
        } catch {
          readable = false;
        }
        return {
          id: entry.name,
          title: metadata.Title || metadata.title || metadata.Description || entry.name.replace(/\.db$/i, ""),
          fileName: entry.name,
          sizeMb: Number((statSync(filePath).size / 1024 / 1024).toFixed(2)),
          count,
          readable,
        };
      });
    return commentaryCache;
  }

  function dictionaryFiles() {
    if (dictionaryCache) return dictionaryCache;
    if (!existsSync(dictionariesDir)) return [];
    dictionaryCache = readdirSync(dictionariesDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".db"))
      .sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN"))
      .map((entry) => {
        const filePath = path.join(dictionariesDir, entry.name);
        const metadata = readMetadata(filePath);
        const db = new DatabaseSync(filePath, { readOnly: true });
        try {
          const count = hasTable(db, "Dictionary")
            ? Number(db.prepare("select count(*) count from Dictionary").get().count)
            : 0;
          const imageCount = hasTable(db, "Images")
            ? Number(db.prepare("select count(*) count from Images").get().count)
            : 0;
          const sample = hasTable(db, "Dictionary")
            ? db.prepare("select Description from Dictionary where Description is not null and Description <> '' limit 1").get()
            : null;
          return {
            id: entry.name,
            title: metadata.Title || metadata.title || metadata.Description || entry.name.replace(/\.db$/i, ""),
            fileName: entry.name,
            count,
            imageCount,
            readable: looksReadable(sample?.Description || ""),
          };
        } finally {
          db.close();
        }
      });
    return dictionaryCache;
  }

  function audioFiles() {
    if (audioCache) return audioCache;
    if (!existsSync(audioDir)) return [];
    const files = [];
    function walk(dir) {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".mp3")) {
          const rel = path.relative(audioDir, fullPath);
          const parts = rel.split(path.sep);
          const bookMatch = parts.find((part) => /^\d+/.test(part))?.match(/^(\d+)/);
          const chapterMatch = entry.name.match(/_(\d+)\.mp3$/i);
          if (bookMatch && chapterMatch) {
            files.push({
              id: rel.replaceAll(path.sep, "/"),
              source: parts[0] || "朗读",
              fileName: entry.name,
              book: Number(bookMatch[1]),
              chapter: Number(chapterMatch[1]),
              sizeMb: Number((statSync(fullPath).size / 1024 / 1024).toFixed(2)),
            });
          }
        }
      }
    }
    walk(audioDir);
    audioCache = files.sort((a, b) => a.source.localeCompare(b.source, "zh-Hans-CN") || a.chapter - b.chapter);
    return audioCache;
  }

  function safeDbPath(root, versionId, label) {
    const fileName = path.basename(decodeURIComponent(versionId || ""));
    const filePath = path.join(root, fileName);
    if (!fileName.toLowerCase().endsWith(".db") || !existsSync(filePath)) {
      throw httpError(`找不到${label}：${fileName}`, 404);
    }
    return filePath;
  }

  function biblePath(versionId) {
    return safeDbPath(biblesDir, versionId, "版本");
  }

  function commentaryPath(sourceId) {
    return safeDbPath(commentariesDir, sourceId, "注释");
  }

  function dictionaryPath(sourceId) {
    return safeDbPath(dictionariesDir, sourceId, "辞典");
  }

  function getBooks(versionId) {
    if (!versionId) return fallbackBooks();
    try {
      const db = new DatabaseSync(biblePath(versionId), { readOnly: true });
      try {
        if (!hasTable(db, "Books")) return fallbackBooks();
        const rows = db.prepare("select id, ShortName, LongName, ChapterCount from Books order by id").all();
        if (!rows.length) return fallbackBooks();
        return rows.map((row) => ({
          id: Number(row.id),
          shortName: row.ShortName,
          longName: row.LongName,
          chapterCount: Number(row.ChapterCount),
          testament: Number(row.id) <= 39 ? "ot" : "nt",
        }));
      } finally {
        db.close();
      }
    } catch {
      return fallbackBooks();
    }
  }

  function diagnostics() {
    const checks = [];
    function add(name, ok, detail = "") {
      checks.push({ name, ok: !!ok, detail });
    }
    add("圣经目录", existsSync(biblesDir), biblesDir);
    add("注释目录", existsSync(commentariesDir), commentariesDir);
    add("辞典目录", existsSync(dictionariesDir), dictionariesDir);
    add("音频目录", existsSync(audioDir), audioDir);
    add("原文库", existsSync(origDb), origDb);
    add("圣经译本", bibleFiles().length > 0, `${bibleFiles().length} 个`);
    add("注释源", commentaryFiles().length > 0, `${commentaryFiles().length} 个`);
    add("辞典源", dictionaryFiles().length > 0, `${dictionaryFiles().length} 个`);
    add("音频文件", audioFiles().length > 0, `${audioFiles().length} 个`);
    return { ok: checks.every((check) => check.ok), checks };
  }

  return {
    hasTable,
    bibleFiles,
    commentaryFiles,
    dictionaryFiles,
    audioFiles,
    biblePath,
    commentaryPath,
    dictionaryPath,
    getBooks,
    diagnostics,
    origDb,
    audioDir,
  };
}
