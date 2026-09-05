package local.bible.reader;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

final class DownloadMirrors {
    static final String REPO = "cuizihao1992/local-bible-reader-offline";
    static final String GITHUB_RELEASES = "https://api.github.com/repos/" + REPO + "/releases?per_page=20";
    static final String GITHUB_LATEST = "https://api.github.com/repos/" + REPO + "/releases/latest";
    static final String EXTRA_BIBLES = "bibles-extra-v1.3.0.zip";
    static final String COMMENTARIES = "commentaries-v1.3.0.zip";
    static final long EXTRA_BIBLES_SIZE = 152367407L;
    static final long COMMENTARIES_SIZE = 123662016L;

    private static final String[] PREFIXES = {
            "https://ghfast.top/",
            "https://gh-proxy.com/",
            "https://ghproxy.net/"
    };

    private static final String[] LATEST_JSON = {
            "https://cdn.jsdelivr.net/gh/" + REPO + "@main/latest.json",
            "https://fastly.jsdelivr.net/gh/" + REPO + "@main/latest.json",
            "https://gcore.jsdelivr.net/gh/" + REPO + "@main/latest.json",
            "https://raw.githubusercontent.com/" + REPO + "/main/latest.json"
    };

    private DownloadMirrors() {}

    static List<String> candidates(String url) {
        List<String> list = new ArrayList<>();
        add(list, url);
        if (isGithub(url)) {
            for (String prefix : PREFIXES) add(list, prefix + url);
        }
        return list;
    }

    static List<String> releaseApiCandidates() {
        List<String> list = new ArrayList<>();
        list.addAll(candidates(GITHUB_RELEASES));
        list.addAll(candidates(GITHUB_LATEST));
        return list;
    }

    static List<String> latestJsonCandidates() {
        List<String> list = new ArrayList<>();
        for (String url : LATEST_JSON) add(list, url);
        return list;
    }

    static boolean isGithub(String url) {
        if (url == null) return false;
        return url.startsWith("https://github.com/")
                || url.startsWith("https://api.github.com/")
                || url.contains("githubusercontent.com");
    }

    static boolean isAllowedDownload(String url) {
        if (url == null || !url.startsWith("https://")) return false;
        if (isGithub(url)) return true;
        if (url.contains("jsdelivr.net/") || url.contains("gitee.com/") || url.contains("pgyer.com/")) return true;
        for (String prefix : PREFIXES) {
            if (url.startsWith(prefix)) return true;
        }
        return false;
    }

    static String packageUrl(String fileName) {
        return "https://github.com/" + REPO + "/releases/download/v1.3.0/" + fileName;
    }

    static long expectedZipSize(String packageId) {
        if ("extra-bibles".equals(packageId)) return EXTRA_BIBLES_SIZE;
        if ("commentaries".equals(packageId)) return COMMENTARIES_SIZE;
        return 0;
    }

    static JSONObject pickAppRelease(JSONArray releases) throws Exception {
        if (releases == null) return null;
        for (int i = 0; i < releases.length(); i++) {
            JSONObject release = releases.getJSONObject(i);
            if (release.optBoolean("draft")) continue;
            String tag = release.optString("tag_name");
            if (!isAppTag(tag) || !hasApk(release)) continue;
            return release;
        }
        return null;
    }

    static boolean isAppTag(String tag) {
        return tag != null && tag.matches("v?\\d+\\.\\d+.*");
    }

    static boolean hasApk(JSONObject release) {
        JSONArray assets = release.optJSONArray("assets");
        if (assets == null) return false;
        for (int i = 0; i < assets.length(); i++) {
            JSONObject asset = assets.optJSONObject(i);
            if (asset != null && asset.optString("name").toLowerCase().endsWith(".apk")) return true;
        }
        return false;
    }

    static JSONObject fromCatalog(JSONObject catalog, String currentVersion) throws Exception {
        JSONObject apk = catalog.optJSONObject("apk");
        JSONArray assets = new JSONArray();
        if (apk != null) {
            assets.put(new JSONObject()
                    .put("name", apk.optString("name"))
                    .put("size", apk.optLong("size"))
                    .put("url", apk.optString("url")));
            JSONArray extra = apk.optJSONArray("mirrors");
            if (extra != null) {
                for (int i = 0; i < extra.length(); i++) {
                    String mirror = extra.optString(i);
                    if (mirror == null || mirror.isEmpty()) continue;
                    assets.put(new JSONObject()
                            .put("name", apk.optString("name"))
                            .put("size", apk.optLong("size"))
                            .put("url", mirror));
                }
            }
        }
        String version = catalog.optString("version", currentVersion);
        return new JSONObject()
                .put("currentVersion", currentVersion)
                .put("tagName", catalog.optString("tagName", "v" + version))
                .put("version", version.replaceFirst("^v", ""))
                .put("name", catalog.optString("name", "v" + version))
                .put("body", catalog.optString("body"))
                .put("publishedAt", catalog.optString("publishedAt"))
                .put("source", "latest.json")
                .put("assets", assets);
    }

    private static void add(List<String> list, String url) {
        if (url != null && !url.isEmpty() && !list.contains(url)) list.add(url);
    }
}
