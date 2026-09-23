function markForVerse(verse) {
  const state = Bible.state;
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
  return `<div class="notePreview">${mark.tags ? `<div class="noteTags">${escapeHtml(mark.tags)}</div>` : ""}<div class="noteText">${formatNoteMarkdown(mark.note)}</div></div>`;
}

function renderStrongList(strongs) {
  if (!Bible.state.showStrong || !strongs?.length) return "";
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
  const state = Bible.state;
  const content = Bible.dom.content;
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
  if (typeof renderVerseSelectionState === "function") renderVerseSelectionState();
  focusTargetVerse();
  if (Bible.map && typeof Bible.map.onChapterRendered === "function") Bible.map.onChapterRendered();
}

function focusTargetVerse() {
  const state = Bible.state;
  const content = Bible.dom.content;
  if (!state.targetVerse) return;
  const el = content.querySelector(`.verse[data-verse="${state.targetVerse}"]`);
  if (!el) return;
  el.classList.add("targetVerse");
  el.scrollIntoView({ block: "center", behavior: "smooth" });
}

Bible.reader.markForVerse = markForVerse;
Bible.reader.renderVerses = renderVerses;
Bible.reader.focusTargetVerse = focusTargetVerse;
