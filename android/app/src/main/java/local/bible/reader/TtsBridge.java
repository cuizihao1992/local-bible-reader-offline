package local.bible.reader;

import android.app.Activity;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class TtsBridge {
    private final Activity activity;
    private final WebView webView;
    private TextToSpeech tts;
    private volatile boolean ready = false;
    private volatile boolean speaking = false;
    private volatile boolean cancelled = false;
    private volatile int pendingCount = 0;
    private volatile String pendingSpeak = null;

    public TtsBridge(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
        activity.runOnUiThread(this::ensureTts);
    }

    @JavascriptInterface
    public String getStatus() {
        try {
            return new JSONObject()
                    .put("ok", true)
                    .put("ready", ready)
                    .put("speaking", speaking)
                    .toString();
        } catch (Exception error) {
            return "{\"ok\":true,\"ready\":false,\"speaking\":false}";
        }
    }

    @JavascriptInterface
    public String speak(String text) {
        try {
            if (text == null || text.trim().isEmpty()) throw new IllegalArgumentException("没有可朗读的经文");
            if (!ready || tts == null) {
                pendingSpeak = text.trim();
                activity.runOnUiThread(this::ensureTts);
                return new JSONObject().put("ok", true).put("queued", true).toString();
            }
            pendingSpeak = null;
            final List<String> parts = splitText(text);
            activity.runOnUiThread(() -> speakParts(parts));
            return new JSONObject().put("ok", true).put("parts", parts.size()).toString();
        } catch (Throwable error) {
            return errorJson(error);
        }
    }

    @JavascriptInterface
    public String speakQueue(String jsonArray) {
        try {
            JSONArray raw = new JSONArray(jsonArray == null ? "[]" : jsonArray);
            StringBuilder joined = new StringBuilder();
            for (int i = 0; i < raw.length(); i++) {
                String item = raw.optString(i, "").trim();
                if (!item.isEmpty()) {
                    if (joined.length() > 0) joined.append("。");
                    joined.append(item);
                }
            }
            return speak(joined.toString());
        } catch (Throwable error) {
            return errorJson(error);
        }
    }

    @JavascriptInterface
    public String stop() {
        activity.runOnUiThread(() -> {
            cancelled = true;
            pendingSpeak = null;
            pendingCount = 0;
            speaking = false;
            if (tts != null) tts.stop();
        });
        return "{\"ok\":true}";
    }

    public void shutdown() {
        pendingSpeak = null;
        if (tts != null) {
            tts.stop();
            tts.shutdown();
            tts = null;
        }
    }

    private void ensureTts() {
        if (tts != null) return;
        tts = new TextToSpeech(activity.getApplicationContext(), status -> {
            ready = status == TextToSpeech.SUCCESS && tts != null;
            if (!ready) {
                emit("error", "系统没有可用的朗读引擎，请到系统设置安装中文语音");
                pendingSpeak = null;
                return;
            }
            int zh = tts.setLanguage(Locale.SIMPLIFIED_CHINESE);
            if (zh == TextToSpeech.LANG_MISSING_DATA || zh == TextToSpeech.LANG_NOT_SUPPORTED) {
                zh = tts.setLanguage(Locale.CHINA);
            }
            if (zh == TextToSpeech.LANG_MISSING_DATA || zh == TextToSpeech.LANG_NOT_SUPPORTED) {
                tts.setLanguage(Locale.CHINESE);
            }
            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override
                public void onStart(String utteranceId) {
                    speaking = true;
                    emit("start", utteranceId == null ? "" : utteranceId);
                }

                @Override
                public void onDone(String utteranceId) {
                    if (cancelled) return;
                    pendingCount -= 1;
                    if (pendingCount <= 0) {
                        speaking = false;
                        pendingCount = 0;
                        emit("done", utteranceId == null ? "" : utteranceId);
                    }
                }

                @Override
                public void onError(String utteranceId) {
                    if (cancelled) return;
                    speaking = false;
                    pendingCount = 0;
                    emit("error", "朗读失败");
                }
            });
            emit("ready", "");
            String queued = pendingSpeak;
            pendingSpeak = null;
            if (queued != null && !queued.isEmpty()) speakParts(splitText(queued));
        });
    }

    private void speakParts(List<String> parts) {
        if (tts == null || parts.isEmpty()) return;
        cancelled = false;
        tts.stop();
        pendingCount = parts.size();
        speaking = true;
        for (int i = 0; i < parts.size(); i++) {
            Bundle params = new Bundle();
            tts.speak(parts.get(i), i == 0 ? TextToSpeech.QUEUE_FLUSH : TextToSpeech.QUEUE_ADD, params, "part-" + i);
        }
    }

    private List<String> splitText(String text) {
        String raw = text.trim();
        List<String> parts = new ArrayList<>();
        int max = 3500;
        if (raw.length() <= max) {
            parts.add(raw);
            return parts;
        }
        StringBuilder current = new StringBuilder();
        for (String sentence : raw.split("(?<=[。！？；\n])")) {
            if (current.length() + sentence.length() > max && current.length() > 0) {
                parts.add(current.toString().trim());
                current.setLength(0);
            }
            current.append(sentence);
        }
        if (current.length() > 0) parts.add(current.toString().trim());
        return parts;
    }

    private void emit(String type, String text) {
        if (webView == null) return;
        String script = "window.handleAndroidTts && window.handleAndroidTts(" + JSONObject.quote(type) + "," + JSONObject.quote(text == null ? "" : text) + ")";
        webView.post(() -> webView.evaluateJavascript(script, null));
    }

    private String errorJson(Throwable error) {
        String message = error == null || error.getMessage() == null ? "朗读失败" : error.getMessage();
        try {
            return new JSONObject().put("error", message).toString();
        } catch (Exception ignored) {
            return "{\"error\":\"朗读失败\"}";
        }
    }
}
