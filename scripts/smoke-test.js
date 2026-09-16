import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fallbackBooks } from "../lib/books.js";
import { decodeModuleText, looksEncrypted } from "../lib/text.js";
import { htmlToMarkdown, looksLikeHttpUrl, publicHttpUrl } from "../lib/webextract.js";
import { pickTodayVerse } from "../lib/verse-library.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function walkJs(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkJs(path));
    else if (entry.name.endsWith(".js")) out.push(path);
  }
  return out;
}

function readStaticJs() {
  return walkJs(join(root, "static")).map((file) => readFileSync(file, "utf8")).join("\n");
}

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
const staticJs = readStaticJs();
assert(staticJs.includes("function parseReference"), "static JS glob empty or unreadable");
assert(indexHtml.includes("src=\"version.js\""), "version.js script missing");
assert(indexHtml.includes("src=\"js/core/namespace.js\""), "namespace.js script missing");
assert(indexHtml.includes("src=\"js/core/api.js\""), "api.js script missing");
assert(indexHtml.includes("src=\"js/core/state.js\""), "state.js script missing");
assert(staticJs.includes("Bible.state"), "Bible.state missing");
assert(staticJs.includes("bibleReaderState.v1"), "State storage key missing");
assert(indexHtml.includes("本地圣经"), "Index title missing");
assert(indexHtml.includes("id=\"fuzzySearchToggle\""), "Fuzzy search toggle missing");
assert(staticJs.includes("function parseReference"), "Reference parser missing");
assert(staticJs.includes("function parseSpokenCommand"), "Spoken command parser missing");
assert(staticJs.includes("function parseCountdown"), "Spoken countdown chapter parser missing");
assert(staticJs.includes("isNextBookTail"), "Spoken next-book parser missing");
assert(staticJs.includes("function parseSpokenReference"), "Spoken reference parser missing");
assert(staticJs.includes("function parseChapterVerseToken"), "Spoken chapter/verse tokenizer missing");
assert(staticJs.includes('level: "book"'), "Spoken book-only jump missing");
assert(staticJs.includes("function setBookPickerStep"), "Book picker step view missing");
assert(staticJs.includes("篇"), "Psalm spoken chapter alias missing");
assert(staticJs.includes("mimo-v2.5-asr"), "MiMo ASR model missing");
assert(staticJs.includes("MIMO_CHAT_MODEL"), "MiMo chat model missing");
assert(staticJs.includes("AI_PROVIDERS"), "Multi-provider registry missing");
assert(staticJs.includes("anthropic-messages"), "Anthropic Messages API missing");
assert(staticJs.includes("openai-completions"), "OpenAI-compatible API missing");
assert(staticJs.includes('id: "deepseek"'), "DeepSeek provider missing");
assert(staticJs.includes('id: "xai"'), "Grok provider missing");
assert(staticJs.includes('id: "openai"'), "OpenAI provider missing");
assert(staticJs.includes('id: "custom"'), "Custom OpenAI-compatible provider missing");
assert(indexHtml.includes("id=\"aiProviderSelect\""), "Provider select missing");
assert(indexHtml.includes("id=\"aiKeyInput\""), "Provider key input missing");
assert(indexHtml.includes("id=\"mimoAsrKeyInput\""), "MiMo ASR key field missing");
assert(staticJs.includes("function understandSpokenCommand"), "Spoken LLM understand missing");
assert(staticJs.includes("smartVoice"), "Smart voice toggle state missing");
assert(staticJs.includes("function runAiTask"), "AI reading tasks missing");
assert(indexHtml.includes("id=\"smartVoiceToggle\""), "Smart voice toggle missing");
assert(indexHtml.includes("id=\"aiSheet\""), "AI sheet missing");
assert(indexHtml.includes("id=\"studySearchBtn\""), "Study search button missing");
assert(indexHtml.includes("data-sidebar-tab"), "Sidebar tabs missing");
assert(indexHtml.includes("data-my-tab"), "My panel tabs missing");
assert(indexHtml.includes("id=\"mobileAiBtn\""), "Mobile assistant nav missing");
assert(indexHtml.includes("id=\"dictionarySheetInput\""), "Dictionary sheet search missing");
assert(indexHtml.includes("id=\"toggleAiNotesBtn\""), "AI notes toggle missing");
assert(staticJs.includes("function setSidebarTab"), "Sidebar tab switcher missing");
assert(staticJs.includes("function setMyTab"), "My panel tab switcher missing");
assert(indexHtml.includes("data-my-tab=\"library\""), "Verse library tab missing");
assert(indexHtml.includes("id=\"verseLibraryList\""), "Verse library list missing");
assert(staticJs.includes("/api/verse-library"), "Verse library client call missing");
assert(staticJs.includes("function pickTodayVerse"), "Today verse picker missing");
assert(indexHtml.includes("id=\"todayVerseCard\""), "Today verse card missing");
assert(indexHtml.includes("id=\"todayVersePeek\""), "Today verse peek missing");
const verseLibrary = await getJson("/api/verse-library?version=" + encodeURIComponent("和合本.db"));
assert(Array.isArray(verseLibrary.items) && verseLibrary.items.length >= 120, "Verse library too small");
assert(Array.isArray(verseLibrary.themes) && verseLibrary.themes.some((theme) => theme.id === "comfort"), "Verse library themes missing");
const john316 = verseLibrary.items.find((item) => item.book === 43 && item.chapter === 3 && item.verse === 16);
assert(john316 && String(john316.text).includes("永生"), "John 3:16 missing from verse library");
const emptyTheme = verseLibrary.items.every((item) => Array.isArray(item.themes) && item.themes.length);
assert(emptyTheme, "Verse library items must have themes");
const jan1 = pickTodayVerse(verseLibrary.items, new Date(2026, 0, 1));
assert(jan1 && jan1.id === verseLibrary.items[0].id, "Jan 1 should be the first library verse");
assert(!staticJs.includes("每日一节还没做"), "Today verse should no longer say it is unfinished");
assert(staticJs.includes("function toggleAiNotes"), "AI notes collapse missing");
assert(indexHtml.includes("id=\"myAgentNotes\""), "My panel study notes missing");
assert(indexHtml.includes("id=\"myNotesHint\""), "Unified notes hint missing");
assert(indexHtml.includes("批注"), "Verse annotation name missing");
assert(indexHtml.includes("查经记录"), "Study record name missing");
assert(indexHtml.includes("id=\"exportNotesMdBtn\""), "Markdown export missing");
assert(indexHtml.includes("id=\"pasteNotesMdBtn\""), "Markdown paste missing");
assert(indexHtml.includes("id=\"importUrlBtn\""), "Import URL button missing");
assert(staticJs.includes("/api/import/url"), "Import URL client call missing");
assert(looksLikeHttpUrl("https://example.com/a"), "HTTP URL detector missing");
assert(!looksLikeHttpUrl("not a url"), "URL detector too loose");
try {
  publicHttpUrl("http://127.0.0.1/secret");
  throw new Error("localhost URL must be rejected");
} catch (error) {
  if (error.message === "localhost URL must be rejected") throw error;
}
const sampleHtml = "<html><head><title>测试标题</title></head><body><article><h1>大标题</h1><p>第一段。</p></article></body></html>";
const extracted = htmlToMarkdown(sampleHtml);
assert(extracted.title.includes("测试标题"), "HTML title extract missing");
assert(extracted.text.includes("第一段"), "HTML body extract missing");
assert(staticJs.includes("writeAgentNoteToCurrentVerse"), "Write study note to verse missing");
assert(staticJs.includes("function exportNotesMarkdown"), "Notes markdown export missing");
assert(staticJs.includes("function parseNotesMarkdown"), "Notes markdown import missing");
assert(staticJs.includes("function formatNoteMarkdown"), "Markdown note renderer missing");
assert(staticJs.includes("600 到 1800"), "Comprehensive distill prompt missing");
assert(staticJs.includes("noteKindBadge"), "Note kind badges missing");
assert(staticJs.includes("function renderMyAgentNotes"), "My agent notes renderer missing");
assert(looksEncrypted("4w09I7ACRvw1x3Mp1672ify+DbbPBQR1G9h9VD7bIsSirxHf"), "Ciphertext should look encrypted");
assert(!looksEncrypted("<p><b>五经总论</b></p>"), "HTML commentary should not look encrypted");
assert(decodeModuleText("4w09I7ACRvw1x3Mp1672ify+DbbPBQR1G9h9VD7bIsSirxHf").encrypted, "Ciphertext must not be shown as text");
assert(!decodeModuleText("<p><b>五经总论</b></p>").encrypted, "Plain HTML must remain readable");
assert(staticJs.includes("function renderModuleImages"), "Commentary/dictionary image renderer missing");
assert(staticJs.includes("文字已加密") || staticJs.includes("正文已加密"), "Encrypted commentary message missing");
assert(staticJs.includes("renderModuleBody") || staticJs.includes("配图仍可看"), "Encrypted module image fallback missing");
assert(staticJs.includes("function runBibleStudy"), "Bible study agent missing");
assert(staticJs.includes("function runAgent"), "Unified bible agent missing");
assert(staticJs.includes("function rememberFact"), "Long-term memory facts missing");
assert(staticJs.includes("function compactAgentTurns"), "Conversation compaction missing");
assert(staticJs.includes("function renderAgentMemoryBar"), "Memory bar renderer missing");
assert(staticJs.includes("function renderAgentTurnsHtml"), "Chat history renderer missing");
assert(staticJs.includes("HISTORY_MAX"), "Long chat history cap missing");
assert(staticJs.includes("对话记录"), "Chat history heading missing");
assert(staticJs.includes('{"tool":"remember"') || staticJs.includes('tool === "remember"'), "Memory remember tool missing");
assert(indexHtml.includes("id=\"aiMemoryBar\""), "Memory bar missing");
assert(staticJs.includes("function applyBuiltInMimoKeys"), "Built-in MiMo keys missing");
assert(staticJs.includes("BIBLE_AI_DEFAULTS"), "AI defaults loader missing");
assert(indexHtml.includes("ai-defaults.js"), "AI defaults script missing");
assert(staticJs.includes("function getAiProvider"), "AI provider abstraction missing");
assert(staticJs.includes("function beginJob"), "Command job cancel token missing");
assert(staticJs.includes("function finishJob"), "Command finish status missing");
assert(staticJs.includes("spokenAliasIndex"), "Spoken short-name guard missing");
assert(indexHtml.includes("spoken-books.js"), "Spoken book helper script missing");

const spokenJs = await getText("/spoken-books.js");
assert(spokenJs.includes("伊斯拉"), "Ezra ASR variant missing");
assert(spokenJs.includes("以斯贴"), "Esther ASR variant missing");
assert(spokenJs.includes("哈巴古"), "Habakkuk ASR variant missing");
const spokenBooks = new Function(`${spokenJs}\nreturn globalThis.SpokenBooks;`)();
assert(spokenBooks, "SpokenBooks helper missing");
assert(spokenBooks.canonicalizeSpokenBooks("跳到伊斯拉记第三章").includes("以斯拉记"), "Ezra homophone not canonicalized");
assert(spokenBooks.canonicalizeSpokenBooks("打开以斯贴记").includes("以斯帖记"), "Esther homophone not canonicalized");
assert(spokenBooks.canonicalizeSpokenBooks("以斯拉记") === "以斯拉记", "Official Ezra name must stay intact");
assert(spokenBooks.spokenAliasIndex("以斯拉记", "斯") < 0, "Esther short name must not match inside Ezra");
assert(spokenBooks.spokenAliasIndex("以斯帖记", "拉") < 0, "Ezra short name must not match inside Esther");
assert(spokenBooks.spokenAliasIndex("斯4", "斯") === 0, "Esther abbreviation 斯4 must still work");
assert(spokenBooks.spokenAliasIndex("诗23", "诗") === 0, "Psalm abbreviation 诗23 must still work");
assert(spokenBooks.spokenAliasIndex("约3:16", "约") === 0, "John abbreviation 约3:16 must still work");

function mockFindSpokenBook(input) {
  const books = fallbackBooks();
  const aliases = new Map();
  books.forEach((book) => {
    [book.shortName, book.longName, book.longName.replace(/记$/, ""), book.longName.replace(/书$/, ""), book.longName.replace(/福音$/, "")].forEach((name) => {
      if (name) aliases.set(name, book);
    });
  });
  Object.entries(spokenBooks.extras).forEach(([alias, longName]) => {
    const book = books.find((item) => item.longName === longName);
    if (book) aliases.set(alias, book);
  });
  const value = spokenBooks.prepareSpokenText(String(input || "").replace(/\s+/g, ""));
  let best = null;
  for (const [alias, book] of [...aliases.entries()].sort((left, right) => right[0].length - left[0].length)) {
    const index = spokenBooks.spokenAliasIndex(value, alias);
    if (index < 0) continue;
    if (best && (index > best.index || (index === best.index && alias.length <= best.alias.length))) continue;
    best = { alias, book, index };
  }
  return best?.book.longName || null;
}

assert(mockFindSpokenBook("以斯拉记") === "以斯拉记", "Ezra official name failed");
assert(mockFindSpokenBook("以斯帖记") === "以斯帖记", "Esther official name failed");
assert(mockFindSpokenBook("伊斯拉记") === "以斯拉记", "Ezra homophone 伊斯拉记 jumped to the wrong book");
assert(mockFindSpokenBook("以斯啦记") === "以斯拉记", "Ezra homophone 以斯啦记 jumped to the wrong book");
assert(mockFindSpokenBook("以司拉") === "以斯拉记", "Ezra homophone 以司拉 jumped to the wrong book");
assert(mockFindSpokenBook("以斯贴记") === "以斯帖记", "Esther homophone 以斯贴记 failed");
assert(mockFindSpokenBook("伊斯特") === "以斯帖记", "Esther homophone 伊斯特 failed");
assert(mockFindSpokenBook("以司帖") === "以斯帖记", "Esther homophone 以司帖 failed");
assert(mockFindSpokenBook("哈巴古") === "哈巴谷书", "Habakkuk homophone failed");
assert(mockFindSpokenBook("哈该书") === "哈该书", "Haggai official name failed");
assert(mockFindSpokenBook("腓力比") === "腓立比书", "Philippians homophone failed");
assert(mockFindSpokenBook("菲利门") === "腓利门书", "Philemon homophone failed");
assert(mockFindSpokenBook("马泰福音") === "马太福音", "Matthew homophone failed");
assert(mockFindSpokenBook("约书亚记") === "约书亚记", "Joshua must not collapse to John");
assert(spokenBooks.stripBibleFiller("圣经诗篇") === "诗篇", "圣经 prefix must be stripped from 诗篇");
assert(spokenBooks.stripBibleFiller("圣经箴言") === "箴言", "圣经 prefix must be stripped from 箴言");
assert(spokenBooks.canonicalizeSpokenBooks("真言") === "箴言", "真言 must map to 箴言");
assert(spokenBooks.normalizeChapterSpeech("最后一张") === "最后一章", "最后一张 must become 最后一章");
assert(spokenBooks.normalizeChapterSpeech("倒数一张") === "倒数一章", "倒数一张 must become 倒数一章");
assert(spokenBooks.normalizeChapterSpeech("到数第一章") === "倒数一章", "到数第一章 must become 倒数一章");
assert(mockFindSpokenBook("圣经诗篇") === "诗篇", "圣经诗篇 must jump to Psalms");
assert(mockFindSpokenBook("圣经真言") === "箴言", "圣经真言 must jump to Proverbs");
assert(mockFindSpokenBook("真言") === "箴言", "真言 must jump to Proverbs");
assert(typeof spokenBooks.confusableChoices === "function", "Confusable book helper missing");
assert(spokenBooks.confusableChoices("以斯")?.books.includes("以斯拉记"), "Ambiguous 以斯 should ask Ezra/Esther");
assert(spokenBooks.confusableChoices("以斯")?.books.includes("以斯帖记"), "Ambiguous 以斯 should include Esther");
assert(spokenBooks.confusableChoices("以斯拉记") == null, "Clear Ezra must not ask");
assert(spokenBooks.confusableChoices("以斯帖记") == null, "Clear Esther must not ask");
assert(spokenBooks.confusableChoices("伊斯拉") == null, "伊斯拉 should resolve to Ezra without asking");
assert(staticJs.includes("lastVerse"), "Resume last verse missing");
assert(staticJs.includes("renderStudyProgress"), "Study progress log missing");
assert(staticJs.includes("data-dash=\"continue\""), "Continue reading button missing");
assert(staticJs.includes("inlineCompareList") || staticJs.includes("data-toggle-compare"), "Inline compare missing");
assert(indexHtml.includes("id=\"confirmSheet\""), "Voice confirm sheet missing");
assert(indexHtml.includes("id=\"closeAudioBtn\""), "Audio sheet close button missing");
assert(indexHtml.includes("id=\"ttsPlayBtn\""), "TTS play button missing");
assert(indexHtml.includes("id=\"ttsFromHereBtn\""), "Speak-from-verse button missing");
assert(indexHtml.includes("data-menu-action=\"speak\""), "Verse menu speak action missing");
assert(staticJs.includes("fromVerse"), "Speak-from-verse option missing");
assert(staticJs.includes("setNowPlaying"), "Android now-playing metadata missing");
assert(indexHtml.includes("class=\"sheetBody\""), "Sheet body layout missing");
assert(staticJs.includes("handleAndroidTts"), "Android TTS callback missing");
assert(staticJs.includes("ttsSession"), "TTS session token missing");
assert(staticJs.includes("function describeTtsEngine"), "TTS engine status helper missing");
assert(staticJs.includes("function stopSpeaking"), "Stop speaking helper missing");
assert(indexHtml.includes("sidebarSheetClose"), "Settings sheet close missing");
assert(indexHtml.includes("aria-label=\"设置\""), "Settings button label missing");
assert(stylesCss.includes("sidebarSheetClose"), "Settings sheet close style missing");
assert(stylesCss.includes("translateY(110%)"), "Mobile settings should be a bottom sheet");
assert(staticJs.includes("function openAudioSheet"), "Audio sheet opener missing");
assert(staticJs.includes("function linkVerseRefs"), "Reference link helper missing");
assert(staticJs.includes("readFont"), "Read font setting missing");
assert(staticJs.includes("copyFormat"), "Copy format setting missing");
assert(staticJs.includes("setSpeakingVerse"), "TTS verse highlight missing");
assert(staticJs.includes("ttsRate"), "TTS rate setting missing");
assert(staticJs.includes("function startNewConversation"), "New conversation missing");
assert(staticJs.includes("function insertNoteVerseRef"), "Insert verse ref into note missing");
assert(staticJs.includes("function addCurrentVerseToAgentNote"), "Add verse to study note missing");
assert(indexHtml.includes("id=\"newAiChatBtn\""), "New chat button missing");
assert(indexHtml.includes("id=\"insertNoteRefBtn\""), "Insert note ref button missing");
assert(staticJs.includes("function distillConversationToNote"), "Conversation-to-note missing");
assert(staticJs.includes("function continueAgentNote"), "Continue from note missing");
assert(indexHtml.includes("id=\"saveAiNoteBtn\""), "Save note button missing");
assert(indexHtml.includes("id=\"aiNoteList\""), "Note list missing");
assert(staticJs.includes("function patchMyMark"), "My list mark patch missing");
assert(staticJs.includes("function confirmClearMyMark"), "My list confirm clear missing");
assert(staticJs.includes("data-manage"), "My list manage button missing");
assert(staticJs.includes("verseHighlightColors"), "Verse menu highlight colors missing");
assert(indexHtml.includes("id=\"verseHighlightColors\""), "Verse highlight palette missing");
assert(indexHtml.includes("id=\"verseMenuMore\""), "Verse menu more section missing");
assert(staticJs.includes("function placeVerseMenu"), "Verse menu on-screen placement missing");
assert(staticJs.includes("function verseSelectionLabel"), "Multi-verse explain label missing");
assert(indexHtml.includes("data-bar-action=\"explain\""), "Selection bar explain missing");
assert(indexHtml.includes("data-ai-action=\"explain\""), "Explain action missing");
assert(indexHtml.includes("id=\"readFontSelect\""), "Read font select missing");
assert(indexHtml.includes("id=\"peekBar\""), "Return peek bar missing");
assert(indexHtml.includes("data-share-theme"), "Share theme templates missing");
assert(staticJs.includes("function jumpFromPeek"), "Peek jump helper missing");
assert(staticJs.includes("function switchVersion"), "Version switch keep-verse missing");
assert(staticJs.includes("function loadAgentMemory"), "Assistant memory missing");
assert(staticJs.includes("function rememberAgentTurn"), "Assistant turn memory missing");
assert(indexHtml.includes("id=\"clearAiMemoryBtn\""), "Clear assistant memory button missing");
assert(staticJs.includes("queued"), "TTS queue-until-ready missing");
assert(!staticJs.includes("function ttsReady"), "Old TTS ready gate should be removed");
assert(indexHtml.includes("data-my-filter=\"highlight\""), "Highlight filter missing");
assert(staticJs.includes("leftoverIsFiller"), "Spoken leftover filler guard missing");
assert(staticJs.includes("normalizeRelativeText"), "Relative chapter normalizer missing");
assert(staticJs.includes("模型超时，没有返回内容") || staticJs.includes("waitVoiceIntent(60000)"), "Study chat timeout too short");
assert(staticJs.includes("function startVoiceInput"), "Voice hold-to-talk missing");
assert(indexHtml.includes("id=\"voiceBtn\""), "Voice button missing");
assert(staticJs.includes("function loadChapter"), "Chapter loader missing");
assert(stylesCss.includes("--reader-font-size"), "Reader typography variables missing");

console.log("smoke-test ok");
console.log(`versions=${health.versionCount} commentaries=${health.commentaryCount} dictionaries=${health.dictionaryCount}`);
