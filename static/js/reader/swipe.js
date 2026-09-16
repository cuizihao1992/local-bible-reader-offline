var swipeState = null;
var justSwiped = false;
var chapterLongPress = false;

function swipeIgnoreTarget(target) {
  return !!target.closest(".sheetPanel, .readerSettingsPanel, .sidebar, .verseMenu, .selectionBar, .mobileNav, .readerChrome, .ttsBar, .topbar, .closeSidebarBtn, .chapterEdge, button, a, input, select, textarea, audio");
}

function resetSwipeVisual() {
  const content = Bible.dom.content;
  if (!content) return;
  content.style.transform = "";
  content.style.opacity = "";
  content.style.transition = "";
}

function applySwipeVisual(dx) {
  const content = Bible.dom.content;
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
  if (!el) return;
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

function finishSwipeGesture(x, y) {
  if (!swipeState) return;
  const dx = x - swipeState.x;
  const dy = y - swipeState.y;
  swipeState = null;
  const content = Bible.dom.content;
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

(function bindReaderSwipe() {
  const swipeRoot = Bible.dom.readerEl || Bible.dom.content;
  if (!swipeRoot) return;
  swipeRoot.addEventListener("pointerdown", (event) => {
    if (typeof pinchState !== "undefined" && pinchState) return;
    startSwipeGesture(event.clientX, event.clientY, event.target);
  });
  swipeRoot.addEventListener("pointermove", (event) => {
    if (!swipeState) return;
    swipeState.lastX = event.clientX;
    swipeState.lastY = event.clientY;
    const dx = event.clientX - swipeState.x;
    const dy = event.clientY - swipeState.y;
    if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) && !hasBlockingOverlayOpen()) {
      applySwipeVisual(dx);
    }
  });
  swipeRoot.addEventListener("pointerup", (event) => {
    finishSwipeGesture(event.clientX, event.clientY);
  });
  swipeRoot.addEventListener("pointercancel", () => {
    if (swipeState) finishSwipeGesture(swipeState.lastX, swipeState.lastY);
    else resetSwipeVisual();
  });
})();

Bible.reader.resetSwipeVisual = resetSwipeVisual;
Bible.reader.enablePickerChapterSwipe = enablePickerChapterSwipe;
