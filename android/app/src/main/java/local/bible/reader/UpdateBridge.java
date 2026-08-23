package local.bible.reader;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.webkit.JavascriptInterface;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;

public class UpdateBridge {
    private static final String LATEST_RELEASE_URL = "https://api.github.com/repos/cuizihao1992/local-bible-reader-offline/releases/latest";
    private static final String CURRENT_VERSION = "1.32.0";
    private final Activity activity;
    private volatile JSONObject downloadStatus = new JSONObject();

    public UpdateBridge(Activity activity) {
        this.activity = activity;
    }

    @JavascriptInterface
    public String checkLatest() {
        try {
            JSONObject release = new JSONObject(readText(LATEST_RELEASE_URL));
            HttpSupport.JSONProxy proxy = HttpSupport.snapshot(activity);
            JSONObject result = new JSONObject()
                    .put("currentVersion", CURRENT_VERSION)
                    .put("tagName", release.optString("tag_name"))
                    .put("version", release.optString("tag_name").replaceFirst("^v", ""))
                    .put("name", release.optString("name"))
                    .put("body", release.optString("body"))
                    .put("publishedAt", release.optString("published_at"))
                    .put("proxyType", proxy.type)
                    .put("proxyHost", proxy.host)
                    .put("proxyPort", proxy.port);
            JSONArray assets = new JSONArray();
            JSONArray sourceAssets = release.optJSONArray("assets");
            if (sourceAssets != null) {
                for (int index = 0; index < sourceAssets.length(); index += 1) {
                    JSONObject asset = sourceAssets.getJSONObject(index);
                    assets.put(new JSONObject()
                            .put("name", asset.optString("name"))
                            .put("size", asset.optLong("size"))
                            .put("url", asset.optString("browser_download_url")));
                }
            }
            return result.put("assets", assets).toString();
        } catch (Throwable error) {
            return errorJson(error);
        }
    }

    @JavascriptInterface
    public String localApkStatus(String fileName, String expectedSizeText) {
        try {
            File target = updateFile(fileName);
            long expected = parseSize(expectedSizeText);
            long size = target.exists() ? target.length() : 0;
            boolean ready = isCompleteApk(target, expected);
            return new JSONObject()
                    .put("exists", target.exists())
                    .put("ready", ready)
                    .put("size", size)
                    .put("expected", expected)
                    .put("path", target.getAbsolutePath())
                    .toString();
        } catch (Throwable error) {
            return errorJson(error);
        }
    }

    @JavascriptInterface
    public String downloadAndInstall(String downloadUrl, String fileName) {
        return downloadAndInstall(downloadUrl, fileName, "0");
    }

    @JavascriptInterface
    public String downloadAndInstall(String downloadUrl, String fileName, String expectedSizeText) {
        try {
            if (downloadUrl == null || !downloadUrl.startsWith("https://github.com/")) {
                throw new IllegalArgumentException("更新下载地址不正确");
            }
            File target = updateFile(fileName);
            File parent = target.getParentFile();
            if (parent != null) parent.mkdirs();
            long expected = parseSize(expectedSizeText);
            if (isCompleteApk(target, expected)) {
                setDownloadStatus("apk", "done", target.length(), expected > 0 ? expected : target.length(), "已有安装包，正在打开安装");
                openInstaller(target);
                return new JSONObject().put("started", true).put("reused", true).put("file", target.getAbsolutePath()).toString();
            }
            new Thread(() -> {
                try {
                    downloadWithRetry(downloadUrl, target, expected, 3);
                    openInstaller(target);
                } catch (Throwable error) {
                    setDownloadStatus("apk", "error", target.exists() ? target.length() : 0, expected, friendlyDownloadError(error));
                }
            }).start();
            return new JSONObject().put("started", true).put("reused", false).put("file", target.getAbsolutePath()).toString();
        } catch (Throwable error) {
            setDownloadStatus("apk", "error", 0, 0, friendlyDownloadError(error));
            return errorJson(error);
        }
    }

    @JavascriptInterface
    public String downloadStatus() {
        return downloadStatus.toString();
    }

    @JavascriptInterface
    public String clearDownloadCache() {
        long bytes = deleteChildren(activity.getExternalFilesDir("updates"));
        setDownloadStatus("apk", "cleared", 0, 0, "已清理更新缓存");
        try {
            return new JSONObject().put("ok", true).put("bytes", bytes).put("message", "已清理更新缓存").toString();
        } catch (Exception error) {
            return "{\"ok\":true,\"bytes\":" + bytes + "}";
        }
    }

    private File updateFile(String fileName) {
        String safeName = fileName == null || fileName.trim().isEmpty()
                ? "local-bible-reader-update.apk"
                : fileName.replace("/", "").replace("\\", "");
        return new File(activity.getExternalFilesDir("updates"), safeName);
    }

    private long parseSize(String text) {
        try {
            return Long.parseLong(String.valueOf(text == null ? "0" : text).trim());
        } catch (Exception error) {
            return 0;
        }
    }

    private boolean isCompleteApk(File target, long expected) {
        if (target == null || !target.isFile()) return false;
        long size = target.length();
        if (size < 1024 * 1024) return false;
        if (expected > 0) return size == expected;
        return size > 1024 * 1024;
    }

    private String readText(String urlText) throws Exception {
        String resolved = HttpSupport.resolveRedirects(activity, urlText, 15000, 20000);
        HttpURLConnection connection = HttpSupport.open(activity, resolved, 15000, 20000);
        connection.setRequestProperty("Accept", "application/vnd.github+json");
        try (InputStream in = connection.getInputStream()) {
            byte[] buffer = new byte[8192];
            StringBuilder builder = new StringBuilder();
            int read;
            while ((read = in.read(buffer)) > 0) {
                builder.append(new String(buffer, 0, read, java.nio.charset.StandardCharsets.UTF_8));
            }
            return builder.toString();
        } finally {
            connection.disconnect();
        }
    }

    private void downloadWithRetry(String urlText, File target, long expected, int maxAttempts) throws Exception {
        Exception lastError = null;
        for (int attempt = 1; attempt <= maxAttempts; attempt += 1) {
            try {
                downloadTo(urlText, target, expected, attempt);
                return;
            } catch (Exception error) {
                lastError = error;
                setDownloadStatus("apk", "retrying", target.exists() ? target.length() : 0, expected, "下载失败，重试 " + attempt + "/" + maxAttempts);
                Thread.sleep(1200L * attempt);
            }
        }
        throw lastError == null ? new RuntimeException("APK 下载失败") : lastError;
    }

    private void downloadTo(String urlText, File target, long expected, int attempt) throws Exception {
        if (isCompleteApk(target, expected)) {
            setDownloadStatus("apk", "done", target.length(), expected > 0 ? expected : target.length(), "已有安装包");
            return;
        }
        String resolved = HttpSupport.resolveRedirects(activity, urlText, 15000, 20000);
        long existing = target.exists() ? target.length() : 0;
        if (expected > 0 && existing > expected) {
            if (!target.delete()) existing = 0;
            else existing = 0;
        }
        HttpURLConnection connection = HttpSupport.open(activity, resolved, 15000, 60000);
        if (existing > 0) connection.setRequestProperty("Range", "bytes=" + existing + "-");
        int code = connection.getResponseCode();
        if (code == 416 && existing > 0) {
            connection.disconnect();
            if (expected > 0 && existing == expected) {
                setDownloadStatus("apk", "done", existing, expected, "已有安装包");
                return;
            }
            if (!target.delete()) throw new java.io.IOException("无法重置损坏的安装包");
            existing = 0;
            connection = HttpSupport.open(activity, resolved, 15000, 60000);
            code = connection.getResponseCode();
        }
        boolean append = existing > 0 && code == HttpURLConnection.HTTP_PARTIAL;
        if (existing > 0 && !append) existing = 0;
        long contentLength = connection.getContentLengthLong();
        long total = expected > 0 ? expected : (append && contentLength > 0 ? existing + contentLength : contentLength);
        long downloaded = existing;
        setDownloadStatus("apk", "downloading", downloaded, total, attempt > 1 ? "正在重试下载 APK" : "正在下载 APK");
        try (InputStream in = connection.getInputStream(); FileOutputStream out = new FileOutputStream(target, append)) {
            byte[] buffer = new byte[1024 * 64];
            int read;
            while ((read = in.read(buffer)) > 0) {
                out.write(buffer, 0, read);
                downloaded += read;
                setDownloadStatus("apk", "downloading", downloaded, total, "正在下载 APK");
            }
            if (total > 0 && downloaded < total) throw new java.io.EOFException("APK 下载不完整 " + downloaded + "/" + total);
            setDownloadStatus("apk", "done", downloaded, total, "APK 下载完成");
        } finally {
            connection.disconnect();
        }
    }

    private String friendlyDownloadError(Throwable error) {
        String message = error == null || error.getMessage() == null ? "APK 下载失败" : error.getMessage();
        return message + "。若只用规则分流，请把 github.com、api.github.com、*.githubusercontent.com 走代理，或临时开全局。也可到 GitHub Release 用浏览器下载。";
    }

    private void setDownloadStatus(String id, String state, long downloaded, long total, String message) {
        try {
            int percent = total > 0 ? (int) Math.min(100, Math.round(downloaded * 100.0 / total)) : 0;
            downloadStatus = new JSONObject()
                    .put("id", id)
                    .put("state", state)
                    .put("downloaded", downloaded)
                    .put("total", total)
                    .put("percent", percent)
                    .put("message", message == null ? "" : message);
        } catch (Exception ignored) {
        }
    }

    private long deleteChildren(File dir) {
        if (dir == null || !dir.exists()) return 0;
        long bytes = 0;
        File[] files = dir.listFiles();
        if (files == null) return 0;
        for (File file : files) {
            bytes += file.isFile() ? file.length() : deleteChildren(file);
            if (!file.delete()) file.deleteOnExit();
        }
        return bytes;
    }

    private void openInstaller(File apk) {
        activity.runOnUiThread(() -> {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !activity.getPackageManager().canRequestPackageInstalls()) {
                Intent permissionIntent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES)
                        .setData(Uri.parse("package:" + activity.getPackageName()))
                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                activity.startActivity(permissionIntent);
                return;
            }
            Uri uri = Uri.parse("content://" + activity.getPackageName() + ".apkprovider/" + apk.getName());
            Intent intent = new Intent(Intent.ACTION_VIEW)
                    .setDataAndType(uri, "application/vnd.android.package-archive")
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            activity.startActivity(intent);
        });
    }

    private String errorJson(Throwable error) {
        String message = error == null || error.getMessage() == null ? "Update bridge error" : error.getMessage();
        return "{\"error\":\"" + message.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "") + "\"}";
    }
}
