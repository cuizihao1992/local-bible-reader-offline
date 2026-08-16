(function (root) {
  const BOOK_SPEECH_EXTRAS = {
    伊斯拉记: "以斯拉记",
    伊斯拉纪: "以斯拉记",
    伊斯拉书: "以斯拉记",
    伊斯拉: "以斯拉记",
    以司拉记: "以斯拉记",
    以司拉: "以斯拉记",
    以斯啦记: "以斯拉记",
    以斯啦: "以斯拉记",
    以斯拉纪: "以斯拉记",
    以斯拉书: "以斯拉记",
    以斯拉記: "以斯拉记",
    Ezra: "以斯拉记",
    ezra: "以斯拉记",
    以斯贴记: "以斯帖记",
    以斯贴: "以斯帖记",
    以司帖记: "以斯帖记",
    以司帖: "以斯帖记",
    伊斯帖记: "以斯帖记",
    伊斯帖: "以斯帖记",
    以斯特记: "以斯帖记",
    以斯特: "以斯帖记",
    伊斯特记: "以斯帖记",
    伊斯特: "以斯帖记",
    以斯铁记: "以斯帖记",
    以斯铁: "以斯帖记",
    以斯碟记: "以斯帖记",
    以斯碟: "以斯帖记",
    以斯帖纪: "以斯帖记",
    以斯帖书: "以斯帖记",
    以斯帖記: "以斯帖记",
    Esther: "以斯帖记",
    esther: "以斯帖记",
    哈巴古书: "哈巴谷书",
    哈巴古: "哈巴谷书",
    哈八谷书: "哈巴谷书",
    哈八谷: "哈巴谷书",
    哈改书: "哈该书",
    哈改: "哈该书",
    哈盖书: "哈该书",
    哈盖: "哈该书",
    腓力比书: "腓立比书",
    腓力比: "腓立比书",
    菲立比书: "腓立比书",
    菲立比: "腓立比书",
    腓力门书: "腓利门书",
    腓力门: "腓利门书",
    菲利门书: "腓利门书",
    菲利门: "腓利门书",
    马泰福音: "马太福音",
    马泰: "马太福音",
    马可福音: "马可福音",
    路德记: "路得记",
    路得: "路得记",
    尼西米记: "尼希米记",
    尼西米: "尼希米记",
    以塞亚书: "以赛亚书",
    以塞亚: "以赛亚书",
    以赛亚记: "以赛亚书",
    撒加利亚书: "撒迦利亚书",
    撒加利亚: "撒迦利亚书",
    约尔书: "约珥书",
    约尔: "约珥书",
    约纳书: "约拿书",
    约纳: "约拿书",
    何西亚书: "何西阿书",
    何西亚: "何西阿书",
    阿摩斯书: "阿摩司书",
    阿摩斯: "阿摩司书",
    弥加书: "弥迦书",
    弥加: "弥迦书",
    纳鸿书: "那鸿书",
    纳鸿: "那鸿书",
    西番牙书: "西番雅书",
    西番牙: "西番雅书",
    玛拉吉书: "玛拉基书",
    玛拉吉: "玛拉基书",
    创世纪: "创世记",
  };

  const TRADITIONAL_CHARS = [
    ["記", "记"],
    ["書", "书"],
    ["約", "约"],
    ["啟", "启"],
    ["馬", "马"],
    ["傳", "传"],
    ["詩", "诗"],
    ["歷", "历"],
    ["數", "数"],
    ["師", "师"],
    ["賽", "赛"],
    ["結", "结"],
    ["爾", "尔"],
    ["亞", "亚"],
    ["彌", "弥"],
    ["羅", "罗"],
    ["來", "来"],
    ["猶", "犹"],
    ["後", "后"],
    ["與", "与"],
  ];

  function normalizeTraditional(text) {
    let value = String(text || "");
    for (const [from, to] of TRADITIONAL_CHARS) value = value.split(from).join(to);
    return value;
  }

  function variantEntries() {
    return Object.entries(BOOK_SPEECH_EXTRAS)
      .filter(([from, to]) => from && to && from !== to)
      .sort((left, right) => right[0].length - left[0].length);
  }

  function canonicalizeSpokenBooks(text) {
    let value = String(text || "");
    for (const [from, to] of variantEntries()) {
      let next = "";
      let index = 0;
      while (index < value.length) {
        if (value.startsWith(to, index)) {
          next += to;
          index += to.length;
        } else if (value.startsWith(from, index)) {
          next += to;
          index += from.length;
        } else {
          next += value[index];
          index += 1;
        }
      }
      value = next;
    }
    return value;
  }

  function spokenAliasIndex(value, alias) {
    const text = String(value || "");
    const key = String(alias || "");
    if (!key) return -1;
    const index = text.indexOf(key);
    if (index < 0) return -1;
    if (key.length >= 2) return index;
    const before = index === 0 ? "" : text[index - 1];
    const after = text[index + key.length] || "";
    const beforeOk = !before || /[\s:：到至]/.test(before);
    const afterOk = !after || /[0-9零〇一二两三四五六七八九十百:：章节]/.test(after);
    return beforeOk && afterOk ? index : -1;
  }

  function namesForBook(longName) {
    const names = [longName];
    for (const [alias, target] of Object.entries(BOOK_SPEECH_EXTRAS)) {
      if (target === longName) names.push(alias);
    }
    return names;
  }

  root.SpokenBooks = {
    extras: BOOK_SPEECH_EXTRAS,
    normalizeTraditional,
    canonicalizeSpokenBooks,
    spokenAliasIndex,
    namesForBook,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
