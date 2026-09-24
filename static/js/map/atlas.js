Bible.map = {
  places: [],
  journeys: [],
  era: "all",
  pane: "map",
  activeJourney: null,
  scale: 1,
  panX: 0,
  panY: 0,
  loaded: false,
};

function mapPlaceById(id) {
  return Bible.map.places.find((item) => item.id === id);
}

function mapMatchesEra(place) {
  if (Bible.map.era === "all") return true;
  return (place.eras || []).includes(Bible.map.era);
}

async function loadMapCatalog() {
  if (Bible.map.loaded) return;
  const data = await api("/api/map");
  Bible.map.places = data.places || [];
  Bible.map.journeys = data.journeys || [];
  Bible.map.loaded = true;
}

function mapSvgBase() {
  return `
    <rect width="390" height="560" fill="url(#mapLand)"/>
    <path d="M20,80 C80,40 140,60 180,30 L220,70 L160,120 L80,140 Z" fill="#C9B892" opacity=".55"/>
    <path d="M260,420 C300,390 340,410 380,380 L390,560 L200,560 Z" fill="#C4B08A" opacity=".45"/>
    <path d="M0,0 L70,0 C55,80 35,160 55,250 C70,320 40,400 20,560 L0,560 Z" fill="url(#mapWater)" opacity=".9"/>
    <path d="M210,120 C205,180 195,230 185,280 C175,330 170,380 175,430" fill="none" stroke="#6E98AE" stroke-width="5" opacity=".7"/>
    <ellipse cx="198" cy="168" rx="28" ry="34" fill="url(#mapWater)"/>
    <ellipse cx="190" cy="400" rx="16" ry="38" fill="#5E86A0"/>
    <text x="95" y="210" class="mapRegion">撒马利亚</text>
    <text x="250" y="250" class="mapRegion">约旦河东</text>
    <text x="70" y="330" class="mapRegion">非利士</text>
    <text x="95" y="55" class="mapRegion">加利利</text>
    <text x="120" y="470" class="mapRegion">南地</text>
    <g id="mapRouteLayer"></g>
    <g id="mapPoiLayer"></g>
  `;
}

function ensureMapSvg() {
  const svg = Bible.dom.mapCanvas;
  if (!svg || svg.dataset.ready) return svg;
  svg.innerHTML = `
    <defs>
      <linearGradient id="mapLand" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#E8DFCB"/>
        <stop offset="100%" stop-color="#D2C2A2"/>
      </linearGradient>
      <linearGradient id="mapWater" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#8FB4C6"/>
        <stop offset="100%" stop-color="#6E98AE"/>
      </linearGradient>
    </defs>
    ${mapSvgBase()}
  `;
  svg.dataset.ready = "1";
  return svg;
}

function applyMapTransform() {
  const svg = Bible.dom.mapCanvas;
  if (!svg) return;
  svg.style.transform = `translate(${Bible.map.panX}px, ${Bible.map.panY}px) scale(${Bible.map.scale})`;
}

function clampMapScale(value) {
  return Math.min(3.2, Math.max(0.7, value));
}

function mapStageCenterOffset(clientX, clientY) {
  const stage = Bible.dom.mapStage;
  if (!stage) return { x: 0, y: 0 };
  const rect = stage.getBoundingClientRect();
  return { x: clientX - rect.left - rect.width / 2, y: clientY - rect.top - rect.height / 2 };
}

function zoomMapAt(clientX, clientY, nextScale) {
  const old = Bible.map.scale || 1;
  const scale = clampMapScale(nextScale);
  if (old <= 0 || scale === old) {
    Bible.map.scale = scale;
    applyMapTransform();
    return;
  }
  const point = mapStageCenterOffset(clientX, clientY);
  const k = scale / old;
  Bible.map.panX = point.x - (point.x - Bible.map.panX) * k;
  Bible.map.panY = point.y - (point.y - Bible.map.panY) * k;
  Bible.map.scale = scale;
  applyMapTransform();
}

function bindMapGestures(stage) {
  const pointers = new Map();
  let pinchDist = 0;
  let pinchMid = null;
  Bible.map.gestureMoved = false;

  const pointOf = (event) => ({ x: event.clientX, y: event.clientY });
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  stage.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".mapTools")) return;
    stage.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, pointOf(event));
    if (pointers.size === 1) Bible.map.gestureMoved = false;
    if (pointers.size === 2) {
      const pts = [...pointers.values()];
      pinchDist = dist(pts[0], pts[1]);
      pinchMid = mid(pts[0], pts[1]);
      Bible.map.gestureMoved = true;
    }
  });
  stage.addEventListener("pointermove", (event) => {
    if (!pointers.has(event.pointerId)) return;
    const prev = pointers.get(event.pointerId);
    const next = pointOf(event);
    pointers.set(event.pointerId, next);
    if (pointers.size >= 2) {
      const pts = [...pointers.values()];
      const d = dist(pts[0], pts[1]);
      const c = mid(pts[0], pts[1]);
      if (pinchDist > 8) {
        zoomMapAt(c.x, c.y, Bible.map.scale * (d / pinchDist));
        Bible.map.panX += c.x - pinchMid.x;
        Bible.map.panY += c.y - pinchMid.y;
        applyMapTransform();
      }
      pinchDist = d;
      pinchMid = c;
      Bible.map.gestureMoved = true;
      return;
    }
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    if (Math.hypot(dx, dy) > 3) Bible.map.gestureMoved = true;
    Bible.map.panX += dx;
    Bible.map.panY += dy;
    applyMapTransform();
  });
  const endPointer = (event) => {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) {
      pinchDist = 0;
      pinchMid = null;
    }
  };
  stage.addEventListener("pointerup", endPointer);
  stage.addEventListener("pointercancel", endPointer);
  stage.addEventListener("pointerleave", (event) => {
    if (pointers.has(event.pointerId)) endPointer(event);
  });
  stage.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      zoomMapAt(event.clientX, event.clientY, Bible.map.scale * (event.deltaY > 0 ? 0.9 : 1.11));
    },
    { passive: false },
  );
  stage.addEventListener(
    "touchmove",
    (event) => {
      if (event.touches.length >= 1) event.preventDefault();
    },
    { passive: false },
  );
}

function renderMapPois(highlightIds) {
  const layer = document.getElementById("mapPoiLayer");
  if (!layer) return;
  const marks = Bible.map.places.filter((place) => place.inFrame !== false && mapMatchesEra(place));
  const hi = new Set(highlightIds || []);
  layer.innerHTML = marks
    .map((place) => {
      const uncertain = place.certainty === "uncertain";
      const on = hi.has(place.id);
      return `<g class="mapPoi" data-map-place="${place.id}">
        <circle cx="${place.x}" cy="${place.y}" r="${on ? 8 : 6}" fill="${uncertain ? "none" : "#2F4034"}" stroke="${on ? "#C4A35A" : "#fff"}" stroke-width="${uncertain ? 2 : 2}" stroke-dasharray="${uncertain ? "3 2" : "0"}"/>
        <text class="mapPin" x="${place.x}" y="${place.y - 12}">${place.name}</text>
      </g>`;
    })
    .join("");
}

function renderMapRoute(journey) {
  const layer = document.getElementById("mapRouteLayer");
  if (!layer) return;
  if (!journey) {
    layer.innerHTML = "";
    return;
  }
  const pts = journey.stops
    .map((stop) => mapPlaceById(stop.place))
    .filter((place) => place && place.inFrame !== false);
  if (pts.length < 2) {
    layer.innerHTML = "";
    return;
  }
  const sea = (journey.mode || []).includes("sea");
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
  layer.innerHTML = `<path d="${d}" fill="none" stroke="${sea ? "#5E86A0" : "#9A7A32"}" stroke-width="3" stroke-dasharray="${sea ? "7 5" : "0"}" opacity=".9"/>`;
}

function setMapPane(name) {
  Bible.map.pane = name;
  document.querySelectorAll("[data-map-pane]").forEach((el) => {
    el.hidden = el.dataset.mapPane !== name;
  });
  document.querySelectorAll("[data-map-tab]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mapTab === name);
  });
}

function renderMapPlaceList(filter) {
  const list = Bible.dom.mapPlaceList;
  if (!list) return;
  const q = String(filter || "").trim().toLowerCase();
  const rows = Bible.map.places.filter((place) => {
    if (!mapMatchesEra(place)) return false;
    if (!q) return true;
    return `${place.name} ${place.en} ${place.now} ${(place.aliases || []).join(" ")}`.toLowerCase().includes(q);
  });
  list.innerHTML = rows
    .map((place) => {
      const extra = place.inFrame === false ? " · 图外" : place.certainty === "uncertain" ? " · 推定" : "";
      return `<button class="resultItem" type="button" data-map-place="${place.id}">
        <div class="resultRef">${escapeHtml(place.name)} · ${escapeHtml(place.en)}${extra}</div>
        <div class="resultText">今：${escapeHtml(place.now)}</div>
      </button>`;
    })
    .join("") || `<div class="panelHint">没有匹配的地名</div>`;
}

function renderMapJourneys() {
  const list = Bible.dom.mapJourneyList;
  if (!list) return;
  const rows = Bible.map.era === "all" ? Bible.map.journeys : Bible.map.journeys.filter((item) => item.era === Bible.map.era);
  list.innerHTML = rows
    .map((item) => {
      const stops = item.stops
        .map((stop) => {
          const place = mapPlaceById(stop.place);
          const name = place ? place.name : stop.place;
          const off = place && place.inFrame === false ? "（图外）" : "";
          return name + off;
        })
        .join(" → ");
      return `<button class="resultItem" type="button" data-map-journey="${item.id}">
        <div class="resultRef">${escapeHtml(item.name)}</div>
        <div class="resultText">${escapeHtml(stops)}</div>
      </button>`;
    })
    .join("");
}

async function fetchPlaceVerse(entry) {
  const state = Bible.state;
  const data = await api(`/api/chapter?version=${encodeURIComponent(state.version)}&book=${entry.book}&chapter=${entry.chapter}`);
  const end = entry.verseEnd || entry.verse;
  const parts = (data.verses || []).filter((item) => item.verse >= entry.verse && item.verse <= end);
  const book = (state.books || []).find((item) => item.id === entry.book);
  const ref = `${book ? book.longName : "书卷"} ${entry.chapter}:${entry.verse}${end > entry.verse ? "–" + end : ""}`;
  return { book: entry.book, chapter: entry.chapter, verse: entry.verse, ref, text: parts.map((item) => item.text).join("") };
}

async function openMapPlace(id) {
  const place = mapPlaceById(id);
  const body = Bible.dom.mapPlaceBody;
  if (!place || !body) return;
  Bible.map.activePlace = id;
  if (Bible.dom.mapPlaceDetail) Bible.dom.mapPlaceDetail.hidden = false;
  body.innerHTML = `<div class="loading">正在读取经文…</div>`;
  let verses = [];
  try {
    verses = await Promise.all((place.verses || []).map(fetchPlaceVerse));
  } catch (error) {
    verses = [{ ref: "", text: error.message }];
  }
  const off = place.inFrame === false ? `<span class="verseLibBadge">图外</span>` : "";
  const uncertain = place.certainty === "uncertain" ? `<span class="verseLibBadge">位置推定</span>` : `<span class="verseLibBadge">位置确定</span>`;
  body.innerHTML = `
    <h3 style="margin:0 0 6px">${escapeHtml(place.name)}</h3>
    <div class="panelHint">${escapeHtml(place.en)} · 今：${escapeHtml(place.now)} ${uncertain} ${off}</div>
    <p class="panelHint">${escapeHtml(place.desc)}</p>
    <div class="dataButtons">
      <button type="button" data-map-focus="${place.id}">在地图上看</button>
    </div>
    <div class="panelTitle" style="margin-top:12px">相关经文 · 当前译本</div>
    ${verses
      .map(
        (item) => `<button class="resultItem" type="button" data-jump-book="${item.book || ""}" data-jump-chapter="${item.chapter || ""}" data-jump-verse="${item.verse || ""}">
        <div class="resultRef">${escapeHtml(item.ref)}</div>
        <div class="resultText">${escapeHtml(item.text || "")}</div>
      </button>`,
      )
      .join("")}
  `;
}

function closeMapPlace() {
  Bible.map.activePlace = null;
  if (Bible.dom.mapPlaceDetail) Bible.dom.mapPlaceDetail.hidden = true;
}

function showJourneyOnMap(id) {
  const journey = Bible.map.journeys.find((item) => item.id === id);
  Bible.map.activeJourney = journey || null;
  setMapPane("map");
  ensureMapSvg();
  renderMapPois(journey ? journey.stops.map((stop) => stop.place) : null);
  renderMapRoute(journey);
  closeMapPlace();
  if (journey) showStatus(`已在地图显示：${journey.name}`, "success");
}

async function openMapSheet(options = {}) {
  await loadMapCatalog();
  closeContentPanels();
  const sheet = Bible.dom.mapSheet;
  if (!sheet) return;
  sheet.hidden = false;
  keepReadingChromeVisible();
  syncSheetOverlay();
  ensureMapSvg();
  applyMapTransform();
  const era = options.era || Bible.map.era || "all";
  Bible.map.era = era;
  document.querySelectorAll("[data-map-era]").forEach((btn) => btn.classList.toggle("active", btn.dataset.mapEra === era));
  if (options.journeyId) showJourneyOnMap(options.journeyId);
  else {
    renderMapPois(options.placeId ? [options.placeId] : null);
    renderMapRoute(null);
  }
  renderMapPlaceList(Bible.dom.mapPlaceSearch?.value);
  renderMapJourneys();
  setMapPane(options.pane || "map");
  if (options.placeId) await openMapPlace(options.placeId);
}

function placesForText(text) {
  const hay = String(text || "");
  if (!hay) return [];
  return Bible.map.places.filter((place) => (place.aliases || [place.name]).some((alias) => alias && hay.includes(alias)));
}

function renderChapterPlaceBar() {
  const bar = Bible.dom.chapterPlacesBar;
  if (!bar) return;
  if (!Bible.map.loaded) {
    bar.hidden = true;
    return;
  }
  const content = Bible.dom.content;
  const text = content ? content.innerText : "";
  const hits = placesForText(text);
  if (!hits.length) {
    bar.hidden = true;
    bar.innerHTML = "";
    return;
  }
  bar.hidden = false;
  const shown = hits.slice(0, 3);
  bar.innerHTML =
    `<span>本章地点</span>` +
    shown.map((place) => `<button type="button" data-map-open="${place.id}">${escapeHtml(place.name)}</button>`).join("") +
    (hits.length > 3 ? `<button type="button" data-map-open="">更多</button>` : "");
}

function verseHasMapPlace(verseNo) {
  const el = Bible.dom.content?.querySelector(`.verse[data-verse="${verseNo}"]`);
  const hits = placesForText(el ? el.innerText : "");
  return hits[0] || null;
}

function initMapUi() {
  const stage = Bible.dom.mapStage;
  if (stage && !stage.dataset.bound) {
    stage.dataset.bound = "1";
    bindMapGestures(stage);
  }
  Bible.dom.mapZoomIn?.addEventListener("click", () => {
    const rect = stage?.getBoundingClientRect();
    if (rect) zoomMapAt(rect.left + rect.width / 2, rect.top + rect.height / 2, Bible.map.scale + 0.25);
    else {
      Bible.map.scale = clampMapScale(Bible.map.scale + 0.25);
      applyMapTransform();
    }
  });
  Bible.dom.mapZoomOut?.addEventListener("click", () => {
    const rect = stage?.getBoundingClientRect();
    if (rect) zoomMapAt(rect.left + rect.width / 2, rect.top + rect.height / 2, Bible.map.scale - 0.25);
    else {
      Bible.map.scale = clampMapScale(Bible.map.scale - 0.25);
      applyMapTransform();
    }
  });
  Bible.dom.mapZoomReset?.addEventListener("click", () => {
    Bible.map.scale = 1;
    Bible.map.panX = 0;
    Bible.map.panY = 0;
    applyMapTransform();
  });
  document.querySelectorAll("[data-map-tab]").forEach((btn) => {
    btn.addEventListener("click", () => setMapPane(btn.dataset.mapTab));
  });
  document.querySelectorAll("[data-map-era]").forEach((btn) => {
    btn.addEventListener("click", () => {
      Bible.map.era = btn.dataset.mapEra;
      document.querySelectorAll("[data-map-era]").forEach((el) => el.classList.toggle("active", el === btn));
      renderMapPois(Bible.map.activeJourney ? Bible.map.activeJourney.stops.map((s) => s.place) : null);
      renderMapRoute(Bible.map.activeJourney);
      renderMapPlaceList(Bible.dom.mapPlaceSearch?.value);
      renderMapJourneys();
    });
  });
  Bible.dom.mapPlaceSearch?.addEventListener("input", () => renderMapPlaceList(Bible.dom.mapPlaceSearch.value));
  Bible.dom.mapPlaceList?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-map-place]");
    if (btn) openMapPlace(btn.dataset.mapPlace);
  });
  Bible.dom.mapJourneyList?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-map-journey]");
    if (btn) showJourneyOnMap(btn.dataset.mapJourney);
  });
  Bible.dom.mapCanvas?.addEventListener("click", (event) => {
    if (Bible.map.gestureMoved) return;
    const poi = event.target.closest("[data-map-place]");
    if (poi) openMapPlace(poi.dataset.mapPlace);
  });
  Bible.dom.mapPlaceBody?.addEventListener("click", async (event) => {
    const focus = event.target.closest("[data-map-focus]");
    if (focus) {
      closeMapPlace();
      setMapPane("map");
      renderMapPois([focus.dataset.mapFocus]);
      return;
    }
    const jump = event.target.closest("[data-jump-book]");
    if (jump && jump.dataset.jumpBook) {
      const book = Number(jump.dataset.jumpBook);
      const chapter = Number(jump.dataset.jumpChapter);
      const verse = Number(jump.dataset.jumpVerse);
      closeMapPlace();
      if (typeof jumpFromPeek === "function") {
        await jumpFromPeek(
          { book, chapter, verse },
          { kind: "map", title: "返回地图", restore: () => openMapSheet({ pane: "map" }) },
        );
      }
    }
  });
  Bible.dom.closeMapPlaceBtn?.addEventListener("click", closeMapPlace);
  Bible.dom.closeMapSheetBtn?.addEventListener("click", () => {
    closeMapPlace();
    if (Bible.dom.mapSheet) Bible.dom.mapSheet.hidden = true;
    keepReadingChromeVisible();
    syncSheetOverlay();
  });
  Bible.dom.openMapCard?.addEventListener("click", () => openMapSheet());
  Bible.dom.chapterPlacesBar?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-map-open]");
    if (!btn) return;
    openMapSheet({ placeId: btn.dataset.mapOpen || undefined, pane: btn.dataset.mapOpen ? "map" : "places" });
  });
}

Bible.map.open = openMapSheet;
Bible.map.closePlace = closeMapPlace;
Bible.map.onChapterRendered = renderChapterPlaceBar;
Bible.map.placeForVerse = verseHasMapPlace;
Bible.map.handleBack = function () {
  if (Bible.dom.mapPlaceDetail && !Bible.dom.mapPlaceDetail.hidden) {
    closeMapPlace();
    return true;
  }
  if (Bible.dom.mapSheet && !Bible.dom.mapSheet.hidden) {
    Bible.dom.mapSheet.hidden = true;
    keepReadingChromeVisible();
    syncSheetOverlay();
    return true;
  }
  return false;
};

loadMapCatalog()
  .then(() => {
    initMapUi();
    renderChapterPlaceBar();
  })
  .catch(() => {});
