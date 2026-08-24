import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { fallbackBooks } from "./books.js";
import { cleanText } from "./text.js";

const CATALOG_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "../static/verse-library.json");

let cachedCatalog = null;

export function loadVerseCatalog() {
  if (cachedCatalog) return cachedCatalog;
  cachedCatalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
  return cachedCatalog;
}

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dayOfYearIndex(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 1);
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((today - start) / 86400000);
}

export function pickTodayVerse(items, date = new Date()) {
  if (!Array.isArray(items) || !items.length) return null;
  const index = dayOfYearIndex(date) % items.length;
  return {
    ...items[index],
    index,
    dateKey: localDateKey(date),
  };
}

export function formatVerseRef(bookName, chapter, verse, verseEnd) {
  const end = Number(verseEnd || verse);
  const start = Number(verse);
  if (end > start) return `${bookName} ${chapter}:${start}-${end}`;
  return `${bookName} ${chapter}:${start}`;
}

export function getVerseLibrary(biblePath, options = {}) {
  const catalog = loadVerseCatalog();
  const books = fallbackBooks();
  const themeId = String(options.theme || "").trim();
  const query = String(options.q || "").trim().toLowerCase();
  const versionId = String(options.versionId || "");
  const versionName = String(options.versionName || versionId);
  const themeNames = new Map((catalog.themes || []).map((theme) => [theme.id, theme.name]));

  let items = Array.isArray(catalog.items) ? catalog.items : [];
  if (themeId) items = items.filter((item) => Array.isArray(item.themes) && item.themes.includes(themeId));

  const db = new DatabaseSync(biblePath, { readOnly: true });
  const hydrated = [];
  try {
    const stmt = db.prepare(
      "select Verse, Scripture from Bible where Book=? and Chapter=? and Verse>=? and Verse<=? order by Verse",
    );
    for (const item of items) {
      const book = Number(item.book);
      const chapter = Number(item.chapter);
      const verse = Number(item.verse);
      const verseEnd = Number(item.verseEnd || item.verse);
      const bookInfo = books.find((entry) => entry.id === book);
      const bookName = bookInfo?.longName || `第 ${book} 卷`;
      const rows = stmt.all(book, chapter, verse, verseEnd);
      const text = rows.map((row) => cleanText(row.Scripture)).filter(Boolean).join("");
      const themes = Array.isArray(item.themes) ? item.themes : [];
      const entry = {
        id: item.id,
        book,
        bookName,
        chapter,
        verse,
        verseEnd,
        ref: formatVerseRef(bookName, chapter, verse, verseEnd),
        themes,
        themeNames: themes.map((id) => themeNames.get(id) || id),
        text,
      };
      if (query) {
        const hay = `${entry.ref} ${entry.text} ${entry.themeNames.join(" ")}`.toLowerCase();
        if (!hay.includes(query)) continue;
      }
      hydrated.push(entry);
    }
  } finally {
    db.close();
  }

  return {
    ok: true,
    id: catalog.id,
    name: catalog.name,
    note: catalog.note,
    version: versionId,
    versionName,
    count: hydrated.length,
    total: (catalog.items || []).length,
    themes: catalog.themes || [],
    items: hydrated,
  };
}
