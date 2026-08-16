import { DatabaseSync } from "node:sqlite";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fallbackBooks } from "./books.js";
import { clampNonNegativeInt, clampPositiveInt, httpError } from "./http.js";
import { cleanText, extractStrongNumbers } from "./text.js";

const MAX_SEARCH_RESULTS = 80;

export function createReader(sources) {
  function readChapterTitles(db, book, chapter) {
    if (!sources.hasTable(db, "Titles")) return [];
    return db
      .prepare("select Verse, Scripture from Titles where Book=? and Chapter=? order by Verse")
      .all(book, chapter)
      .map((row) => ({
        verse: Number(row.Verse),
        text: cleanText(row.Scripture),
      }))
      .filter((item) => item.verse > 0 && item.text);
  }

  function fallbackTitleVersion(versionId) {
    return sources.bibleFiles().find((version) => version.id !== versionId && Number(version.titleCount) > 0);
  }

  function readChapterTitleInfo(versionId, db, book, chapter) {
    const titles = readChapterTitles(db, book, chapter);
    if (titles.length) {
      return {
        titles,
        titleSource: "db",
        titleSourceVersion: versionId,
        titleSourceName: sources.bibleFiles().find((version) => version.id === versionId)?.name || versionId,
      };
    }

    const fallbackVersion = fallbackTitleVersion(versionId);
    if (!fallbackVersion) return { titles: [], titleSource: "none", titleSourceVersion: "", titleSourceName: "" };

    try {
      const fallbackDb = new DatabaseSync(sources.biblePath(fallbackVersion.id), { readOnly: true });
      try {
        const fallbackTitles = readChapterTitles(fallbackDb, book, chapter);
        if (fallbackTitles.length) {
          return {
            titles: fallbackTitles,
            titleSource: "reference",
            titleSourceVersion: fallbackVersion.id,
            titleSourceName: fallbackVersion.name,
          };
        }
      } finally {
        fallbackDb.close();
      }
    } catch {
      return { titles: [], titleSource: "none", titleSourceVersion: "", titleSourceName: "" };
    }

    return { titles: [], titleSource: "none", titleSourceVersion: "", titleSourceName: "" };
  }

  function getChapter(versionId, book, chapter) {
    const db = new DatabaseSync(sources.biblePath(versionId), { readOnly: true });
    try {
      const rows = db
        .prepare("select Verse, Scripture from Bible where Book=? and Chapter=? order by Verse")
        .all(book, chapter);
      const titleInfo = readChapterTitleInfo(versionId, db, book, chapter);
      const books = sources.getBooks(versionId);
      const bookInfo = books.find((item) => item.id === book);
      const versionInfo = sources.bibleFiles().find((item) => item.id === versionId);
      return {
        version: versionId,
        versionName: versionInfo?.name || versionId,
        shortName: versionInfo?.shortName || versionId,
        book,
        bookName: bookInfo?.longName || `第 ${book} 卷`,
        chapter,
        titles: titleInfo.titles,
        titleSource: titleInfo.titleSource,
        titleSourceVersion: titleInfo.titleSourceVersion,
        titleSourceName: titleInfo.titleSourceName,
        verses: rows.map((row) => ({
          verse: Number(row.Verse),
          text: cleanText(row.Scripture),
          strongs: extractStrongNumbers(row.Scripture),
        })),
      };
    } finally {
      db.close();
    }
  }

  function getChapters(versionIds, book, chapter) {
    const versions = [...new Set(versionIds.filter(Boolean))].slice(0, 4);
    if (!versions.length) throw httpError("至少需要一个 version 参数");
    const chapters = [];
    const errors = [];
    for (const version of versions) {
      try {
        chapters.push(getChapter(version, book, chapter));
      } catch (error) {
        errors.push({ version, error: error.message || "读取失败" });
      }
    }
    return { chapters, errors };
  }

  function searchBible(versionId, query, options = {}) {
    const keyword = String(query || "").trim();
    if (keyword.length < 1) throw httpError("请输入搜索关键词");
    const scope = options.scope || "all";
    const currentBook = Number(options.book || 0);
    const limit = clampPositiveInt(options.limit, 40, MAX_SEARCH_RESULTS);
    const offset = clampNonNegativeInt(options.offset, 0);
    const params = [`%${keyword}%`];
    const where = ["Scripture like ?"];

    if (scope === "ot") where.push("Book between 1 and 39");
    else if (scope === "nt") where.push("Book between 40 and 66");
    else if (scope === "book" && currentBook > 0) {
      where.push("Book = ?");
      params.push(currentBook);
    }

    const db = new DatabaseSync(sources.biblePath(versionId), { readOnly: true });
    try {
      const rows = db
        .prepare(
          `select Book, Chapter, Verse, Scripture
           from Bible
           where ${where.join(" and ")}
           order by Book, Chapter, Verse
           limit ? offset ?`,
        )
        .all(...params, limit + 1, offset);
      const books = sources.getBooks(versionId);
      const pageRows = rows.slice(0, limit);
      return {
        version: versionId,
        query: keyword,
        scope,
        limit,
        offset,
        nextOffset: offset + pageRows.length,
        hasMore: rows.length > limit,
        results: pageRows.map((row) => {
          const book = books.find((item) => item.id === Number(row.Book));
          return {
            book: Number(row.Book),
            bookName: book?.longName || `第 ${row.Book} 卷`,
            chapter: Number(row.Chapter),
            verse: Number(row.Verse),
            text: cleanText(row.Scripture),
          };
        }),
      };
    } finally {
      db.close();
    }
  }

  function findStrongOccurrences(type, number, limit = 30) {
    const tagNumber = String(Number(number));
    const candidates = sources
      .bibleFiles()
      .filter((version) => /KJV|Strong|原文|編碼|编码/i.test(`${version.id} ${version.name}`))
      .slice(0, 6);
    const books = fallbackBooks();
    const occurrences = [];
    for (const version of candidates) {
      const db = new DatabaseSync(sources.biblePath(version.id), { readOnly: true });
      try {
        const rows = db
          .prepare(
            `select Book, Chapter, Verse
             from Bible
             where Scripture like ? or Scripture like ?
             order by Book, Chapter, Verse
             limit ?`,
          )
          .all(`%<W${type}${tagNumber}>%`, `%<W${type}${number}>%`, limit - occurrences.length);
        for (const row of rows) {
          const book = books.find((item) => item.id === Number(row.Book));
          occurrences.push({
            version: version.shortName || version.name,
            book: Number(row.Book),
            bookName: book?.longName || `第 ${row.Book} 卷`,
            chapter: Number(row.Chapter),
            verse: Number(row.Verse),
          });
        }
      } finally {
        db.close();
      }
      if (occurrences.length >= limit) break;
    }
    return occurrences;
  }

  function lookupStrong(code) {
    const match = String(code || "").trim().toUpperCase().match(/^(?:W)?([HG])0*(\d{1,5})$/);
    if (!match) throw httpError("Strong 编号格式无效");
    if (!existsSync(sources.origDb)) throw httpError("找不到原文库 cbol.db", 404);
    const type = match[1];
    const number = match[2].padStart(5, "0");
    const db = new DatabaseSync(sources.origDb, { readOnly: true });
    try {
      const table = type === "H" ? "hfhl" : "gfhl";
      const numberColumn = type === "H" ? "hsnum" : "gsnum";
      const row = db.prepare(`select ${numberColumn} number, txt, orig, orig_fhl from ${table} where ${numberColumn}=?`).get(number);
      if (!row) throw httpError(`找不到 Strong 编号：${type}${Number(number)}`, 404);
      return {
        code: `${type}${Number(number)}`,
        type,
        number,
        original: cleanText(row.orig || ""),
        transliteration: cleanText(row.orig_fhl || ""),
        definition: cleanText(row.txt || ""),
        occurrences: findStrongOccurrences(type, number),
      };
    } finally {
      db.close();
    }
  }

  function getCommentary(sourceId, book, chapter) {
    const source = sources.commentaryFiles().find((item) => item.id === sourceId);
    const db = new DatabaseSync(sources.commentaryPath(sourceId), { readOnly: true });
    try {
      if (!sources.hasTable(db, "commentary")) throw httpError("这个数据库没有 commentary 表", 400);
      const rows = db
        .prepare(
          `select Book, Chapter, FromVerse, ToVerse, Data
           from commentary
           where Book = ? and (Chapter = ? or Chapter = 0)
           order by Chapter, FromVerse, ToVerse`,
        )
        .all(book, chapter);
      return {
        source: sourceId,
        title: source?.title || sourceId,
        readable: source?.readable !== false,
        book,
        chapter,
        entries: rows.map((row) => ({
          book: Number(row.Book),
          chapter: Number(row.Chapter),
          fromVerse: Number(row.FromVerse),
          toVerse: Number(row.ToVerse),
          text: source?.readable === false ? "" : cleanText(row.Data),
          hasImages: /\bImages?\b|<img/i.test(String(row.Data || "")),
        })),
      };
    } finally {
      db.close();
    }
  }

  function searchDictionary(sourceId, query, limit = 30) {
    const keyword = String(query || "").trim();
    if (!keyword) throw httpError("请输入词条关键词");
    const source = sources.dictionaryFiles().find((item) => item.id === sourceId);
    const db = new DatabaseSync(sources.dictionaryPath(sourceId), { readOnly: true });
    try {
      const columns = db.prepare("pragma table_info(Dictionary)").all().map((column) => column.name);
      const hasImages = columns.includes("Images");
      const rows = db
        .prepare(
          `select id, Word, Description, ComeFrom${hasImages ? ", Images" : ""}
           from Dictionary
           where Word like ?
           order by length(Word), Word
           limit ?`,
        )
        .all(`%${keyword}%`, clampPositiveInt(limit, 30, 80));
      return {
        source: sourceId,
        title: source?.title || sourceId,
        readable: source?.readable !== false,
        query: keyword,
        results: rows.map((row) => ({
          id: Number(row.id),
          word: row.Word,
          comeFrom: row.ComeFrom || "",
          text: source?.readable === false ? "" : cleanText(row.Description || ""),
          images: String(row.Images || "")
            .split(";")
            .map((item) => item.trim())
            .filter(Boolean)
            .map((name) => ({
              name,
              url: `/api/dictionary/image?source=${encodeURIComponent(sourceId)}&name=${encodeURIComponent(name)}`,
            })),
        })),
      };
    } finally {
      db.close();
    }
  }

  function sendDictionaryImage(res, sourceId, imageName) {
    const db = new DatabaseSync(sources.dictionaryPath(sourceId), { readOnly: true });
    try {
      if (!sources.hasTable(db, "Images")) throw httpError("这个辞典没有图片表", 404);
      const row = db.prepare("select FileName, Data from Images where FileName=?").get(imageName);
      if (!row) throw httpError("找不到图片", 404);
      const ext = path.extname(row.FileName).toLowerCase();
      res.writeHead(200, {
        "Content-Type": ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png",
        "Content-Length": row.Data.length,
        "Cache-Control": "no-store",
      });
      res.end(row.Data);
    } finally {
      db.close();
    }
  }

  function sendAudio(res, audioId) {
    const safeId = String(audioId || "").replaceAll("/", path.sep);
    const filePath = path.resolve(sources.audioDir, safeId);
    const relativePath = path.relative(sources.audioDir, filePath);
    if (relativePath.startsWith("..") || path.isAbsolute(relativePath) || !existsSync(filePath)) {
      throw httpError("找不到音频", 404);
    }
    const body = readFileSync(filePath);
    res.writeHead(200, {
      "Content-Type": "audio/mpeg",
      "Content-Length": body.length,
      "Cache-Control": "no-store",
    });
    res.end(body);
  }

  return {
    getChapter,
    getChapters,
    searchBible,
    lookupStrong,
    getCommentary,
    searchDictionary,
    sendDictionaryImage,
    sendAudio,
  };
}
