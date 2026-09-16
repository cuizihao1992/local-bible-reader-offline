Bible.STORAGE_KEY = "bibleReaderState.v1";

Bible.state = {
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

function restoreState() {
  const state = Bible.state;
  try {
    const saved = JSON.parse(localStorage.getItem(Bible.STORAGE_KEY) || "{}");
    const hadSavedKey = !!(saved.mimoKey || (saved.aiKeys && saved.aiKeys.mimo));
    const providers = window.AI_PROVIDERS || [];
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
      aiProvider: providers.some((item) => item.id === saved.aiProvider) ? saved.aiProvider : saved.aiProvider || "mimo",
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
    if (providers.length && !providers.some((item) => item.id === state.aiProvider)) state.aiProvider = "mimo";
    state.aiKeys = { ...(state.aiKeys || {}), mimo: state.mimoKey };
    state.aiBaseUrls = { ...(state.aiBaseUrls || {}), mimo: state.mimoBaseUrl };
    applyBuiltInMimoKeys(hadSavedKey);
  } catch {
    applyBuiltInMimoKeys(false);
  }
}

function saveState() {
  const state = Bible.state;
  localStorage.setItem(
    Bible.STORAGE_KEY,
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
  const theme = Bible.state.theme;
  if (theme === "auto") {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme === "dark" ? "dark" : "light";
}

function applySettings() {
  const state = Bible.state;
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
  const setVal = (id, value) => {
    const el = document.querySelector(id);
    if (el) el.value = value;
  };
  const setText = (id, value) => {
    const el = document.querySelector(id);
    if (el) el.textContent = value;
  };
  const setChecked = (id, value) => {
    const el = document.querySelector(id);
    if (el) el.checked = value;
  };
  setVal("#themeSelect", state.theme);
  setVal("#paletteSelect", state.palette);
  setVal("#fontSizeRange", String(state.fontSize));
  setVal("#lineHeightRange", String(state.lineHeight));
  setText("#fontSizeValue", `${state.fontSize}px`);
  setText("#lineHeightValue", Number(state.lineHeight).toFixed(2));
  setText("#pageMarginValue", String(state.pageMargin));
  setVal("#pageMarginRange", String(state.pageMargin));
  setVal("#readFontSelect", state.readFont === "sans" ? "sans" : "serif");
  setVal("#copyFormatSelect", state.copyFormat);
  setVal("#ttsRateSelect", String(state.ttsRate));
  setChecked("#strongToggle", state.showStrong);
  setChecked("#strongToggleReader", state.showStrong);
  setChecked("#audioAutoNext", state.audioAutoNext);
  setChecked("#audioAutoNextSheet", state.audioAutoNext);
  setChecked("#keepScreenOnToggle", state.keepScreenOn);
  setChecked("#fuzzySearchToggle", !!state.fuzzySearch);
  if (window.AndroidBibleApi && window.AndroidBibleApi.setKeepScreenOn) {
    window.AndroidBibleApi.setKeepScreenOn(!!state.keepScreenOn);
  }
  if (typeof syncAiSettingsFields === "function") syncAiSettingsFields();
}

Bible.restoreState = restoreState;
Bible.saveState = saveState;
Bible.applySettings = applySettings;
Bible.resolvedTheme = resolvedTheme;
