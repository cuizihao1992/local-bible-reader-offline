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
  return !looksEncrypted(value);
}

export function looksEncrypted(value = "") {
  const text = String(value || "").trim();
  if (text.length < 24) return false;
  const sample = text.slice(0, 800);
  if (/[\u4e00-\u9fff]/.test(sample)) return false;
  if (/<[a-zA-Z][^>]{0,60}>/.test(sample)) return false;
  const compact = text.replace(/\s+/g, "");
  if (compact.length < 24 || compact.length % 4 !== 0) return false;
  const b64 = (compact.match(/[A-Za-z0-9+/=]/g) || []).length;
  return b64 / compact.length >= 0.92;
}

export function parseImageNames(value = "") {
  const names = [];
  const seen = new Set();
  const add = (name) => {
    const file = String(name || "").trim().replace(/^["']|["']$/g, "");
    if (!file || seen.has(file) || !/\.(png|jpe?g|gif|webp|bmp)$/i.test(file)) return;
    seen.add(file);
    names.push(file);
  };
  String(value || "")
    .split(/[;,\n]/)
    .forEach(add);
  for (const match of String(value || "").matchAll(/(?:src|Images?)\s*[=:]\s*["']?([^"'>\s;]+)/gi)) {
    add(match[1]);
  }
  return names;
}

export function decodeModuleText(value = "") {
  const raw = String(value || "");
  if (!raw.trim()) return { text: "", encrypted: false, images: [] };
  if (!looksEncrypted(raw)) {
    return { text: cleanText(raw), encrypted: false, images: parseImageNames(raw) };
  }
  return { text: "", encrypted: true, images: parseImageNames(raw) };
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
