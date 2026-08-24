import { httpError } from "./http.js";

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_TEXT = 20000;
const FETCH_MS = 15000;
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 LocalBibleReader/1.35.0";

export function looksLikeHttpUrl(value) {
  return /^https?:\/\/[^\s]+$/i.test(String(value || "").trim());
}

export function publicHttpUrl(value) {
  let parsed;
  try {
    parsed = new URL(String(value || "").trim());
  } catch {
    throw httpError("请输入有效的 http 或 https 链接", 400);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw httpError("只支持 http 或 https 链接", 400);
  }
  if (isPrivateHost(parsed.hostname)) {
    throw httpError("不能读取本机或内网地址", 400);
  }
  return parsed;
}

function isPrivateHost(hostname) {
  const host = String(hostname || "")
    .replace(/^\[|\]$/g, "")
    .toLowerCase();
  if (!host) return true;
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return true;
  if (host === "::1" || host === "0.0.0.0" || host === "127.0.0.1") return true;
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) return true;
  const match = host.match(/^172\.(\d+)\./);
  if (match) {
    const second = Number(match[1]);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}

function normalizeCharset(value) {
  const raw = String(value || "")
    .trim()
    .replace(/["']/g, "")
    .toLowerCase();
  if (!raw) return "";
  if (raw === "gbk" || raw === "gb2312" || raw === "gb18030") return "gb18030";
  if (raw === "utf8") return "utf-8";
  return raw;
}

function decodeEntities(text) {
  return String(text || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => {
      const n = Number(code);
      return n >= 32 && n < 0x110000 ? String.fromCodePoint(n) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const n = parseInt(hex, 16);
      return n >= 32 && n < 0x110000 ? String.fromCodePoint(n) : "";
    });
}

function stripTags(html) {
  return String(html || "").replace(/<[^>]+>/g, " ");
}

function decodeBuffer(buf, contentType) {
  const head = buf.subarray(0, 4096).toString("latin1");
  let charset = normalizeCharset((String(contentType || "").match(/charset=([^;]+)/i) || [])[1]);
  if (!charset) charset = normalizeCharset((head.match(/charset\s*=\s*["']?([\w-]+)/i) || [])[1]);
  const tryList = [...new Set([charset, "utf-8", "gb18030"].filter(Boolean))];
  for (const name of tryList) {
    try {
      return new TextDecoder(name).decode(buf);
    } catch {
      continue;
    }
  }
  return buf.toString("utf8");
}

function pickMainHtml(html) {
  const article = html.match(/<article\b[\s\S]*?<\/article>/i);
  if (article) return article[0];
  const main = html.match(/<main\b[\s\S]*?<\/main>/i);
  if (main) return main[0];
  const content =
    html.match(/<div[^>]*(id|class)=["'][^"']*(content|post|article|entry|rich_media)[^"']*["'][^>]*>[\s\S]*$/i) || [];
  if (content[0]) return content[0].slice(0, 400000);
  return html;
}

export function htmlToMarkdown(html) {
  let s = String(html || "");
  const title = decodeEntities(stripTags((s.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "")).trim();
  s = s.replace(/<script\b[\s\S]*?<\/script>/gi, " ");
  s = s.replace(/<style\b[\s\S]*?<\/style>/gi, " ");
  s = s.replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ");
  s = s.replace(/<(svg|iframe|canvas|form)\b[\s\S]*?<\/\1>/gi, " ");
  s = pickMainHtml(s);
  s = s.replace(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, tag, inner) => {
    const level = Math.min(Number(tag[1]) || 2, 3);
    return `\n${"#".repeat(level)} ${decodeEntities(stripTags(inner)).trim()}\n`;
  });
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/(p|div|section|blockquote|tr)>/gi, "\n\n");
  s = s.replace(/<li\b[^>]*>/gi, "\n- ");
  s = decodeEntities(stripTags(s));
  s = s
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (s.length > MAX_TEXT) s = `${s.slice(0, MAX_TEXT).trim()}\n\n…（后文已截断）`;
  return { title, text: s };
}

export async function extractWebPage(urlText) {
  const first = publicHttpUrl(urlText);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_MS);
  let response;
  try {
    response = await fetch(first.href, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,text/plain,text/markdown,application/xhtml+xml;q=0.9,*/*;q=0.5",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
    });
  } catch (error) {
    if (error?.name === "AbortError") throw httpError("读取网页超时", 504);
    const detail = error.cause?.message || error.message || "无法打开这个链接";
    throw httpError(detail, 502);
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) throw httpError(`网页返回 ${response.status}`, 502);
  const finalUrl = publicHttpUrl(response.url || first.href).href;
  const contentType = response.headers.get("content-type") || "";
  const buf = Buffer.from(await response.arrayBuffer());
  if (buf.length > MAX_BYTES) throw httpError("网页过大", 413);
  const decoded = decodeBuffer(buf, contentType);
  const isHtml = /html/i.test(contentType) || /<html|<body|<article|<p[\s>]/i.test(decoded.slice(0, 2000));
  let title = "";
  let text = decoded.trim();
  if (isHtml) {
    const extracted = htmlToMarkdown(decoded);
    title = extracted.title;
    text = extracted.text;
  }
  if (text.length < 24) throw httpError("没有提取到可用正文。有的页面需要登录，或正文在脚本里。", 422);
  const heading = title || first.hostname;
  const markdown = [`# ${heading}`, "", `来源: ${finalUrl}`, "", text].join("\n");
  return { url: finalUrl, title: heading, text, markdown };
}
