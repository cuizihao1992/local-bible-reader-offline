Bible.sheets.peekState = null;
Bible.sheets.chromePinnedUntil = 0;
Bible.sheets.stack = [];

function d(name) {
  return Bible.dom[name];
}

function keepReadingChromeVisible(ms = 1600) {
  Bible.sheets.chromePinnedUntil = Date.now() + ms;
  document.body.classList.remove("chromeHidden");
}

function closeContentPanels() {
  const hide = (name) => {
    const el = d(name);
    if (el) el.hidden = true;
  };
  hide("searchPanel");
  hide("strongPanel");
  hide("dictionaryPanel");
  hide("myPanel");
  hide("compareSheet");
  hide("commentarySheet");
  hide("shareSheet");
  hide("noteSheet");
  hide("aiSheet");
  hide("confirmSheet");
  hide("highlightColors");
  hide("mapSheet");
  hide("mapPlaceDetail");
  if (typeof closeVerseMenu === "function") closeVerseMenu();
  if (typeof closeSelectionBar === "function") closeSelectionBar();
  if (typeof setNav === "function") setNav(null);
}

function syncSheetOverlay() {
  const open = [...document.querySelectorAll(".sheetPanel, .readerSettingsPanel")].some((el) => el && !el.hidden);
  document.body.classList.toggle("sheetOpen", open);
}

function closeTopPanels(includeSettings = true) {
  const bookPickerPanel = d("bookPickerPanel");
  const versionPickerPanel = d("versionPickerPanel");
  const readerSettingsPanel = d("readerSettingsPanel");
  if (bookPickerPanel) bookPickerPanel.hidden = true;
  if (versionPickerPanel) versionPickerPanel.hidden = true;
  if (includeSettings && readerSettingsPanel) readerSettingsPanel.hidden = true;
  closeContentPanels();
  syncSheetOverlay();
}

function hasBlockingOverlayOpen() {
  const open = (name) => {
    const el = d(name);
    return el && !el.hidden;
  };
  return (
    document.body.classList.contains("sidebarOpen") ||
    open("bookPickerPanel") ||
    open("versionPickerPanel") ||
    open("readerSettingsPanel") ||
    open("searchPanel") ||
    open("strongPanel") ||
    open("dictionaryPanel") ||
    open("myPanel") ||
    open("compareSheet") ||
    open("commentarySheet") ||
    open("shareSheet") ||
    open("noteSheet") ||
    open("aiSheet") ||
    open("mapSheet") ||
    open("confirmSheet") ||
    open("verseMenu") ||
    open("selectionBar")
  );
}

function visible(name) {
  const el = d(name);
  return !!(el && !el.hidden);
}

function handleBackIntent() {
  if (typeof Bible.map?.handleBack === "function" && Bible.map.handleBack()) return true;
  if (visible("verseMenu")) {
    if (typeof closeVerseMenu === "function") closeVerseMenu();
    keepReadingChromeVisible();
    return true;
  }
  if (visible("selectionBar")) {
    if (typeof closeSelectionBar === "function") closeSelectionBar();
    keepReadingChromeVisible();
    return true;
  }
  if (visible("confirmSheet")) {
    if (typeof closeConfirmSheet === "function") closeConfirmSheet(true);
    keepReadingChromeVisible();
    return true;
  }
  if (
    visible("bookPickerPanel") ||
    visible("versionPickerPanel") ||
    visible("readerSettingsPanel") ||
    visible("searchPanel") ||
    visible("strongPanel") ||
    visible("dictionaryPanel") ||
    visible("myPanel") ||
    visible("compareSheet") ||
    visible("commentarySheet") ||
    visible("shareSheet") ||
    visible("noteSheet") ||
    visible("aiSheet") ||
    visible("mapSheet")
  ) {
    closeTopPanels();
    keepReadingChromeVisible();
    return true;
  }
  if (document.body.classList.contains("sidebarOpen")) {
    if (typeof closeSidebar === "function") closeSidebar();
    keepReadingChromeVisible();
    return true;
  }
  if (Bible.sheets.peekState && visible("peekBar")) {
    if (typeof restorePeek === "function") restorePeek();
    return true;
  }
  return false;
}

function enableSheetDismiss(el) {
  if (!el) return;
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

function dismissSheet() {
  closeTopPanels();
  keepReadingChromeVisible();
}

Bible.sheets.closeAll = closeTopPanels;
Bible.sheets.closeContent = closeContentPanels;
Bible.sheets.handleBack = handleBackIntent;
Bible.sheets.dismiss = dismissSheet;
Bible.sheets.syncOverlay = syncSheetOverlay;
Bible.sheets.enableDismiss = enableSheetDismiss;
Bible.sheets.hasBlocking = hasBlockingOverlayOpen;
Bible.sheets.keepChrome = keepReadingChromeVisible;
window.handleAndroidBack = function handleAndroidBack() {
  return handleBackIntent();
};
