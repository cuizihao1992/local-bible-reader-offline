package local.bible.reader;

import android.net.Uri;
import android.webkit.JavascriptInterface;

public class AndroidBridge {
    private final OfflineApi offlineApi;

    public AndroidBridge(OfflineApi offlineApi) {
        this.offlineApi = offlineApi;
    }

    @JavascriptInterface
    public String getJson(String path) {
        try {
            String safePath = path == null ? "/" : path;
            String url = safePath.startsWith("/") ? "https://offline.local" + safePath : "https://offline.local/" + safePath;
            return offlineApi.handle("GET", Uri.parse(url));
        } catch (Throwable error) {
            return errorJson(error);
        }
    }

    @JavascriptInterface
    public void setNightMode(boolean night) {
        // Theme is applied from MainActivity via a static hook.
        MainActivity.setNightMode(night);
    }

    @JavascriptInterface
    public String postJson(String path, String payload) {
        try {
            return offlineApi.handlePost(path == null ? "" : path, payload == null ? "{}" : payload);
        } catch (Throwable error) {
            return errorJson(error);
        }
    }

    private String errorJson(Throwable error) {
        String message = error == null || error.getMessage() == null ? "Android bridge error" : error.getMessage();
        return "{\"error\":\"" + message.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "") + "\"}";
    }
}
