export function cleanText(value = "") {
  return String(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&ldquo;|&rdquo;/g, "\"")
    .replace(/&lsquo;|&rsquo;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function looksReadable(value = "") {
  const text = String(value).slice(0, 500);
  if (!text) return true;
  if (/[<>\u4e00-\u9fff]/.test(text)) return true;
  const alphaNum = (text.match(/[A-Za-z0-9+/=]/g) || []).length;
  return alphaNum / text.length < 0.82;
}

export function extractStrongNumbers(value = "") {
  const matches = [...String(value).matchAll(/<W([HG])0*(\d{1,5})>/gi)];
  const seen = new Set();
  return matches
    .map((match) => {
      const type = match[1].toUpperCase();
      const number = match[2].padStart(5, "0");
      return { code: `${type}${Number(match[2])}`, type, number };
    })
    .filter((item) => {
      const key = `${item.type}${item.number}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
