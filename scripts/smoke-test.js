const base = process.env.BIBLE_READER_URL || "http://127.0.0.1:8766";

async function getJson(path) {
  const response = await fetch(`${base}${path}`);
  const data = await response.json();
  if (!response.ok) throw new Error(`${path}: ${data.error || response.status}`);
  return data;
}

async function getText(path) {
  const response = await fetch(`${base}${path}`);
  const text = await response.text();
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return text;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const health = await getJson("/api/health");
assert(health.ok && health.versionCount > 0, "No Bible versions detected");
assert(health.app === "bible-reader", "Health app name mismatch");

const chapter = await getJson("/api/chapters?version=KJV.db&book=1&chapter=1");
assert(chapter.chapters[0].verses[0].text, "KJV Genesis 1:1 missing");
assert(chapter.chapters[0].verses[0].strongs.length > 0, "KJV Strong numbers missing");
assert(chapter.chapters[0].titles.length > 0, "KJV should receive reference chapter titles");
assert(chapter.chapters[0].titleSource === "reference", "KJV chapter title source should be reference");

const versions = await getJson("/api/versions");
const hhbVersion = versions.versions.find((version) => version.id === "和合本.db");
assert(hhbVersion?.titleCount > 0, "和合本 titleCount metadata missing");

const philemon = await getJson("/api/chapters?version=%E5%92%8C%E5%90%88%E6%9C%AC.db&book=57&chapter=1");
const philemonTitles = philemon.chapters?.[0]?.titles || [];
assert(philemonTitles.length === 4, "和合本腓利门书 1 章小标题缺失");
assert(
  philemonTitles.some((title) => title.verse === 8 && title.text.includes("阿尼西母")),
  "腓利门书小标题内容异常",
);

const john = await getJson("/api/chapter?version=%E5%92%8C%E5%90%88%E6%9C%AC.db&book=43&chapter=3");
assert(john.verses.some((verse) => verse.verse === 16 && verse.text.includes("永生")), "约翰福音 3:16 内容异常");

const search = await getJson("/api/search?version=%E5%92%8C%E5%90%88%E6%9C%AC.db&q=%E6%B0%B8%E7%94%9F&scope=nt&limit=2");
assert(search.results.length > 0, "Search returned no results");
assert(Number.isInteger(search.nextOffset) && typeof search.hasMore === "boolean", "Search pagination metadata missing");
const fuzzy = await getJson("/api/search?version=%E5%92%8C%E5%90%88%E6%9C%AC.db&q=%E7%A5%9E%E7%88%B1%E4%B8%96%E4%BA%BA&fuzzy=1&limit=2");
assert(fuzzy.fuzzy === true, "Fuzzy search flag missing");
assert(fuzzy.results.length > 0, "Fuzzy search returned no results");

const strong = await getJson("/api/strong?code=H7225");
assert(strong.definition && strong.occurrences.length > 0, "Strong lookup incomplete");

const diagnostics = await getJson("/api/diagnostics");
assert(Array.isArray(diagnostics.checks), "Diagnostics shape invalid");

const marks = await getJson("/api/user/marks/all?limit=5");
assert(Array.isArray(marks.marks), "Marks endpoint shape invalid");

const progress = await getJson("/api/user/progress?version=KJV.db");
assert(Number.isInteger(progress.total) && progress.total > 1000, "Progress total chapter count invalid");

const indexHtml = await getText("/index.html");
const appJs = await getText("/app.js");
const stylesCss = await getText("/styles.css");
assert(indexHtml.includes("本地圣经"), "Index title missing");
assert(indexHtml.includes("id=\"fuzzySearchToggle\""), "Fuzzy search toggle missing");
assert(appJs.includes("function parseReference"), "Reference parser missing");
assert(appJs.includes("function parseSpokenCommand"), "Spoken command parser missing");
assert(appJs.includes("function parseCountdown"), "Spoken countdown chapter parser missing");
assert(appJs.includes("isNextBookTail"), "Spoken next-book parser missing");
assert(appJs.includes("function parseSpokenReference"), "Spoken reference parser missing");
assert(appJs.includes("function parseChapterVerseToken"), "Spoken chapter/verse tokenizer missing");
assert(appJs.includes('level: "book"'), "Spoken book-only jump missing");
assert(appJs.includes("function setBookPickerStep"), "Book picker step view missing");
assert(appJs.includes("篇"), "Psalm spoken chapter alias missing");
assert(appJs.includes("mimo-v2.5-asr"), "MiMo ASR model missing");
assert(appJs.includes("MIMO_CHAT_MODEL"), "MiMo chat model missing");
assert(appJs.includes("function understandSpokenCommand"), "Spoken LLM understand missing");
assert(appJs.includes("function startVoiceInput"), "Voice hold-to-talk missing");
assert(indexHtml.includes("id=\"voiceBtn\""), "Voice button missing");
assert(appJs.includes("function loadChapter"), "Chapter loader missing");
assert(stylesCss.includes("--reader-font-size"), "Reader typography variables missing");

console.log("smoke-test ok");
console.log(`versions=${health.versionCount} commentaries=${health.commentaryCount} dictionaries=${health.dictionaryCount}`);
