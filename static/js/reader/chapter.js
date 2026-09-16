var chapterLoadToken = 0;
var chapterLoading = false;
var chapterAudioFiles = [];
var lastScrollY = window.scrollY || 0;
var scrollSaveTimer = null;
var speaking = false;
var ttsSession = 0;
var jumpBusy = false;

function currentBook() {
  const state = Bible.state;
  return state.books.find((book) => book.id === state.book) || state.books[0] || { id: 1, shortName: "创", longName: "创世记", chapterCount: 50 };
}

function currentVersion() {
  return Bible.state.versions.find((item) => item.id === Bible.state.version);
}

function versionLabel(versionId) {
  const version = Bible.state.versions.find((item) => item.id === versionId);
  return version?.shortName || version?.name || versionId;
}

function atFirstChapter() {
  return Bible.state.book <= 1 && Bible.state.chapter <= 1;
}

function atLastChapter() {
  const last = Bible.state.books[Bible.state.books.length - 1];
  return last && Bible.state.book === last.id && Bible.state.chapter >= last.chapterCount;
}

function renderChrome() {
  const state = Bible.state;
  const book = currentBook();
  if (Bible.dom.chapterTitle) Bible.dom.chapterTitle.textContent = book ? `${book.longName} ${state.chapter}` : "加载中";
  const version = currentVersion();
  if (Bible.dom.versionTitle) Bible.dom.versionTitle.textContent = version ? version.shortName || version.name : "译本";
  if (Bible.dom.prevBtn) Bible.dom.prevBtn.disabled = chapterLoading || atFirstChapter();
  if (Bible.dom.nextBtn) Bible.dom.nextBtn.disabled = chapterLoading || atLastChapter();
}

function rememberReadingPosition(verse = Bible.state.activeVerse || Bible.state.targetVerse) {
  const n = Number(verse);
  if (Number.isFinite(n) && n >= 1) Bible.state.lastVerse = n;
  saveState();
}

function visibleVerseNumber() {
  const content = Bible.dom.content;
  const verses = [...content.querySelectorAll(".verse[data-verse]")];
  if (!verses.length) return null;
  const top = (document.querySelector(".readerChrome")?.getBoundingClientRect().bottom || document.querySelector(".topbar")?.getBoundingClientRect().bottom || 0) + 28;
  let current = Number(verses[0].dataset.verse);
  for (const el of verses) {
    if (el.getBoundingClientRect().top <= top) current = Number(el.dataset.verse);
  }
  return current;
}

function onReaderScroll() {
  const state = Bible.state;
  const y = window.scrollY || 0;
  const audioPanel = Bible.dom.audioPanel;
  if (!chapterLoading && !jumpBusy && !speaking && !(audioPanel && !audioPanel.hidden) && Date.now() >= Bible.sheets.chromePinnedUntil && !hasBlockingOverlayOpen()) {
    if (y > lastScrollY + 10 && y > 48) document.body.classList.add("chromeHidden");
    else if (y < lastScrollY - 10) document.body.classList.remove("chromeHidden");
  }
  lastScrollY = y;
  if (chapterLoading || jumpBusy || !Bible.dom.content.querySelector(".verse")) return;
  const verse = visibleVerseNumber();
  if (!verse) return;
  state.lastVerse = verse;
  clearTimeout(scrollSaveTimer);
  scrollSaveTimer = setTimeout(saveState, 400);
}

function scrollReaderToTop() {
  const content = Bible.dom.content;
  const top = document.querySelector(".topbar")?.getBoundingClientRect().bottom || 0;
  const target = Math.max(0, window.scrollY + content.getBoundingClientRect().top - top - 8);
  window.scrollTo({ top: target, behavior: "auto" });
}

function setChapterError(error, snapshot) {
  const content = Bible.dom.content;
  const message = error.message || String(error);
  const book = Bible.state.books.find((item) => item.id === snapshot.book);
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
  const state = Bible.state;
  const data = await api(`/api/books?version=${encodeURIComponent(state.version)}`);
  state.books = data.books;
  if (!state.books.some((book) => book.id === state.book)) {
    state.book = state.books[0]?.id || 1;
    state.chapter = 1;
  }
  const book = currentBook();
  if (state.chapter > book.chapterCount) state.chapter = 1;
  if (typeof renderBookGrid === "function") renderBookGrid();
  if (typeof renderChapterGrid === "function") renderChapterGrid();
}

async function loadMarks(snapshot = {}, token = null) {
  const state = Bible.state;
  const data = await api(`/api/user/marks?version=${encodeURIComponent(snapshot.version || state.version)}&book=${snapshot.book || state.book}&chapter=${snapshot.chapter || state.chapter}`);
  if (token != null && token !== chapterLoadToken) return;
  state.marks = new Map(data.marks.map((mark) => [Number(mark.verse), mark]));
}

async function loadProgress(version = Bible.state.version, token = null) {
  const data = await api(`/api/user/progress?version=${encodeURIComponent(version)}`);
  if (token != null && token !== chapterLoadToken) return;
  Bible.state.progress = data;
}

function saveReadingHistory(snapshot = {}) {
  const state = Bible.state;
  postJson("/api/user/history", {
    version: snapshot.version || state.version,
    book: snapshot.book || state.book,
    chapter: snapshot.chapter || state.chapter,
  }).catch(() => {});
}

async function loadAudio(snapshot = {}, token = null) {
  const state = Bible.state;
  const audioPanel = Bible.dom.audioPanel;
  try {
    const data = await api(`/api/audio?book=${snapshot.book || state.book}&chapter=${snapshot.chapter || state.chapter}`);
    if (token != null && token !== chapterLoadToken) return;
    chapterAudioFiles = data.audio || [];
    if (audioPanel && !audioPanel.hidden && typeof renderAudioSheet === "function") renderAudioSheet();
  } catch {
    if (token != null && token !== chapterLoadToken) return;
    chapterAudioFiles = [];
    if (audioPanel && !audioPanel.hidden && typeof renderAudioSheet === "function") renderAudioSheet();
  }
}

async function loadChapter(options = {}) {
  const state = Bible.state;
  const content = Bible.dom.content;
  const token = ++chapterLoadToken;
  const snapshot = { version: state.version, book: state.book, chapter: state.chapter };
  const resumeSpeak = !!options.resumeSpeak;
  chapterLoading = true;
  if (speaking) stopSpeaking({ silent: resumeSpeak });
  if (typeof resetSwipeVisual === "function") resetSwipeVisual();
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
    if (typeof renderMyProgress === "function") renderMyProgress();
    if (typeof renderBookGrid === "function") renderBookGrid();
    if (typeof renderChapterGrid === "function") renderChapterGrid();
    saveReadingHistory(snapshot);
    if (state.targetVerse) rememberReadingPosition(state.targetVerse);
    else saveState();
    if (options.scrollTop) scrollReaderToTop();
    else if (state.targetVerse) focusTargetVerse();
    await loadAudio(snapshot, token);
    if (resumeSpeak && state.audioAutoNext && token === chapterLoadToken && typeof speakChapter === "function") {
      speakChapter({ autoContinue: true });
    }
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

function moveChapter(delta, options = {}) {
  const state = Bible.state;
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
  if (typeof rememberCurrentBook === "function") rememberCurrentBook();
  if (typeof resetVerseInteraction === "function") resetVerseInteraction();
  const nextInfo = state.books.find((item) => item.id === nextBook) || currentBook();
  showStatus(`${nextInfo.longName} ${nextChapter}`);
  loadChapter({ scrollTop: true, resumeSpeak: !!options.resumeSpeak });
}

async function switchVersion(nextVersion) {
  const state = Bible.state;
  if (!nextVersion || nextVersion === state.version) return;
  const verse = state.lastVerse || state.activeVerse || 1;
  state.version = nextVersion;
  if (Bible.dom.versionSelect) Bible.dom.versionSelect.value = nextVersion;
  state.compareVersions = state.compareVersions.filter((id) => id !== state.version);
  if (typeof renderCompareVersions === "function") renderCompareVersions();
  if (typeof resetVerseInteraction === "function") resetVerseInteraction(verse);
  await loadBooks();
  state.targetVerse = verse;
  await loadChapter({ scrollTop: false });
}

window.addEventListener("scroll", onReaderScroll, { passive: true });
Bible.dom.prevBtn?.addEventListener("click", () => moveChapter(-1));
Bible.dom.nextBtn?.addEventListener("click", () => moveChapter(1));
Bible.dom.prevEdge?.addEventListener("click", () => moveChapter(-1));
Bible.dom.nextEdge?.addEventListener("click", () => moveChapter(1));
Bible.dom.versionSelect?.addEventListener("change", async () => {
  await switchVersion(Bible.dom.versionSelect.value);
});

Bible.reader.loadChapter = loadChapter;
Bible.reader.moveChapter = moveChapter;
Bible.reader.switchVersion = switchVersion;
Bible.reader.renderChrome = renderChrome;
