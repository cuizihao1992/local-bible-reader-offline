(function () {
  const phone = document.getElementById("phoneScreen");
  const links = document.querySelectorAll(".catalog a[href^='#']");
  const titleEl = document.getElementById("currentScreenLabel");
  const darkBtn = document.getElementById("toggleDark");
  const deskBtn = document.getElementById("toggleDesktop");

  const titles = {
    reader: "阅读页",
    books: "书卷选择",
    chapters: "章节选择",
    verses: "经节选择",
    versions: "译本选择",
    "reader-settings": "阅读设置",
    search: "搜索",
    audio: "朗读（顶栏迷你条）",
    ai: "助手",
    dictionary: "辞典",
    strong: "Strong",
    commentary: "本节注释",
    note: "批注",
    share: "金句分享",
    "my-marks": "我的 · 标注",
    "my-library": "我的 · 经文库",
    "my-resources": "我的 · 资源",
    "my-updates": "我的 · 更新",
    settings: "设置 · 助手 / 辞典 / 系统",
    "verse-menu": "经文菜单",
    multi: "多选",
    confirm: "口令确认",
    peek: "peek 返回条",
    toast: "状态提示",
    compare: "对照",
  };

  function show(id) {
    if (!titles[id]) id = "reader";
    phone.dataset.view = id;
    links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + id));
    if (titleEl) titleEl.textContent = titles[id] || id;
    history.replaceState(null, "", "#" + id);
  }

  document.addEventListener("click", (event) => {
    const go = event.target.closest("[data-go]");
    if (go) {
      event.preventDefault();
      if (document.body.classList.contains("showDesktop")) {
        document.body.classList.remove("showDesktop");
        if (deskBtn) deskBtn.textContent = "桌面示意";
      }
      show(go.dataset.go);
      return;
    }
    const hash = event.target.closest("a[href^='#']");
    if (hash) {
      const id = hash.getAttribute("href").slice(1);
      if (titles[id]) {
        event.preventDefault();
        show(id);
      }
    }
  });

  darkBtn?.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    phone.classList.toggle("darkTheme");
    darkBtn.textContent = document.body.classList.contains("dark") ? "日间预览" : "夜间预览";
  });

  deskBtn?.addEventListener("click", () => {
    document.body.classList.toggle("showDesktop");
    deskBtn.textContent = document.body.classList.contains("showDesktop") ? "手机预览" : "桌面示意";
  });

  const settingsTabs = document.querySelectorAll("[data-settings-tab]");
  settingsTabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.settingsTab;
      document.querySelectorAll("[data-settings-tab]").forEach((b) => b.classList.toggle("active", b === btn));
      document.querySelectorAll("[data-settings-pane]").forEach((p) => {
        p.classList.toggle("hidden", p.dataset.settingsPane !== name);
      });
    });
  });

  const start = (location.hash || "#reader").slice(1);
  show(start);
})();
