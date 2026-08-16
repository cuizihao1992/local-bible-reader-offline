import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { fallbackBooks, totalChapterCount } from "./books.js";
import { clampPositiveInt, parsePositiveInt } from "./http.js";

export function createUserStore({ userDbPath, userDataDir, biblePath }) {
  function initUserDb() {
    mkdirSync(userDataDir, { recursive: true });
    const db = new DatabaseSync(userDbPath);
    try {
      db.exec(`
        create table if not exists verse_marks (
          version text not null,
          book integer not null,
          chapter integer not null,
          verse integer not null,
          favorite integer not null default 0,
          highlighted integer not null default 0,
          note text not null default '',
          tags text not null default '',
          updated_at text not null,
          primary key (version, book, chapter, verse)
        );
        create table if not exists reading_history (
          id integer primary key check (id = 1),
          version text not null,
          book integer not null,
          chapter integer not null,
          updated_at text not null
        );
        create table if not exists reading_progress (
          version text not null,
          book integer not null,
          chapter integer not null,
          read_at text not null,
          primary key (version, book, chapter)
        );
      `);
    } finally {
      db.close();
    }
  }

  function getMarks(version, book, chapter) {
    const db = new DatabaseSync(userDbPath);
    try {
      return db
        .prepare(
          `select version, book, chapter, verse, favorite, highlighted, note, tags, updated_at updatedAt
           from verse_marks
           where version=? and book=? and chapter=?
           order by verse`,
        )
        .all(version, book, chapter)
        .map((row) => ({
          ...row,
          favorite: !!row.favorite,
          highlighted: !!row.highlighted,
        }));
    } finally {
      db.close();
    }
  }

  function getAllMarks(filter = {}) {
    const db = new DatabaseSync(userDbPath);
    try {
      const where = [];
      const params = [];
      if (filter.kind === "favorite") where.push("favorite = 1");
      if (filter.kind === "note") where.push("(note <> '' or tags <> '')");
      if (filter.tag) {
        where.push("tags like ?");
        params.push(`%${filter.tag}%`);
      }
      const rows = db
        .prepare(
          `select version, book, chapter, verse, favorite, highlighted, note, tags, updated_at updatedAt
           from verse_marks
           ${where.length ? `where ${where.join(" and ")}` : ""}
           order by updated_at desc
           limit ?`,
        )
        .all(...params, clampPositiveInt(filter.limit, 200, 1000));
      const books = fallbackBooks();
      return rows.map((row) => {
        const book = books.find((item) => item.id === Number(row.book));
        return {
          ...row,
          bookName: book?.longName || `第 ${row.book} 卷`,
          favorite: !!row.favorite,
          highlighted: !!row.highlighted,
        };
      });
    } finally {
      db.close();
    }
  }

  function saveMark(payload) {
    const version = String(payload.version || "");
    const book = parsePositiveInt(payload.book, "book");
    const chapter = parsePositiveInt(payload.chapter, "chapter");
    const verse = parsePositiveInt(payload.verse, "verse");
    const favorite = payload.favorite ? 1 : 0;
    const highlighted = payload.highlighted ? 1 : 0;
    const note = String(payload.note || "").slice(0, 4000);
    const tags = String(payload.tags || "").slice(0, 500);
    const updatedAt = new Date().toISOString();
    biblePath(version);

    const db = new DatabaseSync(userDbPath);
    try {
      db.prepare(
        `insert into verse_marks (version, book, chapter, verse, favorite, highlighted, note, tags, updated_at)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?)
         on conflict(version, book, chapter, verse)
         do update set favorite=excluded.favorite, highlighted=excluded.highlighted,
           note=excluded.note, tags=excluded.tags, updated_at=excluded.updated_at`,
      ).run(version, book, chapter, verse, favorite, highlighted, note, tags, updatedAt);
      return {
        version,
        book,
        chapter,
        verse,
        favorite: !!favorite,
        highlighted: !!highlighted,
        note,
        tags,
        updatedAt,
      };
    } finally {
      db.close();
    }
  }

  function saveHistory(payload) {
    const version = String(payload.version || "");
    const book = parsePositiveInt(payload.book, "book");
    const chapter = parsePositiveInt(payload.chapter, "chapter");
    biblePath(version);
    const updatedAt = new Date().toISOString();
    const db = new DatabaseSync(userDbPath);
    try {
      db.prepare(
        `insert into reading_history (id, version, book, chapter, updated_at)
         values (1, ?, ?, ?, ?)
         on conflict(id) do update set version=excluded.version, book=excluded.book,
           chapter=excluded.chapter, updated_at=excluded.updated_at`,
      ).run(version, book, chapter, updatedAt);
      return { version, book, chapter, updatedAt };
    } finally {
      db.close();
    }
  }

  function getHistory() {
    const db = new DatabaseSync(userDbPath);
    try {
      return db.prepare("select version, book, chapter, updated_at updatedAt from reading_history where id=1").get() || null;
    } finally {
      db.close();
    }
  }

  function getReadingProgress(version) {
    const safeVersion = String(version || "");
    biblePath(safeVersion);
    const db = new DatabaseSync(userDbPath);
    try {
      const readChapters = db
        .prepare(
          `select version, book, chapter, read_at readAt
           from reading_progress
           where version=?
           order by book, chapter`,
        )
        .all(safeVersion);
      const readSet = new Set(readChapters.map((item) => `${item.book}:${item.chapter}`));
      const books = fallbackBooks().map((book) => {
        const read = Array.from({ length: book.chapterCount }, (_, index) => index + 1).filter((chapter) =>
          readSet.has(`${book.id}:${chapter}`),
        ).length;
        return {
          id: book.id,
          shortName: book.shortName,
          longName: book.longName,
          chapterCount: book.chapterCount,
          read,
          unread: book.chapterCount - read,
        };
      });
      return {
        version: safeVersion,
        total: totalChapterCount(),
        read: readChapters.length,
        percent: Math.round((readChapters.length / totalChapterCount()) * 1000) / 10,
        readChapters,
        books,
      };
    } finally {
      db.close();
    }
  }

  function setChapterRead(payload) {
    const version = String(payload.version || "");
    const book = parsePositiveInt(payload.book, "book");
    const chapter = parsePositiveInt(payload.chapter, "chapter");
    const read = payload.read !== false;
    biblePath(version);
    const updatedAt = new Date().toISOString();
    const db = new DatabaseSync(userDbPath);
    try {
      if (read) {
        db.prepare(
          `insert into reading_progress (version, book, chapter, read_at)
           values (?, ?, ?, ?)
           on conflict(version, book, chapter) do update set read_at=excluded.read_at`,
        ).run(version, book, chapter, updatedAt);
      } else {
        db.prepare("delete from reading_progress where version=? and book=? and chapter=?").run(version, book, chapter);
      }
    } finally {
      db.close();
    }
    return {
      version,
      book,
      chapter,
      read,
      readAt: read ? updatedAt : null,
      progress: getReadingProgress(version),
    };
  }

  function exportUserData() {
    const db = new DatabaseSync(userDbPath);
    try {
      return {
        exportedAt: new Date().toISOString(),
        marks: db.prepare("select * from verse_marks order by updated_at desc").all(),
        history: getHistory(),
        progress: db.prepare("select * from reading_progress order by read_at desc").all(),
      };
    } finally {
      db.close();
    }
  }

  function importUserData(payload) {
    const marks = Array.isArray(payload.marks) ? payload.marks : [];
    const progress = Array.isArray(payload.progress) ? payload.progress : [];
    const db = new DatabaseSync(userDbPath);
    let committed = false;
    try {
      const insert = db.prepare(
        `insert into verse_marks (version, book, chapter, verse, favorite, highlighted, note, tags, updated_at)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?)
         on conflict(version, book, chapter, verse)
         do update set favorite=excluded.favorite, highlighted=excluded.highlighted,
           note=excluded.note, tags=excluded.tags, updated_at=excluded.updated_at`,
      );
      const insertProgress = db.prepare(
        `insert into reading_progress (version, book, chapter, read_at)
         values (?, ?, ?, ?)
         on conflict(version, book, chapter) do update set read_at=excluded.read_at`,
      );
      db.exec("begin");
      for (const item of marks.filter((mark) => mark.version && mark.book && mark.chapter && mark.verse)) {
        insert.run(
          String(item.version || ""),
          Number(item.book),
          Number(item.chapter),
          Number(item.verse),
          item.favorite ? 1 : 0,
          item.highlighted ? 1 : 0,
          String(item.note || ""),
          String(item.tags || ""),
          String(item.updated_at || item.updatedAt || new Date().toISOString()),
        );
      }
      for (const item of progress.filter((chapter) => chapter.version && chapter.book && chapter.chapter)) {
        insertProgress.run(
          String(item.version || ""),
          Number(item.book),
          Number(item.chapter),
          String(item.read_at || item.readAt || new Date().toISOString()),
        );
      }
      db.exec("commit");
      committed = true;
    } finally {
      if (!committed) {
        try {
          db.exec("rollback");
        } catch {}
      }
      db.close();
    }
    if (payload.history) saveHistory(payload.history);
    return { imported: marks.length, progressImported: progress.length };
  }

  return {
    initUserDb,
    getMarks,
    getAllMarks,
    saveMark,
    saveHistory,
    getHistory,
    getReadingProgress,
    setChapterRead,
    exportUserData,
    importUserData,
  };
}
