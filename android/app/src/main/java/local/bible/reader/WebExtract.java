package local.bible.reader;

import android.content.Context;

import org.json.JSONObject;

import java.net.URI;
import java.nio.charset.Charset;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class WebExtract {
    private static final int MAX_BYTES = 2 * 1024 * 1024;
    private static final int MAX_TEXT = 20000;

    private WebExtract() {}

    static JSONObject extract(Context context, String urlText) throws Exception {
        URI uri = publicHttpUrl(urlText);
        HttpSupport.FetchedPage page = HttpSupport.getPage(context, uri.toString(), MAX_BYTES);
        publicHttpUrl(page.url);
        String html = decodeBody(page.body, page.contentType);
        boolean isHtml = page.contentType.toLowerCase().contains("html")
                || html.regionMatches(true, 0, "<!doctype", 0, 9)
                || html.contains("<html")
                || html.contains("<body")
                || html.contains("<article");
        String title = "";
        String text = html.trim();
        if (isHtml) {
            title = decodeEntities(stripTags(matchOne(html, "<title[^>]*>([\\s\\S]*?)</title>"))).trim();
            text = htmlToText(html);
        }
        if (text.length() < 24) throw new Exception("没有提取到可用正文。有的页面需要登录，或正文在脚本里。");
        if (text.length() > MAX_TEXT) text = text.substring(0, MAX_TEXT).trim() + "\n\n…（后文已截断）";
        String heading = title.isEmpty() ? uri.getHost() : title;
        String markdown = "# " + heading + "\n\n来源: " + page.url + "\n\n" + text;
        return new JSONObject()
                .put("url", page.url)
                .put("title", heading)
                .put("text", text)
                .put("markdown", markdown);
    }

    static URI publicHttpUrl(String value) throws Exception {
        URI uri;
        try {
            uri = new URI(String.valueOf(value == null ? "" : value).trim());
        } catch (Exception error) {
            throw new Exception("请输入有效的 http 或 https 链接");
        }
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();
        if (!"http".equals(scheme) && !"https".equals(scheme)) throw new Exception("只支持 http 或 https 链接");
        if (isPrivateHost(uri.getHost())) throw new Exception("不能读取本机或内网地址");
        return uri;
    }

    private static boolean isPrivateHost(String hostname) {
        if (hostname == null || hostname.isEmpty()) return true;
        String host = hostname.replace("[", "").replace("]", "").toLowerCase();
        if ("localhost".equals(host) || host.endsWith(".localhost") || host.endsWith(".local")) return true;
        if ("::1".equals(host) || "0.0.0.0".equals(host) || "127.0.0.1".equals(host)) return true;
        if (host.startsWith("127.") || host.startsWith("10.") || host.startsWith("192.168.") || host.startsWith("169.254.")) return true;
        Matcher match = Pattern.compile("^172\\.(\\d+)\\.").matcher(host);
        if (match.find()) {
            int second = Integer.parseInt(match.group(1));
            if (second >= 16 && second <= 31) return true;
        }
        return false;
    }

    private static String decodeBody(byte[] body, String contentType) {
        String charset = charsetOf(contentType);
        if (charset.isEmpty()) {
            String head = new String(body, 0, Math.min(body.length, 4096), Charset.forName("ISO-8859-1"));
            charset = charsetOf(matchOne(head, "charset\\s*=\\s*[\"']?([\\w-]+)"));
        }
        String[] tries = charset.isEmpty() ? new String[]{"UTF-8", "GB18030"} : new String[]{charset, "UTF-8", "GB18030"};
        for (String name : tries) {
            try {
                return new String(body, Charset.forName(name));
            } catch (Exception ignored) {
            }
        }
        return new String(body, Charset.forName("UTF-8"));
    }

    private static String charsetOf(String value) {
        String raw = String.valueOf(value == null ? "" : value).trim().replace("\"", "").replace("'", "").toLowerCase();
        if (raw.contains("charset=")) {
            int at = raw.indexOf("charset=");
            raw = raw.substring(at + 8);
            int end = raw.indexOf(';');
            if (end >= 0) raw = raw.substring(0, end);
            raw = raw.trim();
        }
        if (raw.isEmpty()) return "";
        if ("gbk".equals(raw) || "gb2312".equals(raw) || "gb18030".equals(raw)) return "GB18030";
        if ("utf8".equals(raw) || "utf-8".equals(raw)) return "UTF-8";
        return raw;
    }

    private static String htmlToText(String html) {
        String s = html.replaceAll("(?is)<script\\b[\\s\\S]*?</script>", " ");
        s = s.replaceAll("(?is)<style\\b[\\s\\S]*?</style>", " ");
        s = s.replaceAll("(?is)<noscript\\b[\\s\\S]*?</noscript>", " ");
        Matcher article = Pattern.compile("(?is)<article\\b[\\s\\S]*?</article>").matcher(s);
        if (article.find()) s = article.group();
        else {
            Matcher main = Pattern.compile("(?is)<main\\b[\\s\\S]*?</main>").matcher(s);
            if (main.find()) s = main.group();
        }
        Matcher heading = Pattern.compile("(?is)<(h[1-6])\\b[^>]*>([\\s\\S]*?)</\\1>").matcher(s);
        StringBuffer headed = new StringBuffer();
        while (heading.find()) {
            int level = Math.min(heading.group(1).charAt(1) - '0', 3);
            if (level < 1) level = 2;
            String hashes = level == 1 ? "# " : (level == 2 ? "## " : "### ");
            heading.appendReplacement(headed, Matcher.quoteReplacement("\n" + hashes + decodeEntities(stripTags(heading.group(2))).trim() + "\n"));
        }
        heading.appendTail(headed);
        s = headed.toString();
        s = s.replaceAll("(?i)<br\\s*/?>", "\n");
        s = s.replaceAll("(?i)</(p|div|section|blockquote|tr)>", "\n\n");
        s = s.replaceAll("(?i)<li\\b[^>]*>", "\n- ");
        s = decodeEntities(stripTags(s));
        s = s.replaceAll("[ \\t]+\\n", "\n").replaceAll("\\n[ \\t]+", "\n");
        s = s.replaceAll("[ \\t]{2,}", " ").replaceAll("\\n{3,}", "\n\n").trim();
        return s;
    }

    private static String stripTags(String html) {
        return html == null ? "" : html.replaceAll("<[^>]+>", " ");
    }

    private static String decodeEntities(String text) {
        if (text == null || text.isEmpty()) return "";
        String s = text.replace("&nbsp;", " ").replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", "\"");
        Matcher dec = Pattern.compile("&#(\\d+);").matcher(s);
        StringBuffer out = new StringBuffer();
        while (dec.find()) {
            int n = Integer.parseInt(dec.group(1));
            dec.appendReplacement(out, n >= 32 ? Matcher.quoteReplacement(new String(Character.toChars(n))) : "");
        }
        dec.appendTail(out);
        return out.toString();
    }

    private static String matchOne(String text, String regex) {
        Matcher matcher = Pattern.compile("(?is)" + regex).matcher(text == null ? "" : text);
        return matcher.find() && matcher.groupCount() >= 1 ? matcher.group(1) : "";
    }
}
