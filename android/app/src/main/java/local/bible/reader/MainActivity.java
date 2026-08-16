package local.bible.reader;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private static MainActivity instance;
    private OfflineApi offlineApi;
    private WebView webView;

    public static void setKeepScreenOn(boolean keep) {
        MainActivity activity = instance;
        if (activity == null) return;
        activity.runOnUiThread(() -> {
            if (keep) activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            else activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        });
    }

    public static void setNightMode(boolean night) {
        MainActivity activity = instance;
        if (activity == null) return;
        activity.runOnUiThread(() -> {
            Window window = activity.getWindow();
            int color = night ? Color.parseColor("#171614") : Color.parseColor("#fbfaf6");
            window.setStatusBarColor(color);
            window.setNavigationBarColor(color);
            int flags = window.getDecorView().getSystemUiVisibility();
            if (night) {
                flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            } else {
                flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            }
            window.getDecorView().setSystemUiVisibility(flags);
        });
    }

    @Override
    @SuppressLint("SetJavaScriptEnabled")
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        instance = this;
        TextView splash = new TextView(this);
        splash.setText("正在准备经文…");
        splash.setTextSize(18);
        splash.setTypeface(Typeface.DEFAULT_BOLD);
        splash.setGravity(Gravity.CENTER);
        splash.setTextColor(Color.parseColor("#2d6a5f"));
        splash.setBackgroundColor(Color.parseColor("#fbfaf6"));
        LinearLayout splashWrap = new LinearLayout(this);
        splashWrap.setGravity(Gravity.CENTER);
        splashWrap.setBackgroundColor(Color.parseColor("#fbfaf6"));
        splashWrap.addView(splash);
        setContentView(splashWrap, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));
        new Thread(() -> {
            OfflineApi api = new OfflineApi(this);
            runOnUiThread(() -> setupWebView(api));
        }, "bible-prepare").start();
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView(OfflineApi api) {
        offlineApi = api;
        webView = new WebView(this);
        setContentView(webView, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        webView.addJavascriptInterface(new AndroidBridge(offlineApi), "AndroidBibleApi");
        webView.addJavascriptInterface(new UpdateBridge(this), "AndroidUpdateApi");
        webView.addJavascriptInterface(new ShareBridge(this), "AndroidShareApi");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                String path = request.getUrl().getPath();
                if (path != null && path.startsWith("/api/")) {
                    return jsonResponse(offlineApi.handle(request.getMethod(), request.getUrl()));
                }
                return super.shouldInterceptRequest(view, request);
            }
        });

        webView.loadUrl("file:///android_asset/static/index.html");
    }

    @Override
    protected void onDestroy() {
        if (instance == this) instance = null;
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        if (webView == null) {
            super.onBackPressed();
            return;
        }
        webView.evaluateJavascript(
                "(window.handleAndroidBack && window.handleAndroidBack()) ? 'handled' : 'exit'",
                value -> {
                    if (!"\"handled\"".equals(value)) MainActivity.super.onBackPressed();
                }
        );
    }

    private WebResourceResponse jsonResponse(String json) {
        return new WebResourceResponse(
                "application/json",
                "utf-8",
                new ByteArrayInputStream(json.getBytes(StandardCharsets.UTF_8))
        );
    }
}
