package local.bible.reader;

import android.app.Activity;
import android.speech.tts.TextToSpeech;
import android.webkit.JavascriptInterface;

import org.json.JSONObject;

import java.util.Locale;

public class TtsBridge {
    private final Activity activity;
    private TextToSpeech tts;
    private boolean ready = false;

    public TtsBridge(Activity activity) {
        this.activity = activity;
        activity.runOnUiThread(() -> {
            tts = new TextToSpeech(activity.getApplicationContext(), status -> {
                ready = status == TextToSpeech.SUCCESS;
                if (ready) {
                    int zh = tts.setLanguage(Locale.CHINA);
                    if (zh == TextToSpeech.LANG_MISSING_DATA || zh == TextToSpeech.LANG_NOT_SUPPORTED) {
                        tts.setLanguage(Locale.CHINESE);
                    }
                }
            });
        });
    }

    @JavascriptInterface
    public String speak(String text) {
        try {
            if (text == null || text.trim().isEmpty()) throw new IllegalArgumentException("没有可朗读的经文");
            activity.runOnUiThread(() -> {
                if (tts == null || !ready) return;
                tts.stop();
                tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "chapter-read");
            });
            return new JSONObject().put("ok", true).toString();
        } catch (Throwable error) {
            String message = error.getMessage() == null ? "朗读失败" : error.getMessage();
            return "{\"error\":\"" + message.replace("\\", "\\\\").replace("\"", "\\\"") + "\"}";
        }
    }

    @JavascriptInterface
    public String stop() {
        activity.runOnUiThread(() -> {
            if (tts != null) tts.stop();
        });
        return "{\"ok\":true}";
    }

    public void shutdown() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
    }
}
