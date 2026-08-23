const STORAGE_KEY = "bibleReaderState.v1";
const APP_VERSION = "1.28.0";
const SEARCH_RECENTS_KEY = "bibleReaderSearches.v1";
const MEMORY_KEY = "bibleReaderAgentMemory.v1";
const HIGHLIGHT_COLORS = ["gold", "green", "blue", "rose"];
const GITHUB_REPO = "cuizihao1992/local-bible-reader-offline";
const GITHUB_RELEASE_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

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
  theme: "auto",
  palette: "classic",
  fontSize: 20,
  lineHeight: 2.05,
  readFont: "serif",
  pageMargin: 22,
  copyFormat: "reference",
  ttsRate: 1,
  keepScreenOn: false,
  fuzzySearch: false,
  mimoKey: "",
  mimoKeyType: "codeplan",
  mimoBaseUrl: "https://token-plan-cn.xiaomimimo.com/v1",
  mimoStandardKey: "",
  mimoCodeplanKey: "",
  smartVoice: false,
  aiProvider: "mimo",
  aiModel: "mimo-v2.5",
  aiCustomModel: "",
  aiKeys: {},
  aiBaseUrls: {},
  book: 1,
  chapter: 1,
  targetVerse: null,
  activeVerse: null,
  lastVerse: null,
  recentBooks: [],
  recentSearches: [],
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
const dictionarySheetSelect = $("#dictionarySheetSelect");
const dictionarySheetInput = $("#dictionarySheetInput");
const dictionarySheetBtn = $("#dictionarySheetBtn");
const dictionarySheetForm = $("#dictionarySheetForm");
const openDictionarySheetBtn = $("#openDictionarySheetBtn");
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
const fuzzySearchToggle = $("#fuzzySearchToggle");
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
const bookPickerTitle = $("#bookPickerTitle");
const bookPickerCurrent = $("#bookPickerCurrent");
const closeBookPickerBtn = $("#closeBookPickerBtn");
const backToBooksBtn = $("#backToBooksBtn");
const enterBookBtn = $("#enterBookBtn");
const backToChaptersBtn = $("#backToChaptersBtn");
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
const audioFileList = $("#audioFileList");
const ttsStatus = $("#ttsStatus");
const ttsPlayBtn = $("#ttsPlayBtn");
const ttsStopBtn = $("#ttsStopBtn");
const closeAudioBtn = $("#closeAudioBtn");
const audioAutoNextSheet = $("#audioAutoNextSheet");
const dictionaryPanel = $("#dictionaryPanel");
const dictionarySummary = $("#dictionarySummary");
const dictionaryResults = $("#dictionaryResults");
const closeDictionaryBtn = $("#closeDictionaryBtn");
const statusPanel = $("#statusPanel");
const myPanel = $("#myPanel");
const myResults = $("#myResults");
const myAgentNotesEl = $("#myAgentNotes");
const myTagFilter = $("#myTagFilter");
const closeMyPanelBtn = $("#closeMyPanelBtn");
const content = $("#content");
const verseMenu = $("#verseMenu");
const verseMenuTitle = $("#verseMenuTitle");
const selectionBar = $("#selectionBar");
const selectionSummary = $("#selectionSummary");
const cancelSelectionBtn = $("#cancelSelectionBtn");
const mobileSearchBtn = $("#mobileSearchBtn");
const mobileMenuBtn = $("#mobileMenuBtn");
const mobileAiBtn = $("#mobileAiBtn");
const mobileMyBtn = $("#mobileMyBtn");
const searchToggleBtn = $("#searchToggleBtn");
const versionChipBtn = $("#versionChipBtn");
const versionPickerPanel = $("#versionPickerPanel");
const versionPickerList = $("#versionPickerList");
const closeVersionPickerBtn = $("#closeVersionPickerBtn");
const inlineCompareList = $("#inlineCompareList");
const confirmSheet = $("#confirmSheet");
const confirmSheetHint = $("#confirmSheetHint");
const confirmSheetChoices = $("#confirmSheetChoices");
const closeConfirmSheetBtn = $("#closeConfirmSheetBtn");
const compareSheet = $("#compareSheet");
const compareSheetTitle = $("#compareSheetTitle");
const compareSheetContent = $("#compareSheetContent");
const closeCompareSheetBtn = $("#closeCompareSheetBtn");
const myProgressCard = $("#myProgressCard");
const checkUpdateBtn = $("#checkUpdateBtn");
const downloadUpdateBtn = $("#downloadUpdateBtn");
const clearDownloadsBtn = $("#clearDownloadsBtn");
const updateStatus = $("#updateStatus");
const updateNetworkHint = $("#updateNetworkHint");
const updateProgress = $("#updateProgress");
const updateProgressText = $("#updateProgressText");
const updateProgressBar = $("#updateProgressBar");
const updateProgressValue = $("#updateProgressValue");
const keepScreenOnToggle = $("#keepScreenOnToggle");
const readFontSelect = $("#readFontSelect");
const pageMarginRange = $("#pageMarginRange");
const pageMarginValue = $("#pageMarginValue");
const copyFormatSelect = $("#copyFormatSelect");
const strongToggleReader = $("#strongToggleReader");
const ttsRateSelect = $("#ttsRateSelect");
const verseMenuMore = $("#verseMenuMore");
const verseMenuMoreBtn = $("#verseMenuMoreBtn");
const peekBar = $("#peekBar");
const peekBackBtn = $("#peekBackBtn");
const peekCloseBtn = $("#peekCloseBtn");
const shareThemeRow = $("#shareThemeRow");
const verseStepPanel = $("#verseStepPanel");
const verseGrid = $("#verseGrid");
const versePanelTitle = $("#versePanelTitle");
const versePanelMeta = $("#versePanelMeta");
const readChapterStartBtn = $("#readChapterStartBtn");
const commentarySheet = $("#commentarySheet");
const commentarySheetTitle = $("#commentarySheetTitle");
const commentarySheetContent = $("#commentarySheetContent");
const closeCommentarySheetBtn = $("#closeCommentarySheetBtn");
const shareSheet = $("#shareSheet");
const shareCanvas = $("#shareCanvas");
const closeShareSheetBtn = $("#closeShareSheetBtn");
const shareImageBtn = $("#shareImageBtn");
const saveShareBtn = $("#saveShareBtn");
const highlightColors = $("#highlightColors");
const verseHighlightColors = $("#verseHighlightColors");
const packageList = $("#packageList");
const packageHint = $("#packageHint");
const packageProgress = $("#packageProgress");
const packageProgressText = $("#packageProgressText");
const packageProgressBar = $("#packageProgressBar");
const packageProgressValue = $("#packageProgressValue");
const speakToggleBtn = $("#speakToggleBtn");
const recentSearchesEl = $("#recentSearches");
const compareSourceList = $("#compareSourceList");
const commentarySourceList = $("#commentarySourceList");
const noteSheet = $("#noteSheet");
const noteSheetTitle = $("#noteSheetTitle");
const noteSheetText = $("#noteSheetText");
const noteSheetTags = $("#noteSheetTags");
const closeNoteSheetBtn = $("#closeNoteSheetBtn");
const saveNoteSheetBtn = $("#saveNoteSheetBtn");
const overlay = $("#overlay");
const voiceBtn = $("#voiceBtn");
const voiceBtnDesktop = $("#voiceBtnDesktop");
const aiProviderSelect = $("#aiProviderSelect");
const aiModelSelect = $("#aiModelSelect");
const aiCustomModelField = $("#aiCustomModelField");
const aiCustomModelInput = $("#aiCustomModelInput");
const aiKeyInput = $("#aiKeyInput");
const aiKeyLabel = $("#aiKeyLabel");
const mimoKeyTypeField = $("#mimoKeyTypeField");
const mimoKeyTypeSelect = $("#mimoKeyTypeSelect");
const aiBaseUrlField = $("#aiBaseUrlField");
const aiBaseUrlLabel = $("#aiBaseUrlLabel");
const aiBaseUrlInput = $("#aiBaseUrlInput");
const mimoAsrKeyField = $("#mimoAsrKeyField");
const mimoAsrKeyInput = $("#mimoAsrKeyInput");
const smartVoiceToggle = $("#smartVoiceToggle");
const studySearchBtn = $("#studySearchBtn");
const aiSheet = $("#aiSheet");
const aiSheetTitle = $("#aiSheetTitle");
const aiSheetContent = $("#aiSheetContent");
const aiNoteList = $("#aiNoteList");
const aiMemoryBar = $("#aiMemoryBar");
const saveAiNoteBtn = $("#saveAiNoteBtn");
const newAiChatBtn = $("#newAiChatBtn");
const toggleAiNotesBtn = $("#toggleAiNotesBtn");
const aiNotePeek = $("#aiNotePeek");
const insertNoteRefBtn = $("#insertNoteRefBtn");
const aiAskForm = $("#aiAskForm");
const aiAskInput = $("#aiAskInput");
const closeAiSheetBtn = $("#closeAiSheetBtn");
const clearAiMemoryBtn = $("#clearAiMemoryBtn");
const aiActionRow = $("#aiActionRow");
const readerEl = document.querySelector("main.reader");
const prevEdge = $("#prevEdge");
const nextEdge = $("#nextEdge");
let noteSheetVerse = null;
let speaking = false;
let chapterLongPress = false;
let voiceInputActive = false;
let voiceStopPending = false;
let browserRecorder = null;
let browserStream = null;
let browserAudio = null;

let bookFilter = "all";
let bookPickerStep = "books";
let bookLongPress = false;
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
let justSwiped = false;
let statusTimer = null;
let lastUpdateInfo = null;
let pendingConfirm = null;
let peekState = null;
let lastShareVerses = [];
let shareTheme = "light";
let scrollSaveTimer = null;
let updateCheckBusy = false;
let apkDownloadBusy = false;
let apkPollTimer = null;
let chromePinnedUntil = 0;
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

function mimoDefaults() {
  return window.BIBLE_AI_DEFAULTS && typeof window.BIBLE_AI_DEFAULTS === "object" ? window.BIBLE_AI_DEFAULTS : {};
}

function defaultMimoStandardKey() {
  return String(mimoDefaults().mimoStandardKey || "").trim();
}

function defaultMimoCodeplanKey() {
  return String(mimoDefaults().mimoCodeplanKey || "").trim();
}

function defaultMimoCodeplanUrl() {
  return String(mimoDefaults().mimoCodeplanUrl || "https://token-plan-cn.xiaomimimo.com/v1").trim();
}

function applyBuiltInMimoKeys(hadSavedKey) {
  if (!state.mimoStandardKey) state.mimoStandardKey = defaultMimoStandardKey();
  if (!state.mimoCodeplanKey) state.mimoCodeplanKey = defaultMimoCodeplanKey();
  if (hadSavedKey) {
    if (isCodePlanKey(state.mimoKey)) state.mimoCodeplanKey = state.mimoKey;
    else if (state.mimoKey) state.mimoStandardKey = state.mimoKey;
    return;
  }
  state.aiProvider = "mimo";
  state.mimoKeyType = "codeplan";
  state.mimoKey = state.mimoCodeplanKey || defaultMimoCodeplanKey() || state.mimoStandardKey;
  state.mimoBaseUrl = defaultMimoCodeplanUrl();
  state.aiKeys = { ...(state.aiKeys || {}), mimo: state.mimoKey };
  state.aiBaseUrls = { ...(state.aiBaseUrls || {}), mimo: state.mimoBaseUrl };
}

function restoreState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const hadSavedKey = !!(saved.mimoKey || (saved.aiKeys && saved.aiKeys.mimo));
    Object.assign(state, {
      version: saved.version || "",
      compareVersions: Array.isArray(saved.compareVersions) ? saved.compareVersions.slice(0, 3) : [],
      commentary: saved.commentary || "",
      dictionary: saved.dictionary || "",
      showStrong: !!saved.showStrong,
      audioAutoNext: !!saved.audioAutoNext,
      theme: saved.theme === "dark" || saved.theme === "light" || saved.theme === "auto" ? saved.theme : "auto",
      palette: saved.palette || "classic",
      fontSize: Number(saved.fontSize) || 20,
      lineHeight: Number(saved.lineHeight) || 2.05,
      readFont: saved.readFont === "sans" ? "sans" : "serif",
      pageMargin: Number(saved.pageMargin) || 22,
      copyFormat: saved.copyFormat === "plain" || saved.copyFormat === "numbered" ? saved.copyFormat : "reference",
      ttsRate: [0.8, 1, 1.25, 1.5].includes(Number(saved.ttsRate)) ? Number(saved.ttsRate) : 1,
      keepScreenOn: !!saved.keepScreenOn,
      fuzzySearch: !!saved.fuzzySearch,
      mimoKey: saved.mimoKey || (saved.aiKeys && saved.aiKeys.mimo) || "",
      mimoKeyType: saved.mimoKeyType === "codeplan" || String(saved.mimoKey || "").trim().toLowerCase().startsWith("tp-") ? "codeplan" : "standard",
      mimoBaseUrl: saved.mimoBaseUrl || (saved.aiBaseUrls && saved.aiBaseUrls.mimo) || "https://token-plan-cn.xiaomimimo.com/v1",
      mimoStandardKey: saved.mimoStandardKey || "",
      mimoCodeplanKey: saved.mimoCodeplanKey || "",
      smartVoice: !!saved.smartVoice,
      aiProvider: AI_PROVIDERS.some((item) => item.id === saved.aiProvider) ? saved.aiProvider : "mimo",
      aiModel: saved.aiModel || "mimo-v2.5",
      aiCustomModel: saved.aiCustomModel || "",
      aiKeys: saved.aiKeys && typeof saved.aiKeys === "object" ? { ...saved.aiKeys } : {},
      aiBaseUrls: saved.aiBaseUrls && typeof saved.aiBaseUrls === "object" ? { ...saved.aiBaseUrls } : {},
      book: Number(saved.book) || 1,
      chapter: Number(saved.chapter) || 1,
      lastVerse: Number(saved.lastVerse) || null,
      recentBooks: Array.isArray(saved.recentBooks) ? saved.recentBooks.slice(0, 8) : [],
      recentSearches: Array.isArray(saved.recentSearches) ? saved.recentSearches.slice(0, 8) : [],
    });
    state.aiKeys = { ...(state.aiKeys || {}), mimo: state.mimoKey };
    state.aiBaseUrls = { ...(state.aiBaseUrls || {}), mimo: state.mimoBaseUrl };
    applyBuiltInMimoKeys(hadSavedKey);
  } catch {
    applyBuiltInMimoKeys(false);
  }
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
      readFont: state.readFont,
      pageMargin: state.pageMargin,
      copyFormat: state.copyFormat,
      ttsRate: state.ttsRate,
      keepScreenOn: state.keepScreenOn,
      fuzzySearch: !!state.fuzzySearch,
      mimoKey: state.mimoKey,
      mimoKeyType: state.mimoKeyType,
      mimoBaseUrl: state.mimoBaseUrl,
      mimoStandardKey: state.mimoStandardKey || "",
      mimoCodeplanKey: state.mimoCodeplanKey || "",
      smartVoice: !!state.smartVoice,
      aiProvider: state.aiProvider || "mimo",
      aiModel: state.aiModel || "mimo-v2.5",
      aiCustomModel: state.aiCustomModel || "",
      aiKeys: { ...(state.aiKeys || {}), mimo: state.mimoKey },
      aiBaseUrls: { ...(state.aiBaseUrls || {}), mimo: state.mimoBaseUrl },
      book: state.book,
      chapter: state.chapter,
      lastVerse: state.lastVerse,
      recentBooks: state.recentBooks,
      recentSearches: state.recentSearches,
    }),
  );
}

function resolvedTheme() {
  if (state.theme === "auto") {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return state.theme === "dark" ? "dark" : "light";
}

function applySettings() {
  const night = resolvedTheme() === "dark";
  document.body.classList.toggle("darkTheme", night);
  document.body.dataset.palette = state.palette === "classic" ? "" : state.palette;
  if (!document.body.dataset.palette) delete document.body.dataset.palette;
  document.documentElement.style.setProperty("--reader-font-size", `${state.fontSize}px`);
  document.documentElement.style.setProperty("--reader-line-height", String(state.lineHeight));
  document.documentElement.style.setProperty("--reader-pad", `${state.pageMargin}px`);
  document.body.dataset.readFont = state.readFont === "sans" ? "sans" : "serif";
  const themeColor = night ? "#1b1815" : "#3d6b5c";
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.setAttribute("content", themeColor);
  if (window.AndroidBibleApi && window.AndroidBibleApi.setNightMode) {
    window.AndroidBibleApi.setNightMode(night);
  }
  themeSelect.value = state.theme;
  paletteSelect.value = state.palette;
  fontSizeRange.value = String(state.fontSize);
  lineHeightRange.value = String(state.lineHeight);
  fontSizeValue.textContent = `${state.fontSize}px`;
  lineHeightValue.textContent = Number(state.lineHeight).toFixed(2);
  if (pageMarginValue) pageMarginValue.textContent = String(state.pageMargin);
  if (pageMarginRange) pageMarginRange.value = String(state.pageMargin);
  if (readFontSelect) readFontSelect.value = state.readFont === "sans" ? "sans" : "serif";
  if (copyFormatSelect) copyFormatSelect.value = state.copyFormat;
  if (ttsRateSelect) ttsRateSelect.value = String(state.ttsRate);
  if (strongToggle) strongToggle.checked = state.showStrong;
  if (strongToggleReader) strongToggleReader.checked = state.showStrong;
  if (audioAutoNext) audioAutoNext.checked = state.audioAutoNext;
  if (audioAutoNextSheet) audioAutoNextSheet.checked = state.audioAutoNext;
  if (keepScreenOnToggle) keepScreenOnToggle.checked = state.keepScreenOn;
  if (fuzzySearchToggle) fuzzySearchToggle.checked = !!state.fuzzySearch;
  if (window.AndroidBibleApi && window.AndroidBibleApi.setKeepScreenOn) {
    window.AndroidBibleApi.setKeepScreenOn(!!state.keepScreenOn);
  }
  syncAiSettingsFields();
}

function showStatus(message, tone = "info", holdMs = 0) {
  statusPanel.hidden = false;
  statusPanel.className = `statusPanel ${tone}`;
  statusPanel.textContent = message;
  clearTimeout(statusTimer);
  const wait = holdMs || (tone === "success" ? 3600 : tone === "error" ? 3800 : 2600);
  statusTimer = setTimeout(() => {
    statusPanel.hidden = true;
  }, wait);
}

function closeSidebar() {
  document.body.classList.remove("sidebarOpen");
}

function openSidebar(tab) {
  document.body.classList.add("sidebarOpen");
  closeTopPanels(false);
  if (tab) setSidebarTab(tab);
}

function setSidebarTab(name) {
  const tab = name === "dictionary" || name === "system" ? name : "assistant";
  document.querySelectorAll("[data-sidebar-tab]").forEach((button) => {
    const on = button.dataset.sidebarTab === tab;
    button.classList.toggle("active", on);
    button.setAttribute("aria-selected", on ? "true" : "false");
  });
  document.querySelectorAll("[data-sidebar-section]").forEach((section) => {
    section.classList.toggle("active", section.dataset.sidebarSection === tab);
  });
}

function setMyTab(name) {
  const tab = name === "resources" || name === "updates" ? name : "marks";
  document.querySelectorAll("[data-my-tab]").forEach((button) => {
    const on = button.dataset.myTab === tab;
    button.classList.toggle("active", on);
    button.setAttribute("aria-selected", on ? "true" : "false");
  });
  document.querySelectorAll("[data-my-pane]").forEach((pane) => {
    pane.hidden = pane.dataset.myPane !== tab;
  });
}

function keepReadingChromeVisible(ms = 1600) {
  chromePinnedUntil = Date.now() + ms;
  document.body.classList.remove("chromeHidden");
}

function closeContentPanels() {
  searchPanel.hidden = true;
  strongPanel.hidden = true;
  dictionaryPanel.hidden = true;
  myPanel.hidden = true;
  if (compareSheet) compareSheet.hidden = true;
  if (commentarySheet) commentarySheet.hidden = true;
  if (shareSheet) shareSheet.hidden = true;
  if (noteSheet) noteSheet.hidden = true;
  if (aiSheet) aiSheet.hidden = true;
  if (confirmSheet) confirmSheet.hidden = true;
  if (audioPanel) audioPanel.hidden = true;
  if (highlightColors) highlightColors.hidden = true;
  closeVerseMenu();
  closeSelectionBar();
  setNav(null);
}

function syncSheetOverlay() {
  const open = [...document.querySelectorAll(".sheetPanel, .readerSettingsPanel")].some((el) => el && !el.hidden);
  document.body.classList.toggle("sheetOpen", open);
}

function closeTopPanels(includeSettings = true) {
  bookPickerPanel.hidden = true;
  if (versionPickerPanel) versionPickerPanel.hidden = true;
  if (includeSettings) readerSettingsPanel.hidden = true;
  closeContentPanels();
  syncSheetOverlay();
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
  versionTitle.textContent = version ? version.shortName || version.name : "译本";
  prevBtn.disabled = chapterLoading || atFirstChapter();
  nextBtn.disabled = chapterLoading || atLastChapter();
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
  if (versionPickerList) {
    versionPickerList.innerHTML = state.versions
      .map((version) => {
        const titles = version.titleCount > 0 ? "有小标题" : "";
        return `<button type="button" class="versionPickBtn ${version.id === state.version ? "active" : ""}" data-pick-version="${escapeHtml(version.id)}">
          <span>${escapeHtml(version.name)}</span>
          <span class="panelHint">${escapeHtml(version.shortName || "")}${titles ? ` · ${titles}` : ""}</span>
        </button>`;
      })
      .join("");
  }
}

function renderCompareVersions() {
  const html = state.versions
    .filter((version) => version.id !== state.version)
    .map((version) => {
      const checked = state.compareVersions.includes(version.id) ? "checked" : "";
      const active = state.compareVersions.includes(version.id) ? "active" : "";
      return {
        box: `<label><input type="checkbox" data-compare="${escapeHtml(version.id)}" ${checked} /> ${escapeHtml(version.shortName || version.name)}</label>`,
        chip: `<button type="button" class="${active}" data-toggle-compare="${escapeHtml(version.id)}">${escapeHtml(version.shortName || version.name)}</button>`,
      };
    });
  if (compareVersionsEl) compareVersionsEl.innerHTML = html.map((item) => item.box).join("");
  if (inlineCompareList) inlineCompareList.innerHTML = html.map((item) => item.chip).join("") || `<div class="panelHint">没有可对照的译本</div>`;
}

function rememberReadingPosition(verse = state.activeVerse || state.targetVerse) {
  const n = Number(verse);
  if (Number.isFinite(n) && n >= 1) state.lastVerse = n;
  saveState();
}

function visibleVerseNumber() {
  const verses = [...content.querySelectorAll(".verse[data-verse]")];
  if (!verses.length) return null;
  const top = (document.querySelector(".topbar")?.getBoundingClientRect().bottom || 0) + 28;
  let current = Number(verses[0].dataset.verse);
  for (const el of verses) {
    if (el.getBoundingClientRect().top <= top) current = Number(el.dataset.verse);
  }
  return current;
}

let lastScrollY = window.scrollY || 0;

function onReaderScroll() {
  const y = window.scrollY || 0;
  if (!chapterLoading && !jumpBusy && Date.now() >= chromePinnedUntil && !hasBlockingOverlayOpen()) {
    if (y > lastScrollY + 10 && y > 48) document.body.classList.add("chromeHidden");
    else if (y < lastScrollY - 10) document.body.classList.remove("chromeHidden");
  }
  lastScrollY = y;
  if (chapterLoading || jumpBusy || !content.querySelector(".verse")) return;
  const verse = visibleVerseNumber();
  if (!verse) return;
  state.lastVerse = verse;
  clearTimeout(scrollSaveTimer);
  scrollSaveTimer = setTimeout(saveState, 400);
}

function renderCommentaries() {
  commentarySelect.innerHTML = `<option value="">不显示注释</option>` +
    state.commentaries
      .map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === state.commentary ? "selected" : ""}>${escapeHtml(item.title)}${item.readable ? "" : "（可能加密）"}</option>`)
      .join("");
}

function renderDictionaries() {
  const html = state.dictionaries
    .map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === state.dictionary ? "selected" : ""}>${escapeHtml(item.title)}</option>`)
    .join("");
  if (dictionarySelect) dictionarySelect.innerHTML = html;
  if (dictionarySheetSelect) dictionarySheetSelect.innerHTML = html;
  if (!state.dictionary && state.dictionaries[0]) state.dictionary = state.dictionaries[0].id;
  if (state.dictionary) {
    if (dictionarySelect) dictionarySelect.value = state.dictionary;
    if (dictionarySheetSelect) dictionarySheetSelect.value = state.dictionary;
  }
}

function setDictionarySource(id) {
  if (!id) return;
  state.dictionary = id;
  if (dictionarySelect && dictionarySelect.value !== id) dictionarySelect.value = id;
  if (dictionarySheetSelect && dictionarySheetSelect.value !== id) dictionarySheetSelect.value = id;
  saveState();
}

function setDictionaryQuery(query) {
  const value = String(query || "");
  if (dictionaryInput) dictionaryInput.value = value;
  if (dictionarySheetInput) dictionarySheetInput.value = value;
}

function openDictionarySheet() {
  closeTopPanels();
  closeSidebar();
  dictionaryPanel.hidden = false;
  dictionarySheetInput?.focus();
}

function rememberCurrentBook() {
  state.recentBooks = [state.book, ...state.recentBooks.filter((id) => id !== state.book)].slice(0, 8);
}

function bookSpeechNames(book) {
  const spoken = typeof SpokenBooks !== "undefined" && SpokenBooks.namesForBook
    ? SpokenBooks.namesForBook(book.longName)
    : [book.longName];
  return [book.shortName, book.longName, ...spoken];
}

function bookMatchesFilter(book) {
  const query = bookSearchInput.value.trim();
  if (query && !bookSpeechNames(book).some((name) => String(name).includes(query))) return false;
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
  chapterPanelMeta.textContent = `${book.chapterCount} 章 · 点章即读 · 长按选节`;
  if (bookPickerTitle) {
    bookPickerTitle.textContent = bookPickerStep === "books" ? "选择书卷" : bookPickerStep === "chapters" ? "选择章节" : "选择经节";
  }
  bookPickerCurrent.textContent =
    bookPickerStep === "books"
      ? "点书卷即读 · 长按选章"
      : `${book.longName} · ${versionLabel(state.version)}`;
  chapterGrid.innerHTML = Array.from({ length: book.chapterCount }, (_, index) => {
    const chapter = index + 1;
    const classes = [chapter === state.chapter ? "active" : "", readSet.has(chapter) ? "read" : ""].filter(Boolean).join(" ");
    return `<button type="button" class="${classes}" data-chapter="${chapter}" ${chapterLoading ? "disabled" : ""}>${chapter}</button>`;
  }).join("");
}

function setBookPickerStep(step) {
  bookPickerStep = step || "books";
  if (bookPickerPanel) bookPickerPanel.dataset.step = bookPickerStep;
  if (verseStepPanel) verseStepPanel.hidden = bookPickerStep !== "verses";
  if (bookPickerTitle) {
    bookPickerTitle.textContent = bookPickerStep === "books" ? "选择书卷" : bookPickerStep === "chapters" ? "选择章节" : "选择经节";
  }
}

function openChapterStep(bookId) {
  const nextId = Number(bookId);
  if (state.book !== nextId) state.chapter = 1;
  state.book = nextId;
  rememberCurrentBook();
  setBookPickerStep("chapters");
  renderBookGrid();
  renderChapterGrid();
}

async function openVerseStep(chapter) {
  const book = currentBook();
  state.chapter = chapter;
  rememberCurrentBook();
  setBookPickerStep("verses");
  renderChapterGrid();
  if (verseStepPanel) verseStepPanel.hidden = false;
  if (versePanelTitle) versePanelTitle.textContent = `${book.longName} ${chapter} 章`;
  if (versePanelMeta) versePanelMeta.textContent = "选择一节，或从第 1 节读";
  if (verseGrid) verseGrid.innerHTML = `<div class="panelHint">正在读取节数...</div>`;
  try {
    const data = await api(`/api/chapter?version=${encodeURIComponent(state.version)}&book=${state.book}&chapter=${chapter}`);
    const verses = data.verses || [];
    if (versePanelMeta) versePanelMeta.textContent = `共 ${verses.length} 节`;
    if (verseGrid) {
      verseGrid.innerHTML = verses
        .map((item) => `<button type="button" data-pick-verse="${item.verse}">${item.verse}</button>`)
        .join("");
    }
    setBookPickerStep("verses");
  } catch (error) {
    if (verseGrid) verseGrid.innerHTML = `<div class="error">${escapeHtml(error.message)}</div>`;
  }
}

async function jumpFromPicker(verse = null) {
  resetVerseInteraction(verse);
  bookPickerPanel.hidden = true;
  closeSidebar();
  keepReadingChromeVisible();
  await loadChapter({ scrollTop: !verse });
}

function renderMyProgress() {
  if (!myProgressCard) return;
  const book = currentBook();
  const percent = state.progress?.percent || 0;
  const verse = state.lastVerse || state.activeVerse || 1;
  const resumeLabel = book ? `${book.longName} ${state.chapter}:${verse}` : "上次位置";
  myProgressCard.innerHTML = `
    <div><b>${escapeHtml(versionLabel(state.version))}</b> · 已读 ${state.progress?.read || 0} / ${state.progress?.total || 1189} 章（${percent}%）</div>
    <div class="progressBar" style="margin-top:8px"><span style="width:${percent}%"></span></div>
    <div class="dashActions" style="margin-top:10px">
      <button type="button" data-dash="continue">继续读 ${escapeHtml(resumeLabel)}</button>
      <button type="button" data-dash="unread">下一未读章</button>
      <button type="button" data-dash="mark">${isCurrentChapterRead() ? "取消已读" : "标记已读"}</button>
    </div>
    ${book ? `<div class="panelHint" style="margin-top:8px">上次读到 ${escapeHtml(book.longName)} ${state.chapter}${verse ? `:${verse}` : ""}</div>` : ""}
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
      highlightColor: "",
      note: "",
      tags: "",
    }
  );
}

function verseMarkClasses(mark) {
  const color = mark.highlightColor || (mark.highlighted ? "gold" : "");
  return [
    mark.favorite ? "favoriteVerse" : "",
    color ? `highlightedVerse hl-${color}` : "",
    mark.note || mark.tags ? "notedVerse" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function renderNoteEditor(verse) {
  const mark = markForVerse(verse);
  if (!mark.note && !mark.tags) return "";
  return `<div class="notePreview">${mark.tags ? `<div class="noteTags">${escapeHtml(mark.tags)}</div>` : ""}<div class="noteText">${linkVerseRefs(mark.note)}</div></div>`;
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
            <div class="verseBody" data-verse="${verse.verse}">
              <span class="verseNo" id="v${verse.verse}">${verse.verse}</span>
              <span class="verseText">${escapeHtml(verse.text)}</span>
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
    commentaryHint.textContent = data.encrypted && !data.readable
      ? "正文已加密。有配图的会显示图片。"
      : `${data.entries.length} 条`;
  } catch (error) {
    if (token != null && token !== chapterLoadToken) return;
    commentaryContent.innerHTML = `<div class="commentaryBlock"><div class="commentaryEntry">${escapeHtml(error.message)}</div></div>`;
    commentaryHint.textContent = error.message;
  }
}

function verseRefRegex() {
  const names = bookAliases()
    .map(([alias]) => String(alias || "").trim())
    .filter((alias) => alias.length >= 1)
    .sort((left, right) => right.length - left.length)
    .map((alias) => alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!names.length) return null;
  return new RegExp(`(?:参(?:看|照|考)?)?\\s*(${names.join("|")})\\s*([0-9]+)\\s*(?:[:：]|章)\\s*([0-9]+)?(?:\\s*节)?(?:\\s*[-–—至到]\\s*[0-9]+)?`, "g");
}

function linkVerseRefs(text) {
  const raw = String(text || "");
  if (!raw) return "";
  const pattern = verseRefRegex();
  if (!pattern) return escapeHtml(raw);
  let html = "";
  let last = 0;
  let match;
  pattern.lastIndex = 0;
  while ((match = pattern.exec(raw))) {
    html += escapeHtml(raw.slice(last, match.index));
    const book = resolveBookName(match[1]);
    const chapter = Number(match[2]);
    const verse = match[3] ? Number(match[3]) : 1;
    if (book && chapter >= 1) {
      html += `<button type="button" class="refLink" data-jump-book="${book.id}" data-jump-chapter="${chapter}" data-jump-verse="${verse}">${escapeHtml(match[0].trim())}</button>`;
    } else {
      html += escapeHtml(match[0]);
    }
    last = match.index + match[0].length;
  }
  html += escapeHtml(raw.slice(last));
  return html;
}

function formatCommentaryRef(entry) {
  if (entry.chapter === 0) return "全书";
  if (!entry.fromVerse) return `${entry.chapter} 章`;
  return entry.toVerse && entry.toVerse !== entry.fromVerse
    ? `${entry.chapter}:${entry.fromVerse}-${entry.toVerse}`
    : `${entry.chapter}:${entry.fromVerse}`;
}

function renderModuleImages(images) {
  if (!images?.length) return "";
  return `<div class="dictImages">${images
    .map((image) => `<img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.name || "")}" />`)
    .join("")}</div>`;
}

function renderModuleBody(entry, emptyLabel = "（无文本）") {
  if (entry.text) return `<div class="commentaryText">${linkVerseRefs(entry.text)}</div>${renderModuleImages(entry.images)}`;
  if (entry.encrypted) {
    return `<div class="panelHint">${entry.images?.length ? "文字已加密，配图仍可看。" : "这篇注释的文字已加密，暂时无法显示。"}</div>${renderModuleImages(entry.images)}`;
  }
  return `<div class="commentaryText">${emptyLabel}</div>${renderModuleImages(entry.images)}`;
}

function renderCommentary(data) {
  if (!data.entries.length) {
    commentaryContent.innerHTML = `<div class="commentaryBlock"><div class="commentaryHeader"><div class="commentaryTitle">${escapeHtml(data.title)}</div><div class="commentaryMeta">本章没有注释</div></div></div>`;
    return;
  }
  const encryptedHint = data.encrypted && !data.entries.some((entry) => entry.text)
    ? `<div class="panelHint">这篇注释库的正文是加密的，文字解不开。若有地图或配图，会显示在下面。</div>`
    : "";
  commentaryContent.innerHTML = `
    <div class="commentaryBlock">
      <div class="commentaryHeader">
        <div class="commentaryTitle">${escapeHtml(data.title)}</div>
        <div class="commentaryMeta">${data.entries.length} 条</div>
      </div>
      ${encryptedHint}
      ${data.entries
        .map(
          (entry) => `
            <article class="commentaryEntry" data-from="${entry.fromVerse}" data-to="${entry.toVerse}" data-jump-book="${state.book}" data-jump-chapter="${Number(entry.chapter || state.chapter) || state.chapter}" data-jump-verse="${Number(entry.fromVerse || 1)}">
              <div class="commentaryRef">${escapeHtml(formatCommentaryRef(entry))}</div>
              ${renderModuleBody(entry)}
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

let chapterAudioFiles = [];

async function loadAudio(snapshot = {}, token = null) {
  try {
    const data = await api(`/api/audio?book=${snapshot.book || state.book}&chapter=${snapshot.chapter || state.chapter}`);
    if (token != null && token !== chapterLoadToken) return;
    chapterAudioFiles = data.audio || [];
    if (audioPanel && !audioPanel.hidden) renderAudioSheet();
  } catch {
    if (token != null && token !== chapterLoadToken) return;
    chapterAudioFiles = [];
    if (audioPanel && !audioPanel.hidden) renderAudioSheet();
  }
}

function setTtsStatus(text) {
  if (ttsStatus) ttsStatus.textContent = text;
}

function renderAudioSheet() {
  if (audioAutoNextSheet) audioAutoNextSheet.checked = !!state.audioAutoNext;
  if (!audioFileList) return;
  if (!chapterAudioFiles.length) {
    audioFileList.innerHTML = `<div class="panelHint">手机版用系统朗读。本章若有 MP3（电脑 D:\\bibleDownload\\ld），会显示在这里。APK 里不内置音频包。</div>`;
    return;
  }
  audioFileList.innerHTML = chapterAudioFiles
    .map(
      (item) => `
        <div class="sheetSection">
          <div class="panelTitle">${escapeHtml(item.source)} · ${escapeHtml(item.fileName || "音频")}</div>
          <audio controls src="${escapeHtml(item.url)}" data-audio></audio>
        </div>
      `,
    )
    .join("");
  audioFileList.querySelectorAll("audio").forEach((audio) => {
    audio.addEventListener("ended", () => {
      if (state.audioAutoNext) moveChapter(1);
    });
  });
}

function openAudioSheet() {
  closeContentPanels();
  if (audioPanel) audioPanel.hidden = false;
  renderAudioSheet();
  syncSheetOverlay();
}

async function loadChapter(options = {}) {
  const token = ++chapterLoadToken;
  const snapshot = { version: state.version, book: state.book, chapter: state.chapter };
  chapterLoading = true;
  if (speaking) stopSpeaking();
  resetSwipeVisual();
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
    renderMyProgress();
    renderBookGrid();
    renderChapterGrid();
    saveReadingHistory(snapshot);
    if (state.targetVerse) rememberReadingPosition(state.targetVerse);
    else saveState();
    if (options.scrollTop) scrollReaderToTop();
    else if (state.targetVerse) focusTargetVerse();
    await loadAudio(snapshot, token);
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
  state.lastVerse = 1;
  rememberCurrentBook();
  resetVerseInteraction();
  const nextInfo = state.books.find((item) => item.id === nextBook) || currentBook();
  showStatus(`${nextInfo.longName} ${nextChapter}`);
  loadChapter({ scrollTop: true });
}

function bookAliases() {
  const aliases = new Map();
  state.books.forEach((book) => {
    [book.shortName, book.longName, book.longName?.replace(/记$/, ""), book.longName?.replace(/书$/, ""), book.longName?.replace(/福音$/, "")].forEach((name) => {
      if (name) aliases.set(name, book);
    });
  });
  const extras = {
    创世: "创世记",
    创世纪: "创世记",
    出埃及: "出埃及记",
    利未: "利未记",
    民数: "民数记",
    申命: "申命记",
    约书亚: "约书亚记",
    士师: "士师记",
    路得: "路得记",
    撒母耳上: "撒母耳记上",
    撒母耳下: "撒母耳记下",
    列王上: "列王纪上",
    列王下: "列王纪下",
    历代上: "历代志上",
    历代下: "历代志下",
    以斯拉: "以斯拉记",
    尼希米: "尼希米记",
    以斯帖: "以斯帖记",
    约伯: "约伯记",
    诗: "诗篇",
    传道: "传道书",
    以赛亚: "以赛亚书",
    耶利米哀歌: "耶利米哀歌",
    耶利米: "耶利米书",
    以西结: "以西结书",
    但以理: "但以理书",
    何西阿: "何西阿书",
    约珥: "约珥书",
    阿摩司: "阿摩司书",
    俄巴底亚: "俄巴底亚书",
    约拿: "约拿书",
    弥迦: "弥迦书",
    那鸿: "那鸿书",
    哈巴谷: "哈巴谷书",
    西番雅: "西番雅书",
    哈该: "哈该书",
    撒迦利亚: "撒迦利亚书",
    玛拉基: "玛拉基书",
    马太: "马太福音",
    马可: "马可福音",
    路加: "路加福音",
    使徒: "使徒行传",
    罗马: "罗马书",
    哥林多前: "哥林多前书",
    哥林多后: "哥林多后书",
    加拉太: "加拉太书",
    以弗所: "以弗所书",
    腓立比: "腓立比书",
    歌罗西: "歌罗西书",
    帖撒罗尼迦前: "帖撒罗尼迦前书",
    帖撒罗尼迦后: "帖撒罗尼迦后书",
    提摩太前: "提摩太前书",
    提摩太后: "提摩太后书",
    提多: "提多书",
    腓利门: "腓利门书",
    希伯来: "希伯来书",
    雅各: "雅各书",
    彼得前: "彼得前书",
    彼得后: "彼得后书",
    约翰一书: "约翰一书",
    约翰二书: "约翰二书",
    约翰三书: "约翰三书",
    约翰一: "约翰一书",
    约翰二: "约翰二书",
    约翰三: "约翰三书",
    约翰壹: "约翰一书",
    约翰贰: "约翰二书",
    约翰叁: "约翰三书",
    约翰福音: "约翰福音",
    约翰: "约翰福音",
    犹大: "犹大书",
    启示: "启示录",
    默示录: "启示录",
  };
  const spokenExtras = typeof SpokenBooks !== "undefined" && SpokenBooks.extras ? SpokenBooks.extras : {};
  Object.entries({ ...extras, ...spokenExtras }).forEach(([alias, longName]) => {
    const book = state.books.find((item) => item.longName === longName);
    if (book && alias) aliases.set(alias, book);
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
    level: match[3] ? "verse" : "chapter",
  };
}

function spokenAliasIndex(value, alias) {
  if (typeof SpokenBooks !== "undefined" && SpokenBooks.spokenAliasIndex) {
    return SpokenBooks.spokenAliasIndex(value, alias);
  }
  return String(value || "").indexOf(String(alias || ""));
}

function normalizeVoiceText(input) {
  let value = String(input || "")
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 65248))
    .replace(/[“”‘’「」『』]/g, "")
    .replace(/[，。？！,.?!、…~～]/g, "")
    .replace(/[:：]/g, ":")
    .replace(/([0-9零〇一二两三四五六七八九十百])比([0-9零〇一二两三四五六七八九十百])/g, "$1:$2")
    .replace(/请你?|帮我|我想要?|听一下|跳转到|跳到|转到|打开|请读|读到|读一下|来读|来听|看看?|阅读|进入|播放|经文|谢谢|啊|嗯|那个/g, "")
    .replace(/的(?=最后|倒数|最前|第一|下一|上一|后面|前面|之后)/g, "")
    .replace(/诗篇/g, "\u0000诗篇\u0000")
    .replace(/第/g, "")
    .replace(/篇/g, "章")
    .replace(/\u0000诗篇\u0000/g, "诗篇")
    .replace(/\s+/g, "");
  if (typeof SpokenBooks !== "undefined" && SpokenBooks.prepareSpokenText) {
    value = SpokenBooks.prepareSpokenText(value);
  } else if (typeof SpokenBooks !== "undefined") {
    if (SpokenBooks.normalizeTraditional) value = SpokenBooks.normalizeTraditional(value);
    if (SpokenBooks.canonicalizeSpokenBooks) value = SpokenBooks.canonicalizeSpokenBooks(value);
  }
  return value;
}

function lightNormalizeVoice(input) {
  return String(input || "")
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 65248))
    .replace(/[“”‘’「」『』]/g, "")
    .replace(/[，。？！,.?!、…~～]/g, "")
    .replace(/\s+/g, "");
}

function findSpokenBook(value) {
  let best = null;
  for (const [alias, book] of bookAliases()) {
    const index = spokenAliasIndex(value, alias);
    if (index < 0) continue;
    if (best && (index > best.index || (index === best.index && alias.length <= best.alias.length))) continue;
    best = { alias, book, index, rest: value.slice(index + alias.length).replace(/^的/, "") };
  }
  return best;
}

function neighborBook(book, delta) {
  if (!book) return null;
  const list = state.books || [];
  const index = list.findIndex((item) => item.id === book.id);
  return index < 0 ? null : list[index + delta] || null;
}

function chapterFromEnd(book, fromEnd) {
  const chapter = (book.chapterCount || 1) - fromEnd + 1;
  if (chapter < 1) return null;
  return clampSpokenRef(book, chapter, null, "chapter");
}

function normalizeRelativeText(text) {
  let value = String(text || "").replace(/^的/, "").replace(/那(?=一?[卷本部长章节张帐])/g, "");
  if (typeof SpokenBooks !== "undefined" && SpokenBooks.normalizeChapterSpeech) {
    value = SpokenBooks.normalizeChapterSpeech(value);
  }
  return value.replace(/[了吧呀呢喔哦嘛嘞]/g, "");
}

function parseCountdown(text) {
  const match = String(text || "").match(/^倒数([0-9零〇一二两三四五六七八九十百]+)?(个)?(章|卷|节)?$/);
  if (!match) return null;
  const n = match[1] ? chineseNumberToInt(match[1]) : 1;
  if (!n || n < 1) return null;
  return { n, unit: match[3] || "章" };
}

function isNextBookTail(text) {
  return /^(下一|下一部|下一本|后面一?|后一|之后一?)(卷|本|部)?书?$/.test(text);
}

function isPrevBookTail(text) {
  return /^(上一|上一部|上一本|前面一?|前一)(卷|本|部)?书?$/.test(text);
}

function leftoverIsFiller(rest) {
  const text = normalizeRelativeText(rest).replace(/^[里中的]/, "");
  return !text;
}

function parseRelativeTail(rest, book) {
  const text = normalizeRelativeText(rest);
  if (!text) return clampSpokenRef(book, 1, null, "book");
  if (/^(最后|末尾|结尾)一?(章|卷)?$/.test(text)) return clampSpokenRef(book, book.chapterCount, null, "chapter");
  const countdown = parseCountdown(text);
  if (countdown && countdown.unit !== "节") return chapterFromEnd(book, countdown.n);
  if (/^(开头|最前|第一?)(章|卷)?$/.test(text)) return clampSpokenRef(book, 1, null, "chapter");
  if (isNextBookTail(text)) {
    const next = neighborBook(book, 1);
    return next ? clampSpokenRef(next, 1, null, "book") : null;
  }
  if (isPrevBookTail(text)) {
    const prev = neighborBook(book, -1);
    return prev ? clampSpokenRef(prev, 1, null, "book") : null;
  }
  if (/最后一?节/.test(text)) {
    const head = text.replace(/最后一?节.*$/, "");
    if (!head || /^(最后一?章)?$/.test(head)) return { book: book.id, chapter: book.chapterCount, verse: "last", level: "verse" };
    const cv = parseChapterVerseToken(head.endsWith("章") ? head : `${head}章`);
    if (cv) return { book: book.id, chapter: Math.min(cv.chapter, book.chapterCount), verse: "last", level: "verse" };
  }
  if (/^第一?节$/.test(text)) return clampSpokenRef(book, 1, 1, "verse");
  return null;
}

function parseSpokenCommand(input) {
  const light = lightNormalizeVoice(input);
  const searchHit = light.match(/^(?:搜索|查找|搜一下|搜)(.+)$/);
  if (searchHit) return { type: "search", query: searchHit[1] };
  const value = normalizeVoiceText(input);
  if (!value) return null;
  if (isNextBookTail(value)) return { type: "moveBook", delta: 1 };
  if (isPrevBookTail(value)) return { type: "moveBook", delta: -1 };
  if (/^倒数([0-9零〇一二两三四五六七八九十百]+)(章|卷)?$/.test(value)) {
    const book = currentBook();
    const countdown = parseCountdown(value);
    return book && countdown ? { type: "jump", ...chapterFromEnd(book, countdown.n) } : null;
  }
  if (/^(下一|后面一)章$/.test(value)) return { type: "moveChapter", delta: 1 };
  if (/^(上一|前面一)章$/.test(value)) return { type: "moveChapter", delta: -1 };
  if (/^(最后|末尾|结尾)一?章$/.test(value) || /^倒数(一)?章?$/.test(value)) {
    const book = currentBook();
    return book ? { type: "jump", ...clampSpokenRef(book, book.chapterCount, null, "chapter") } : null;
  }
  if (/^第一?章$/.test(value)) {
    const book = currentBook();
    return book ? { type: "jump", ...clampSpokenRef(book, 1, null, "chapter") } : null;
  }
  if (/^最后一?节$/.test(value)) {
    return { type: "jump", book: state.book, chapter: state.chapter, verse: "last", level: "verse" };
  }
  const found = findSpokenBook(value);
  if (found) {
    const relative = parseRelativeTail(found.rest, found.book);
    if (relative) return { type: "jump", ...relative };
    const rest = parseChapterVerseToken(found.rest);
    if (rest) return { type: "jump", ...clampSpokenRef(found.book, rest.chapter, rest.verse, rest.verse ? "verse" : "chapter") };
    if (!leftoverHasNumber(found.rest) && leftoverIsFiller(found.rest)) {
      return { type: "jump", ...clampSpokenRef(found.book, 1, null, "book") };
    }
  }
  const ref = parseSpokenReference(input);
  if (ref) return { type: "jump", ...ref };
  return { type: "search", query: String(input || "").trim() };
}

function chineseNumberToInt(input) {
  const raw = String(input || "");
  if (!raw) return NaN;
  if (/^\d+$/.test(raw)) return Number(raw);
  const digits = { 零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  if (!/[十百]/.test(raw)) {
    if (![...raw].every((char) => Object.prototype.hasOwnProperty.call(digits, char))) return NaN;
    return raw.split("").reduce((value, char) => value * 10 + digits[char], 0);
  }
  let total = 0;
  let current = 0;
  for (const char of raw) {
    if (char === "百") {
      total += (current || 1) * 100;
      current = 0;
    } else if (char === "十") {
      total += (current || 1) * 10;
      current = 0;
    } else if (Object.prototype.hasOwnProperty.call(digits, char)) {
      current = digits[char];
    }
  }
  return total + current;
}

function parseChapterVerseToken(text) {
  const value = String(text || "");
  const number = "([0-9零〇一二两三四五六七八九十百]+)";
  const patterns = [
    new RegExp(`${number}章(?:到|至|-|—)?${number}节`),
    new RegExp(`${number}[:/\\.．]${number}`),
    new RegExp(`${number}章${number}`),
    new RegExp(`${number}章`),
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (!match) continue;
    const chapter = chineseNumberToInt(match[1]);
    const verse = match[2] ? chineseNumberToInt(match[2]) : null;
    if (chapter >= 1) return { chapter, verse: verse >= 1 ? verse : null };
  }
  const only = value.match(new RegExp(`^${number}$`));
  if (only) {
    const chapter = chineseNumberToInt(only[1]);
    if (chapter >= 1) return { chapter, verse: null };
  }
  return null;
}

function clampSpokenRef(book, chapter, verse, level) {
  if (!book || !Number.isFinite(chapter) || chapter < 1) return null;
  const safeChapter = Math.min(chapter, book.chapterCount || chapter);
  const safeVerse = Number.isFinite(verse) && verse >= 1 ? verse : null;
  const resolvedLevel = level || (safeVerse ? "verse" : "chapter");
  return { book: book.id, chapter: safeChapter, verse: safeVerse, level: resolvedLevel };
}

function leftoverHasNumber(text) {
  return /[0-9零〇一二两三四五六七八九十百]/.test(String(text || ""));
}

function parseSpokenReference(input) {
  const value = normalizeVoiceText(input);
  if (!value) return null;
  const aliases = bookAliases();
  let best = null;
  for (const [alias, book] of aliases) {
    const index = spokenAliasIndex(value, alias);
    if (index < 0) continue;
    if (best && (index > best.index || (index === best.index && alias.length <= best.alias.length))) continue;
    const restText = value.slice(index + alias.length);
    const rest = parseChapterVerseToken(restText);
    if (rest) {
      best = { index, alias, book, ...rest, level: rest.verse ? "verse" : "chapter" };
      continue;
    }
    if (!leftoverHasNumber(restText)) {
      best = { index, alias, book, chapter: 1, verse: null, level: "book" };
    }
  }
  if (best) return clampSpokenRef(best.book, best.chapter, best.verse, best.level);
  const currentOnly = parseChapterVerseToken(value);
  if (currentOnly) return clampSpokenRef(currentBook(), currentOnly.chapter, currentOnly.verse, currentOnly.verse ? "verse" : "chapter");
  return parseReference(value);
}

function lastVerseInContent() {
  const verses = [...content.querySelectorAll(".verse[data-verse]")];
  return Number(verses[verses.length - 1]?.dataset.verse) || null;
}

function formatJumpRef(ref) {
  const book = state.books.find((item) => item.id === ref.book) || currentBook();
  if (!book) return "";
  if (ref.level === "book") return book.longName;
  if (ref.verse === "last") return `${book.longName} ${ref.chapter}章最后一节`;
  if (ref.level === "verse" && ref.verse) return `${book.longName} ${ref.chapter}:${ref.verse}`;
  return `${book.longName} ${ref.chapter}章`;
}

function moveBook(delta, token = jobToken) {
  const next = neighborBook(currentBook(), delta);
  if (!next) {
    if (jobAlive(token)) showStatus(delta > 0 ? "已经是最后一卷" : "已经是第一卷");
    return;
  }
  return jumpToReference({ book: next.id, chapter: 1, verse: null, level: "book" }, token);
}

async function jumpToReference(ref, token = jobToken) {
  if (!jobAlive(token)) return;
  jumpBusy = true;
  try {
    state.book = ref.book;
    state.chapter = ref.chapter;
    rememberCurrentBook();
    resetVerseInteraction(ref.verse && ref.verse !== "last" ? ref.verse : null);
    renderBookGrid();
    renderChapterGrid();
    closeTopPanels();
    closeSidebar();
    await loadChapter({ scrollTop: !state.targetVerse && ref.verse !== "last" });
    if (!jobAlive(token)) return;
    if (ref.verse === "last") {
      const last = lastVerseInContent();
      if (last) {
        state.targetVerse = last;
        rememberReadingPosition(last);
        focusTargetVerse();
      }
    }
  } finally {
    jumpBusy = false;
  }
}

function setPeek(kind, title, restore) {
  peekState = { kind, title, restore };
  if (!peekBar || !peekBackBtn) return;
  peekBackBtn.textContent = title;
  peekBar.hidden = false;
}

function clearPeek() {
  peekState = null;
  if (peekBar) peekBar.hidden = true;
}

function restorePeek() {
  const peek = peekState;
  clearPeek();
  if (peek?.restore) peek.restore();
}

async function jumpFromPeek(ref, peek) {
  if (peek) setPeek(peek.kind, peek.title, peek.restore);
  await jumpToReference(ref);
  if (peekBar && peekState) peekBar.hidden = false;
}

function isCodePlanKey(key = state.mimoKey) {
  return String(key || "").trim().toLowerCase().startsWith("tp-");
}

const CUSTOM_MODEL_VALUE = "__custom__";
const MIMO_CHAT_MODEL = "mimo-v2.5";
const AI_PROVIDERS = [
  {
    id: "mimo",
    name: "小米 MiMo",
    api: "openai-completions",
    keyLabel: "MiMo Key",
    keyPlaceholder: "sk- 普通 Key 或 tp- Code Plan",
    defaultBaseUrl: "https://api.xiaomimimo.com/v1",
    codePlanBaseUrl: "https://token-plan-cn.xiaomimimo.com/v1",
    extraApiKeyHeader: true,
    models: [{ id: "mimo-v2.5", name: "MiMo 2.5" }],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    api: "openai-completions",
    keyLabel: "DeepSeek Key",
    keyPlaceholder: "sk- …",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    models: [
      { id: "deepseek-chat", name: "DeepSeek Chat" },
      { id: "deepseek-reasoner", name: "DeepSeek Reasoner" },
    ],
  },
  {
    id: "xai",
    name: "xAI Grok",
    api: "openai-completions",
    keyLabel: "xAI Key",
    keyPlaceholder: "xai- …",
    defaultBaseUrl: "https://api.x.ai/v1",
    models: [
      { id: "grok-4", name: "Grok 4" },
      { id: "grok-3", name: "Grok 3" },
      { id: "grok-3-mini", name: "Grok 3 Mini" },
    ],
  },
  {
    id: "openai",
    name: "OpenAI GPT",
    api: "openai-completions",
    keyLabel: "OpenAI Key",
    keyPlaceholder: "sk- …",
    defaultBaseUrl: "https://api.openai.com/v1",
    models: [
      { id: "gpt-4.1", name: "GPT-4.1" },
      { id: "gpt-4.1-mini", name: "GPT-4.1 Mini" },
      { id: "gpt-4o", name: "GPT-4o" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini" },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    api: "anthropic-messages",
    keyLabel: "Anthropic Key",
    keyPlaceholder: "sk-ant- …",
    defaultBaseUrl: "https://api.anthropic.com",
    models: [
      { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6" },
      { id: "claude-opus-4-6", name: "Claude Opus 4.6" },
      { id: "claude-haiku-4-5", name: "Claude Haiku 4.5" },
    ],
  },
  {
    id: "custom",
    name: "自定义（OpenAI 兼容）",
    api: "openai-completions",
    keyLabel: "API Key",
    keyPlaceholder: "中转站或兼容接口的 Key",
    defaultBaseUrl: "",
    custom: true,
    models: [],
  },
];

function aiSpec(id = state.aiProvider) {
  return AI_PROVIDERS.find((item) => item.id === id) || AI_PROVIDERS[0];
}

function providerStoredKey(id = state.aiProvider) {
  if (id === "mimo") return state.mimoKey || "";
  return String((state.aiKeys && state.aiKeys[id]) || "");
}

function providerStoredUrl(id = state.aiProvider) {
  if (id === "mimo") return state.mimoBaseUrl || "";
  return String((state.aiBaseUrls && state.aiBaseUrls[id]) || "");
}

function setProviderStoredKey(id, value) {
  const key = String(value || "").trim();
  state.aiKeys = { ...(state.aiKeys || {}), [id]: key };
  if (id === "mimo") state.mimoKey = key;
}

function setProviderStoredUrl(id, value) {
  const url = String(value || "").trim();
  state.aiBaseUrls = { ...(state.aiBaseUrls || {}), [id]: url };
  if (id === "mimo") state.mimoBaseUrl = url;
}

function fillAiModelSelect() {
  if (!aiModelSelect) return;
  const spec = aiSpec();
  const models = spec.models || [];
  const current = state.aiModel || spec.models[0]?.id || "";
  const known = models.some((item) => item.id === current);
  aiModelSelect.innerHTML = `${models
    .map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`)
    .join("")}<option value="${CUSTOM_MODEL_VALUE}">其他（自己填）</option>`;
  if (spec.custom || !known) aiModelSelect.value = CUSTOM_MODEL_VALUE;
  else aiModelSelect.value = current;
}

function syncAiSettingsFields() {
  const spec = aiSpec();
  const usingCustomModel = spec.custom || !spec.models.some((item) => item.id === state.aiModel);
  if (aiProviderSelect) aiProviderSelect.value = spec.id;
  fillAiModelSelect();
  if (aiCustomModelField) aiCustomModelField.hidden = !usingCustomModel;
  if (aiCustomModelInput) aiCustomModelInput.value = usingCustomModel ? state.aiModel || state.aiCustomModel || "" : "";
  if (aiKeyLabel) aiKeyLabel.textContent = spec.keyLabel || "API Key";
  if (aiKeyInput) {
    aiKeyInput.value = providerStoredKey(spec.id);
    aiKeyInput.placeholder = spec.keyPlaceholder || "sk- …";
  }
  if (mimoKeyTypeField) mimoKeyTypeField.hidden = spec.id !== "mimo";
  if (mimoKeyTypeSelect) mimoKeyTypeSelect.value = state.mimoKeyType;
  const showBase = spec.custom || spec.id === "mimo" && (state.mimoKeyType === "codeplan" || isCodePlanKey());
  if (aiBaseUrlField) aiBaseUrlField.hidden = !showBase;
  if (aiBaseUrlLabel) aiBaseUrlLabel.textContent = spec.id === "mimo" ? "Code Plan Base URL" : "Base URL";
  if (aiBaseUrlInput) {
    let urlValue = providerStoredUrl(spec.id);
    if (spec.id === "mimo" && (state.mimoKeyType === "codeplan" || isCodePlanKey()) && (!urlValue || /api\.xiaomimimo\.com/i.test(urlValue))) {
      urlValue = spec.codePlanBaseUrl;
    }
    aiBaseUrlInput.value = urlValue || spec.codePlanBaseUrl || spec.defaultBaseUrl || "";
    aiBaseUrlInput.placeholder = spec.codePlanBaseUrl || spec.defaultBaseUrl || "https://api.example.com/v1";
    aiBaseUrlInput.disabled = spec.id === "mimo" && state.mimoKeyType !== "codeplan" && !isCodePlanKey();
  }
  if (mimoAsrKeyField) mimoAsrKeyField.hidden = spec.id === "mimo";
  if (mimoAsrKeyInput) mimoAsrKeyInput.value = state.mimoKey || "";
  if (smartVoiceToggle) smartVoiceToggle.checked = !!state.smartVoice;
}

function normalizeOpenAiChatUrl(value, fallback) {
  const raw = String(value || fallback || "").trim() || String(fallback || "").trim();
  const base = raw.replace(/\/+$/, "");
  if (!base) return "";
  if (/\/chat\/completions$/i.test(base) || /\/messages$/i.test(base)) return base;
  if (/\/v1$/i.test(base)) return `${base}/chat/completions`;
  return `${base}/v1/chat/completions`;
}

function normalizeAnthropicUrl(value, fallback = "https://api.anthropic.com") {
  const raw = String(value || fallback || "").trim() || fallback;
  const base = raw.replace(/\/+$/, "");
  if (/\/messages$/i.test(base)) return base;
  if (/\/v1$/i.test(base)) return `${base}/messages`;
  return `${base}/v1/messages`;
}

function normalizeMimoChatUrl(value = state.mimoBaseUrl) {
  const codePlan = state.mimoKeyType === "codeplan" || isCodePlanKey();
  const fallback = codePlan ? "https://token-plan-cn.xiaomimimo.com/v1" : "https://api.xiaomimimo.com/v1";
  const source = codePlan ? value || fallback : "https://api.xiaomimimo.com/v1";
  return normalizeOpenAiChatUrl(source, fallback);
}

function setVoiceButtons(mode) {
  document.querySelectorAll("#voiceBtn, #voiceBtnDesktop").forEach((button) => {
    button.classList.toggle("active", mode === "record" || mode === "upload");
    button.classList.toggle("uploading", mode === "upload");
    if (button.id === "voiceBtn") {
      const label = button.childNodes[button.childNodes.length - 1];
      if (label && label.nodeType === Node.TEXT_NODE) {
        label.textContent = mode === "record" ? "松手" : mode === "upload" ? "处理中" : "口令";
      }
    }
  });
}

function resetVoiceState() {
  voiceInputActive = false;
  voiceStopPending = false;
  setVoiceButtons("idle");
}

let voiceIntentWaiter = null;
let jobToken = 0;
let voiceSession = 0;
let pendingResultJob = 0;

function beginJob(message, tone = "info") {
  jobToken += 1;
  chapterLoadToken += 1;
  if (pendingConfirm) closeConfirmSheet(false);
  if (voiceIntentWaiter) {
    const waiter = voiceIntentWaiter;
    voiceIntentWaiter = null;
    waiter(null);
  }
  if (message) showStatus(message, tone);
  return jobToken;
}

function jobAlive(token) {
  return token === jobToken;
}

function finishJob(token, message, tone = "success") {
  if (!jobAlive(token)) return false;
  resetVoiceState();
  setVoiceButtons("idle");
  if (message) showStatus(message, tone);
  return true;
}

function extractJsonObject(text) {
  let raw = String(text || "").trim();
  if (!raw) return null;
  raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

function resolveBookName(name) {
  if (name == null || name === "") return null;
  if (Number.isFinite(Number(name))) return state.books.find((item) => item.id === Number(name)) || null;
  const raw = String(name).replace(/\s+/g, "");
  const found = findSpokenBook(normalizeVoiceText(raw) || raw);
  if (found?.book) return found.book;
  return bookAliases().find(([alias]) => raw === alias || raw.endsWith(alias) || alias.endsWith(raw))?.[1] || null;
}

function resolveChapterSpec(book, chapter) {
  if (!book) return 1;
  if (chapter == null || chapter === "") return 1;
  const spec = String(chapter).trim();
  if (spec === "last" || spec === "end" || spec === "最后") return book.chapterCount;
  if (spec === "first" || spec === "开头") return 1;
  const lastN = spec.match(/^last-(\d+)$/i) || spec.match(/^倒数(\d+)$/);
  if (lastN) return Math.max(1, book.chapterCount - Number(lastN[1]) + 1);
  const n = Number(spec);
  if (Number.isFinite(n) && n >= 1) return Math.min(n, book.chapterCount);
  const parsed = chineseNumberToInt(spec);
  if (Number.isFinite(parsed) && parsed >= 1) return Math.min(parsed, book.chapterCount);
  return 1;
}

function resolveLlmCommand(raw) {
  const data = raw && typeof raw === "object" ? raw : extractJsonObject(raw);
  if (!data || typeof data !== "object") return null;
  const type = String(data.type || "").trim();
  if (type === "search") {
    const query = String(data.query || "").trim();
    return query ? { type: "search", query } : null;
  }
  if (type === "moveBook" || type === "moveChapter") {
    const delta = Number(data.delta);
    if (delta !== 1 && delta !== -1) return null;
    return { type, delta };
  }
  if (type !== "jump") return null;
  const book = resolveBookName(data.book) || (data.book == null || data.book === "" ? currentBook() : null);
  if (!book) return null;
  const chapter = resolveChapterSpec(book, data.chapter);
  let verse = data.verse;
  if (verse === "last" || verse === "最后") verse = "last";
  else if (verse == null || verse === "") verse = null;
  else {
    const n = Number(verse);
    verse = Number.isFinite(n) && n >= 1 ? n : null;
  }
  const level = verse ? "verse" : data.chapter == null || data.chapter === "" ? "book" : "chapter";
  return { type: "jump", book: book.id, chapter, verse, level };
}

function voiceIntentPrompt(spoken) {
  const book = currentBook();
  return [
    "你是圣经阅读器的口令解析器。只输出一个 JSON，不要解释，不要 Markdown。",
    `用户当前在：${book.longName} 第 ${state.chapter} 章。`,
    "书卷请用中文全名，例如 创世记、出埃及记、诗篇、约翰福音。",
    "JSON 只能是以下之一：",
    '{"type":"jump","book":"诗篇","chapter":"last-2","verse":null}',
    '{"type":"jump","book":"出埃及记","chapter":1,"verse":null}',
    '{"type":"jump","book":"约翰福音","chapter":3,"verse":16}',
    '{"type":"moveBook","delta":1}',
    '{"type":"moveChapter","delta":-1}',
    '{"type":"search","query":"爱人如己"}',
    "chapter 可用数字，或 first、last、last-2（倒数第二篇）。verse 可用数字或 last。",
    "诗篇的倒数第二篇 → book=诗篇 chapter=last-2",
    "创世纪的下一卷书 / 创世记下一本 → book=出埃及记 chapter=1",
    "只说下一章 → moveChapter delta=1；只说上一卷 → moveBook delta=-1",
    "易混书卷必须分开：以斯拉记(Ezra/拉)≠以斯帖记(Esther/斯)；哈巴谷书≠哈该书；腓立比书≠腓利门书；马太福音≠马可福音；路得记≠路加福音；雅歌≠雅各书；约书亚记≠约翰福音≠约伯记≠约珥书≠约拿书。",
    "语音常把以斯拉听成伊斯拉/以司拉/以斯啦，把以斯帖听成以斯贴/伊斯特/以司帖。听到这些就按正确书卷跳转。",
    "无法判断跳转时用 search。",
    `用户说：${spoken}`,
  ].join("\n");
}

function waitVoiceIntent(timeoutMs = 60000) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (voiceIntentWaiter) voiceIntentWaiter = null;
      resolve(null);
    }, timeoutMs);
    voiceIntentWaiter = (payload) => {
      clearTimeout(timer);
      voiceIntentWaiter = null;
      resolve(payload);
    };
  });
}

function getAiProvider() {
  const spec = aiSpec();
  const usingCustom = spec.custom || state.aiModel === CUSTOM_MODEL_VALUE || !spec.models.some((item) => item.id === state.aiModel);
  const customName = state.aiCustomModel || (state.aiModel !== CUSTOM_MODEL_VALUE ? state.aiModel : "");
  const model = usingCustom
    ? String(customName || "").trim()
    : String(state.aiModel || spec.models[0]?.id || MIMO_CHAT_MODEL).trim();
  const storedUrl = providerStoredUrl(spec.id);
  let url = "";
  if (spec.api === "anthropic-messages") url = normalizeAnthropicUrl(storedUrl, spec.defaultBaseUrl);
  else if (spec.id === "mimo") url = normalizeMimoChatUrl(storedUrl);
  else url = normalizeOpenAiChatUrl(storedUrl || spec.defaultBaseUrl, spec.defaultBaseUrl);
  return {
    id: spec.id,
    name: spec.name,
    api: spec.api,
    extraApiKeyHeader: !!spec.extraApiKeyHeader,
    model,
    key: providerStoredKey(spec.id),
    url,
  };
}

function chatHeaders(provider) {
  const headers = { "Content-Type": "application/json" };
  if (provider.api === "anthropic-messages") {
    headers["x-api-key"] = provider.key;
    headers["anthropic-version"] = "2023-06-01";
    headers.Authorization = `Bearer ${provider.key}`;
  } else {
    headers.Authorization = `Bearer ${provider.key}`;
    if (provider.extraApiKeyHeader) headers["api-key"] = provider.key;
  }
  return headers;
}

function openaiChatBody(provider, messages) {
  return {
    model: provider.model,
    temperature: 0,
    messages,
  };
}

function anthropicChatBody(provider, messages) {
  const system = [];
  const out = [];
  (messages || []).forEach((item) => {
    const role = item.role === "assistant" ? "assistant" : item.role === "system" ? "system" : "user";
    const content = String(item.content || "");
    if (role === "system") {
      if (content) system.push(content);
      return;
    }
    const prev = out[out.length - 1];
    if (prev && prev.role === role) prev.content += `\n${content}`;
    else out.push({ role, content });
  });
  if (!out.length) out.push({ role: "user", content: "请继续" });
  if (out[0].role !== "user") out.unshift({ role: "user", content: "请根据系统说明回答。" });
  const body = {
    model: provider.model,
    max_tokens: 8192,
    temperature: 0,
    messages: out,
  };
  if (system.length) body.system = system.join("\n");
  return body;
}

function extractLlmText(payload, api) {
  if (api === "anthropic-messages") {
    const blocks = Array.isArray(payload.content) ? payload.content : [];
    const text = blocks
      .filter((item) => item && item.type === "text")
      .map((item) => item.text || "")
      .join("")
      .trim();
    if (text) return text;
  }
  const message = payload.choices?.[0]?.message || {};
  const content = String(message.content || message.reasoning_content || "").trim();
  if (content && content !== "null") return content;
  const argumentsJson = message.tool_calls?.[0]?.function?.arguments;
  return String(argumentsJson || "").trim();
}

async function llmChat(messages) {
  const provider = getAiProvider();
  if (!provider.key) throw new Error(`请先填写${provider.name} Key`);
  if (!provider.model) throw new Error("请先填写模型名");
  if (!provider.url) throw new Error("请先填写 Base URL");
  if (window.AndroidVoiceApi && window.AndroidVoiceApi.completeChatMessages) {
    const pending = waitVoiceIntent(60000);
    window.AndroidVoiceApi.completeChatMessages(
      provider.key,
      provider.model,
      provider.url,
      JSON.stringify(messages),
      provider.api,
    );
    const text = await pending;
    if (text && typeof text === "object" && text.__error) throw new Error(text.__error);
    if (text == null) throw new Error("模型超时，没有返回内容");
    if (!String(text).trim()) throw new Error("模型返回了空内容");
    return text;
  }
  const body = provider.api === "anthropic-messages" ? anthropicChatBody(provider, messages) : openaiChatBody(provider, messages);
  const response = await fetch(provider.url, {
    method: "POST",
    headers: chatHeaders(provider),
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message || payload.message || `理解失败 ${response.status}`);
  const content = extractLlmText(payload, provider.api);
  if (!content) throw new Error("模型返回了空内容");
  return content;
}

async function mimoChatComplete(systemPrompt, userText) {
  return llmChat([
    { role: "system", content: systemPrompt },
    { role: "user", content: userText },
  ]);
}

const BIBLE_STUDY_SKILL_FALLBACK = `你是离线圣经阅读器里的助手。要接上刚才的话。经文必须用工具或当前经文，禁止编造。
每轮只输出一个 JSON。搜索：{"tool":"search","q":"葡萄","book":"约书亚记"} 或 {"tool":"search","q":"葡萄","scope":"all"}
取经文：{"tool":"verse","book":"民数记","chapter":13,"verse":23} 或 {"tool":"chapter","book":"民数记","chapter":13}
记忆：{"tool":"remember","fact":"用户常读约翰福音","kind":"reading"} 或 {"tool":"forget","q":"约翰福音"}
结束：{"done":true,"correction":"","answer":"","refs":[{"book":"民数记","chapter":13,"verse":23,"why":""}]}
kind 只能是 profile、reading、preference、topic。不要把经文原文写入记忆。约书亚记抬葡萄实际在民数记13:23。最多6次工具。`;

let bibleStudySkillText = "";

async function loadBibleStudySkill() {
  if (bibleStudySkillText) return bibleStudySkillText;
  try {
    const response = await fetch("skills/bible-lookup.md");
    if (response.ok) bibleStudySkillText = (await response.text()).trim();
  } catch {}
  if (!bibleStudySkillText) bibleStudySkillText = BIBLE_STUDY_SKILL_FALLBACK;
  return bibleStudySkillText;
}

function looksLikeStudyQuery(text) {
  const value = String(text || "").trim();
  if (value.length < 4) return false;
  if (/帮我(打开|跳到|转到|去|读|听)/.test(value)) return false;
  return /帮我搜|搜一下|找一下|找找|哪(一)?(节|处|章|卷)|这段经文|那节经文|经文(在|是|哪)|抬|关于.{0,12}(经文|故事)|故事|谁(是|做|曾)|在哪(里|一|卷|章|节)/.test(value);
}

async function runStudyTool(call) {
  const book = resolveBookName(call.book);
  if (call.tool === "search") {
    const scope = book && call.book ? "book" : call.scope || "all";
    const data = await api(
      `/api/search?version=${encodeURIComponent(state.version)}&q=${encodeURIComponent(call.q || "")}&scope=${encodeURIComponent(scope)}&book=${book ? book.id : state.book}&fuzzy=1&limit=8&offset=0`,
    );
    return {
      tool: "search",
      q: call.q,
      scope,
      book: book?.longName || "",
      results: (data.results || []).map((item) => ({
        book: item.bookName,
        chapter: item.chapter,
        verse: item.verse,
        text: item.text,
      })),
    };
  }
  if (call.tool === "verse" || call.tool === "chapter") {
    if (!book) return { error: `未知书卷：${call.book || ""}` };
    const chapter = resolveChapterSpec(book, call.chapter);
    const data = await api(`/api/chapter?version=${encodeURIComponent(state.version)}&book=${book.id}&chapter=${chapter}`);
    const verses = data.verses || [];
    if (call.tool === "verse") {
      const verseNo = Number(call.verse);
      const hit = verses.find((item) => Number(item.verse) === verseNo);
      return {
        tool: "verse",
        book: book.longName,
        chapter,
        verse: verseNo,
        text: hit?.text || "本节没有经文",
      };
    }
    return {
      tool: "chapter",
      book: book.longName,
      chapter,
      text: verses
        .slice(0, 18)
        .map((item) => `${item.verse}.${item.text}`)
        .join("\n"),
    };
  }
  if (call.tool === "remember") return rememberFact(call.fact, call.kind);
  if (call.tool === "forget") return forgetFact(call.q || call.fact || call.id);
  return { error: `未知工具：${call.tool || ""}` };
}

function renderStudyProgress(steps, waiting = "") {
  const log = (steps || [])
    .map((item, index) => `<div class="studyStep${item.done ? " done" : ""}">${index + 1}. ${escapeHtml(item.text)}</div>`)
    .join("");
  renderAgentChat(
    `<div class="studyLog">${log || `<div class="studyStep">正在理解问题</div>`}</div>${
      waiting ? `<div class="panelHint">${escapeHtml(waiting)}</div>` : ""
    }`,
  );
}

function renderStudyResult(result, steps = []) {
  const refs = Array.isArray(result.refs) ? result.refs : [];
  const cards = refs
    .map((item) => {
      const book = resolveBookName(item.book);
      if (!book || !item.chapter) return "";
      const verse = Number(item.verse) || 1;
      return `<button class="resultItem" type="button" data-jump-book="${book.id}" data-jump-chapter="${Number(item.chapter)}" data-jump-verse="${verse}">
        <div class="resultRef">${escapeHtml(book.longName)} ${Number(item.chapter)}:${verse}</div>
        <div class="resultText">${escapeHtml(item.why || item.text || "打开这节")}</div>
      </button>`;
    })
    .join("");
  const log = (steps || [])
    .map((item, index) => `<div class="studyStep done">${index + 1}. ${escapeHtml(item.text)}</div>`)
    .join("");
  renderAgentChat(
    `${log ? `<div class="studyLog">${log}</div>` : ""}${
      result.correction ? `<div class="aiCorrection">${linkVerseRefs(result.correction)}</div>` : ""
    }${
      result.answer ? `<div class="aiAnswer">${linkVerseRefs(result.answer)}</div>` : ""
    }${cards ? `<div class="resultList">${cards}</div>` : ""}`,
  );
}

function agentToolLabel(call) {
  if (call.tool === "search") {
    return `搜索「${call.q || ""}」${call.book ? ` · ${call.book}` : call.scope === "all" ? " · 全本" : ""}`;
  }
  if (call.tool === "verse") return `取经文 ${call.book || ""} ${call.chapter || ""}:${call.verse || ""}`;
  if (call.tool === "chapter") return `读章 ${call.book || ""} ${call.chapter || ""}`;
  if (call.tool === "remember") return `记住：${call.fact || ""}`;
  if (call.tool === "forget") return `忘掉：${call.q || call.fact || call.id || ""}`;
  return call.tool || "工具";
}

function agentSystemPrompt(skill, mode = "ask", verseList) {
  const ctx = aiContext(null, verseList);
  const facts = (agentMemory.facts || []).slice(-40);
  const factLines = facts.length
    ? facts.map((item) => `- (${item.kind || "topic"}) ${item.text}`).join("\n")
    : "（暂无长期记忆）";
  const many = (ctx.verses || []).length > 1;
  const modeLine =
    mode === "study"
      ? "这次用户在查经，必须用工具取经文后再回答，不要直接编章节。"
      : mode === "explain"
        ? many
          ? `请把这 ${ctx.verses.length} 节当作一段来讲解，说明节与节的关系。引用其它章节时先用工具。`
          : "请讲解当前经文。引用其它章节时先用工具。"
        : mode === "summary"
          ? "请概括本章。只根据当前章摘录，不要编其它章。"
          : mode === "polish"
            ? "请润色本节笔记，保持原意，用中文。"
            : "闲聊或讲解可以直接答；一旦要引用具体章节，必须先用工具或当前经文。";
  return [
    skill,
    modeLine,
    `当前译本：${ctx.version}`,
    `当前阅读：${ctx.ref}`,
    ctx.verseText && ctx.verseText !== "（未选中经文）" ? `当前经文：\n${ctx.verseText}` : "",
    ctx.note ? `本节笔记：${ctx.note}` : "",
    ctx.chapterText ? `本章摘录：${ctx.chapterText.slice(0, 700)}` : "",
    `长期记忆（跨会话，只信任这些条目）：\n${factLines}`,
    activeAgentNote()
      ? `当前查经笔记《${activeAgentNote().title}》：\n${activeAgentNote().summary}${
          (activeAgentNote().refs || []).length
            ? `\n相关经文：${activeAgentNote()
                .refs.map((item) => `${item.book} ${item.chapter}:${item.verse}${item.why ? `（${item.why}）` : ""}`)
                .join("；")}`
            : ""
        }\n用户是在这篇笔记上继续问，要接上笔记内容，不要当全新话题。`
      : "",
    agentMemory.summary ? `更早对话摘要：\n${agentMemory.summary}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function runAgent(question, options = {}) {
  if (!requireAiKey()) return;
  const query = String(question || "").trim();
  const mode = options.mode || (looksLikeStudyQuery(query) ? "study" : "ask");
  const verses = (options.verses && options.verses.length ? options.verses : aiVerseNumbers(options.verseNo))
    .map(Number)
    .filter((n) => n >= 1);
  const token = options.token || beginJob(mode === "study" ? "正在查经..." : "正在想...");
  if (!query) {
    finishJob(token, mode === "study" ? "请先说出或输入要找的经文" : "请先输入问题", "info");
    return;
  }
  if (!jobAlive(token)) return;
  if (verses[0]) state.activeVerse = verses[0];
  if (mode === "polish") {
    const ctx = aiContext(null, verses);
    if (!ctx.note) {
      openAiSheet("助手", verses[0] || options.verseNo);
      renderAgentChat(`<div class="panelHint">这一节还没有笔记。先写笔记再润色。</div>`);
      finishJob(token, "这一节还没有笔记", "info");
      return;
    }
  }
  rememberAgentTurn("user", query);
  openAiSheet(
    mode === "explain" && verses.length > 1 ? `讲解 ${verses.length} 节` : mode === "study" ? "智能查经" : "助手 · 智能查经",
    verses[0] || options.verseNo || state.activeVerse,
  );
  const steps = [{ text: `正在理解：${query.slice(0, 40)}` }];
  renderStudyProgress(steps, "等待模型...");
  const skill = await loadBibleStudySkill();
  if (!jobAlive(token)) return;
  const messages = [{ role: "system", content: agentSystemPrompt(skill, mode, verses) }];
  agentMemory.turns.slice(-PROMPT_TURNS).forEach((item) => {
    messages.push({ role: item.role === "user" ? "user" : "assistant", content: item.text });
  });
  try {
    for (let round = 0; round < 6; round += 1) {
      if (!jobAlive(token)) return;
      renderStudyProgress(steps, "等待模型...");
      const raw = await llmChat(messages);
      if (!jobAlive(token)) return;
      const data =
        extractJsonObject(raw) ||
        (String(raw || "").trim() ? { done: true, correction: "", answer: String(raw).trim(), refs: [] } : null);
      if (!data) throw new Error("模型没有给出可用结果");
      if (data.done) {
        const answer = [data.correction, data.answer].filter(Boolean).join("\n");
        steps.push({ text: data.correction ? `完成，并纠正：${data.correction}` : "完成", done: true });
        rememberAgentTurn("assistant", answer || "好的");
        if ((mode === "study" || looksLikeStudyQuery(query)) && data.refs && data.refs[0]) {
          const hit = data.refs[0];
          rememberFact(`查过「${query.slice(0, 24)}」→ ${hit.book} ${hit.chapter}:${hit.verse || 1}`, "topic");
        }
        renderStudyResult(data, steps);
        if (mode === "polish") {
          const verses = aiVerseNumbers(options.verseNo);
          if (verses[0] && answer) {
            const mark = markForVerse(verses[0]);
            await saveVerseMark({ ...mark, note: answer }, { successMessage: "已写入润色后的笔记" });
          }
        }
        finishJob(
          token,
          data.correction ? `完成：${data.correction}` : mode === "polish" ? "笔记已润色" : "已完成",
          data.correction ? "info" : "success",
        );
        return;
      }
      if (!data.tool) throw new Error("模型没有选择工具");
      const action = agentToolLabel(data);
      steps.push({ text: action });
      renderStudyProgress(steps, data.tool === "remember" || data.tool === "forget" ? "正在更新记忆..." : "正在查本地译本...");
      const toolResult = await runStudyTool(data);
      const found = Array.isArray(toolResult.results)
        ? toolResult.results.length
        : toolResult.text || toolResult.fact || toolResult.ok
          ? 1
          : 0;
      let resultLabel = "没有结果";
      if (toolResult.error) resultLabel = toolResult.error;
      else if (toolResult.fact) resultLabel = toolResult.updated ? "已更新" : "已记住";
      else if (toolResult.tool === "forget") resultLabel = `去掉 ${toolResult.removed || 0} 条`;
      else if (found) resultLabel = `找到 ${found} 条`;
      steps[steps.length - 1] = { text: `${action} → ${resultLabel}`, done: true };
      renderAgentMemoryBar();
      renderStudyProgress(steps, "继续让模型判断...");
      messages.push({ role: "assistant", content: JSON.stringify(data) });
      messages.push({ role: "user", content: `工具结果：${JSON.stringify(toolResult)}` });
    }
    throw new Error("回合过多，请换个说法再试");
  } catch (error) {
    if (!jobAlive(token)) return;
    renderAgentChat(`<div class="error">${escapeHtml(error.message || "助手失败")}</div>`);
    finishJob(token, error.message || "助手失败", "error");
  }
}

async function runBibleStudy(question, token) {
  return runAgent(question, { mode: "study", token });
}

async function understandSpokenCommand(spoken) {
  if (!getAiProvider().key) return null;
  try {
    const content = await mimoChatComplete(voiceIntentPrompt(spoken), spoken);
    return resolveLlmCommand(content);
  } catch {
    return null;
  }
}

const FACT_KINDS = ["profile", "reading", "preference", "topic"];
const agentMemory = { facts: [], summary: "", turns: [], notes: [], activeNoteId: null };

function newFactId() {
  return `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function rememberFact(text, kind = "topic") {
  const clean = String(text || "").replace(/\s+/g, " ").trim().slice(0, 160);
  if (!clean) return { error: "记忆内容为空" };
  const factKind = FACT_KINDS.includes(kind) ? kind : "topic";
  const existing = (agentMemory.facts || []).find(
    (item) => item.text === clean || item.text.includes(clean) || clean.includes(item.text),
  );
  if (existing) {
    existing.text = clean.length >= existing.text.length ? clean : existing.text;
    existing.kind = factKind;
    existing.at = Date.now();
    saveAgentMemory();
    return { tool: "remember", ok: true, updated: true, fact: existing.text };
  }
  agentMemory.facts.push({ id: newFactId(), text: clean, kind: factKind, at: Date.now() });
  if (agentMemory.facts.length > 40) agentMemory.facts = agentMemory.facts.slice(-40);
  saveAgentMemory();
  return { tool: "remember", ok: true, fact: clean };
}

function forgetFact(query) {
  const q = String(query || "").trim();
  if (!q) return { error: "没有要忘掉的内容" };
  const before = agentMemory.facts.length;
  agentMemory.facts = agentMemory.facts.filter((item) => item.id !== q && !String(item.text || "").includes(q));
  saveAgentMemory();
  return { tool: "forget", ok: true, removed: before - agentMemory.facts.length };
}

const HISTORY_MAX = 120;
const HISTORY_COMPACT_KEEP = 80;
const PROMPT_TURNS = 10;

function compactAgentTurns() {
  if (agentMemory.turns.length <= HISTORY_MAX) return;
  const dropped = agentMemory.turns.slice(0, -HISTORY_COMPACT_KEEP);
  const chunk = dropped
    .map((item) => `${item.role === "user" ? "用户" : "助手"}：${String(item.text || "").slice(0, 80)}`)
    .join("\n");
  agentMemory.summary = `${agentMemory.summary ? `${agentMemory.summary}\n` : ""}${chunk}`.slice(-2400);
  agentMemory.turns = agentMemory.turns.slice(-HISTORY_COMPACT_KEEP);
}

function loadAgentMemory() {
  try {
    const saved = JSON.parse(localStorage.getItem(MEMORY_KEY) || "{}");
    agentMemory.turns = Array.isArray(saved.turns) ? saved.turns.slice(-HISTORY_MAX) : [];
    agentMemory.facts = Array.isArray(saved.facts)
      ? saved.facts.filter((item) => item && item.text).slice(-40)
      : [];
    agentMemory.summary = String(saved.summary || "").slice(-2400);
    agentMemory.notes = Array.isArray(saved.notes) ? saved.notes.filter((item) => item && item.summary).slice(-30) : [];
    agentMemory.activeNoteId = saved.activeNoteId || null;
  } catch {
    agentMemory.turns = [];
    agentMemory.facts = [];
    agentMemory.summary = "";
    agentMemory.notes = [];
    agentMemory.activeNoteId = null;
  }
}

function saveAgentMemory() {
  compactAgentTurns();
  localStorage.setItem(
    MEMORY_KEY,
    JSON.stringify({
      turns: agentMemory.turns.slice(-HISTORY_MAX),
      facts: (agentMemory.facts || []).slice(-40),
      summary: String(agentMemory.summary || "").slice(-2400),
      notes: (agentMemory.notes || []).slice(-30),
      activeNoteId: agentMemory.activeNoteId || null,
    }),
  );
}

function activeAgentNote() {
  const id = agentMemory.activeNoteId;
  if (!id) return null;
  return (agentMemory.notes || []).find((item) => item.id === id) || null;
}

function readingRefLabel() {
  const book = currentBook();
  if (!book) return "";
  const verse = state.activeVerse || state.lastVerse;
  return verse ? `${book.longName} ${state.chapter}:${verse}` : `${book.longName} ${state.chapter}章`;
}

function rememberAgentTurn(role, text) {
  const clean = String(text || "").trim();
  if (!clean) return;
  agentMemory.turns.push({
    role: role === "user" ? "user" : "assistant",
    text: clean.slice(0, 1200),
    ref: readingRefLabel(),
    at: Date.now(),
  });
  compactAgentTurns();
  saveAgentMemory();
}

let pendingNewChat = false;
let pendingClearChat = false;
let pendingDeleteNoteId = "";

function resetChatActionButtons() {
  pendingNewChat = false;
  pendingClearChat = false;
  if (newAiChatBtn) newAiChatBtn.textContent = "新对话";
  if (clearAiMemoryBtn) clearAiMemoryBtn.textContent = "清空本轮";
}

function startNewConversation({ keepNote = false } = {}) {
  agentMemory.turns = [];
  agentMemory.summary = "";
  if (!keepNote) agentMemory.activeNoteId = null;
  saveAgentMemory();
  resetChatActionButtons();
  renderAgentChat();
}

function requestNewConversation() {
  if (pendingClearChat) resetChatActionButtons();
  if (!(agentMemory.turns || []).length) {
    startNewConversation();
    showStatus("已经是新对话", "info");
    return;
  }
  if (!pendingNewChat) {
    pendingNewChat = true;
    if (newAiChatBtn) newAiChatBtn.textContent = "确定新开？";
    return;
  }
  startNewConversation();
  showStatus("已开新对话，笔记还在", "info");
}

function requestClearCurrentChat() {
  if (pendingNewChat) resetChatActionButtons();
  if (!(agentMemory.turns || []).length) {
    showStatus("这一轮还没有对话", "info");
    return;
  }
  if (!pendingClearChat) {
    pendingClearChat = true;
    if (clearAiMemoryBtn) clearAiMemoryBtn.textContent = "确定清空？";
    return;
  }
  startNewConversation({ keepNote: true });
  showStatus("已清空本轮，笔记还在", "info");
}

function clearAgentMemory() {
  requestClearCurrentChat();
}

function normalizeNoteRefs(refs) {
  return (Array.isArray(refs) ? refs : [])
    .map((item) => {
      const book = resolveBookName(item.book);
      if (!book || !item.chapter) return null;
      return {
        book: book.longName,
        chapter: Number(item.chapter),
        verse: Number(item.verse) || 1,
        why: String(item.why || "").slice(0, 40),
      };
    })
    .filter(Boolean)
    .slice(0, 6);
}

function upsertAgentNote(note) {
  const next = {
    id: note.id || newFactId(),
    title: String(note.title || "查经笔记").trim().slice(0, 24) || "查经笔记",
    summary: String(note.summary || "").trim().slice(0, 800),
    refs: normalizeNoteRefs(note.refs),
    ref: readingRefLabel(),
    at: note.at || Date.now(),
    updatedAt: Date.now(),
  };
  if (!next.summary) return null;
  const list = agentMemory.notes || [];
  const index = list.findIndex((item) => item.id === next.id);
  if (index >= 0) list[index] = next;
  else list.push(next);
  agentMemory.notes = list.slice(-30);
  agentMemory.activeNoteId = next.id;
  saveAgentMemory();
  return next;
}

function deleteAgentNote(id) {
  agentMemory.notes = (agentMemory.notes || []).filter((item) => item.id !== id);
  if (agentMemory.activeNoteId === id) agentMemory.activeNoteId = null;
  saveAgentMemory();
}

let aiNotesOpen = false;

function continueAgentNote(id) {
  const note = (agentMemory.notes || []).find((item) => item.id === id);
  if (!note) return;
  agentMemory.activeNoteId = note.id;
  saveAgentMemory();
  aiNotesOpen = true;
  openAiSheet("继续笔记");
  renderAgentChat(
    `<div class="panelHint">正在根据《${escapeHtml(note.title)}》继续。直接提问即可，例如「再展开这一点」或「相关经文还有哪些」。</div>`,
  );
  aiAskInput?.focus();
}

function agentNotesMatchingFilter() {
  const tag = String(myTagFilter?.value || "").trim();
  return [...(agentMemory.notes || [])].reverse().filter((item) => {
    if (!tag) return true;
    const hay = `${item.title || ""} ${item.summary || ""} ${(item.refs || []).map((ref) => `${ref.book} ${ref.chapter}:${ref.verse}`).join(" ")}`;
    return hay.includes(tag);
  });
}

function shouldShowAgentNotesInMyPanel() {
  return myPanelKind === "all" || myPanelKind === "note" || myPanelKind === "study";
}

function agentNoteRefButtons(item) {
  return (item.refs || [])
    .map((ref) => {
      const book = resolveBookName(ref.book);
      if (!book) return "";
      return `<button class="aiNoteRef" type="button" data-jump-book="${book.id}" data-jump-chapter="${Number(ref.chapter)}" data-jump-verse="${Number(ref.verse) || 1}">${escapeHtml(book.longName)} ${Number(ref.chapter)}:${Number(ref.verse) || 1}</button>`;
    })
    .join("");
}

function agentNoteCardHtml(item, activeId) {
  const refs = agentNoteRefButtons(item);
  return `<article class="aiNoteCard${item.id === activeId ? " active" : ""}">
    <div class="aiNoteTitle">${escapeHtml(item.title)}</div>
    <div class="aiNoteSummary">${linkVerseRefs(item.summary)}</div>
    ${refs ? `<div class="aiNoteRefs">${refs}</div>` : ""}
    <div class="aiNoteActions">
      <button type="button" data-continue-note="${escapeHtml(item.id)}">${item.id === activeId ? "正在用这篇" : "继续问"}</button>
      <button type="button" data-add-note-ref="${escapeHtml(item.id)}">加上本节</button>
      <button type="button" data-delete-note="${escapeHtml(item.id)}">${pendingDeleteNoteId === item.id ? "确定删除？" : "删除"}</button>
    </div>
  </article>`;
}

function renderMyAgentNotes() {
  if (!myAgentNotesEl) return;
  if (!shouldShowAgentNotesInMyPanel()) {
    myAgentNotesEl.hidden = true;
    myAgentNotesEl.innerHTML = "";
    return;
  }
  const notes = agentNotesMatchingFilter();
  if (!notes.length) {
    myAgentNotesEl.hidden = myPanelKind !== "study";
    myAgentNotesEl.innerHTML = myPanelKind === "study"
      ? `<div class="panelHint">还没有查经笔记。在助手里聊几句，点「整理成笔记」。之后也会出现在这里。</div>`
      : "";
    return;
  }
  myAgentNotesEl.hidden = false;
  myAgentNotesEl.innerHTML = `<div class="panelTitle">查经笔记 · ${notes.length} 篇</div>${notes
    .map((item) => agentNoteCardHtml(item, agentMemory.activeNoteId))
    .join("")}`;
}

async function distillConversationToNote() {
  if (!requireAiKey()) return;
  const turns = (agentMemory.turns || []).slice(-24);
  if (turns.length < 2) {
    showStatus("先聊几句再整理成笔记", "info");
    openAiSheet("助手 · 智能查经");
    return;
  }
  const token = beginJob("正在整理笔记...");
  openAiSheet("助手 · 智能查经");
  renderStudyProgress([{ text: "正在把这次对话收成笔记" }], "等待模型...");
  const transcript = turns
    .map((item) => `${item.role === "user" ? "用户" : "助手"}：${item.text}`)
    .join("\n")
    .slice(0, 6000);
  try {
    const raw = await llmChat([
      {
        role: "user",
        content: [
          "把下面圣经阅读对话整理成一条中文笔记。只输出一个 JSON，不要 Markdown。",
          '{"title":"不超过16字","summary":"200字内要点和结论","refs":[{"book":"约翰福音","chapter":3,"verse":16,"why":"关键经文"}]}',
          "refs 必须来自对话里出现过的章节，禁止编造。没有经文时 refs 为空数组。",
          "对话：",
          transcript,
        ].join("\n"),
      },
    ]);
    if (!jobAlive(token)) return;
    const data = extractJsonObject(raw) || {};
    const summary = String(data.summary || raw || "").replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
    const note = upsertAgentNote({
      title: data.title,
      summary,
      refs: data.refs,
    });
    if (!note) throw new Error("没有整理出可用笔记");
    rememberFact(`笔记《${note.title}》`, "topic");
    aiNotesOpen = true;
    renderAgentChat(`<div class="aiNoteSaved">已保存笔记《${escapeHtml(note.title)}》。在助手点「笔记」，或到「我的 → 查经 / 笔记」里都能找到。</div>`);
    finishJob(token, `已整理成笔记：${note.title}（助手和「我的」里都能找到）`, "success");
    if (myPanel && !myPanel.hidden) renderMyAgentNotes();
  } catch (error) {
    if (!jobAlive(token)) return;
    renderAgentChat(`<div class="error">${escapeHtml(error.message || "整理笔记失败")}</div>`);
    finishJob(token, error.message || "整理笔记失败", "error");
  }
}

function syncAiNotesToggle() {
  if (!toggleAiNotesBtn) return;
  const count = (agentMemory.notes || []).length;
  toggleAiNotesBtn.textContent = count ? `笔记 · ${count}` : "笔记";
  toggleAiNotesBtn.classList.toggle("active", !!(aiNotesOpen && count));
}

function toggleAiNotes() {
  const count = (agentMemory.notes || []).length;
  if (!count) {
    showStatus("还没有查经笔记。聊几句再点「整理成笔记」。", "info");
    return;
  }
  aiNotesOpen = !aiNotesOpen;
  renderAgentNoteList();
}

function renderAiNotePeek() {
  if (!aiNotePeek) return;
  const notes = agentMemory.notes || [];
  if (aiNotesOpen || !notes.length) {
    aiNotePeek.hidden = true;
    aiNotePeek.innerHTML = "";
    return;
  }
  const latest = notes[notes.length - 1];
  aiNotePeek.hidden = false;
  aiNotePeek.innerHTML = `<button type="button" data-open-ai-notes>查经笔记《${escapeHtml(latest.title || "未命名")}》${notes.length > 1 ? ` · 共 ${notes.length} 篇` : ""} · 点开查看</button>`;
}

function renderAgentNoteList() {
  if (!aiNoteList) return;
  syncAiNotesToggle();
  renderAiNotePeek();
  const notes = [...(agentMemory.notes || [])].reverse().slice(0, 12);
  if (!aiNotesOpen || !notes.length) {
    aiNoteList.hidden = true;
    if (!notes.length) aiNoteList.innerHTML = "";
    return;
  }
  const activeId = agentMemory.activeNoteId;
  aiNoteList.hidden = false;
  aiNoteList.innerHTML = `<div class="aiHistoryHead">查经笔记 · ${agentMemory.notes.length} 篇 · 也会出现在「我的」</div>${notes
    .map((item) => agentNoteCardHtml(item, activeId))
    .join("")}`;
}

function renderAgentMemoryBar() {
  if (!aiMemoryBar) return;
  const note = activeAgentNote();
  const facts = (agentMemory.facts || []).slice(-8);
  if (!note && !facts.length) {
    aiMemoryBar.hidden = true;
    aiMemoryBar.innerHTML = "";
    return;
  }
  aiMemoryBar.hidden = false;
  const noteChip = note
    ? `<span class="aiFact active"><span class="aiFactText">笔记 · ${escapeHtml(note.title)}</span><button type="button" data-unpin-note aria-label="不用这篇">×</button></span>`
    : "";
  const factChips = facts
    .map(
      (item) =>
        `<span class="aiFact"><span class="aiFactText">${escapeHtml(item.text)}</span><button type="button" data-forget-id="${escapeHtml(item.id)}" aria-label="忘掉这条">×</button></span>`,
    )
    .join("");
  aiMemoryBar.innerHTML = `${noteChip}${factChips}`;
}

function formatTurnDay(at) {
  const date = new Date(at);
  if (!Number.isFinite(date.getTime())) return "";
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startThat = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diff = Math.round((startToday - startThat) / 86400000);
  if (diff === 0) return "今天";
  if (diff === 1) return "昨天";
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatTurnTime(at) {
  const date = new Date(at);
  if (!Number.isFinite(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function renderAgentTurnsHtml(turns) {
  let lastDay = "";
  return turns
    .map((item) => {
      const day = item.at ? formatTurnDay(item.at) : "";
      const sep = day && day !== lastDay ? `<div class="aiDaySep">${escapeHtml(day)}</div>` : "";
      if (day) lastDay = day;
      const who = item.role === "user" ? "我" : "助手";
      const time = item.at ? formatTurnTime(item.at) : "";
      const body = item.role === "assistant" ? linkVerseRefs(item.text) : escapeHtml(item.text);
      return `${sep}<div class="aiTurn ${item.role}"><div class="aiTurnMeta">${who}${time ? ` · ${escapeHtml(time)}` : ""}${item.ref ? ` · ${escapeHtml(item.ref)}` : ""}</div><div class="aiTurnText">${body}</div></div>`;
    })
    .join("");
}

function renderAgentChat(extraHtml = "") {
  if (!aiSheetContent) return;
  renderAgentNoteList();
  renderAgentMemoryBar();
  const turns = agentMemory.turns || [];
  const summary = String(agentMemory.summary || "").trim();
  const head = `<div class="aiHistoryHead">对话记录${turns.length ? ` · ${turns.length} 条` : ""}</div>`;
  const summaryHtml = summary
    ? `<div class="aiSummary"><div class="aiTurnMeta">更早的对话</div>${escapeHtml(summary)}</div>`
    : "";
  const html = renderAgentTurnsHtml(turns);
  aiSheetContent.innerHTML =
    head +
    (html || summaryHtml
      ? `${summaryHtml}${html}`
      : `<div class="panelHint">可以问这节的意思，或点底栏「助手」。聊完点「整理成笔记」，笔记会留在助手和「我的 → 查经」里。</div>`) +
    extraHtml;
  aiSheetContent.scrollTop = aiSheetContent.scrollHeight;
}

function agentChatMessages(userText) {
  const messages = [{ role: "system", content: agentSystemPrompt(bibleStudySkillText || BIBLE_STUDY_SKILL_FALLBACK, "ask") }];
  agentMemory.turns.slice(-PROMPT_TURNS).forEach((item) => {
    messages.push({ role: item.role === "user" ? "user" : "assistant", content: item.text });
  });
  if (userText) messages.push({ role: "user", content: userText });
  return messages;
}

function requireAiKey() {
  saveAiSettings();
  const provider = getAiProvider();
  if (provider.key && provider.model && provider.url) return true;
  openSidebar();
  if (!provider.key) showStatus(`请先在设置里填写${provider.name} Key`);
  else if (!provider.model) showStatus("请先填写模型名");
  else showStatus("请先填写 Base URL");
  return false;
}

function requireMimoKey() {
  saveAiSettings();
  if (state.mimoKey) return true;
  openSidebar();
  showStatus("口令识别需要小米 MiMo Key");
  return false;
}

function aiVerseNumbers(verseNo) {
  if (selectedVerseNumbers.length) return selectedVerseNumbers.map(Number).filter((n) => n >= 1);
  if (verseNo) return [Number(verseNo)].filter((n) => n >= 1);
  if (state.activeVerse) return [state.activeVerse];
  return [];
}

function verseSelectionLabel(verses) {
  const book = currentBook();
  const nums = (verses || []).map(Number).filter((n) => n >= 1);
  if (!book) return "";
  if (!nums.length) return `${book.longName} ${state.chapter}章`;
  if (nums.length === 1) return `${book.longName} ${state.chapter}:${nums[0]}`;
  const sorted = [...nums].sort((a, b) => a - b);
  const consecutive = sorted.every((n, i) => i === 0 || n === sorted[i - 1] + 1);
  if (consecutive) return `${book.longName} ${state.chapter}:${sorted[0]}-${sorted[sorted.length - 1]}`;
  return `${book.longName} ${state.chapter}:${sorted.join(",")}`;
}

function aiContext(verseNo, verseList) {
  const verses = (Array.isArray(verseList) && verseList.length ? verseList : aiVerseNumbers(verseNo)).map(Number).filter((n) => n >= 1);
  const verseText = verses.map((n) => `${n}. ${verseTextForNumber(n)}`).filter((line) => !line.endsWith(". ")).join("\n");
  return {
    ref: verseSelectionLabel(verses),
    version: versionLabel(state.version),
    verseText: verseText || "（未选中经文）",
    chapterText: chapterPlainText().slice(0, 1800),
    note: verses[0] ? markForVerse(verses[0]).note || "" : "",
    verses,
  };
}

function openAiSheet(title, verseNo, focusAsk = false) {
  closeContentPanels();
  closeSidebar();
  if (verseNo) state.activeVerse = Number(verseNo);
  aiSheet.hidden = false;
  if (aiSheetTitle) aiSheetTitle.textContent = title || "助手";
  setNav("ai");
  renderAgentChat();
  if (focusAsk) aiAskInput?.focus();
}

async function runAiTask(kind, verseNo, question = "") {
  const verses = aiVerseNumbers(verseNo);
  const labels = {
    summary: "请概括本章",
    polish: "请润色我的笔记",
    ask: question,
    explain: verses.length > 1 ? `请讲解这 ${verses.length} 节经文（${verseSelectionLabel(verses)}）` : "请讲解这节经文",
  };
  const userText = String(labels[kind] || question || "请讲解这节经文").trim();
  return runAgent(userText, { mode: kind || "ask", verseNo: verses[0] || verseNo, verses });
}

function saveAiSettings() {
  const previous = state.aiProvider || "mimo";
  const next = aiProviderSelect?.value || previous;
  const typeBefore = state.mimoKeyType;
  const typeWanted = mimoKeyTypeSelect?.value === "codeplan" ? "codeplan" : "standard";
  if (previous === "mimo" && aiKeyInput) {
    const typed = aiKeyInput.value.trim();
    if (typed) {
      if (isCodePlanKey(typed) || typeBefore === "codeplan") state.mimoCodeplanKey = typed;
      else state.mimoStandardKey = typed;
      setProviderStoredKey("mimo", typed);
    }
  } else if (aiKeyInput) {
    setProviderStoredKey(previous, aiKeyInput.value);
  }
  if (aiBaseUrlInput && (aiSpec(previous).custom || previous === "mimo")) {
    setProviderStoredUrl(previous, aiBaseUrlInput.value);
  }
  if (mimoAsrKeyInput && previous !== "mimo" && !mimoAsrKeyField?.hidden) {
    state.mimoKey = mimoAsrKeyInput.value.trim();
    state.aiKeys = { ...(state.aiKeys || {}), mimo: state.mimoKey };
  }
  if (previous === "mimo" && typeWanted !== typeBefore) {
    state.mimoKeyType = typeWanted;
    if (typeWanted === "codeplan") {
      state.mimoKey = state.mimoCodeplanKey || defaultMimoCodeplanKey();
      state.mimoBaseUrl = defaultMimoCodeplanUrl();
    } else {
      state.mimoKey = state.mimoStandardKey || defaultMimoStandardKey();
      state.mimoBaseUrl = "https://api.xiaomimimo.com/v1";
    }
    setProviderStoredKey("mimo", state.mimoKey);
    setProviderStoredUrl("mimo", state.mimoBaseUrl);
  } else {
    if (mimoKeyTypeSelect) state.mimoKeyType = typeWanted;
    if (isCodePlanKey(state.mimoKey)) state.mimoKeyType = "codeplan";
    else if (String(state.mimoKey).toLowerCase().startsWith("sk-") && previous === "mimo") state.mimoKeyType = "standard";
    if (previous === "mimo" && state.mimoKeyType !== "codeplan") {
      state.mimoBaseUrl = "https://api.xiaomimimo.com/v1";
    }
  }
  state.aiProvider = AI_PROVIDERS.some((item) => item.id === next) ? next : "mimo";
  const spec = aiSpec();
  if (next !== previous) {
    state.aiModel = spec.custom ? (state.aiCustomModel || "") : spec.models[0]?.id || MIMO_CHAT_MODEL;
    if (!spec.custom) state.aiCustomModel = "";
  } else if (aiModelSelect) {
    const selected = aiModelSelect.value;
    if (selected === CUSTOM_MODEL_VALUE || spec.custom) {
      state.aiCustomModel = (aiCustomModelInput?.value || "").trim();
      state.aiModel = state.aiCustomModel || CUSTOM_MODEL_VALUE;
    } else {
      state.aiModel = selected || spec.models[0]?.id || MIMO_CHAT_MODEL;
      state.aiCustomModel = "";
    }
  }
  if (smartVoiceToggle) state.smartVoice = !!smartVoiceToggle.checked;
  syncAiSettingsFields();
  saveState();
}

function isDirectJumpCommand(command) {
  return command && (command.type === "jump" || command.type === "moveBook" || command.type === "moveChapter");
}

function heardSuffix(spoken) {
  const raw = String(spoken || "").trim();
  return raw ? ` · 听成「${raw}」` : "";
}

function closeConfirmSheet(cancel = false) {
  if (confirmSheet) confirmSheet.hidden = true;
  const pending = pendingConfirm;
  pendingConfirm = null;
  if (cancel && pending && jobAlive(pending.token)) finishJob(pending.token, "已取消，请再说一次", "info");
}

function openBookConfirm(spoken, ambiguous, token) {
  const books = (ambiguous.books || [])
    .map((name) => state.books.find((item) => item.longName === name))
    .filter(Boolean);
  if (books.length < 2) return false;
  pendingConfirm = { spoken, tail: ambiguous.tail || "", token };
  if (confirmSheetHint) confirmSheetHint.textContent = `听成：${spoken}。请选一下是哪一卷。`;
  if (confirmSheetChoices) {
    confirmSheetChoices.innerHTML = books
      .map((book) => `<button class="resultItem" type="button" data-confirm-book="${book.id}"><div class="resultRef">${escapeHtml(book.longName)}</div><div class="resultText">${escapeHtml(book.shortName)} · ${book.chapterCount}章</div></button>`)
      .join("");
  }
  if (confirmSheet) confirmSheet.hidden = false;
  showStatus("听得不太准，请选一下是哪一卷", "info");
  return true;
}

async function applyConfirmedBook(bookId) {
  const pending = pendingConfirm;
  if (!pending) return;
  pendingConfirm = null;
  if (confirmSheet) confirmSheet.hidden = true;
  const book = state.books.find((item) => item.id === Number(bookId));
  if (!book || !jobAlive(pending.token)) return;
  const tail = pending.tail || "";
  const relative = parseRelativeTail(tail, book);
  const cv = relative || parseChapterVerseToken(tail);
  const command = relative
    ? { type: "jump", ...relative }
    : cv
      ? { type: "jump", ...clampSpokenRef(book, cv.chapter, cv.verse, cv.verse ? "verse" : "chapter") }
      : { type: "jump", ...clampSpokenRef(book, 1, null, "book") };
  await applySpokenCommand(command, pending.token, pending.spoken);
}

async function applySpokenCommand(command, token, spoken) {
  if (!command) {
    finishJob(token, `已听清：${spoken}，没有对应口令`, "info");
    return;
  }
  if (command.type === "search") {
    if (quickInput) quickInput.value = command.query;
    toggleSearch(true);
    await runSearch(command.query);
    if (jobAlive(token)) finishJob(token, `搜索完成：${command.query}${heardSuffix(spoken)}`, "success");
    return;
  }
  if (command.type === "moveBook") {
    await moveBook(command.delta, token);
    if (jobAlive(token)) finishJob(token, `已完成：${formatJumpRef({ book: state.book, chapter: 1, level: "book" })}${heardSuffix(spoken)}`, "success");
    return;
  }
  if (command.type === "moveChapter") {
    moveChapter(command.delta);
    if (jobAlive(token)) finishJob(token, `已完成：${currentBook().longName} ${state.chapter}章${heardSuffix(spoken)}`, "success");
    return;
  }
  if (command.type === "jump") {
    showStatus(`正在跳到 ${formatJumpRef(command)}...`);
    await jumpToReference(command, token);
    if (jobAlive(token)) finishJob(token, `已完成：${formatJumpRef(command)}${heardSuffix(spoken)}`, "success");
  }
}

async function handleVoiceText(text, token = jobToken) {
  const spoken = String(text || "").trim();
  if (!jobAlive(token)) return;
  if (!spoken) {
    finishJob(token, "没有听清，请再说一次", "info");
    return;
  }
  showStatus(`已听清：${spoken}，正在处理...`);
  let command = parseSpokenCommand(spoken);
  const ambiguous = typeof SpokenBooks !== "undefined" && SpokenBooks.confusableChoices
    ? SpokenBooks.confusableChoices(spoken)
    : null;
  if (ambiguous && !looksLikeStudyQuery(spoken)) {
    const previewBook = command?.type === "jump" ? state.books.find((item) => item.id === command.book) : null;
    if ((!previewBook || ambiguous.books.includes(previewBook.longName)) && openBookConfirm(spoken, ambiguous, token)) return;
  }
  if (isDirectJumpCommand(command)) {
    await applySpokenCommand(command, token, spoken);
    return;
  }
  if (looksLikeStudyQuery(spoken) && getAiProvider().key) {
    await runBibleStudy(spoken, token);
    return;
  }
  if (state.smartVoice) {
    showStatus(`已听清：${spoken}，正在用大模型理解...`);
    const understood = await understandSpokenCommand(spoken);
    if (!jobAlive(token)) return;
    if (understood) command = understood;
  }
  if (!jobAlive(token)) return;
  if (command?.type === "search" && looksLikeStudyQuery(command.query) && getAiProvider().key) {
    await runBibleStudy(command.query, token);
    return;
  }
  await applySpokenCommand(command, token, spoken);
}

window.handleAndroidVoice = function handleAndroidVoice(type, text) {
  if (type === "intent") {
    if (voiceIntentWaiter) voiceIntentWaiter(text);
    return;
  }
  if (type === "intentError") {
    if (voiceIntentWaiter) voiceIntentWaiter({ __error: text || "模型调用失败" });
    return;
  }
  if (type === "start" || type === "ready" || type === "speech") {
    voiceInputActive = true;
    if (type === "ready") setVoiceButtons("upload");
    else setVoiceButtons("record");
    return;
  }
  if (type === "partial") {
    if (text) showStatus(text);
    return;
  }
  if (type === "end") {
    setVoiceButtons("upload");
    return;
  }
  if (type === "result") {
    if (!pendingResultJob || pendingResultJob !== jobToken) return;
    const token = pendingResultJob;
    pendingResultJob = 0;
    voiceInputActive = false;
    voiceStopPending = false;
    setVoiceButtons("upload");
    handleVoiceText(text, token).catch((error) => {
      if (jobAlive(token)) finishJob(token, error.message || "口令失败", "error");
    });
    return;
  }
  if (type === "error") {
    if (!pendingResultJob || pendingResultJob !== jobToken) return;
    finishJob(pendingResultJob, text || "识别失败", "error");
    pendingResultJob = 0;
    return;
  }
  resetVoiceState();
};

function encodeWav(floatChunks, sampleRate) {
  let length = 0;
  for (const chunk of floatChunks) length += chunk.length;
  const pcm = new Int16Array(length);
  let offset = 0;
  for (const chunk of floatChunks) {
    for (let i = 0; i < chunk.length; i += 1) {
      const sample = Math.max(-1, Math.min(1, chunk[i]));
      pcm[offset] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      offset += 1;
    }
  }
  const bytes = pcm.byteLength;
  const buffer = new ArrayBuffer(44 + bytes);
  const view = new DataView(buffer);
  const writeText = (at, text) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(at + i, text.charCodeAt(i));
  };
  writeText(0, "RIFF");
  view.setUint32(4, 36 + bytes, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, bytes, true);
  new Uint8Array(buffer, 44).set(new Uint8Array(pcm.buffer));
  return new Blob([buffer], { type: "audio/wav" });
}

async function recognizeMimoInBrowser(blob) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || "").replace(/^data:[^;]+/, "data:audio/wav"));
    reader.onerror = () => reject(new Error("读取录音失败"));
    reader.readAsDataURL(blob);
  });
  const response = await fetch(normalizeMimoChatUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.mimoKey}`,
      "api-key": state.mimoKey,
    },
    body: JSON.stringify({
      model: "mimo-v2.5-asr",
      messages: [{ role: "user", content: [{ type: "input_audio", input_audio: { data: dataUrl } }] }],
      asr_options: { language: "auto" },
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(isCodePlanKey()
        ? "Code Plan 鉴权失败，请确认 tp- Key 和后台 OpenAI 兼容 Base URL"
        : "普通 Key 鉴权失败，请确认是 sk- 开头的按量 Key");
    }
    throw new Error(payload.error?.message || payload.message || `识别失败 ${response.status}`);
  }
  return payload.choices?.[0]?.message?.content || "";
}

async function startVoiceInput(event) {
  event.preventDefault();
  if (voiceInputActive && !voiceStopPending) {
    showStatus("正在录音，请先松开");
    return;
  }
  if (window.AndroidVoiceApi && window.AndroidVoiceApi.cancel) window.AndroidVoiceApi.cancel();
  if (browserAudio) {
    try {
      browserAudio.processor?.disconnect();
      browserAudio.source?.disconnect();
      browserAudio.context?.close();
    } catch {}
    browserAudio = null;
  }
  if (browserStream) {
    browserStream.getTracks().forEach((track) => track.stop());
    browserStream = null;
  }
  saveAiSettings();
  if (!state.mimoKey) {
    openSidebar();
    showStatus("口令识别需要小米 MiMo Key");
    return;
  }
  if ((state.mimoKeyType === "codeplan" || isCodePlanKey()) && !String(state.mimoBaseUrl || "").trim()) {
    openSidebar();
    showStatus("Code Plan 请填写后台显示的 OpenAI 兼容 Base URL");
    return;
  }
  voiceSession = beginJob("正在录音 · 诗篇最后一章 / 圣经箴言");
  pendingResultJob = 0;
  voiceInputActive = true;
  voiceStopPending = false;
  setVoiceButtons("record");
  if (window.AndroidVoiceApi && window.AndroidVoiceApi.startCloud) {
    window.AndroidVoiceApi.startCloud("mimo", state.mimoKey, "mimo-v2.5-asr", normalizeMimoChatUrl());
    return;
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    resetVoiceState();
    showStatus("当前环境不支持录音", "error");
    return;
  }
  try {
    browserStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const source = context.createMediaStreamSource(browserStream);
    const processor = context.createScriptProcessor(4096, 1, 1);
    const chunks = [];
    processor.onaudioprocess = (item) => {
      chunks.push(new Float32Array(item.inputBuffer.getChannelData(0)));
    };
    source.connect(processor);
    processor.connect(context.destination);
    browserAudio = {
      context,
      source,
      processor,
      chunks,
      stop: async () => {
        try {
          processor.disconnect();
          source.disconnect();
          await context.close();
        } catch {}
        if (browserStream) browserStream.getTracks().forEach((track) => track.stop());
        browserStream = null;
        const blob = encodeWav(chunks, context.sampleRate || 16000);
        if (blob.size < 1024) throw new Error("录音太短，请按住说完后再松开");
        setVoiceButtons("upload");
        pendingResultJob = voiceSession;
        showStatus("正在识别...");
        const text = await recognizeMimoInBrowser(blob);
        if (!pendingResultJob || pendingResultJob !== jobToken) return;
        const token = pendingResultJob;
        pendingResultJob = 0;
        await handleVoiceText(text, token);
      },
    };
  } catch (error) {
    resetVoiceState();
    showStatus(error.message || "无法打开麦克风", "error");
  }
}

function stopVoiceInput(event) {
  if (event) event.preventDefault();
  if (!voiceInputActive || voiceStopPending) return;
  voiceStopPending = true;
  if (window.AndroidVoiceApi && window.AndroidVoiceApi.stopCloud) {
    setVoiceButtons("upload");
    pendingResultJob = voiceSession;
    showStatus("正在识别...");
    window.AndroidVoiceApi.stopCloud();
    return;
  }
  if (browserAudio) {
    const session = browserAudio;
    browserAudio = null;
    session.stop().catch((error) => {
      resetVoiceState();
      showStatus(error.message || "语音识别失败", "error");
    });
    return;
  }
  resetVoiceState();
}

function bindVoiceButton(button) {
  if (!button) return;
  button.addEventListener("pointerdown", startVoiceInput);
  button.addEventListener("pointerup", stopVoiceInput);
  button.addEventListener("pointercancel", stopVoiceInput);
  button.addEventListener("pointerleave", (event) => {
    if (event.buttons) stopVoiceInput(event);
  });
  button.addEventListener("contextmenu", (event) => event.preventDefault());
  if (!window.PointerEvent) {
    button.addEventListener("touchstart", (event) => {
      if (event.touches.length !== 1) return;
      startVoiceInput(event);
    }, { passive: false });
    button.addEventListener("touchend", stopVoiceInput, { passive: false });
    button.addEventListener("touchcancel", stopVoiceInput, { passive: false });
  }
}

function highlightText(text, query) {
  if (!query) return escapeHtml(text);
  if (state.fuzzySearch) {
    const needle = String(query).replace(/\s+/g, "");
    if (!needle) return escapeHtml(text);
    let qi = 0;
    let out = "";
    let buf = "";
    let marking = false;
    const flush = (marked) => {
      if (!buf) return;
      out += marked ? `<mark>${escapeHtml(buf)}</mark>` : escapeHtml(buf);
      buf = "";
    };
    for (const char of String(text)) {
      if (qi < needle.length && char === needle[qi]) {
        if (!marking) {
          flush(false);
          marking = true;
        }
        buf += char;
        qi += 1;
      } else if (marking && /\s/.test(char)) {
        buf += char;
      } else {
        if (marking) {
          flush(true);
          marking = false;
        }
        buf += char;
      }
    }
    flush(marking);
    return out;
  }
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
    searchState.fuzzy = !!state.fuzzySearch;
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
      `/api/search?version=${encodeURIComponent(state.version)}&q=${encodeURIComponent(query)}&scope=${searchState.scope}&book=${searchState.book}&fuzzy=${searchState.fuzzy ? "1" : "0"}&limit=40&offset=${append ? searchState.nextOffset : 0}`,
    );
    if (token !== searchRequestToken) return;
    searchState.results = append ? [...searchState.results, ...data.results] : data.results;
    searchState.nextOffset = data.nextOffset;
    searchState.hasMore = data.hasMore;
    if (!append) rememberSearch(query);
    renderRecentSearches();
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

function searchScopeLabel() {
  if (searchState.scope === "ot") return "旧约";
  if (searchState.scope === "nt") return "新约";
  if (searchState.scope === "book") {
    const book = state.books.find((item) => item.id === searchState.book);
    return book ? `本卷 · ${book.longName}` : "本卷";
  }
  return "全本";
}

function restoreSearchPeek() {
  closeTopPanels();
  searchPanel.hidden = false;
  setNav("search");
  renderRecentSearches();
  if (searchState.query) renderSearchResults();
}

function renderSearchResults() {
  const here = searchState.results.filter((item) => item.book === searchState.book).length;
  const extra = searchState.scope === "all" && here ? `，本卷 ${here} 处在前` : "";
  searchSummary.textContent = `${searchScopeLabel()}${searchState.fuzzy ? " · 模糊" : ""} · “${searchState.query}” 找到 ${searchState.results.length}${searchState.hasMore ? "+" : ""} 处${extra}`;
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

async function searchDictionary(query) {
  const value = String(query || dictionarySheetInput?.value || dictionaryInput?.value || "").trim();
  if (!value || !state.dictionary) {
    showStatus(!state.dictionary ? "请先选择辞典" : "请输入词条");
    if (dictionaryPanel?.hidden) openDictionarySheet();
    return;
  }
  setDictionaryQuery(value);
  const token = ++dictionaryRequestToken;
  const buttons = [dictionaryBtn, dictionarySheetBtn].filter(Boolean);
  buttons.forEach((button) => {
    button.disabled = true;
    button.textContent = "查找中";
  });
  closeContentPanels();
  closeSidebar();
  dictionaryPanel.hidden = false;
  try {
    const data = await api(`/api/dictionary/search?source=${encodeURIComponent(state.dictionary)}&q=${encodeURIComponent(value)}`);
    if (token !== dictionaryRequestToken) return;
    if (dictionarySummary) dictionarySummary.textContent = `“${value}” · ${data.title} · ${data.results.length} 条`;
    dictionaryResults.innerHTML = data.results.length
      ? data.results
          .map(
            (item) => `
              <article class="resultItem">
                <div class="resultRef">${escapeHtml(item.word)}</div>
                <div class="resultText">${item.text ? linkVerseRefs(item.text) : item.encrypted ? (item.images?.length ? "说明已加密，配图仍可看。" : "词条说明已加密，无法显示。") : "（无文本）"}</div>
                ${renderModuleImages(item.images)}
              </article>
            `,
          )
          .join("")
      : `<div class="panelHint">没有找到词条</div>`;
    if (dictionaryHint) dictionaryHint.textContent = `${data.results.length} 条`;
  } catch (error) {
    if (token !== dictionaryRequestToken) return;
    if (dictionaryHint) dictionaryHint.textContent = error.message;
    if (dictionarySummary) dictionarySummary.textContent = error.message;
    dictionaryResults.innerHTML = `<div class="error">${escapeHtml(error.message)}</div>`;
  } finally {
    if (token === dictionaryRequestToken) {
      buttons.forEach((button) => {
        button.disabled = false;
        button.textContent = "查";
      });
    }
  }
}

let myPanelKind = "all";
let myManageKey = "";
let myManageAction = "";
let pendingUnfavorite = false;
const myMarksByKey = new Map();

function myMarkKey(item) {
  return `${item.version}:${item.book}:${item.chapter}:${item.verse}`;
}

async function openMyPanel(kind = "all", options = {}) {
  if (myPanelLoading) {
    showStatus("正在读取我的内容，请稍候");
    return;
  }
  myPanelKind = kind || "all";
  if (!options.refresh) resetMyManage();
  const token = ++myPanelRequestToken;
  myPanelLoading = true;
  if (!options.refresh) {
    closeContentPanels();
    closeSidebar();
    myPanel.hidden = false;
    setNav("my");
    setMyTab(options.tab || "marks");
  }
  renderMyProgress();
  renderMyAgentNotes();
  myResults.innerHTML = kind === "study" ? "" : `<div class="loading">正在读取我的收藏与笔记...</div>`;
  document.querySelectorAll("[data-my-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.myFilter === kind);
    button.disabled = true;
  });
  try {
    if (kind === "study") {
      renderMyResults([]);
      return;
    }
    const tag = myTagFilter.value.trim();
    const data = await api(`/api/user/marks/all?kind=${encodeURIComponent(kind === "all" ? "" : kind)}&tag=${encodeURIComponent(tag)}`);
    if (token !== myPanelRequestToken) return;
    renderMyAgentNotes();
    renderMyResults(data.marks);
  } catch (error) {
    if (token !== myPanelRequestToken) return;
    renderMyAgentNotes();
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

function myMarkActions(item) {
  const actions = [];
  if (item.favorite) actions.push(["favorite", "取消收藏"]);
  if (item.highlighted) actions.push(["highlight", "取消高亮"]);
  if (item.note || item.tags) actions.push(["note", "删除笔记"]);
  return actions;
}

function myConfirmLabel(action, item) {
  const ref = `${item.bookName || ""} ${item.chapter}:${item.verse}`.trim();
  if (action === "favorite") return `确定取消收藏「${ref}」？`;
  if (action === "highlight") return `确定去掉「${ref}」的高亮？`;
  return `确定删除「${ref}」的笔记？删除后不能恢复。`;
}

function renderMyResults(marks) {
  myMarksByKey.clear();
  (marks || []).forEach((item) => myMarksByKey.set(myMarkKey(item), item));
  if (!marks.length) {
    const hasStudy = shouldShowAgentNotesInMyPanel() && agentNotesMatchingFilter().length;
    myResults.innerHTML = hasStudy || myPanelKind === "study" ? "" : `<div class="panelHint">这里还是空的</div>`;
    return;
  }
  myResults.innerHTML = marks
        .map((item) => {
          const key = myMarkKey(item);
          const summary = item.note
            ? linkVerseRefs(item.note)
            : escapeHtml(item.tags || (item.highlighted ? "高亮经文" : item.favorite ? "收藏" : ""));
          const actions = myMarkActions(item);
          const managing = myManageKey === key;
          let extra = "";
          if (managing && myManageAction) {
            extra = `<div class="myItemConfirm">
              <span>${escapeHtml(myConfirmLabel(myManageAction, item))}</span>
              <button type="button" data-confirm-clear="${myManageAction}" data-mark-key="${escapeHtml(key)}">确定</button>
              <button type="button" data-manage-cancel>返回</button>
            </div>`;
          } else if (managing) {
            extra = `<div class="myItemConfirm">
              ${actions.map(([action, label]) => `<button type="button" data-manage-action="${action}" data-mark-key="${escapeHtml(key)}">${label}</button>`).join("")}
              <button type="button" data-manage-cancel>返回</button>
            </div>`;
          }
          const manage = actions.length
            ? `<button class="myItemManage" type="button" data-manage="${escapeHtml(key)}">管理</button>`
            : "";
          return `<div class="myItem${managing ? " managing" : ""}" data-my-item="${escapeHtml(key)}">
            <article class="resultItem">
              <button type="button" class="resultRef" data-jump-book="${item.book}" data-jump-chapter="${item.chapter}" data-jump-verse="${item.verse}">${escapeHtml(item.bookName)} ${item.chapter}:${item.verse} ${item.favorite ? "★" : ""} ${item.highlighted ? "高亮" : ""}</button>
              <div class="resultText">${summary}</div>
            </article>
            ${manage}
            ${extra}
          </div>`;
        })
        .join("");
}

function resetMyManage() {
  myManageKey = "";
  myManageAction = "";
}

async function patchMyMark(key, patch, message) {
  const item = myMarksByKey.get(key);
  if (!item) return;
  await saveVerseMark(
    {
      version: item.version || state.version,
      book: item.book,
      chapter: item.chapter,
      verse: item.verse,
      favorite: patch.favorite !== undefined ? patch.favorite : !!item.favorite,
      highlighted: patch.highlighted !== undefined ? patch.highlighted : !!item.highlighted,
      highlightColor: patch.highlightColor !== undefined ? patch.highlightColor : item.highlightColor || "",
      note: patch.note !== undefined ? patch.note : item.note || "",
      tags: patch.tags !== undefined ? patch.tags : item.tags || "",
    },
    { successMessage: message },
  );
  resetMyManage();
  if (!myPanel.hidden) await openMyPanel(myPanelKind, { refresh: true });
}

async function confirmClearMyMark(key, action) {
  if (action === "favorite") return patchMyMark(key, { favorite: false }, "已取消收藏");
  if (action === "highlight") return patchMyMark(key, { highlighted: false, highlightColor: "" }, "已取消高亮");
  if (action === "note") return patchMyMark(key, { note: "", tags: "" }, "已删除笔记");
}

function updateVerseMarkDom(mark) {
  const verse = content.querySelector(`.verse[data-verse="${mark.verse}"]`);
  if (!verse) return;
  verse.className = `verse ${verseMarkClasses(mark)}`;
  if (selectedVerseNumbers.includes(Number(mark.verse))) verse.classList.add("selectedVerse");
  const body = verse.querySelector(".verseBody");
  if (!body) return;
  const preview = body.querySelector(".notePreview");
  const html = renderNoteEditor(mark.verse);
  if (html) {
    if (preview) preview.outerHTML = html;
    else body.insertAdjacentHTML("beforeend", html);
  } else if (preview) {
    preview.remove();
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
    const saved = data.mark;
    const sameChapter =
      saved.version === state.version && Number(saved.book) === Number(state.book) && Number(saved.chapter) === Number(state.chapter);
    if (sameChapter) {
      state.marks.set(Number(saved.verse), saved);
      updateVerseMarkDom(saved);
    }
    if (options.successMessage) showStatus(options.successMessage, "success");
    return saved;
  } finally {
    markSavingKeys.delete(key);
  }
}

function verseTextForNumber(verseNo) {
  return content.querySelector(`.verse[data-verse="${verseNo}"] .verseText`)?.textContent.trim() || "";
}

function formatVerseLines(verseNumbers, format = state.copyFormat || "reference") {
  const book = currentBook();
  const nums = verseNumbers.map(Number).filter((n) => n >= 1);
  const lines = nums
    .map((verseNo) => {
      const verse = verseTextForNumber(verseNo);
      if (!verse) return "";
      if (format === "plain") return verse;
      if (format === "numbered") return `${verseNo} ${verse}`;
      return `${book.longName} ${state.chapter}:${verseNo} ${verse}`;
    })
    .filter(Boolean);
  if (format === "numbered" && nums.length) {
    const first = nums[0];
    const last = nums[nums.length - 1];
    const ref = nums.length === 1 ? `${book.longName} ${state.chapter}:${first}` : `${book.longName} ${state.chapter}:${first}-${last}`;
    return `${ref}\n${lines.join("\n")}`;
  }
  if (format === "paragraph") {
    const first = nums[0];
    const last = nums[nums.length - 1];
    const ref = nums.length === 1 ? `${book.longName} ${state.chapter}:${first}` : `${book.longName} ${state.chapter}:${first}-${last}`;
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

let verseMenuPoint = { x: 12, y: 12 };

function setVerseMenuMore(show) {
  if (verseMenuMore) verseMenuMore.hidden = !show;
  if (verseMenuMoreBtn) verseMenuMoreBtn.textContent = show ? "收起" : "更多";
  if (!verseMenu.hidden) placeVerseMenu();
}

function placeVerseMenu(x = verseMenuPoint.x, y = verseMenuPoint.y) {
  verseMenuPoint = { x: Number(x) || 12, y: Number(y) || 12 };
  if (!verseMenu || verseMenu.hidden) return;
  const pad = 8;
  const barTop = selectionBar && !selectionBar.hidden ? selectionBar.getBoundingClientRect().top : window.innerHeight;
  const limitBottom = Math.min(window.innerHeight - pad, barTop - 8);
  const maxH = Math.max(140, limitBottom - pad);
  verseMenu.style.maxHeight = `${maxH}px`;
  verseMenu.style.overflowY = "auto";
  const width = verseMenu.offsetWidth || 176;
  const height = Math.min(verseMenu.scrollHeight || verseMenu.offsetHeight, maxH);
  const left = Math.max(pad, Math.min(verseMenuPoint.x, window.innerWidth - width - pad));
  let top = verseMenuPoint.y;
  if (top + height > limitBottom) top = limitBottom - height;
  top = Math.max(pad, top);
  verseMenu.style.left = `${left}px`;
  verseMenu.style.top = `${top}px`;
}

function openVerseMenu(verseNo, x, y, expandMore = false) {
  const mark = markForVerse(verseNo);
  state.activeVerse = Number(verseNo);
  rememberReadingPosition(verseNo);
  const nums =
    selectedVerseNumbers.length && selectedVerseNumbers.includes(Number(verseNo))
      ? selectedVerseNumbers
      : [Number(verseNo)];
  verseMenuTitle.textContent = verseSelectionLabel(nums);
  pendingUnfavorite = false;
  verseMenu.querySelector('[data-menu-action="favorite"]').textContent = mark.favorite ? "取消收藏" : "收藏";
  verseMenu.querySelector('[data-menu-action="highlight"]').textContent = mark.highlighted || mark.highlightColor ? "取消高亮" : "高亮";
  if (verseHighlightColors) verseHighlightColors.hidden = true;
  verseMenu.hidden = false;
  setVerseMenuMore(expandMore);
  placeVerseMenu(x, y);
}

function closeVerseMenu() {
  verseMenu.hidden = true;
  pendingUnfavorite = false;
  if (verseHighlightColors) verseHighlightColors.hidden = true;
  setVerseMenuMore(false);
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
  verseSelectionMode = "multi";
  selectedVerseNumbers = Number.isFinite(Number(verseNo)) ? [Number(verseNo)] : [];
  updateManualSelectionBar();
}

function toggleVerseSelection(verseNo) {
  const value = Number(verseNo);
  if (!Number.isFinite(value) || value < 1) return;
  document.body.classList.remove("chromeHidden");
  if (verseSelectionMode === "multi") {
    selectedVerseNumbers = selectedVerseNumbers.includes(value)
      ? selectedVerseNumbers.filter((item) => item !== value)
      : [...selectedVerseNumbers, value];
  } else if (selectedVerseNumbers.length === 1 && selectedVerseNumbers[0] === value) {
    closeSelectionBar();
    return;
  } else {
    selectedVerseNumbers = [value];
    verseSelectionMode = "single";
  }
  state.activeVerse = value;
  updateManualSelectionBar();
}

function closeSelectionBar() {
  window.getSelection()?.removeAllRanges();
  selectionBar.hidden = true;
  selectedVerseNumbers = [];
  verseSelectionMode = false;
  if (highlightColors) highlightColors.hidden = true;
  renderVerseSelectionState();
}

async function copyVerses(verseNumbers, format = state.copyFormat) {
  const nums = (verseNumbers || []).map(Number).filter((n) => n >= 1);
  if (!nums.length) return;
  await writeClipboard(formatVerseLines(nums, format));
  const label = format === "plain" ? "只要经文" : format === "numbered" ? "带节号" : "带出处";
  showStatus(`已复制（${label}）`, "success");
}

async function copySelectedVerses() {
  await copyVerses(selectedVerseNumbers.length ? selectedVerseNumbers : [state.activeVerse], state.copyFormat);
}

async function runVerseAction(action, verseNo = state.activeVerse) {
  if (!verseNo) return;
  if (action === "more") {
    setVerseMenuMore(verseMenuMore ? verseMenuMore.hidden : true);
    return;
  }
  const mark = markForVerse(verseNo);
  if (action === "highlight") {
    pendingUnfavorite = false;
    const fromMenu = verseMenu && !verseMenu.hidden;
    const already = !!(mark.highlighted || mark.highlightColor);
    if (fromMenu && already) {
      closeVerseMenu();
      await applyHighlightColor("");
      return;
    }
    const palette = !selectionBar.hidden && highlightColors ? highlightColors : verseHighlightColors;
    if (palette) {
      palette.hidden = !palette.hidden;
      if (!verseMenu.hidden) placeVerseMenu();
    }
    return;
  }
  if (action === "favorite" && mark.favorite && !pendingUnfavorite) {
    pendingUnfavorite = true;
    const button = verseMenu.querySelector('[data-menu-action="favorite"]');
    if (button) button.textContent = "确定取消收藏？";
    return;
  }
  closeVerseMenu();
  if (action === "select") {
    startVerseSelection(verseNo);
    return;
  }
  if (action === "compare") {
    await showCompareSheet(verseNo);
    return;
  }
  if (action === "commentary") {
    await showCommentarySheet(verseNo);
    return;
  }
  if (action === "explain") {
    await runAiTask("explain", verseNo);
    return;
  }
  if (action === "ask") {
    openAiSheet("提问", verseNo, true);
    return;
  }
  if (action === "share") {
    await openShareSheet(selectedVerseNumbers.length ? selectedVerseNumbers : [verseNo]);
    return;
  }
  if (action === "favorite") {
    const verses = selectedVerseNumbers.length ? selectedVerseNumbers : [verseNo];
    const next = !mark.favorite;
    for (const number of verses) {
      const item = markForVerse(number);
      await saveVerseMark({ ...item, favorite: next });
    }
    pendingUnfavorite = false;
    showStatus(next ? "已收藏" : "已取消收藏", "success");
    return;
  }
  if (action === "note") {
    openNoteSheet(verseNo);
    return;
  }
  if (action === "multi") {
    verseSelectionMode = "multi";
    showStatus("再点经文可连选");
    return;
  }
  if (action === "copy" || action === "copy-reference" || action === "copy-plain" || action === "copy-numbered") {
    const format = action === "copy-plain" ? "plain" : action === "copy-numbered" ? "numbered" : action === "copy-reference" ? "reference" : state.copyFormat;
    if (action !== "copy") {
      state.copyFormat = format;
      if (copyFormatSelect) copyFormatSelect.value = format;
      saveState();
    }
    const nums = selectedVerseNumbers.length ? selectedVerseNumbers : [verseNo];
    await copyVerses(nums, format);
    return;
  }
  if (action === "dictionary") {
    setDictionaryQuery(verseTextForNumber(verseNo).slice(0, 12));
    await searchDictionary(dictionaryInput?.value || dictionarySheetInput?.value);
  }
}

async function applyHighlightColor(color) {
  const verses = selectedVerseNumbers.length ? selectedVerseNumbers : state.activeVerse ? [state.activeVerse] : [];
  if (!verses.length) return;
  for (const verseNo of verses) {
    const mark = markForVerse(verseNo);
    await saveVerseMark(
      { ...mark, highlighted: !!color, highlightColor: color || "" },
      { successMessage: color ? "已高亮" : "已取消高亮" },
    );
  }
  if (highlightColors) highlightColors.hidden = true;
  if (verseHighlightColors) verseHighlightColors.hidden = true;
  closeVerseMenu();
}

function renderCommentarySources() {
  if (!commentarySourceList) return;
  if (!state.commentaries.length) {
    commentarySourceList.innerHTML = `<div class="panelHint">还没有注释库。请到「我的」下载离线资源。</div>`;
    return;
  }
  if (!state.commentary) state.commentary = state.commentaries[0].id;
  commentarySourceList.innerHTML = state.commentaries
    .map(
      (item) =>
        `<button type="button" class="${item.id === state.commentary ? "active" : ""}" data-pick-commentary="${escapeHtml(item.id)}">${escapeHtml(item.title)}</button>`,
    )
    .join("");
}

function renderCompareSources() {
  if (!compareSourceList) return;
  compareSourceList.innerHTML = state.versions
    .filter((item) => item.id !== state.version)
    .map((item) => {
      const checked = state.compareVersions.includes(item.id);
      return `<button type="button" class="${checked ? "active" : ""}" data-pick-compare="${escapeHtml(item.id)}">${escapeHtml(item.shortName || item.name)}</button>`;
    })
    .join("");
}

function insertNoteVerseRef() {
  if (!noteSheetText) return;
  const nums = selectedVerseNumbers.length ? selectedVerseNumbers : noteSheetVerse ? [noteSheetVerse] : [];
  const label = verseSelectionLabel(nums);
  if (!label) {
    showStatus("先选一节经文再插入引用");
    return;
  }
  const el = noteSheetText;
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? start;
  const before = el.value.slice(0, start);
  const after = el.value.slice(end);
  const padL = before && !/\s$/.test(before) ? " " : "";
  const padR = after && !/^\s/.test(after) ? " " : "";
  el.value = `${before}${padL}${label}${padR}${after}`;
  const cursor = (before + padL + label + padR).length;
  el.focus();
  el.setSelectionRange(cursor, cursor);
  showStatus(`已插入 ${label}`, "success");
}

function addCurrentVerseToAgentNote(id) {
  const note = (agentMemory.notes || []).find((item) => item.id === id);
  const book = currentBook();
  const verse = Number(state.activeVerse || state.lastVerse || selectedVerseNumbers[0] || 0);
  if (!note || !book || !verse) {
    showStatus("先打开一节经文，再点加上本节");
    return;
  }
  const refs = Array.isArray(note.refs) ? note.refs.slice() : [];
  const exists = refs.some(
    (item) => item.book === book.longName && Number(item.chapter) === Number(state.chapter) && Number(item.verse) === verse,
  );
  if (!exists) {
    refs.push({ book: book.longName, chapter: Number(state.chapter), verse, why: "手加" });
    note.refs = refs.slice(0, 8);
    note.updatedAt = Date.now();
    saveAgentMemory();
  }
  renderAgentChat();
  renderMyAgentNotes();
  showStatus(exists ? "这篇笔记已经有这节" : `已加上 ${book.longName} ${state.chapter}:${verse}`, exists ? "info" : "success");
}

function openNoteSheet(verseNo) {
  const verse = Number(verseNo || selectedVerseNumbers[0] || state.activeVerse);
  if (!verse) return;
  noteSheetVerse = verse;
  const mark = markForVerse(verse);
  closeContentPanels();
  noteSheet.hidden = false;
  if (noteSheetTitle) noteSheetTitle.textContent = `${currentBook().longName} ${state.chapter}:${verse}`;
  if (noteSheetText) noteSheetText.value = mark.note || "";
  if (noteSheetTags) noteSheetTags.value = mark.tags || "";
  noteSheetText?.focus();
}

async function saveNoteSheet() {
  if (!noteSheetVerse) return;
  const mark = markForVerse(noteSheetVerse);
  await saveVerseMark(
    { ...mark, note: noteSheetText?.value || "", tags: noteSheetTags?.value || "" },
    { successMessage: "已保存笔记" },
  );
  noteSheet.hidden = true;
  keepReadingChromeVisible();
}

async function showCommentarySheet(verseNo) {
  const verse = Number(verseNo || selectedVerseNumbers[0] || state.activeVerse);
  if (!verse) return;
  closeContentPanels();
  commentarySheet.hidden = false;
  commentarySheetTitle.textContent = `${currentBook().longName} ${state.chapter}:${verse} 注释`;
  renderCommentarySources();
  if (!state.commentary) {
    commentarySheetContent.innerHTML = `<div class="panelHint">请先下载或选择一本注释。</div>`;
    return;
  }
  commentarySheetContent.innerHTML = `<div class="loading">正在读取本节注释...</div>`;
  try {
    const data = await api(`/api/commentary?source=${encodeURIComponent(state.commentary)}&book=${state.book}&chapter=${state.chapter}`);
    const entries = (data.entries || []).filter((entry) => {
      if (entry.chapter === 0) return true;
      const from = Number(entry.fromVerse || 0);
      const to = Number(entry.toVerse || from);
      if (!from) return entry.chapter === state.chapter;
      return verse >= from && verse <= (to || from);
    });
    commentarySheetContent.innerHTML = entries.length
      ? `<div class="resultRef" style="margin-bottom:8px">${escapeHtml(data.title || "")}</div>` +
        (data.encrypted && !entries.some((entry) => entry.text)
          ? `<div class="panelHint">这篇注释的文字已加密，暂时无法显示。有地图或配图时会显示图片。</div>`
          : "") +
        entries
          .map(
            (entry) => `<article class="resultItem" data-jump-book="${state.book}" data-jump-chapter="${Number(entry.chapter || state.chapter) || state.chapter}" data-jump-verse="${Number(entry.fromVerse || 1)}"><div class="resultRef">${escapeHtml(formatCommentaryRef(entry))}</div><div class="resultText">${entry.text ? linkVerseRefs(entry.text) : entry.encrypted ? (entry.images?.length ? "文字已加密，配图仍可看。" : "文字已加密，无法显示。") : "（无文本）"}</div>${renderModuleImages(entry.images)}</article>`,
          )
          .join("")
      : `<div class="panelHint">这一节没有对应注释。</div>`;
  } catch (error) {
    commentarySheetContent.innerHTML = `<div class="error">${escapeHtml(error.message)}</div>`;
  }
}

function wrapShareText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const chars = String(text || "").split("");
  let line = "";
  let lines = 0;
  let cursorY = y;
  for (const char of chars) {
    const test = line + char;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = char;
      cursorY += lineHeight;
      lines += 1;
      if (lines >= maxLines - 1) break;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cursorY);
}

function drawShareCard(verses, theme) {
  const canvas = shareCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dark = theme === "dark";
  shareTheme = dark ? "dark" : "light";
  shareThemeRow?.querySelectorAll("[data-share-theme]").forEach((button) => {
    button.classList.toggle("active", button.dataset.shareTheme === shareTheme);
  });
  ctx.fillStyle = dark ? "#171614" : "#f7f1e4";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = dark ? "#2a2621" : "#efe6d4";
  ctx.fillRect(72, 72, canvas.width - 144, canvas.height - 144);
  ctx.fillStyle = dark ? "#ede7dc" : "#2a241c";
  ctx.font = "bold 44px serif";
  ctx.fillText(currentBook().longName, 120, 200);
  ctx.font = "32px sans-serif";
  ctx.fillStyle = dark ? "#d6a16f" : "#8a4f2a";
  ctx.fillText(`${state.chapter}:${verses[0]}${verses.length > 1 ? `-${verses[verses.length - 1]}` : ""}  ·  ${versionLabel(state.version)}`, 120, 260);
  ctx.fillStyle = dark ? "#ede7dc" : "#24211d";
  ctx.font = "46px serif";
  wrapShareText(ctx, verses.map((n) => verseTextForNumber(n)).join(""), 120, 360, canvas.width - 240, 72, 12);
  ctx.fillStyle = dark ? "#74b8a8" : "#2d6a5f";
  ctx.font = "28px sans-serif";
  ctx.fillText("本地圣经", 120, canvas.height - 120);
}

async function openShareSheet(verseNumbers) {
  const verses = (verseNumbers || []).filter(Boolean);
  if (!verses.length) return;
  closeContentPanels();
  shareSheet.hidden = false;
  lastShareVerses = verses;
  drawShareCard(verses, resolvedTheme() === "dark" ? "dark" : "light");
}

async function shareOrSaveCard(share) {
  if (!shareCanvas) return;
  const dataUrl = shareCanvas.toDataURL("image/png");
  const text = formatVerseLines(selectedVerseNumbers.length ? selectedVerseNumbers : [state.activeVerse], "reference");
  if (window.AndroidShareApi && window.AndroidShareApi.shareImage) {
    const result = JSON.parse(window.AndroidShareApi.shareImage(dataUrl, text || ""));
    if (result.error) showStatus(result.error, "error");
    else showStatus(share ? "已打开分享" : "已保存到分享", "success");
    return;
  }
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], "bible-verse.png", { type: "image/png" });
  if (share && navigator.share) {
    try {
      await navigator.share({ files: [file], text, title: verseReference(selectedVerseNumbers[0] || state.activeVerse) });
      showStatus("已分享", "success");
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = "bible-verse.png";
  link.click();
  showStatus("已保存图片", "success");
}

async function setCurrentChapterRead(read) {
  if (progressSaving) {
    showStatus("正在保存阅读进度，请稍候");
    return;
  }
  progressSaving = true;
  try {
    const data = await postJson("/api/user/progress", {
      version: state.version,
      book: state.book,
      chapter: state.chapter,
      read,
    });
    state.progress = data.progress;
    renderChrome();
    renderMyProgress();
    renderChapterGrid();
    showStatus(read ? "已标记本章为已读" : "已取消已读", "success");
  } catch (error) {
    showStatus(error.message, "error");
  } finally {
    progressSaving = false;
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
    const text = JSON.stringify(data, null, 2);
    const fileName = `bible-reader-data-${new Date().toISOString().slice(0, 10)}.json`;
    if (window.AndroidShareApi && window.AndroidShareApi.shareText) {
      const result = JSON.parse(window.AndroidShareApi.shareText(text, fileName));
      if (result.error) throw new Error(result.error);
      userDataHint.textContent = "已打开系统分享";
      showStatus("选择保存或发送导出文件", "success");
      return;
    }
    const blob = new Blob([text], { type: "application/json" });
    const file = new File([blob], fileName, { type: "application/json" });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: "本地圣经个人数据" });
      userDataHint.textContent = "数据已分享";
      showStatus("数据导出完成", "success");
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
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

function chapterPlainText() {
  return [...content.querySelectorAll(".verseText")]
    .map((el) => el.textContent.trim())
    .filter(Boolean)
    .join("。");
}

function setSpeaking(on) {
  speaking = !!on;
  if (!speaking) clearSpeakingVerse();
  if (speakToggleBtn) {
    speakToggleBtn.classList.toggle("active", speaking);
    speakToggleBtn.setAttribute("aria-pressed", speaking ? "true" : "false");
    speakToggleBtn.setAttribute("aria-label", speaking ? "停止朗读" : "朗读本章");
  }
}

function clearSpeakingVerse() {
  content?.querySelectorAll(".speakingVerse").forEach((el) => el.classList.remove("speakingVerse"));
}

function setSpeakingVerse(id) {
  const verseNo = String(id || "").replace(/^v/, "");
  if (!/^\d+$/.test(verseNo)) return;
  clearSpeakingVerse();
  const el = content.querySelector(`.verse[data-verse="${verseNo}"]`);
  if (!el) return;
  el.classList.add("speakingVerse");
  el.scrollIntoView({ block: "center", behavior: "smooth" });
  rememberReadingPosition(Number(verseNo));
}

function chapterSpeakItems() {
  return [...content.querySelectorAll(".verse[data-verse]")]
    .map((el) => {
      const verse = Number(el.dataset.verse);
      const text = el.querySelector(".verseText")?.textContent.trim() || "";
      return text ? { id: `v${verse}`, verse, text } : null;
    })
    .filter(Boolean);
}

function applyTtsRate() {
  if (window.AndroidTtsApi && window.AndroidTtsApi.setRate) {
    try {
      window.AndroidTtsApi.setRate(String(state.ttsRate || 1));
    } catch {}
  }
}

function speakChapter() {
  openAudioSheet();
  if (speaking) {
    stopSpeaking();
    return;
  }
  const book = currentBook();
  const items = chapterSpeakItems();
  if (!items.length) {
    setTtsStatus("这一章没有可朗读的经文");
    showStatus("没有可朗读的经文");
    return;
  }
  applyTtsRate();
  if (window.AndroidTtsApi && (window.AndroidTtsApi.speakQueue || window.AndroidTtsApi.speak)) {
    let result = {};
    try {
      result = JSON.parse(
        window.AndroidTtsApi.speakQueue
          ? window.AndroidTtsApi.speakQueue(JSON.stringify(items))
          : window.AndroidTtsApi.speak(`${book ? book.longName : ""} 第 ${state.chapter} 章。${items.map((item) => item.text).join("。")}`),
      );
    } catch {
      result = { error: "朗读接口异常" };
    }
    if (result.error) {
      setSpeaking(false);
      setTtsStatus(result.error);
      showStatus(result.error, "error");
      return;
    }
    setSpeaking(true);
    if (result.queued) {
      setTtsStatus("正在启动朗读引擎…");
      showStatus("正在启动朗读引擎");
      return;
    }
    setTtsStatus(`正在朗读 ${book ? book.longName : ""} ${state.chapter} 章`);
    showStatus("开始朗读本章");
    return;
  }
  if (!window.speechSynthesis) {
    setTtsStatus("当前环境不支持朗读");
    showStatus("当前环境不支持朗读", "error");
    return;
  }
  window.speechSynthesis.cancel();
  const speakNext = (index) => {
    if (index >= items.length) {
      setSpeaking(false);
      setTtsStatus("朗读结束");
      if (state.audioAutoNext) moveChapter(1);
      return;
    }
    setSpeakingVerse(items[index].id);
    const utterance = new SpeechSynthesisUtterance(items[index].text);
    utterance.lang = "zh-CN";
    utterance.rate = Number(state.ttsRate) || 1;
    utterance.onend = () => {
      if (speaking) speakNext(index + 1);
    };
    utterance.onerror = () => {
      setSpeaking(false);
      setTtsStatus("朗读中断");
    };
    window.speechSynthesis.speak(utterance);
  };
  setSpeaking(true);
  setTtsStatus(`正在朗读 ${book ? book.longName : ""} ${state.chapter} 章`);
  showStatus("开始朗读本章");
  speakNext(0);
}

function stopSpeaking() {
  if (window.AndroidTtsApi && window.AndroidTtsApi.stop) window.AndroidTtsApi.stop();
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  setSpeaking(false);
  setTtsStatus("已停止朗读");
  showStatus("已停止朗读");
}

window.handleAndroidTts = function handleAndroidTts(type, text) {
  if (type === "ready") {
    if (speaking) setTtsStatus(`正在朗读 ${currentBook()?.longName || ""} ${state.chapter} 章`);
    else setTtsStatus("朗读引擎已就绪，可以开始。");
    return;
  }
  if (type === "start") {
    setSpeaking(true);
    setSpeakingVerse(text);
    return;
  }
  if (type === "done") {
    setSpeaking(false);
    setTtsStatus("朗读结束");
    if (state.audioAutoNext) moveChapter(1);
    return;
  }
  if (type === "error") {
    setSpeaking(false);
    setTtsStatus(text || "朗读失败");
    showStatus(text || "朗读失败", "error");
  }
};

function renderPackages(packages) {
  if (!packageList) return;
  if (!packages || !packages.length) {
    packageList.innerHTML = `<div class="panelHint">当前没有可下载的资源包</div>`;
    return;
  }
  packageList.innerHTML = packages
    .map((item) => {
      const status = item.installed ? "已安装" : `已有 ${item.installedCount || 0} / ${item.fullCount || "?"}`;
      return `<div class="packageRow">
        <div><b>${escapeHtml(item.title)}</b><div class="panelHint">${escapeHtml(item.description || "")} · ${status}</div></div>
        <button type="button" data-install-package="${escapeHtml(item.id)}" data-package-url="${escapeHtml(item.url || "")}" ${item.installed ? "disabled" : ""}>${item.installed ? "已完成" : "下载"}</button>
      </div>`;
    })
    .join("");
}

async function loadPackages() {
  try {
    const data = await api("/api/packages");
    renderPackages(data.packages || []);
  } catch (error) {
    if (packageHint) packageHint.textContent = error.message;
  }
}

function startPackageProgressPolling() {
  clearInterval(apkPollTimer);
  apkPollTimer = setInterval(() => {
    if (!window.AndroidBibleApi || !window.AndroidBibleApi.downloadStatus) return;
    try {
      const status = JSON.parse(window.AndroidBibleApi.downloadStatus());
      const percent = Number(status.percent || 0);
      if (packageProgress) packageProgress.hidden = false;
      if (packageProgressText) packageProgressText.textContent = status.message || "正在下载";
      if (packageProgressValue) packageProgressValue.textContent = `${percent}%`;
      if (packageProgressBar) packageProgressBar.style.width = `${percent}%`;
      if (status.state === "done" || status.state === "error" || status.state === "cleared") {
        clearInterval(apkPollTimer);
        if (status.state === "done") {
          showStatus("资源包安装完成", "success");
          loadPackages();
          api("/api/versions").then((data) => {
            state.versions = data.versions;
            renderVersions();
            renderCompareVersions();
          });
          api("/api/commentaries").then((data) => {
            state.commentaries = data.commentaries;
            renderCommentaries();
          });
        } else if (status.state === "error") {
          showStatus(status.message || "资源包下载失败", "error");
        }
      }
    } catch {
      clearInterval(apkPollTimer);
    }
  }, 400);
}

async function installResourcePackage(packageId, url) {
  if (!window.AndroidBibleApi || !window.AndroidBibleApi.installPackage) {
    if (url) window.open(url, "_blank");
    else showStatus("请在 Android 版下载资源包");
    return;
  }
  const result = JSON.parse(window.AndroidBibleApi.installPackage(packageId, url || ""));
  if (result.error) {
    showStatus(result.error, "error");
    return;
  }
  startPackageProgressPolling();
  showStatus("开始下载资源包");
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

function hasBlockingOverlayOpen() {
  return (
    document.body.classList.contains("sidebarOpen") ||
    !bookPickerPanel.hidden ||
    (versionPickerPanel && !versionPickerPanel.hidden) ||
    !readerSettingsPanel.hidden ||
    !searchPanel.hidden ||
    !strongPanel.hidden ||
    !dictionaryPanel.hidden ||
    !myPanel.hidden ||
    (compareSheet && !compareSheet.hidden) ||
    (commentarySheet && !commentarySheet.hidden) ||
    (shareSheet && !shareSheet.hidden) ||
    (noteSheet && !noteSheet.hidden) ||
    (aiSheet && !aiSheet.hidden) ||
    (confirmSheet && !confirmSheet.hidden) ||
    (audioPanel && !audioPanel.hidden) ||
    !verseMenu.hidden ||
    !selectionBar.hidden
  );
}

function handleBackIntent() {
  if (!verseMenu.hidden) {
    closeVerseMenu();
    keepReadingChromeVisible();
    return true;
  }
  if (!selectionBar.hidden) {
    closeSelectionBar();
    keepReadingChromeVisible();
    return true;
  }
  if (confirmSheet && !confirmSheet.hidden) {
    closeConfirmSheet(true);
    keepReadingChromeVisible();
    return true;
  }
  if (!bookPickerPanel.hidden || (versionPickerPanel && !versionPickerPanel.hidden) || !readerSettingsPanel.hidden || !searchPanel.hidden || !strongPanel.hidden || !dictionaryPanel.hidden || !myPanel.hidden || (compareSheet && !compareSheet.hidden) || (commentarySheet && !commentarySheet.hidden) || (shareSheet && !shareSheet.hidden) || (noteSheet && !noteSheet.hidden) || (aiSheet && !aiSheet.hidden) || (audioPanel && !audioPanel.hidden)) {
    closeTopPanels();
    keepReadingChromeVisible();
    return true;
  }
  if (document.body.classList.contains("sidebarOpen")) {
    closeSidebar();
    keepReadingChromeVisible();
    return true;
  }
  if (peekState && peekBar && !peekBar.hidden) {
    restorePeek();
    return true;
  }
  return false;
}

function setNav(name) {
  document.querySelectorAll(".mobileNav button").forEach((button) => {
    if (button.id === "voiceBtn") return;
    button.classList.toggle("active", name && button.dataset.nav === name);
  });
}

function rememberSearch(query) {
  const value = String(query || "").trim();
  if (!value) return;
  state.recentSearches = [value, ...state.recentSearches.filter((item) => item !== value)].slice(0, 8);
  saveState();
}

function renderRecentSearches() {
  if (!recentSearchesEl) return;
  if (!state.recentSearches.length) {
    recentSearchesEl.innerHTML = "";
    return;
  }
  recentSearchesEl.innerHTML =
    `<span class="panelHint">最近</span>` +
    state.recentSearches.map((item) => `<button type="button" data-recent-search="${escapeHtml(item)}">${escapeHtml(item)}</button>`).join("");
}

function toggleSearch(show = searchPanel.hidden) {
  closeTopPanels();
  closeSidebar();
  searchPanel.hidden = !show;
  setNav(show ? "search" : null);
  if (show) {
    renderRecentSearches();
    keepReadingChromeVisible(4000);
    quickInput?.focus();
  }
}

function toggleVersionPicker(show = versionPickerPanel.hidden) {
  closeTopPanels();
  versionPickerPanel.hidden = !show;
  if (show) {
    renderVersions();
    keepReadingChromeVisible();
  }
}

function toggleReadingChrome() {
  if (Date.now() < chromePinnedUntil) return;
  if (hasBlockingOverlayOpen()) return;
  document.body.classList.toggle("chromeHidden");
}

function compareAppVersions(left, right) {
  const a = String(left || "").replace(/^v/i, "").split(".").map((part) => Number(part) || 0);
  const b = String(right || "").replace(/^v/i, "").split(".").map((part) => Number(part) || 0);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    const diff = (a[i] || 0) - (b[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

async function showCompareSheet(verseNo) {
  const verse = Number(verseNo || selectedVerseNumbers[0] || state.activeVerse);
  if (!verse) return;
  closeContentPanels();
  compareSheet.hidden = false;
  compareSheetTitle.textContent = `${currentBook().longName} ${state.chapter}:${verse}`;
  renderCompareSources();
  compareSheetContent.innerHTML = `<div class="loading">正在读取对照...</div>`;
  try {
    const versions = [state.version, ...state.compareVersions]
      .filter((id, index, list) => id && list.indexOf(id) === index)
      .slice(0, 4);
    const list = versions.length > 1 ? versions : [state.version, ...state.versions.map((item) => item.id)].filter((id, index, all) => id && all.indexOf(id) === index).slice(0, 3);
    const query = list.map((id) => `version=${encodeURIComponent(id)}`).join("&");
    const data = await api(`/api/chapters?${query}&book=${state.book}&chapter=${state.chapter}`);
    compareSheetContent.innerHTML = (data.chapters || [])
      .map((chapter) => {
        const text = chapter.verses.find((item) => item.verse === verse)?.text || "（本节无经文）";
        return `<article class="resultItem"><div class="resultRef">${escapeHtml(chapter.shortName || chapter.versionName)}</div><div class="resultText compareVerse">${escapeHtml(text)}</div></article>`;
      })
      .join("");
  } catch (error) {
    compareSheetContent.innerHTML = `<div class="error">${escapeHtml(error.message)}</div>`;
  }
}

function apkAssetFromRelease(release) {
  const assets = release?.assets || [];
  return assets.find((asset) => /\.apk$/i.test(asset.name)) || null;
}

function localApkStatus(apk) {
  if (!apk || !window.AndroidUpdateApi || !window.AndroidUpdateApi.localApkStatus) return null;
  try {
    return JSON.parse(window.AndroidUpdateApi.localApkStatus(apk.name, String(apk.size || 0)));
  } catch {
    return null;
  }
}

function formatProxyHint(release) {
  if (!window.AndroidUpdateApi) return "电脑版下载走系统 / 浏览器网络。";
  if (release?.proxyType && release.proxyType !== "direct" && release.proxyHost) {
    return `当前系统 HTTP 代理 ${release.proxyHost}:${release.proxyPort}。规则分流仍可能把 GitHub CDN 直连，失败时请开全局或把 githubusercontent 加入代理。`;
  }
  return "当前没有系统 HTTP 代理。Clash 等软件开「规则」时不会自动填代理，GitHub 常直连失败；开全局，或把 github.com、api.github.com、*.githubusercontent.com 走代理。";
}

function refreshUpdateAction(apk, newer) {
  if (!downloadUpdateBtn) return;
  if (!apk) {
    downloadUpdateBtn.disabled = true;
    downloadUpdateBtn.textContent = "暂无 APK";
    return;
  }
  const local = localApkStatus(apk);
  downloadUpdateBtn.disabled = false;
  if (local?.ready) downloadUpdateBtn.textContent = "立即安装";
  else if (local?.exists && Number(local.size) > 0) downloadUpdateBtn.textContent = "继续下载";
  else downloadUpdateBtn.textContent = newer ? "下载更新" : "下载 APK";
}

async function checkForUpdates() {
  if (updateCheckBusy) {
    showStatus("正在检查更新，请稍候");
    return;
  }
  updateCheckBusy = true;
  if (checkUpdateBtn) checkUpdateBtn.textContent = "检查中";
  if (updateStatus) updateStatus.textContent = "正在检查 GitHub 最新版本...";
  try {
    let release;
    if (window.AndroidUpdateApi && window.AndroidUpdateApi.checkLatest) {
      release = JSON.parse(window.AndroidUpdateApi.checkLatest());
      if (release.error) throw new Error(release.error);
    } else {
      const response = await fetch(GITHUB_RELEASE_API, { headers: { Accept: "application/vnd.github+json" } });
      if (!response.ok) throw new Error(`检查更新失败：${response.status}`);
      const data = await response.json();
      release = {
        currentVersion: APP_VERSION,
        tagName: data.tag_name,
        version: String(data.tag_name || "").replace(/^v/i, ""),
        name: data.name,
        body: data.body,
        assets: (data.assets || []).map((asset) => ({
          name: asset.name,
          size: asset.size,
          url: asset.browser_download_url,
        })),
      };
    }
    lastUpdateInfo = release;
    const latest = release.version || "";
    const newer = compareAppVersions(latest, APP_VERSION) > 0;
    const apk = apkAssetFromRelease(release);
    const local = localApkStatus(apk);
    if (updateStatus) {
      if (newer && local?.ready) updateStatus.textContent = `发现新版本 ${latest}，已下载，可直接安装`;
      else if (newer) updateStatus.textContent = `发现新版本 ${latest}（当前 ${APP_VERSION}）`;
      else updateStatus.textContent = `已是最新版本 ${APP_VERSION}`;
    }
    if (updateNetworkHint) updateNetworkHint.textContent = formatProxyHint(release);
    refreshUpdateAction(apk, newer);
    showStatus(newer ? (local?.ready ? "已下载，可直接安装" : `发现新版本 ${latest}`) : "已是最新版本", newer ? "info" : "success");
    if (myPanel.hidden) await openMyPanel("all");
  } catch (error) {
    if (updateStatus) updateStatus.textContent = error.message;
    showStatus(error.message, "error");
  } finally {
    updateCheckBusy = false;
    if (checkUpdateBtn) checkUpdateBtn.textContent = "检查更新";
  }
}

function startApkProgressPolling() {
  clearInterval(apkPollTimer);
  apkPollTimer = setInterval(() => {
    if (!window.AndroidUpdateApi || !window.AndroidUpdateApi.downloadStatus) return;
    try {
      const status = JSON.parse(window.AndroidUpdateApi.downloadStatus());
      const percent = Number(status.percent || 0);
      if (updateProgress) updateProgress.hidden = false;
      if (updateProgressText) updateProgressText.textContent = status.message || "正在下载";
      if (updateProgressValue) updateProgressValue.textContent = `${percent}%`;
      if (updateProgressBar) updateProgressBar.style.width = `${percent}%`;
      if (status.state === "done" || status.state === "error" || status.state === "cleared") {
        clearInterval(apkPollTimer);
        apkDownloadBusy = false;
        if (downloadUpdateBtn) downloadUpdateBtn.disabled = false;
        if (status.state === "error") showStatus(status.message || "下载失败", "error");
        if (status.state === "done") {
          showStatus(status.message || "下载完成，请按提示安装", "success");
          const apk = apkAssetFromRelease(lastUpdateInfo);
          refreshUpdateAction(apk, compareAppVersions(lastUpdateInfo?.version, APP_VERSION) > 0);
        }
      }
    } catch {
      clearInterval(apkPollTimer);
      apkDownloadBusy = false;
    }
  }, 400);
}

async function downloadUpdate() {
  const apk = apkAssetFromRelease(lastUpdateInfo);
  if (!apk) {
    showStatus("没有可下载的 APK");
    return;
  }
  if (window.AndroidUpdateApi && window.AndroidUpdateApi.downloadAndInstall) {
    if (apkDownloadBusy) {
      showStatus("正在下载更新，请稍候");
      return;
    }
    apkDownloadBusy = true;
    downloadUpdateBtn.disabled = true;
    const result = JSON.parse(window.AndroidUpdateApi.downloadAndInstall(apk.url, apk.name, String(apk.size || 0)));
    if (result.error) {
      apkDownloadBusy = false;
      downloadUpdateBtn.disabled = false;
      showStatus(result.error, "error");
      return;
    }
    if (result.reused) {
      apkDownloadBusy = false;
      refreshUpdateAction(apk, compareAppVersions(lastUpdateInfo?.version, APP_VERSION) > 0);
      showStatus("已有安装包，正在打开安装", "success");
      return;
    }
    startApkProgressPolling();
    showStatus("开始下载 APK");
    return;
  }
  window.open(apk.url, "_blank");
  showStatus("已打开 APK 下载页");
}

function verseFromEvent(event) {
  return Number(event.target.closest("[data-verse]")?.dataset.verse || 0);
}

function swipeIgnoreTarget(target) {
  return !!target.closest(".sheetPanel, .readerSettingsPanel, .sidebar, .verseMenu, .selectionBar, .mobileNav, .topbar, .closeSidebarBtn, .chapterEdge, button, a, input, select, textarea, audio");
}

function resetSwipeVisual() {
  if (!content) return;
  content.style.transform = "";
  content.style.opacity = "";
  content.style.transition = "";
}

function applySwipeVisual(dx) {
  if (!content) return;
  content.style.transition = "none";
  content.style.transform = `translateX(${Math.round(dx * 0.38)}px)`;
  content.style.opacity = String(Math.max(0.58, 1 - Math.abs(dx) / 460));
}

function startSwipeGesture(x, y, target) {
  if (swipeIgnoreTarget(target)) return;
  swipeState = { x, y, lastX: x, lastY: y, fromPicker: !!target.closest("#bookPickerPanel") };
}

function enablePickerChapterSwipe(el) {
  let startX = 0;
  let startY = 0;
  let tracking = false;
  el.addEventListener("pointerdown", (event) => {
    if (el.hidden) return;
    if (event.target.closest("input, textarea, select, a")) return;
    startX = event.clientX;
    startY = event.clientY;
    tracking = true;
  });
  el.addEventListener("pointerup", (event) => {
    if (!tracking) return;
    tracking = false;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) < 48 || Math.abs(dx) <= Math.abs(dy) * 1.1) return;
    justSwiped = true;
    chapterLongPress = true;
    setTimeout(() => {
      justSwiped = false;
      chapterLongPress = false;
    }, 280);
    closeTopPanels();
    keepReadingChromeVisible();
    moveChapter(dx < 0 ? 1 : -1);
  });
  el.addEventListener("pointercancel", () => {
    tracking = false;
  });
}

function enableSheetDismiss(el) {
  let startY = 0;
  let tracking = false;
  el.addEventListener("pointerdown", (event) => {
    if (el.hidden) return;
    const header = event.target.closest(".panelHeader, .bookPickerHeader, .readerSettingsHeader");
    if (!header && event.clientY - el.getBoundingClientRect().top > 56) return;
    startY = event.clientY;
    tracking = true;
  });
  el.addEventListener("pointerup", (event) => {
    if (!tracking) return;
    tracking = false;
    if (event.clientY - startY > 72) {
      closeTopPanels();
      keepReadingChromeVisible();
    }
  });
  el.addEventListener("pointercancel", () => {
    tracking = false;
  });
}

function finishSwipeGesture(x, y) {
  if (!swipeState) return;
  const dx = x - swipeState.x;
  const dy = y - swipeState.y;
  swipeState = null;
  if (Math.abs(dx) >= 46 && Math.abs(dx) > Math.abs(dy) * 1.05) {
    if (hasBlockingOverlayOpen()) {
      resetSwipeVisual();
      return;
    }
    justSwiped = true;
    setTimeout(() => {
      justSwiped = false;
    }, 280);
    if (content) {
      content.style.transition = "transform 0.16s ease, opacity 0.16s ease";
      content.style.transform = `translateX(${dx < 0 ? -48 : 48}px)`;
      content.style.opacity = "0.72";
    }
    moveChapter(dx < 0 ? 1 : -1);
    return;
  }
  if (content) {
    content.style.transition = "transform 0.16s ease, opacity 0.16s ease";
    content.style.transform = "";
    content.style.opacity = "";
  }
}

async function init() {
  restoreState();
  loadAgentMemory();
  applySettings();
  if (updateStatus) updateStatus.textContent = `当前版本 ${APP_VERSION}`;
  loadPackages();
  document.querySelectorAll(".sheetPanel, .readerSettingsPanel").forEach((el) => {
    new MutationObserver(syncSheetOverlay).observe(el, { attributes: true, attributeFilter: ["hidden"] });
    enableSheetDismiss(el);
  });
  if (bookPickerPanel) enablePickerChapterSwipe(bookPickerPanel);
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
  if (state.lastVerse) state.targetVerse = state.lastVerse;
  await loadChapter({ scrollTop: !state.targetVerse });
}

async function switchVersion(nextVersion) {
  if (!nextVersion || nextVersion === state.version) return;
  const verse = state.lastVerse || state.activeVerse || 1;
  state.version = nextVersion;
  if (versionSelect) versionSelect.value = nextVersion;
  state.compareVersions = state.compareVersions.filter((id) => id !== state.version);
  renderCompareVersions();
  resetVerseInteraction(verse);
  await loadBooks();
  state.targetVerse = verse;
  await loadChapter({ scrollTop: false });
}

versionSelect.addEventListener("change", async () => {
  await switchVersion(versionSelect.value);
});

compareVersionsEl?.addEventListener("change", (event) => {
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
  saveState();
  renderCompareVersions();
  state.targetVerse = state.lastVerse || visibleVerseNumber();
  loadChapter({ scrollTop: false });
});

commentarySelect?.addEventListener("change", () => {
  state.commentary = commentarySelect.value;
  saveState();
  loadCommentary();
});

strongToggle?.addEventListener("change", () => {
  state.showStrong = strongToggle.checked;
  if (strongToggleReader) strongToggleReader.checked = state.showStrong;
  saveState();
  loadChapter();
});

function syncAudioAutoNext(checked) {
  state.audioAutoNext = !!checked;
  if (audioAutoNext) audioAutoNext.checked = state.audioAutoNext;
  if (audioAutoNextSheet) audioAutoNextSheet.checked = state.audioAutoNext;
  saveState();
}
audioAutoNext?.addEventListener("change", () => syncAudioAutoNext(audioAutoNext.checked));
audioAutoNextSheet?.addEventListener("change", () => syncAudioAutoNext(audioAutoNextSheet.checked));

dictionarySelect?.addEventListener("change", () => setDictionarySource(dictionarySelect.value));
dictionarySheetSelect?.addEventListener("change", () => setDictionarySource(dictionarySheetSelect.value));

dictionaryBtn?.addEventListener("click", () => searchDictionary());
dictionarySheetBtn?.addEventListener("click", () => searchDictionary());
openDictionarySheetBtn?.addEventListener("click", openDictionarySheet);
$("#openAiSheetBtn")?.addEventListener("click", () => openAiSheet("助手", state.activeVerse || state.lastVerse, true));
dictionarySheetForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  searchDictionary();
});
dictionaryInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    searchDictionary();
  }
});
dictionarySheetInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    searchDictionary();
  }
});
document.querySelector(".sidebarTabs")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-sidebar-tab]");
  if (button) setSidebarTab(button.dataset.sidebarTab);
});
document.querySelector("#myPanel .panelTabs")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-my-tab]");
  if (button) setMyTab(button.dataset.myTab);
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
readFontSelect?.addEventListener("change", () => {
  state.readFont = readFontSelect.value === "sans" ? "sans" : "serif";
  applySettings();
  saveState();
});
pageMarginRange?.addEventListener("input", () => {
  state.pageMargin = Number(pageMarginRange.value);
  applySettings();
  saveState();
});
copyFormatSelect?.addEventListener("change", () => {
  state.copyFormat = copyFormatSelect.value;
  saveState();
});
ttsRateSelect?.addEventListener("change", () => {
  state.ttsRate = Number(ttsRateSelect.value) || 1;
  applyTtsRate();
  saveState();
});
strongToggleReader?.addEventListener("change", () => {
  state.showStrong = strongToggleReader.checked;
  if (strongToggle) strongToggle.checked = state.showStrong;
  applySettings();
  saveState();
  loadChapter({ scrollTop: false });
});

menuBtn.addEventListener("click", () => openSidebar());
function openBookPicker() {
  clearPeek();
  closeTopPanels();
  closeSidebar();
  bookPickerPanel.hidden = false;
  setBookPickerStep("books");
  setNav("books");
  renderBookGrid();
  renderChapterGrid();
  keepReadingChromeVisible();
}

mobileMenuBtn.addEventListener("click", () => {
  if (!bookPickerPanel.hidden) {
    closeTopPanels();
    keepReadingChromeVisible();
    return;
  }
  openBookPicker();
});
mobileSearchBtn.addEventListener("click", () => {
  if (!searchPanel.hidden) {
    closeTopPanels();
    keepReadingChromeVisible();
  } else toggleSearch(true);
});
searchToggleBtn.addEventListener("click", () => {
  if (!searchPanel.hidden) {
    closeTopPanels();
    keepReadingChromeVisible();
  } else toggleSearch(true);
});
speakToggleBtn?.addEventListener("click", speakChapter);
closeSidebarBtn.addEventListener("click", closeSidebar);
overlay.addEventListener("click", () => handleBackIntent());
prevBtn.addEventListener("click", () => moveChapter(-1));
nextBtn.addEventListener("click", () => moveChapter(1));
prevEdge?.addEventListener("click", () => moveChapter(-1));
nextEdge?.addEventListener("click", () => moveChapter(1));
mobileAiBtn?.addEventListener("click", () => {
  if (aiSheet && !aiSheet.hidden) {
    closeTopPanels();
    keepReadingChromeVisible();
    return;
  }
  openAiSheet("助手", state.activeVerse || state.lastVerse, true);
});
mobileMyBtn.addEventListener("click", () => {
  if (!myPanel.hidden) {
    closeTopPanels();
    keepReadingChromeVisible();
    return;
  }
  openMyPanel("all");
});
versionChipBtn.addEventListener("click", () => toggleVersionPicker());
function dismissSheet() {
  closeTopPanels();
  keepReadingChromeVisible();
}

closeVersionPickerBtn.addEventListener("click", dismissSheet);
closeCompareSheetBtn.addEventListener("click", dismissSheet);
closeCommentarySheetBtn?.addEventListener("click", dismissSheet);
closeShareSheetBtn?.addEventListener("click", dismissSheet);
closeNoteSheetBtn?.addEventListener("click", dismissSheet);
closeAiSheetBtn?.addEventListener("click", dismissSheet);
newAiChatBtn?.addEventListener("click", requestNewConversation);
saveAiNoteBtn?.addEventListener("click", distillConversationToNote);
clearAiMemoryBtn?.addEventListener("click", requestClearCurrentChat);
toggleAiNotesBtn?.addEventListener("click", toggleAiNotes);
myTagFilter?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  if (!myPanel.hidden) openMyPanel(myPanelKind, { refresh: true });
});
myTagFilter?.addEventListener("input", () => {
  if (!myPanel.hidden) renderMyAgentNotes();
});
insertNoteRefBtn?.addEventListener("click", insertNoteVerseRef);
function handleAgentNoteClick(event) {
  const addRef = event.target.closest("[data-add-note-ref]");
  if (addRef) {
    event.stopPropagation();
    addCurrentVerseToAgentNote(addRef.dataset.addNoteRef);
    return;
  }
  const cont = event.target.closest("[data-continue-note]");
  if (cont) {
    event.stopPropagation();
    continueAgentNote(cont.dataset.continueNote);
    return;
  }
  const del = event.target.closest("[data-delete-note]");
  if (del) {
    event.stopPropagation();
    const id = del.dataset.deleteNote;
    if (pendingDeleteNoteId !== id) {
      pendingDeleteNoteId = id;
      renderAgentNoteList();
      renderMyAgentNotes();
      return;
    }
    pendingDeleteNoteId = "";
    deleteAgentNote(id);
    renderAgentChat();
    renderMyAgentNotes();
    showStatus("已删除笔记", "info");
  }
}
aiNoteList?.addEventListener("click", handleAgentNoteClick);
myAgentNotesEl?.addEventListener("click", async (event) => {
  const jump = event.target.closest("[data-jump-book]");
  if (jump) {
    event.stopPropagation();
    await jumpFromPeek(
      {
        book: Number(jump.dataset.jumpBook),
        chapter: Number(jump.dataset.jumpChapter),
        verse: Number(jump.dataset.jumpVerse),
      },
      { kind: "my", title: "返回我的", restore: () => openMyPanel(myPanelKind) },
    );
    return;
  }
  handleAgentNoteClick(event);
});
aiNotePeek?.addEventListener("click", (event) => {
  if (!event.target.closest("[data-open-ai-notes]")) return;
  aiNotesOpen = true;
  renderAgentNoteList();
});
aiMemoryBar?.addEventListener("click", (event) => {
  if (event.target.closest("[data-unpin-note]")) {
    agentMemory.activeNoteId = null;
    saveAgentMemory();
    renderAgentChat();
    showStatus("已离开这篇笔记", "info");
    return;
  }
  const button = event.target.closest("[data-forget-id]");
  if (!button) return;
  forgetFact(button.dataset.forgetId);
  renderAgentChat();
  showStatus("已忘掉这条", "info");
});
closeAudioBtn?.addEventListener("click", dismissSheet);
ttsPlayBtn?.addEventListener("click", () => {
  if (speaking) stopSpeaking();
  else speakChapter();
});
ttsStopBtn?.addEventListener("click", stopSpeaking);
closeConfirmSheetBtn?.addEventListener("click", () => closeConfirmSheet(true));
confirmSheetChoices?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-confirm-book]");
  if (button) applyConfirmedBook(button.dataset.confirmBook);
});
inlineCompareList?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-toggle-compare]");
  if (!button) return;
  const id = button.dataset.toggleCompare;
  if (state.compareVersions.includes(id)) {
    state.compareVersions = state.compareVersions.filter((item) => item !== id);
  } else if (state.compareVersions.length >= 3) {
    showStatus("最多对照 3 个译本");
    return;
  } else {
    state.compareVersions.push(id);
  }
  saveState();
  renderCompareVersions();
  state.targetVerse = state.lastVerse || visibleVerseNumber();
  await loadChapter({ scrollTop: false });
});
window.addEventListener("scroll", onReaderScroll, { passive: true });
smartVoiceToggle?.addEventListener("change", saveAiSettings);
aiActionRow?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-ai-action]");
  if (!button) return;
  if (button.dataset.aiAction === "study") {
    const question = aiAskInput?.value.trim() || quickInput?.value.trim();
    if (!question) {
      showStatus("先输入要找的内容，例如：约书亚记里抬葡萄");
      aiAskInput?.focus();
      return;
    }
    runBibleStudy(question);
    return;
  }
  runAiTask(button.dataset.aiAction, state.activeVerse);
});
aiAskForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const question = aiAskInput?.value.trim();
  if (!question) {
    showStatus("请先输入问题");
    return;
  }
  runAgent(question, { mode: looksLikeStudyQuery(question) ? "study" : "ask", verseNo: state.activeVerse });
  if (aiAskInput) aiAskInput.value = "";
});
searchScope?.addEventListener("change", () => {
  if (searchState.query) runSearch(searchState.query);
});
shareThemeRow?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-share-theme]");
  if (!button || !lastShareVerses.length) return;
  drawShareCard(lastShareVerses, button.dataset.shareTheme);
});
peekBackBtn?.addEventListener("click", restorePeek);
peekCloseBtn?.addEventListener("click", clearPeek);
studySearchBtn?.addEventListener("click", () => {
  const query = quickInput?.value.trim();
  if (!query) {
    openAiSheet("智能查经");
    showStatus("智能查经就是这个助手。先输入内容再点，或直接在这里接着问。", "info");
    return;
  }
  runBibleStudy(query);
});
aiProviderSelect?.addEventListener("change", saveAiSettings);
aiModelSelect?.addEventListener("change", saveAiSettings);
aiCustomModelInput?.addEventListener("change", saveAiSettings);
aiCustomModelInput?.addEventListener("input", saveAiSettings);
aiKeyInput?.addEventListener("change", saveAiSettings);
aiKeyInput?.addEventListener("input", saveAiSettings);
mimoAsrKeyInput?.addEventListener("change", saveAiSettings);
mimoAsrKeyInput?.addEventListener("input", saveAiSettings);
saveNoteSheetBtn?.addEventListener("click", saveNoteSheet);
recentSearchesEl?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-recent-search]");
  if (!button) return;
  quickInput.value = button.dataset.recentSearch;
  quickForm.requestSubmit();
});
compareSourceList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-pick-compare]");
  if (!button) return;
  const id = button.dataset.pickCompare;
  if (state.compareVersions.includes(id)) {
    state.compareVersions = state.compareVersions.filter((item) => item !== id);
  } else if (state.compareVersions.length >= 3) {
    showStatus("最多对照 3 个译本");
    return;
  } else {
    state.compareVersions.push(id);
  }
  saveState();
  showCompareSheet(state.activeVerse);
});
commentarySourceList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-pick-commentary]");
  if (!button) return;
  state.commentary = button.dataset.pickCommentary;
  saveState();
  showCommentarySheet(state.activeVerse);
});
shareImageBtn?.addEventListener("click", () => shareOrSaveCard(true));
saveShareBtn?.addEventListener("click", () => shareOrSaveCard(false));
function onHighlightPaletteClick(event) {
  const button = event.target.closest("[data-hl-color]");
  if (!button) return;
  applyHighlightColor(button.dataset.hlColor || "");
}
highlightColors?.addEventListener("click", onHighlightPaletteClick);
verseHighlightColors?.addEventListener("click", onHighlightPaletteClick);
keepScreenOnToggle?.addEventListener("change", () => {
  state.keepScreenOn = keepScreenOnToggle.checked;
  applySettings();
  saveState();
});
fuzzySearchToggle?.addEventListener("change", () => {
  state.fuzzySearch = !!fuzzySearchToggle.checked;
  saveState();
  if (searchState.query && !searchPanel.hidden) runSearch(searchState.query);
});

packageList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-install-package]");
  if (!button || button.disabled) return;
  installResourcePackage(button.dataset.installPackage, button.dataset.packageUrl);
});
if (window.matchMedia) {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (state.theme === "auto") applySettings();
  });
}
checkUpdateBtn.addEventListener("click", checkForUpdates);
downloadUpdateBtn.addEventListener("click", downloadUpdate);
clearDownloadsBtn?.addEventListener("click", () => {
  if (!window.AndroidUpdateApi && !window.AndroidBibleApi) {
    showStatus("清除下载仅在 Android 版可用");
    return;
  }
  let bytes = 0;
  try {
    if (window.AndroidUpdateApi && window.AndroidUpdateApi.clearDownloadCache) {
      const result = JSON.parse(window.AndroidUpdateApi.clearDownloadCache());
      bytes += Number(result.bytes || 0);
    }
    if (window.AndroidBibleApi && window.AndroidBibleApi.clearDownloadCache) {
      const result = JSON.parse(window.AndroidBibleApi.clearDownloadCache());
      bytes += Number(result.bytes || 0);
    }
  } catch (error) {
    showStatus(error.message || "清除失败", "error");
    return;
  }
  if (updateProgress) updateProgress.hidden = true;
  const apk = apkAssetFromRelease(lastUpdateInfo);
  refreshUpdateAction(apk, compareAppVersions(lastUpdateInfo?.version, APP_VERSION) > 0);
  showStatus(bytes > 0 ? `已清除 ${(bytes / 1024 / 1024).toFixed(1)} MB 下载文件` : "没有可清除的下载", "success");
});

chapterTitleBtn.addEventListener("click", () => {
  if (!bookPickerPanel.hidden) {
    dismissSheet();
    return;
  }
  openBookPicker();
});
closeBookPickerBtn.addEventListener("click", dismissSheet);
readerSettingsBtn.addEventListener("click", () => {
  const show = readerSettingsPanel.hidden;
  closeTopPanels();
  readerSettingsPanel.hidden = !show;
});
closeReaderSettingsBtn.addEventListener("click", dismissSheet);

bookSearchInput.addEventListener("input", renderBookGrid);
bookFilterTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-book-filter]");
  if (!button) return;
  bookFilter = button.dataset.bookFilter;
  bookFilterTabs.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
  renderBookGrid();
});
bookGrid.addEventListener("pointerdown", (event) => {
  const button = event.target.closest("[data-book]");
  if (!button) return;
  bookLongPress = false;
  clearTimeout(longPressTimer);
  longPressTimer = setTimeout(() => {
    bookLongPress = true;
    openChapterStep(Number(button.dataset.book));
  }, 420);
});
bookGrid.addEventListener("pointerup", () => clearTimeout(longPressTimer));
bookGrid.addEventListener("pointercancel", () => clearTimeout(longPressTimer));
bookGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-book]");
  if (!button) return;
  if (bookLongPress) {
    bookLongPress = false;
    return;
  }
  state.book = Number(button.dataset.book);
  state.chapter = 1;
  rememberCurrentBook();
  jumpFromPicker(null);
});
backToBooksBtn?.addEventListener("click", () => {
  setBookPickerStep("books");
  renderBookGrid();
  renderChapterGrid();
});
enterBookBtn?.addEventListener("click", () => {
  state.chapter = 1;
  rememberCurrentBook();
  jumpFromPicker(null);
});
backToChaptersBtn?.addEventListener("click", () => {
  setBookPickerStep("chapters");
  renderChapterGrid();
});
chapterGrid.addEventListener("pointerdown", (event) => {
  const button = event.target.closest("[data-chapter]");
  if (!button || chapterLoading) return;
  chapterLongPress = false;
  clearTimeout(longPressTimer);
  longPressTimer = setTimeout(() => {
    chapterLongPress = true;
    openVerseStep(Number(button.dataset.chapter));
  }, 420);
});
chapterGrid.addEventListener("pointerup", () => clearTimeout(longPressTimer));
chapterGrid.addEventListener("pointercancel", () => clearTimeout(longPressTimer));
chapterGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-chapter]");
  if (!button || chapterLoading) return;
  if (chapterLongPress) {
    chapterLongPress = false;
    return;
  }
  state.chapter = Number(button.dataset.chapter);
  rememberCurrentBook();
  jumpFromPicker(null);
});
verseGrid?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-pick-verse]");
  if (!button) return;
  jumpFromPicker(Number(button.dataset.pickVerse));
});
readChapterStartBtn?.addEventListener("click", () => jumpFromPicker(null));

quickForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = quickInput.value.trim();
  if (!query) {
    searchSummary.textContent = "输入书卷章节（如 约3:16）或关键词";
    return;
  }
  const ref = parseReference(query);
  if (ref) {
    await jumpToReference(ref);
    return;
  }
  await runSearch(query);
});

closeSearchBtn.addEventListener("click", () => {
  searchRequestToken += 1;
  dismissSheet();
});
closeStrongBtn.addEventListener("click", () => {
  strongRequestToken += 1;
  dismissSheet();
});
closeDictionaryBtn.addEventListener("click", () => {
  dictionaryRequestToken += 1;
  dismissSheet();
});
closeMyPanelBtn.addEventListener("click", () => {
  myPanelRequestToken += 1;
  myPanelLoading = false;
  dismissSheet();
});

searchResults.addEventListener("click", async (event) => {
  if (event.target.closest("[data-search-more]")) {
    await runSearch(searchState.query, { append: true });
    return;
  }
  const button = event.target.closest("[data-jump-book]");
  if (!button) return;
  event.stopPropagation();
  await jumpFromPeek(
    {
      book: Number(button.dataset.jumpBook),
      chapter: Number(button.dataset.jumpChapter),
      verse: Number(button.dataset.jumpVerse),
    },
    { kind: "search", title: "返回搜索", restore: restoreSearchPeek },
  );
});

document.body.addEventListener("click", async (event) => {
  const jumpVerse = event.target.closest("[data-jump-verse]:not([data-jump-book])");
  if (jumpVerse) {
    state.targetVerse = Number(jumpVerse.dataset.jumpVerse);
    focusTargetVerse();
    return;
  }
  const jump = event.target.closest("[data-jump-book]");
  if (jump && !searchResults.contains(jump) && !myResults.contains(jump)) {
    const ref = {
      book: Number(jump.dataset.jumpBook),
      chapter: Number(jump.dataset.jumpChapter),
      verse: Number(jump.dataset.jumpVerse),
    };
    let peek = null;
    if (aiSheet && !aiSheet.hidden && aiSheet.contains(jump)) {
      peek = { kind: "study", title: "返回查经", restore: () => { closeTopPanels(); if (aiSheet) aiSheet.hidden = false; } };
    } else if (commentarySheet && !commentarySheet.hidden && commentarySheet.contains(jump)) {
      const verse = state.activeVerse || state.lastVerse || ref.verse;
      peek = { kind: "commentary", title: "返回注释", restore: () => showCommentarySheet(verse) };
    } else if (dictionaryPanel && !dictionaryPanel.hidden && dictionaryPanel.contains(jump)) {
      peek = { kind: "dictionary", title: "返回辞典", restore: () => { closeTopPanels(); dictionaryPanel.hidden = false; } };
    } else if (strongContent && strongContent.contains(jump)) {
      peek = { kind: "strong", title: "返回原文", restore: () => { closeTopPanels(); strongPanel.hidden = false; } };
    }
    await jumpFromPeek(ref, peek);
    return;
  }
  const strong = event.target.closest("[data-strong]");
  if (strong) {
    await openStrong(strong.dataset.strong);
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
    } else if (dash.dataset.dash === "continue") {
      closeTopPanels();
      await jumpToReference({
        book: state.book,
        chapter: state.chapter,
        verse: state.lastVerse || 1,
        level: state.lastVerse ? "verse" : "chapter",
      });
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
});

myResults.addEventListener("click", async (event) => {
  const manage = event.target.closest("[data-manage]");
  if (manage) {
    event.preventDefault();
    const key = manage.dataset.manage;
    const item = myMarksByKey.get(key);
    const actions = item ? myMarkActions(item) : [];
    myManageKey = key;
    myManageAction = actions.length === 1 ? actions[0][0] : "";
    renderMyResults([...myMarksByKey.values()]);
    return;
  }
  if (event.target.closest("[data-manage-cancel]")) {
    event.preventDefault();
    resetMyManage();
    renderMyResults([...myMarksByKey.values()]);
    return;
  }
  const pick = event.target.closest("[data-manage-action]");
  if (pick) {
    event.preventDefault();
    myManageKey = pick.dataset.markKey;
    myManageAction = pick.dataset.manageAction;
    renderMyResults([...myMarksByKey.values()]);
    return;
  }
  const confirm = event.target.closest("[data-confirm-clear]");
  if (confirm) {
    event.preventDefault();
    await confirmClearMyMark(confirm.dataset.markKey, confirm.dataset.confirmClear);
    return;
  }
  const button = event.target.closest("[data-jump-book]");
  if (!button) return;
  event.stopPropagation();
  await jumpFromPeek(
    {
      book: Number(button.dataset.jumpBook),
      chapter: Number(button.dataset.jumpChapter),
      verse: Number(button.dataset.jumpVerse),
    },
    { kind: "my", title: "返回我的", restore: () => openMyPanel(myPanelKind) },
  );
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

content.addEventListener("click", (event) => {
  if (justSwiped) {
    justSwiped = false;
    return;
  }
  if (event.target.closest("button, a, textarea, input, select, .noteEditor, .strongBtn")) return;
  const verseNo = verseFromEvent(event);
  if (verseNo) {
    toggleVerseSelection(verseNo);
    return;
  }
  if (verseSelectionMode) {
    closeSelectionBar();
    keepReadingChromeVisible();
    return;
  }
  toggleReadingChrome();
});

content.addEventListener("contextmenu", (event) => {
  const verseNo = verseFromEvent(event);
  if (!verseNo) return;
  event.preventDefault();
  openVerseMenu(verseNo, event.clientX, event.clientY);
});

let pinchState = null;

function pinchDistance(event) {
  if (!event.touches || event.touches.length < 2) return 0;
  const a = event.touches[0];
  const b = event.touches[1];
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function clampFontSize(value) {
  return Math.max(16, Math.min(32, Math.round(value)));
}

content.addEventListener("touchstart", (event) => {
  if (event.touches.length !== 2) return;
  pinchState = { dist: pinchDistance(event), font: state.fontSize };
  swipeState = null;
  clearTimeout(longPressTimer);
}, { passive: true });
content.addEventListener("touchmove", (event) => {
  if (!pinchState || event.touches.length !== 2) return;
  const dist = pinchDistance(event);
  if (!pinchState.dist) return;
  const next = clampFontSize(pinchState.font * (dist / pinchState.dist));
  if (next === state.fontSize) return;
  state.fontSize = next;
  applySettings();
}, { passive: true });
content.addEventListener("touchend", () => {
  if (!pinchState) return;
  pinchState = null;
  saveState();
}, { passive: true });

const swipeRoot = readerEl || content;
swipeRoot.addEventListener("pointerdown", (event) => {
  if (pinchState) return;
  startSwipeGesture(event.clientX, event.clientY, event.target);
  const verseNo = verseFromEvent(event);
  if (!verseNo || event.pointerType === "mouse") return;
  clearTimeout(longPressTimer);
  longPressTimer = setTimeout(() => openVerseMenu(verseNo, event.clientX, event.clientY), 420);
});
swipeRoot.addEventListener("pointermove", (event) => {
  if (!swipeState) return;
  swipeState.lastX = event.clientX;
  swipeState.lastY = event.clientY;
  const dx = event.clientX - swipeState.x;
  const dy = event.clientY - swipeState.y;
  if (Math.hypot(dx, dy) > 12) clearTimeout(longPressTimer);
  if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) && !hasBlockingOverlayOpen()) {
    applySwipeVisual(dx);
  }
});
swipeRoot.addEventListener("pointerup", (event) => {
  clearTimeout(longPressTimer);
  finishSwipeGesture(event.clientX, event.clientY);
});
swipeRoot.addEventListener("pointercancel", () => {
  clearTimeout(longPressTimer);
  if (swipeState) finishSwipeGesture(swipeState.lastX, swipeState.lastY);
  else resetSwipeVisual();
});

verseMenu.addEventListener("click", (event) => {
  const button = event.target.closest("[data-menu-action]");
  if (button) runVerseAction(button.dataset.menuAction);
});
selectionBar.addEventListener("click", (event) => {
  const button = event.target.closest("[data-bar-action]");
  if (!button) return;
  const action = button.dataset.barAction;
  const verseNo = state.activeVerse || selectedVerseNumbers[0];
  if (action === "copy") {
    copySelectedVerses();
    return;
  }
  if (action === "more") {
    const rect = selectionBar.getBoundingClientRect();
    openVerseMenu(verseNo, rect.left + 24, Math.max(12, rect.top - 8), true);
    return;
  }
  runVerseAction(action, verseNo);
});
cancelSelectionBtn.addEventListener("click", closeSelectionBar);

exportDataBtn.addEventListener("click", exportUserData);
importDataBtn.addEventListener("click", () => importDataFile.click());
importDataFile.addEventListener("change", () => {
  if (importDataFile.files[0]) importUserData(importDataFile.files[0]);
});
diagnosticsBtn.addEventListener("click", runDiagnostics);
mimoKeyTypeSelect?.addEventListener("change", saveAiSettings);
aiBaseUrlInput?.addEventListener("change", saveAiSettings);
bindVoiceButton(voiceBtn);
bindVoiceButton(voiceBtnDesktop);

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
    toggleSearch(true);
  }
});

versionPickerList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-pick-version]");
  if (!button) return;
  const nextVersion = button.dataset.pickVersion;
  if (!nextVersion || nextVersion === state.version) {
    versionPickerPanel.hidden = true;
    return;
  }
  versionPickerPanel.hidden = true;
  await switchVersion(nextVersion);
});

init().catch((error) => {
  content.innerHTML = `<div class="error">启动失败：${escapeHtml(error.message)}</div>`;
});
