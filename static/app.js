const STORAGE_KEY = "bibleReaderState.v1";
const APP_VERSION = "1.0.0";

const state = {
  versions: [],
  books: [],
  commentaries: [],
  dictionaries: [],
  marks: new Map(),
  progress: null,
  version: "",
  compareVersions: [],
  commentary: "",
  dictionary: "",
  showStrong: false,
  audioAutoNext: false,
  theme: "light",
  palette: "classic",
  fontSize: 20,
  lineHeight: 2.05,
  book: 1,
  chapter: 1,
  targetVerse: null,
  activeVerse: null,
  recentBooks: [],
};

const $ = (id) => document.querySelector(id);
const versionSelect = $("#versionSelect");
const compareVersionsEl = $("#compareVersions");
const commentarySelect = $("#commentarySelect");
const commentaryHint = $("#commentaryHint");
const commentaryContent = $("#commentaryContent");
const strongToggle = $("#strongToggle");
const audioAutoNext = $("#audioAutoNext");
const dictionarySelect = $("#dictionarySelect");
const dictionaryInput = $("#dictionaryInput");
const dictionaryBtn = $("#dictionaryBtn");
const dictionaryHint = $("#dictionaryHint");
const exportDataBtn = $("#exportDataBtn");
const importDataBtn = $("#importDataBtn");
const importDataFile = $("#importDataFile");
const userDataHint = $("#userDataHint");
const diagnosticsBtn = $("#diagnosticsBtn");
const diagnosticsHint = $("#diagnosticsHint");
const closeSidebarBtn = $("#closeSidebarBtn");
const menuBtn = $("#menuBtn");
const prevBtn = $("#prevBtn");
const nextBtn = $("#nextBtn");
const chapterTitleBtn = $("#chapterTitleBtn");
const chapterTitle = $("#chapterTitle");
const versionTitle = $("#versionTitle");
const quickForm = $("#quickForm");
const quickInput = $("#quickInput");
const searchScope = $("#searchScope");
const readerSettingsBtn = $("#readerSettingsBtn");
const readerSettingsPanel = $("#readerSettingsPanel");
const closeReaderSettingsBtn = $("#closeReaderSettingsBtn");
const themeSelect = $("#themeSelect");
const paletteSelect = $("#paletteSelect");
const fontSizeRange = $("#fontSizeRange");
const lineHeightRange = $("#lineHeightRange");
const fontSizeValue = $("#fontSizeValue");
const lineHeightValue = $("#lineHeightValue");
const bookPickerPanel = $("#bookPickerPanel");
const bookPickerCurrent = $("#bookPickerCurrent");
const closeBookPickerBtn = $("#closeBookPickerBtn");
const bookSearchInput = $("#bookSearchInput");
const bookFilterTabs = $("#bookFilterTabs");
const bookGrid = $("#bookGrid");
const chapterGrid = $("#chapterGrid");
const chapterPanelTitle = $("#chapterPanelTitle");
const chapterPanelMeta = $("#chapterPanelMeta");
const searchPanel = $("#searchPanel");
const searchSummary = $("#searchSummary");
const searchResults = $("#searchResults");
const closeSearchBtn = $("#closeSearchBtn");
const strongPanel = $("#strongPanel");
const strongTitle = $("#strongTitle");
const strongContent = $("#strongContent");
const closeStrongBtn = $("#closeStrongBtn");
const audioPanel = $("#audioPanel");
const dictionaryPanel = $("#dictionaryPanel");
const dictionarySummary = $("#dictionarySummary");
const dictionaryResults = $("#dictionaryResults");
const closeDictionaryBtn = $("#closeDictionaryBtn");
const dashboardPanel = $("#dashboardPanel");
const statusPanel = $("#statusPanel");
const myPanel = $("#myPanel");
const myResults = $("#myResults");
const myTagFilter = $("#myTagFilter");
const closeMyPanelBtn = $("#closeMyPanelBtn");
const content = $("#content");
const verseMenu = $("#verseMenu");
const verseMenuTitle = $("#verseMenuTitle");
const selectionBar = $("#selectionBar");
const selectionSummary = $("#selectionSummary");
const copyFormatSelect = $("#copyFormatSelect");
const copySelectionBtn = $("#copySelectionBtn");
const cancelSelectionBtn = $("#cancelSelectionBtn");
const mobilePrevBtn = $("#mobilePrevBtn");
const mobileMenuBtn = $("#mobileMenuBtn");
const mobileMarkReadBtn = $("#mobileMarkReadBtn");
const mobileMyBtn = $("#mobileMyBtn");
const mobileNextBtn = $("#mobileNextBtn");
const overlay = $("#overlay");

let bookFilter = "all";
let chapterLoadToken = 0;
let chapterLoading = false;
let jumpBusy = false;
let progressSaving = false;
let exportBusy = false;
let importBusy = false;
let myPanelLoading = false;
let searchRequestToken = 0;
let dictionaryRequestToken = 0;
let strongRequestToken = 0;
let myPanelRequestToken = 0;
let selectedVerseNumbers = [];
let verseSelectionMode = false;
let longPressTimer = null;
let swipeState = null;
let statusTimer = null;
let lastScrollY = window.scrollY;
const markSavingKeys = new Set();
const searchState = { query: "", scope: "all", book: 1, results: [], nextOffset: 0, hasMore: false };

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function readResponse(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    if (!response.ok) throw new Error(text || `请求失败 ${response.status}`);
    throw new Error("服务器返回了无法解析的内容");
  }
}

async function api(path, options) {
  if (window.AndroidBibleApi && window.AndroidBibleApi.getJson && !(options && options.method && options.method !== "GET")) {
    const data = JSON.parse(window.AndroidBibleApi.getJson(path));
    if (data.error) throw new Error(data.error);
    return data;
  }
  const response = await fetch(path, options);
  const data = await readResponse(response);
  if (!response.ok || data.error) throw new Error(data.error || `请求失败 ${response.status}`);
  return data;
}

function postJson(path, payload) {
  if (window.AndroidBibleApi && window.AndroidBibleApi.postJson) {
    const data = JSON.parse(window.AndroidBibleApi.postJson(path, JSON.stringify(payload)));
    if (data.error) throw new Error(data.error);
    return Promise.resolve(data);
  }
  return api(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

window.handleAndroidBack = function handleAndroidBack() {
  return handleBackIntent();
};

function currentBook() {
  return state.books.find((book) => book.id === state.book) || state.books[0] || { id: 1, shortName: "创", longName: "创世记", chapterCount: 50 };
}

function currentVersion() {
  return state.versions.find((item) => item.id === state.version);
}

function versionLabel(versionId) {
  const version = state.versions.find((item) => item.id === versionId);
  return version?.shortName || version?.name || versionId;
}

function restoreState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    Object.assign(state, {
      version: saved.version || "",
      compareVersions: Array.isArray(saved.compareVersions) ? saved.compareVersions.slice(0, 3) : [],
      commentary: saved.commentary || "",
      dictionary: saved.dictionary || "",
      showStrong: !!saved.showStrong,
      audioAutoNext: !!saved.audioAutoNext,
      theme: saved.theme === "dark" ? "dark" : "light",
      palette: saved.palette || "classic",
      fontSize: Number(saved.fontSize) || 20,
      lineHeight: Number(saved.lineHeight) || 2.05,
      book: Number(saved.book) || 1,
      chapter: Number(saved.chapter) || 1,
      recentBooks: Array.isArray(saved.recentBooks) ? saved.recentBooks.slice(0, 8) : [],
    });
  } catch {}
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: state.version,
      compareVersions: state.compareVersions,
      commentary: state.commentary,
      dictionary: state.dictionary,
      showStrong: state.showStrong,
      audioAutoNext: state.audioAutoNext,
      theme: state.theme,
      palette: state.palette,
      fontSize: state.fontSize,
      lineHeight: state.lineHeight,
      book: state.book,
      chapter: state.chapter,
      recentBooks: state.recentBooks,
    }),
  );
}

function applySettings() {
  document.body.classList.toggle("darkTheme", state.theme === "dark");
  document.body.dataset.palette = state.palette === "classic" ? "" : state.palette;
  if (!document.body.dataset.palette) delete document.body.dataset.palette;
  document.documentElement.style.setProperty("--reader-font-size", `${state.fontSize}px`);
  document.documentElement.style.setProperty("--reader-line-height", String(state.lineHeight));
  themeSelect.value = state.theme;
  paletteSelect.value = state.palette;
  fontSizeRange.value = String(state.fontSize);
  lineHeightRange.value = String(state.lineHeight);
  fontSizeValue.textContent = `${state.fontSize}px`;
  lineHeightValue.textContent = Number(state.lineHeight).toFixed(2);
  strongToggle.checked = state.showStrong;
  audioAutoNext.checked = state.audioAutoNext;
}

function showStatus(message, tone = "info") {
  statusPanel.hidden = false;
  statusPanel.className = `statusPanel ${tone}`;
  statusPanel.textContent = message;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    statusPanel.hidden = true;
  }, 2600);
}

function closeSidebar() {
  document.body.classList.remove("sidebarOpen");
}

function openSidebar(panel) {
  document.body.classList.add("sidebarOpen");
  if (panel) showSidebarPanel(panel);
  closeTopPanels(false);
}

function showSidebarPanel(name) {
  document.querySelectorAll("[data-sidebar-target]").forEach((button) => {
    button.classList.toggle("active", button.dataset.sidebarTarget === name);
  });
  document.querySelectorAll("[data-sidebar-panel]").forEach((section) => {
    section.classList.toggle("active", section.dataset.sidebarPanel === name);
  });
}

function closeContentPanels() {
  searchPanel.hidden = true;
  strongPanel.hidden = true;
  dictionaryPanel.hidden = true;
  myPanel.hidden = true;
}

function closeTopPanels(includeSettings = true) {
  bookPickerPanel.hidden = true;
  if (includeSettings) readerSettingsPanel.hidden = true;
  closeContentPanels();
  closeVerseMenu();
  closeSelectionBar();
}

function resetVerseInteraction(targetVerse = null) {
  state.activeVerse = null;
  state.targetVerse = targetVerse;
  closeContentPanels();
  closeVerseMenu();
  closeSelectionBar();
}

function atFirstChapter() {
  return state.book <= 1 && state.chapter <= 1;
}

function atLastChapter() {
  const last = state.books[state.books.length - 1];
  return last && state.book === last.id && state.chapter >= last.chapterCount;
}

function renderChrome() {
  const book = currentBook();
  chapterTitle.textContent = book ? `${book.longName} ${state.chapter}` : "加载中";
  const version = currentVersion();
  const titleHint = version?.titleCount > 0 ? "有小标题" : "可参考小标题";
  versionTitle.textContent = version ? `${version.name} · ${titleHint}` : "";
  prevBtn.disabled = chapterLoading || atFirstChapter();
  nextBtn.disabled = chapterLoading || atLastChapter();
  mobilePrevBtn.disabled = chapterLoading || atFirstChapter();
  mobileNextBtn.disabled = chapterLoading || atLastChapter();
  mobileMarkReadBtn.textContent = isCurrentChapterRead() ? "已读" : "标记";
}

function isCurrentChapterRead() {
  return !!state.progress?.readChapters?.some((item) => item.book === state.book && item.chapter === state.chapter);
}

function renderVersions() {
  versionSelect.innerHTML = state.versions
    .map((version) => {
      const titles = version.titleCount > 0 ? " · 有小标题" : "";
      return `<option value="${escapeHtml(version.id)}" ${version.id === state.version ? "selected" : ""}>${escapeHtml(version.name)}${titles}</option>`;
    })
    .join("");
}

function renderCompareVersions() {
  compareVersionsEl.innerHTML = state.versions
    .filter((version) => version.id !== state.version)
    .map((version) => {
      const checked = state.compareVersions.includes(version.id) ? "checked" : "";
      return `<label><input type="checkbox" data-compare="${escapeHtml(version.id)}" ${checked} /> ${escapeHtml(version.shortName || version.name)}</label>`;
    })
    .join("");
}

function renderCommentaries() {
  commentarySelect.innerHTML = `<option value="">不显示注释</option>` +
    state.commentaries
      .map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === state.commentary ? "selected" : ""}>${escapeHtml(item.title)}${item.readable ? "" : "（可能加密）"}</option>`)
      .join("");
}

function renderDictionaries() {
  dictionarySelect.innerHTML = state.dictionaries
    .map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === state.dictionary ? "selected" : ""}>${escapeHtml(item.title)}</option>`)
    .join("");
  if (!state.dictionary && state.dictionaries[0]) state.dictionary = state.dictionaries[0].id;
}

function rememberCurrentBook() {
  state.recentBooks = [state.book, ...state.recentBooks.filter((id) => id !== state.book)].slice(0, 8);
}

function bookMatchesFilter(book) {
  const query = bookSearchInput.value.trim();
  if (query && ![book.shortName, book.longName].some((name) => String(name).includes(query))) return false;
  if (bookFilter === "ot") return book.id <= 39;
  if (bookFilter === "nt") return book.id >= 40;
  if (bookFilter === "recent") return state.recentBooks.includes(book.id);
  return true;
}

function renderBookGrid() {
  bookGrid.innerHTML = state.books
    .filter(bookMatchesFilter)
    .map((book) => {
      const progress = state.progress?.books?.find((item) => item.id === book.id);
      const readClass = progress?.read ? " read" : "";
      return `<button type="button" class="${book.id === state.book ? "active" : ""}${readClass}" data-book="${book.id}">
        <span class="bookShort">${escapeHtml(book.shortName)}</span>
        <span class="bookMeta">${book.id <= 39 ? "旧约" : "新约"} · ${book.chapterCount}章</span>
      </button>`;
    })
    .join("");
  if (!bookGrid.innerHTML) bookGrid.innerHTML = `<div class="panelHint">没有匹配的书卷</div>`;
}

function renderChapterGrid() {
  const book = currentBook();
  const readSet = new Set((state.progress?.readChapters || []).filter((item) => item.book === book.id).map((item) => item.chapter));
  chapterPanelTitle.textContent = book.longName;
  chapterPanelMeta.textContent = `${book.chapterCount} 章 · 当前第 ${state.chapter} 章`;
  bookPickerCurrent.textContent = `${book.longName} ${state.chapter} · ${versionLabel(state.version)}`;
  chapterGrid.innerHTML = Array.from({ length: book.chapterCount }, (_, index) => {
    const chapter = index + 1;
    const classes = [chapter === state.chapter ? "active" : "", readSet.has(chapter) ? "read" : ""].filter(Boolean).join(" ");
    return `<button type="button" class="${classes}" data-chapter="${chapter}" ${chapterLoading ? "disabled" : ""}>${chapter}</button>`;
  }).join("");
}

function renderDashboard() {
  const book = currentBook();
  const percent = state.progress?.percent || 0;
  const historyText = book ? `当前：${book.longName} ${state.chapter}` : "还没有阅读记录";
  dashboardPanel.innerHTML = `
    <div class="dashCard">
      <div class="dashTitle">继续阅读</div>
      <div class="dashMeta">${escapeHtml(historyText)}</div>
      <div class="dashActions">
        <button type="button" data-dash="picker">选择书卷</button>
        <button type="button" data-dash="unread">下一未读章</button>
        <button type="button" data-dash="mark">${isCurrentChapterRead() ? "取消已读" : "标记已读"}</button>
      </div>
    </div>
    <div class="dashCard">
      <div class="dashTitle">阅读进度</div>
      <div class="dashMeta">${versionLabel(state.version)} · 已读 ${state.progress?.read || 0} / ${state.progress?.total || 1189} 章（${percent}%）</div>
      <div class="progressBar"><span style="width:${percent}%"></span></div>
    </div>
  `;
}

function markForVerse(verse) {
  return (
    state.marks.get(Number(verse)) || {
      version: state.version,
      book: state.book,
      chapter: state.chapter,
      verse: Number(verse),
      favorite: false,
      highlighted: false,
      note: "",
      tags: "",
    }
  );
}

function verseMarkClasses(mark) {
  return [
    mark.favorite ? "favoriteVerse" : "",
    mark.highlighted ? "highlightedVerse" : "",
    mark.note || mark.tags ? "notedVerse" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function renderNoteEditor(verse) {
  const mark = markForVerse(verse);
  const preview = mark.note || mark.tags
    ? `<div class="notePreview">${mark.tags ? `<div class="noteTags">${escapeHtml(mark.tags)}</div>` : ""}<div class="noteText">${escapeHtml(mark.note)}</div></div>`
    : "";
  return `
    ${preview}
    <div class="noteEditor" data-note-editor="${verse}" hidden>
      <textarea data-note-text="${verse}" placeholder="写下笔记">${escapeHtml(mark.note)}</textarea>
      <input data-note-tags="${verse}" type="text" placeholder="标签，用逗号分隔" value="${escapeHtml(mark.tags)}" />
      <button type="button" data-save-note="${verse}">保存笔记</button>
    </div>
  `;
}

function renderStrongList(strongs) {
  if (!state.showStrong || !strongs?.length) return "";
  return `<div class="strongList">${strongs.map((item) => `<button class="strongBtn" type="button" data-strong="${escapeHtml(item.code)}">${escapeHtml(item.code)}</button>`).join("")}</div>`;
}

function renderCompareList(verseNo, compareByVersion) {
  const items = compareByVersion
    .map((item) => {
      const text = item.verses.get(verseNo);
      if (!text) return "";
      return `<div class="compareText"><div class="compareName">${escapeHtml(item.name)}</div><div class="compareVerse">${escapeHtml(text)}</div></div>`;
    })
    .filter(Boolean);
  return items.length ? `<div class="compareList">${items.join("")}</div>` : "";
}

function renderVerses(data) {
  const mainChapter = data.chapters?.[0] || data;
  const compareChapters = data.chapters?.slice(1) || [];
  if (!mainChapter.verses.length) {
    content.innerHTML = `<div class="empty">这个版本没有当前章节的经文。可以换一个译本，或选择别的章节。</div>`;
    return;
  }
  const compareByVersion = compareChapters.map((chapter) => ({
    version: chapter.version,
    name: chapter.shortName || chapter.versionName || versionLabel(chapter.version),
    verses: new Map(chapter.verses.map((verse) => [verse.verse, verse.text])),
  }));
  const headings = Object.fromEntries((mainChapter.titles || []).map((item) => [item.verse, item.text]));
  const sourceLabel =
    mainChapter.titleSource === "db"
      ? "真实小标题"
      : mainChapter.titleSource === "reference"
        ? `参考小标题 · ${mainChapter.titleSourceName || ""}`
        : "当前无小标题";
  const titleLinks = (mainChapter.titles || [])
    .map((item) => `<button type="button" data-jump-verse="${item.verse}">${item.verse}. ${escapeHtml(item.text)}</button>`)
    .join(" · ");
  content.innerHTML =
    `<div class="titleSummary">${escapeHtml(sourceLabel)}${titleLinks ? `<div>${titleLinks}</div>` : ""}</div>` +
    mainChapter.verses
      .map((verse) => {
        const mark = markForVerse(verse.verse);
        return `
          ${headings[verse.verse] ? `<div class="sectionHeading" data-section-verse="${verse.verse}"><span class="sectionHeadingNo">${verse.verse}</span><span>${escapeHtml(headings[verse.verse])}</span></div>` : ""}
          <article class="verse ${verseMarkClasses(mark)}" data-verse="${verse.verse}">
            <div class="verseNo" id="v${verse.verse}">${verse.verse}</div>
            <div class="verseBody" data-verse="${verse.verse}">
              <div class="verseText">${escapeHtml(verse.text)}</div>
              ${renderStrongList(verse.strongs || [])}
              ${renderCompareList(verse.verse, compareByVersion)}
              ${renderNoteEditor(verse.verse)}
            </div>
          </article>
        `;
      })
      .join("");
  renderVerseSelectionState();
  focusTargetVerse();
}

function focusTargetVerse() {
  if (!state.targetVerse) return;
  const el = content.querySelector(`.verse[data-verse="${state.targetVerse}"]`);
  if (!el) return;
  el.classList.add("targetVerse");
  el.scrollIntoView({ block: "center", behavior: "smooth" });
}

function scrollReaderToTop() {
  const top = document.querySelector(".topbar")?.getBoundingClientRect().bottom || 0;
  const target = Math.max(0, window.scrollY + content.getBoundingClientRect().top - top - 8);
  window.scrollTo({ top: target, behavior: "auto" });
}

function setChapterError(error, snapshot) {
  const message = error.message || String(error);
  const book = state.books.find((item) => item.id === snapshot.book);
  const reference = book ? `${book.longName} ${snapshot.chapter}` : `第 ${snapshot.chapter} 章`;
  content.innerHTML = `
    <div class="error">
      无法读取 ${escapeHtml(reference)}<br />${escapeHtml(message)}
      <div><button class="retryBtn" type="button" data-retry-chapter>重试</button></div>
    </div>
  `;
  showStatus(message, "error");
}

async function loadBooks() {
  const data = await api(`/api/books?version=${encodeURIComponent(state.version)}`);
  state.books = data.books;
  if (!state.books.some((book) => book.id === state.book)) {
    state.book = state.books[0]?.id || 1;
    state.chapter = 1;
  }
  const book = currentBook();
  if (state.chapter > book.chapterCount) state.chapter = 1;
  renderBookGrid();
  renderChapterGrid();
}

async function loadMarks(snapshot = {}, token = null) {
  const data = await api(`/api/user/marks?version=${encodeURIComponent(snapshot.version || state.version)}&book=${snapshot.book || state.book}&chapter=${snapshot.chapter || state.chapter}`);
  if (token != null && token !== chapterLoadToken) return;
  state.marks = new Map(data.marks.map((mark) => [Number(mark.verse), mark]));
}

async function loadProgress(version = state.version, token = null) {
  const data = await api(`/api/user/progress?version=${encodeURIComponent(version)}`);
  if (token != null && token !== chapterLoadToken) return;
  state.progress = data;
}

function saveReadingHistory(snapshot = {}) {
  postJson("/api/user/history", {
    version: snapshot.version || state.version,
    book: snapshot.book || state.book,
    chapter: snapshot.chapter || state.chapter,
  }).catch(() => {});
}

async function loadCommentary(snapshot = {}, token = null) {
  if (!state.commentary) {
    commentaryContent.innerHTML = "";
    commentaryHint.textContent = "";
    return;
  }
  commentaryHint.textContent = "正在读取注释...";
  try {
    const data = await api(`/api/commentary?source=${encodeURIComponent(state.commentary)}&book=${snapshot.book || state.book}&chapter=${snapshot.chapter || state.chapter}`);
    if (token != null && token !== chapterLoadToken) return;
    renderCommentary(data);
    commentaryHint.textContent = data.readable === false ? "该注释库可能已加密，正文无法直接显示。" : `${data.entries.length} 条`;
  } catch (error) {
    if (token != null && token !== chapterLoadToken) return;
    commentaryContent.innerHTML = `<div class="commentaryBlock"><div class="commentaryEntry">${escapeHtml(error.message)}</div></div>`;
    commentaryHint.textContent = error.message;
  }
}

function formatCommentaryRef(entry) {
  if (entry.chapter === 0) return "全书";
  if (!entry.fromVerse) return `${entry.chapter} 章`;
  return entry.toVerse && entry.toVerse !== entry.fromVerse
    ? `${entry.chapter}:${entry.fromVerse}-${entry.toVerse}`
    : `${entry.chapter}:${entry.fromVerse}`;
}

function renderCommentary(data) {
  if (!data.entries.length) {
    commentaryContent.innerHTML = `<div class="commentaryBlock"><div class="commentaryHeader"><div class="commentaryTitle">${escapeHtml(data.title)}</div><div class="commentaryMeta">本章没有注释</div></div></div>`;
    return;
  }
  commentaryContent.innerHTML = `
    <div class="commentaryBlock">
      <div class="commentaryHeader">
        <div class="commentaryTitle">${escapeHtml(data.title)}</div>
        <div class="commentaryMeta">${data.entries.length} 条</div>
      </div>
      ${data.entries
        .map(
          (entry) => `
            <article class="commentaryEntry" data-from="${entry.fromVerse}" data-to="${entry.toVerse}">
              <div class="commentaryRef">${escapeHtml(formatCommentaryRef(entry))}</div>
              <div class="commentaryText">${escapeHtml(entry.text || "（无文本）")}</div>
              ${entry.hasImages ? `<div class="imageNote">本条含图片，当前版本先显示文字</div>` : ""}
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

async function loadAudio(snapshot = {}, token = null) {
  try {
    const data = await api(`/api/audio?book=${snapshot.book || state.book}&chapter=${snapshot.chapter || state.chapter}`);
    if (token != null && token !== chapterLoadToken) return;
    renderAudio(data.audio || []);
  } catch {
    if (token != null && token !== chapterLoadToken) return;
    audioPanel.hidden = true;
  }
}

function renderAudio(items) {
  if (!items.length) {
    audioPanel.hidden = true;
    audioPanel.innerHTML = "";
    return;
  }
  audioPanel.hidden = false;
  audioPanel.innerHTML = items
    .map(
      (item, index) => `
        <div>
          <div class="panelTitle">${escapeHtml(item.source)} · 音频</div>
          <audio controls ${index === 0 ? "" : ""} src="${escapeHtml(item.url)}" data-audio></audio>
        </div>
      `,
    )
    .join("");
  audioPanel.querySelectorAll("audio").forEach((audio) => {
    audio.addEventListener("ended", () => {
      if (state.audioAutoNext) moveChapter(1);
    });
  });
}

async function loadChapter(options = {}) {
  const token = ++chapterLoadToken;
  const snapshot = { version: state.version, book: state.book, chapter: state.chapter };
  chapterLoading = true;
  renderChrome();
  if (!content.querySelector(".verse")) content.innerHTML = `<div class="loading">正在读取经文...</div>`;
  try {
    const versions = [state.version, ...state.compareVersions.filter((id) => id && id !== state.version)].slice(0, 4);
    const query = versions.map((id) => `version=${encodeURIComponent(id)}`).join("&");
    const [chapterData] = await Promise.all([
      api(`/api/chapters?${query}&book=${snapshot.book}&chapter=${snapshot.chapter}`),
      loadMarks(snapshot, token),
      loadProgress(snapshot.version, token),
    ]);
    if (token !== chapterLoadToken) return;
    renderVerses(chapterData);
    renderChrome();
    renderDashboard();
    renderBookGrid();
    renderChapterGrid();
    saveReadingHistory(snapshot);
    saveState();
    if (options.scrollTop) scrollReaderToTop();
    await Promise.all([loadCommentary(snapshot, token), loadAudio(snapshot, token)]);
  } catch (error) {
    if (token !== chapterLoadToken) return;
    setChapterError(error, snapshot);
  } finally {
    if (token === chapterLoadToken) {
      chapterLoading = false;
      renderChrome();
    }
  }
}

function moveChapter(delta) {
  if (chapterLoading) {
    showStatus("正在读取经文，请稍候");
    return;
  }
  const book = currentBook();
  let nextBook = state.book;
  let nextChapter = state.chapter + delta;
  if (nextChapter < 1) {
    const prev = state.books.find((item) => item.id === state.book - 1);
    if (!prev) {
      showStatus("已经是第一章");
      return;
    }
    nextBook = prev.id;
    nextChapter = prev.chapterCount;
  } else if (nextChapter > book.chapterCount) {
    const next = state.books.find((item) => item.id === state.book + 1);
    if (!next) {
      showStatus("已经是最后一章");
      return;
    }
    nextBook = next.id;
    nextChapter = 1;
  }
  state.book = nextBook;
  state.chapter = nextChapter;
  rememberCurrentBook();
  resetVerseInteraction();
  loadChapter({ scrollTop: true });
}

function bookAliases() {
  const aliases = new Map();
  state.books.forEach((book) => {
    [book.shortName, book.longName, book.longName?.replace(/记$/, ""), book.longName?.replace(/书$/, "")].forEach((name) => {
      if (name) aliases.set(name, book);
    });
  });
  return [...aliases.entries()].sort((a, b) => b[0].length - a[0].length);
}

function parseReference(input) {
  const value = input.trim().replace(/\s+/g, "");
  const match = value.match(/^(.+?)(\d+)[:：.．,，](\d+)$/) || value.match(/^(.+?)(\d+)$/);
  if (!match) return null;
  const rawBook = match[1];
  const found = bookAliases().find(([alias]) => rawBook === alias || rawBook.startsWith(alias));
  if (!found) return null;
  return {
    book: found[1].id,
    chapter: Number(match[2]),
    verse: match[3] ? Number(match[3]) : null,
  };
}

async function jumpToReference(ref) {
  if (jumpBusy) {
    showStatus("正在跳转经文，请稍候");
    return;
  }
  jumpBusy = true;
  try {
    state.book = ref.book;
    state.chapter = ref.chapter;
    rememberCurrentBook();
    resetVerseInteraction(ref.verse || null);
    renderBookGrid();
    renderChapterGrid();
    closeTopPanels();
    closeSidebar();
    await loadChapter({ scrollTop: !state.targetVerse });
    const book = currentBook();
    showStatus(`${book.longName} ${state.chapter}${state.targetVerse ? `:${state.targetVerse}` : ""}`);
  } finally {
    jumpBusy = false;
  }
}

function highlightText(text, query) {
  if (!query) return escapeHtml(text);
  const safe = escapeHtml(text);
  const needle = escapeHtml(query);
  return safe.replaceAll(needle, `<mark>${needle}</mark>`);
}

async function runSearch(query, options = {}) {
  const token = ++searchRequestToken;
  const append = !!options.append;
  if (!append) {
    searchState.query = query;
    searchState.scope = searchScope.value;
    searchState.book = state.book;
    searchState.results = [];
    searchState.nextOffset = 0;
  }
  closeContentPanels();
  searchPanel.hidden = false;
  const button = quickForm.querySelector("button[type=submit]");
  button.textContent = append ? "查找" : "搜索中";
  button.disabled = true;
  try {
    const data = await api(
      `/api/search?version=${encodeURIComponent(state.version)}&q=${encodeURIComponent(query)}&scope=${searchState.scope}&book=${searchState.book}&limit=40&offset=${append ? searchState.nextOffset : 0}`,
    );
    if (token !== searchRequestToken) return;
    searchState.results = append ? [...searchState.results, ...data.results] : data.results;
    searchState.nextOffset = data.nextOffset;
    searchState.hasMore = data.hasMore;
    renderSearchResults();
  } catch (error) {
    if (token !== searchRequestToken) return;
    searchSummary.textContent = error.message;
    searchResults.innerHTML = "";
  } finally {
    if (token === searchRequestToken) {
      button.textContent = "查找";
      button.disabled = false;
    }
  }
}

function renderSearchResults() {
  searchSummary.textContent = `“${searchState.query}” 找到 ${searchState.results.length}${searchState.hasMore ? "+" : ""} 处`;
  searchResults.innerHTML =
    searchState.results
      .map(
        (item) => `
          <button class="resultItem" type="button" data-jump-book="${item.book}" data-jump-chapter="${item.chapter}" data-jump-verse="${item.verse}">
            <div class="resultRef">${escapeHtml(item.bookName)} ${item.chapter}:${item.verse}</div>
            <div class="resultText">${highlightText(item.text, searchState.query)}</div>
          </button>
        `,
      )
      .join("") +
    (searchState.hasMore ? `<button class="loadMore" type="button" data-search-more>加载更多</button>` : "");
}

async function openStrong(code) {
  const token = ++strongRequestToken;
  closeContentPanels();
  strongPanel.hidden = false;
  strongTitle.textContent = code;
  strongContent.innerHTML = `<div class="loading">正在查询原文...</div>`;
  try {
    const data = await api(`/api/strong?code=${encodeURIComponent(code)}`);
    if (token !== strongRequestToken) return;
    strongTitle.textContent = `${data.code} ${data.original || ""}`;
    strongContent.innerHTML = `
      <div class="strongMeta">${escapeHtml(data.transliteration || "")}</div>
      <div>${escapeHtml(data.definition || "没有释义")}</div>
      <div class="panelTitle">出现位置</div>
      ${(data.occurrences || [])
        .map(
          (item) => `<button class="resultItem" type="button" data-jump-book="${item.book}" data-jump-chapter="${item.chapter}" data-jump-verse="${item.verse}">
            <div class="resultRef">${escapeHtml(item.bookName)} ${item.chapter}:${item.verse}</div>
            <div class="resultText">${escapeHtml(item.version)}</div>
          </button>`,
        )
        .join("") || "<div class='panelHint'>没有找到出现位置</div>"}
    `;
  } catch (error) {
    if (token !== strongRequestToken) return;
    strongContent.innerHTML = `<div class="error">${escapeHtml(error.message)}</div>`;
  }
}

async function searchDictionary(query = dictionaryInput.value.trim()) {
  if (!query || !state.dictionary) {
    showStatus("请输入词条");
    return;
  }
  const token = ++dictionaryRequestToken;
  dictionaryBtn.disabled = true;
  dictionaryBtn.textContent = "查找中";
  closeContentPanels();
  dictionaryPanel.hidden = false;
  try {
    const data = await api(`/api/dictionary/search?source=${encodeURIComponent(state.dictionary)}&q=${encodeURIComponent(query)}`);
    if (token !== dictionaryRequestToken) return;
    dictionarySummary.textContent = `“${query}” · ${data.title} · ${data.results.length} 条`;
    dictionaryResults.innerHTML = data.results.length
      ? data.results
          .map(
            (item) => `
              <article class="resultItem">
                <div class="resultRef">${escapeHtml(item.word)}</div>
                <div class="resultText">${escapeHtml(item.text || "（无文本）")}</div>
                ${
                  item.images?.length
                    ? `<div class="dictImages">${item.images.map((image) => `<img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.name)}" />`).join("")}</div>`
                    : ""
                }
              </article>
            `,
          )
          .join("")
      : `<div class="panelHint">没有找到词条</div>`;
    dictionaryHint.textContent = `${data.results.length} 条`;
  } catch (error) {
    if (token !== dictionaryRequestToken) return;
    dictionaryHint.textContent = error.message;
    dictionaryResults.innerHTML = `<div class="error">${escapeHtml(error.message)}</div>`;
  } finally {
    if (token === dictionaryRequestToken) {
      dictionaryBtn.disabled = false;
      dictionaryBtn.textContent = "查";
    }
  }
}

async function openMyPanel(kind = "all") {
  if (myPanelLoading) {
    showStatus("正在读取我的内容，请稍候");
    return;
  }
  const token = ++myPanelRequestToken;
  myPanelLoading = true;
  closeContentPanels();
  myPanel.hidden = false;
  myResults.innerHTML = `<div class="loading">正在读取我的收藏与笔记...</div>`;
  document.querySelectorAll("[data-my-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.myFilter === kind);
    button.disabled = true;
  });
  try {
    const tag = myTagFilter.value.trim();
    const data = await api(`/api/user/marks/all?kind=${encodeURIComponent(kind === "all" ? "" : kind)}&tag=${encodeURIComponent(tag)}`);
    if (token !== myPanelRequestToken) return;
    renderMyResults(data.marks);
  } catch (error) {
    if (token !== myPanelRequestToken) return;
    myResults.innerHTML = `<div class="error">${escapeHtml(error.message)}</div>`;
  } finally {
    if (token === myPanelRequestToken) {
      myPanelLoading = false;
      document.querySelectorAll("[data-my-filter]").forEach((button) => {
        button.disabled = false;
      });
    }
  }
}

function renderMyResults(marks) {
  myResults.innerHTML = marks.length
    ? marks
        .map(
          (item) => `
            <button class="resultItem" type="button" data-jump-book="${item.book}" data-jump-chapter="${item.chapter}" data-jump-verse="${item.verse}">
              <div class="resultRef">${escapeHtml(item.bookName)} ${item.chapter}:${item.verse} ${item.favorite ? "★" : ""} ${item.highlighted ? "高亮" : ""}</div>
              <div class="resultText">${escapeHtml(item.note || item.tags || "收藏")}</div>
            </button>
          `,
        )
        .join("")
    : `<div class="panelHint">还没有收藏或笔记</div>`;
}

function updateVerseMarkDom(mark) {
  const verse = content.querySelector(`.verse[data-verse="${mark.verse}"]`);
  if (!verse) return;
  verse.classList.toggle("favoriteVerse", !!mark.favorite);
  verse.classList.toggle("highlightedVerse", !!mark.highlighted);
  verse.classList.toggle("notedVerse", !!(mark.note || mark.tags));
  const editor = verse.querySelector(`[data-note-editor="${mark.verse}"]`);
  if (editor) {
    const wasHidden = editor.hidden;
    const preview = verse.querySelector(".notePreview");
    editor.outerHTML = renderNoteEditor(mark.verse);
    const nextEditor = verse.querySelector(`[data-note-editor="${mark.verse}"]`);
    if (nextEditor) nextEditor.hidden = wasHidden;
    if (preview && nextEditor) preview.replaceWith();
  }
}

async function saveVerseMark(mark, options = {}) {
  const key = `${mark.version}:${mark.book}:${mark.chapter}:${mark.verse}`;
  if (markSavingKeys.has(key)) {
    showStatus("正在保存标注，请稍候");
    return mark;
  }
  markSavingKeys.add(key);
  try {
    const data = await postJson("/api/user/mark", mark);
    state.marks.set(Number(data.mark.verse), data.mark);
    updateVerseMarkDom(data.mark);
    if (options.successMessage) showStatus(options.successMessage, "success");
    return data.mark;
  } finally {
    markSavingKeys.delete(key);
  }
}

function verseTextForNumber(verseNo) {
  return content.querySelector(`.verse[data-verse="${verseNo}"] .verseText`)?.textContent.trim() || "";
}

function formatVerseLines(verseNumbers, format = "reference") {
  const book = currentBook();
  const lines = verseNumbers
    .map((verseNo) => {
      const verse = verseTextForNumber(verseNo);
      if (!verse) return "";
      if (format === "plain" || format === "paragraph") return verse;
      return `${book.longName} ${state.chapter}:${verseNo} ${verse}`;
    })
    .filter(Boolean);
  if (format === "paragraph") {
    const first = verseNumbers[0];
    const last = verseNumbers[verseNumbers.length - 1];
    const ref = verseNumbers.length === 1 ? `${book.longName} ${state.chapter}:${first}` : `${book.longName} ${state.chapter}:${first}-${last}`;
    return `${ref} ${lines.join("")}`;
  }
  return lines.join("\n");
}

async function writeClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.left = "-9999px";
  document.body.append(area);
  area.select();
  document.execCommand("copy");
  area.remove();
}

function openVerseMenu(verseNo, x, y) {
  const mark = markForVerse(verseNo);
  state.activeVerse = Number(verseNo);
  verseMenuTitle.textContent = `${currentBook().longName} ${state.chapter}:${verseNo}`;
  verseMenu.querySelector('[data-menu-action="favorite"]').textContent = mark.favorite ? "取消收藏" : "收藏";
  verseMenu.querySelector('[data-menu-action="highlight"]').textContent = mark.highlighted ? "取消高亮" : "高亮";
  verseMenu.hidden = false;
  const rect = verseMenu.getBoundingClientRect();
  verseMenu.style.left = `${Math.max(10, Math.min(x, window.innerWidth - rect.width - 10))}px`;
  verseMenu.style.top = `${Math.max(10, Math.min(y, window.innerHeight - rect.height - 10))}px`;
}

function closeVerseMenu() {
  verseMenu.hidden = true;
}

function renderVerseSelectionState() {
  const selected = new Set(selectedVerseNumbers);
  content.querySelectorAll(".verse").forEach((verse) => {
    verse.classList.toggle("selectedVerse", selected.has(Number(verse.dataset.verse)));
  });
}

function updateManualSelectionBar() {
  if (!selectedVerseNumbers.length) {
    closeSelectionBar();
    return;
  }
  selectedVerseNumbers = [...new Set(selectedVerseNumbers)].sort((a, b) => a - b);
  const first = selectedVerseNumbers[0];
  const last = selectedVerseNumbers[selectedVerseNumbers.length - 1];
  selectionSummary.textContent =
    selectedVerseNumbers.length === 1
      ? `${currentBook().longName} ${state.chapter}:${first} · 点击经文继续选择`
      : `${currentBook().longName} ${state.chapter}:${first}-${last} · ${selectedVerseNumbers.length} 节`;
  selectionBar.hidden = false;
  renderVerseSelectionState();
}

function startVerseSelection(verseNo) {
  verseSelectionMode = true;
  selectedVerseNumbers = Number.isFinite(Number(verseNo)) ? [Number(verseNo)] : [];
  updateManualSelectionBar();
}

function toggleVerseSelection(verseNo) {
  if (!verseSelectionMode) return;
  const value = Number(verseNo);
  selectedVerseNumbers = selectedVerseNumbers.includes(value)
    ? selectedVerseNumbers.filter((item) => item !== value)
    : [...selectedVerseNumbers, value];
  updateManualSelectionBar();
}

function closeSelectionBar() {
  window.getSelection()?.removeAllRanges();
  selectionBar.hidden = true;
  selectedVerseNumbers = [];
  verseSelectionMode = false;
  renderVerseSelectionState();
}

async function copySelectedVerses() {
  if (!selectedVerseNumbers.length) return;
  await writeClipboard(formatVerseLines(selectedVerseNumbers, copyFormatSelect.value));
  showStatus("已复制所选经文", "success");
  closeSelectionBar();
}

async function runVerseAction(action, verseNo = state.activeVerse) {
  if (!verseNo) return;
  const mark = markForVerse(verseNo);
  closeVerseMenu();
  if (action === "select") {
    startVerseSelection(verseNo);
    return;
  }
  if (action === "favorite") {
    await saveVerseMark({ ...mark, favorite: !mark.favorite }, { successMessage: mark.favorite ? "已取消收藏" : "已收藏" });
    return;
  }
  if (action === "highlight") {
    await saveVerseMark({ ...mark, highlighted: !mark.highlighted }, { successMessage: mark.highlighted ? "已取消高亮" : "已高亮" });
    return;
  }
  if (action === "note") {
    const editor = content.querySelector(`[data-note-editor="${verseNo}"]`);
    if (editor) {
      editor.hidden = !editor.hidden;
      if (!editor.hidden) editor.querySelector("textarea")?.focus();
    }
    return;
  }
  if (action === "copy") {
    await writeClipboard(formatVerseLines([verseNo], "reference"));
    showStatus("已复制经文", "success");
    return;
  }
  if (action === "dictionary") {
    dictionaryInput.value = verseTextForNumber(verseNo).slice(0, 12);
    await searchDictionary(dictionaryInput.value);
    return;
  }
  if (action === "commentary") {
    commentaryContent.querySelectorAll(".commentaryEntry").forEach((entry) => {
      const from = Number(entry.dataset.from || 0);
      const to = Number(entry.dataset.to || from);
      entry.classList.toggle("activeCommentary", verseNo >= from && verseNo <= (to || from));
    });
    commentaryContent.scrollIntoView({ block: "start", behavior: "smooth" });
  }
}

async function setCurrentChapterRead(read) {
  if (progressSaving) {
    showStatus("正在保存阅读进度，请稍候");
    return;
  }
  progressSaving = true;
  mobileMarkReadBtn.textContent = "保存中";
  mobileMarkReadBtn.disabled = true;
  try {
    const data = await postJson("/api/user/progress", {
      version: state.version,
      book: state.book,
      chapter: state.chapter,
      read,
    });
    state.progress = data.progress;
    renderChrome();
    renderDashboard();
    renderChapterGrid();
    showStatus(read ? "已标记本章为已读" : "已取消已读", "success");
  } catch (error) {
    showStatus(error.message, "error");
  } finally {
    progressSaving = false;
    mobileMarkReadBtn.disabled = false;
    renderChrome();
  }
}

function findNextUnreadChapter() {
  for (const book of state.books) {
    const readSet = new Set((state.progress?.readChapters || []).filter((item) => item.book === book.id).map((item) => item.chapter));
    for (let chapter = 1; chapter <= book.chapterCount; chapter += 1) {
      if (!readSet.has(chapter) && !(book.id === state.book && chapter === state.chapter)) {
        return { book: book.id, chapter };
      }
    }
  }
  return null;
}

async function exportUserData() {
  if (exportBusy) return;
  exportBusy = true;
  exportDataBtn.textContent = "导出中";
  try {
    const data = await api("/api/user/export");
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bible-reader-data-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    userDataHint.textContent = "数据导出完成";
    showStatus("数据导出完成", "success");
  } catch (error) {
    userDataHint.textContent = error.message;
    showStatus(error.message, "error");
  } finally {
    exportBusy = false;
    exportDataBtn.textContent = "导出";
  }
}

async function importUserData(file) {
  if (importBusy) {
    showStatus("正在导入数据，请稍候");
    return;
  }
  importBusy = true;
  importDataBtn.textContent = "导入中";
  try {
    const payload = JSON.parse(await file.text());
    const result = await postJson("/api/user/import", payload);
    userDataHint.textContent = `已导入 ${result.imported} 条标注，${result.progressImported} 条进度`;
    showStatus("导入完成", "success");
    await loadChapter();
  } catch (error) {
    userDataHint.textContent = error.message;
    showStatus(error.message, "error");
  } finally {
    importBusy = false;
    importDataBtn.textContent = "导入";
    importDataFile.value = "";
  }
}

async function runDiagnostics() {
  diagnosticsHint.textContent = "检查中...";
  try {
    const data = await api("/api/diagnostics");
    diagnosticsHint.textContent = data.checks.map((item) => `${item.ok ? "✓" : "✗"} ${item.name}${item.detail ? `：${item.detail}` : ""}`).join("\n");
    showStatus(data.ok ? "本地数据正常" : "有数据目录缺失", data.ok ? "success" : "error");
  } catch (error) {
    diagnosticsHint.textContent = error.message;
  }
}

function handleBackIntent() {
  if (!verseMenu.hidden) {
    closeVerseMenu();
    return true;
  }
  if (!selectionBar.hidden) {
    closeSelectionBar();
    return true;
  }
  if (!bookPickerPanel.hidden || !readerSettingsPanel.hidden || !searchPanel.hidden || !strongPanel.hidden || !dictionaryPanel.hidden || !myPanel.hidden) {
    closeTopPanels();
    return true;
  }
  if (document.body.classList.contains("sidebarOpen")) {
    closeSidebar();
    return true;
  }
  return false;
}

function verseFromEvent(event) {
  return Number(event.target.closest("[data-verse]")?.dataset.verse || 0);
}

function startSwipeGesture(x, y, target) {
  if (target.closest("button, a, input, select, textarea, audio")) return;
  swipeState = { x, y, lastX: x, lastY: y };
}

function finishSwipeGesture(x, y) {
  if (!swipeState) return;
  const dx = x - swipeState.x;
  const dy = y - swipeState.y;
  swipeState = null;
  if (Math.abs(dx) >= 54 && Math.abs(dx) > Math.abs(dy) * 1.2) {
    if (!bookPickerPanel.hidden || !readerSettingsPanel.hidden || !searchPanel.hidden || document.body.classList.contains("sidebarOpen")) return;
    moveChapter(dx < 0 ? 1 : -1);
  }
}

async function init() {
  restoreState();
  applySettings();
  const [versions, commentaries, dictionaries, history] = await Promise.all([
    api("/api/versions"),
    api("/api/commentaries"),
    api("/api/dictionaries"),
    api("/api/user/history"),
  ]);
  state.versions = versions.versions;
  state.commentaries = commentaries.commentaries;
  state.dictionaries = dictionaries.dictionaries;
  if (!state.version || !state.versions.some((item) => item.id === state.version)) {
    state.version = state.versions.find((item) => item.id === "和合本.db")?.id || state.versions[0]?.id || "";
  }
  state.compareVersions = state.compareVersions.filter((id) => id !== state.version && state.versions.some((item) => item.id === id));
  if (!state.commentary && state.commentaries[0]) state.commentary = "";
  if (history.history && !localStorage.getItem(STORAGE_KEY)) {
    state.version = history.history.version;
    state.book = history.history.book;
    state.chapter = history.history.chapter;
  }
  renderVersions();
  renderCompareVersions();
  renderCommentaries();
  renderDictionaries();
  await loadBooks();
  await loadChapter({ scrollTop: true });
}

document.querySelector(".sidebarTabs").addEventListener("click", (event) => {
  const target = event.target.closest("[data-sidebar-target]");
  if (target) showSidebarPanel(target.dataset.sidebarTarget);
});

versionSelect.addEventListener("change", async () => {
  state.version = versionSelect.value;
  state.compareVersions = state.compareVersions.filter((id) => id !== state.version);
  renderCompareVersions();
  resetVerseInteraction();
  await loadBooks();
  await loadChapter({ scrollTop: true });
});

compareVersionsEl.addEventListener("change", (event) => {
  const input = event.target.closest("[data-compare]");
  if (!input) return;
  const id = input.dataset.compare;
  if (input.checked) {
    if (state.compareVersions.length >= 3) {
      input.checked = false;
      showStatus("最多对照 3 个译本");
      return;
    }
    state.compareVersions.push(id);
  } else {
    state.compareVersions = state.compareVersions.filter((item) => item !== id);
  }
  loadChapter();
});

commentarySelect.addEventListener("change", () => {
  state.commentary = commentarySelect.value;
  saveState();
  loadCommentary();
});

strongToggle.addEventListener("change", () => {
  state.showStrong = strongToggle.checked;
  saveState();
  loadChapter();
});

audioAutoNext.addEventListener("change", () => {
  state.audioAutoNext = audioAutoNext.checked;
  saveState();
});

dictionarySelect.addEventListener("change", () => {
  state.dictionary = dictionarySelect.value;
  saveState();
});

dictionaryBtn.addEventListener("click", () => searchDictionary());
dictionaryInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    searchDictionary();
  }
});

themeSelect.addEventListener("change", () => {
  state.theme = themeSelect.value;
  applySettings();
  saveState();
});
paletteSelect.addEventListener("change", () => {
  state.palette = paletteSelect.value;
  applySettings();
  saveState();
});
fontSizeRange.addEventListener("input", () => {
  state.fontSize = Number(fontSizeRange.value);
  applySettings();
  saveState();
});
lineHeightRange.addEventListener("input", () => {
  state.lineHeight = Number(lineHeightRange.value);
  applySettings();
  saveState();
});

menuBtn.addEventListener("click", () => openSidebar("reading"));
mobileMenuBtn.addEventListener("click", () => openSidebar("reading"));
closeSidebarBtn.addEventListener("click", closeSidebar);
overlay.addEventListener("click", () => handleBackIntent());
prevBtn.addEventListener("click", () => moveChapter(-1));
nextBtn.addEventListener("click", () => moveChapter(1));
mobilePrevBtn.addEventListener("click", () => moveChapter(-1));
mobileNextBtn.addEventListener("click", () => moveChapter(1));
mobileMarkReadBtn.addEventListener("click", () => setCurrentChapterRead(!isCurrentChapterRead()));
mobileMyBtn.addEventListener("click", () => openMyPanel("all"));

chapterTitleBtn.addEventListener("click", () => {
  const show = bookPickerPanel.hidden;
  closeTopPanels();
  bookPickerPanel.hidden = !show;
  if (show) {
    renderBookGrid();
    renderChapterGrid();
  }
});
closeBookPickerBtn.addEventListener("click", () => {
  bookPickerPanel.hidden = true;
});
readerSettingsBtn.addEventListener("click", () => {
  const show = readerSettingsPanel.hidden;
  closeTopPanels();
  readerSettingsPanel.hidden = !show;
});
closeReaderSettingsBtn.addEventListener("click", () => {
  readerSettingsPanel.hidden = true;
});

bookSearchInput.addEventListener("input", renderBookGrid);
bookFilterTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-book-filter]");
  if (!button) return;
  bookFilter = button.dataset.bookFilter;
  bookFilterTabs.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
  renderBookGrid();
});
bookGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-book]");
  if (!button) return;
  state.book = Number(button.dataset.book);
  state.chapter = 1;
  rememberCurrentBook();
  renderBookGrid();
  renderChapterGrid();
});
chapterGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-chapter]");
  if (!button || chapterLoading) return;
  state.chapter = Number(button.dataset.chapter);
  rememberCurrentBook();
  resetVerseInteraction();
  bookPickerPanel.hidden = true;
  closeSidebar();
  loadChapter({ scrollTop: true });
});

quickForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = quickInput.value.trim();
  if (!query) return;
  const ref = parseReference(query);
  if (ref) {
    await jumpToReference(ref);
    return;
  }
  await runSearch(query);
});

closeSearchBtn.addEventListener("click", () => {
  searchRequestToken += 1;
  searchPanel.hidden = true;
});
closeStrongBtn.addEventListener("click", () => {
  strongRequestToken += 1;
  strongPanel.hidden = true;
});
closeDictionaryBtn.addEventListener("click", () => {
  dictionaryRequestToken += 1;
  dictionaryPanel.hidden = true;
});
closeMyPanelBtn.addEventListener("click", () => {
  myPanelRequestToken += 1;
  myPanel.hidden = true;
  myPanelLoading = false;
});

searchResults.addEventListener("click", async (event) => {
  if (event.target.closest("[data-search-more]")) {
    await runSearch(searchState.query, { append: true });
    return;
  }
  const button = event.target.closest("[data-jump-book]");
  if (!button) return;
  await jumpToReference({
    book: Number(button.dataset.jumpBook),
    chapter: Number(button.dataset.jumpChapter),
    verse: Number(button.dataset.jumpVerse),
  });
});

document.body.addEventListener("click", async (event) => {
  const jumpVerse = event.target.closest("[data-jump-verse]:not([data-jump-book])");
  if (jumpVerse) {
    state.targetVerse = Number(jumpVerse.dataset.jumpVerse);
    focusTargetVerse();
    return;
  }
  const jump = event.target.closest("[data-jump-book]");
  if (jump && !searchResults.contains(jump) && !myResults.contains(jump) && !strongContent.contains(jump)) {
    await jumpToReference({
      book: Number(jump.dataset.jumpBook),
      chapter: Number(jump.dataset.jumpChapter),
      verse: Number(jump.dataset.jumpVerse),
    });
    return;
  }
  const strong = event.target.closest("[data-strong]");
  if (strong) {
    await openStrong(strong.dataset.strong);
    return;
  }
  const saveNote = event.target.closest("[data-save-note]");
  if (saveNote) {
    const verse = Number(saveNote.dataset.saveNote);
    const mark = markForVerse(verse);
    const note = content.querySelector(`[data-note-text="${verse}"]`)?.value || "";
    const tags = content.querySelector(`[data-note-tags="${verse}"]`)?.value || "";
    saveNote.textContent = "保存中";
    await saveVerseMark({ ...mark, note, tags }, { successMessage: "已保存笔记" });
    saveNote.textContent = "已保存";
    setTimeout(() => {
      saveNote.textContent = "保存笔记";
    }, 1000);
    return;
  }
  const retry = event.target.closest("[data-retry-chapter]");
  if (retry) {
    loadChapter({ scrollTop: true });
    return;
  }
  const dash = event.target.closest("[data-dash]");
  if (dash) {
    if (dash.dataset.dash === "picker") {
      closeTopPanels();
      bookPickerPanel.hidden = false;
    } else if (dash.dataset.dash === "unread") {
      const next = findNextUnreadChapter();
      if (!next) showStatus("已经读完所有章节");
      else await jumpToReference(next);
    } else if (dash.dataset.dash === "mark") {
      await setCurrentChapterRead(!isCurrentChapterRead());
    }
    return;
  }
  const myFilter = event.target.closest("[data-my-filter]");
  if (myFilter) {
    openMyPanel(myFilter.dataset.myFilter);
    return;
  }
  if (verseSelectionMode) {
    const verseNo = verseFromEvent(event);
    if (verseNo) toggleVerseSelection(verseNo);
  }
});

myResults.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-jump-book]");
  if (!button) return;
  await jumpToReference({
    book: Number(button.dataset.jumpBook),
    chapter: Number(button.dataset.jumpChapter),
    verse: Number(button.dataset.jumpVerse),
  });
});

strongContent.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-jump-book]");
  if (!button) return;
  await jumpToReference({
    book: Number(button.dataset.jumpBook),
    chapter: Number(button.dataset.jumpChapter),
    verse: Number(button.dataset.jumpVerse),
  });
});

content.addEventListener("contextmenu", (event) => {
  const verseNo = verseFromEvent(event);
  if (!verseNo) return;
  event.preventDefault();
  openVerseMenu(verseNo, event.clientX, event.clientY);
});

content.addEventListener("pointerdown", (event) => {
  const verseNo = verseFromEvent(event);
  startSwipeGesture(event.clientX, event.clientY, event.target);
  if (!verseNo || event.pointerType === "mouse") return;
  longPressTimer = setTimeout(() => openVerseMenu(verseNo, event.clientX, event.clientY), 420);
});
content.addEventListener("pointermove", (event) => {
  if (!swipeState) return;
  swipeState.lastX = event.clientX;
  swipeState.lastY = event.clientY;
  if (Math.hypot(event.clientX - swipeState.x, event.clientY - swipeState.y) > 12) {
    clearTimeout(longPressTimer);
  }
});
content.addEventListener("pointerup", (event) => {
  clearTimeout(longPressTimer);
  finishSwipeGesture(event.clientX, event.clientY);
});
content.addEventListener("pointercancel", () => {
  clearTimeout(longPressTimer);
  if (swipeState) finishSwipeGesture(swipeState.lastX, swipeState.lastY);
});

verseMenu.addEventListener("click", (event) => {
  const button = event.target.closest("[data-menu-action]");
  if (button) runVerseAction(button.dataset.menuAction);
});
copySelectionBtn.addEventListener("click", copySelectedVerses);
cancelSelectionBtn.addEventListener("click", closeSelectionBar);

exportDataBtn.addEventListener("click", exportUserData);
importDataBtn.addEventListener("click", () => importDataFile.click());
importDataFile.addEventListener("change", () => {
  if (importDataFile.files[0]) importUserData(importDataFile.files[0]);
});
diagnosticsBtn.addEventListener("click", runDiagnostics);

document.addEventListener("keydown", (event) => {
  if (event.target.matches("input, textarea, select")) return;
  if (event.key === "Escape") {
    handleBackIntent();
    return;
  }
  if (event.key === "ArrowLeft") moveChapter(-1);
  if (event.key === "ArrowRight") moveChapter(1);
  if (event.key === "/" && !event.ctrlKey) {
    event.preventDefault();
    quickInput.focus();
  }
});

window.addEventListener("scroll", () => {
  const current = window.scrollY;
  document.body.classList.toggle("hideChrome", current > lastScrollY + 12 && current > 80);
  lastScrollY = current;
}, { passive: true });

init().catch((error) => {
  content.innerHTML = `<div class="error">启动失败：${escapeHtml(error.message)}</div>`;
});
