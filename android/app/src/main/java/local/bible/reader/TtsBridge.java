package local.bible.reader;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

public class TtsBridge {
    private static final class Utterance {
        final String id;
        final String text;

        Utterance(String id, String text) {
            this.id = id;
            this.text = text;
        }
    }

    private final Activity activity;
    private final WebView webView;
    private final AudioManager audioManager;
    private AudioFocusRequest focusRequest;

    private TextToSpeech tts;
    private volatile boolean ready = false;
    private volatile boolean starting = false;
    private volatile boolean speaking = false;
    private volatile boolean cancelled = false;
    private volatile boolean languageOk = false;
    private volatile int generation = 0;
    private volatile int initToken = 0;
    private volatile float speechRate = 1f;
    private volatile String enginePackage = "";
    private volatile String engineLabel = "系统语音";
    private volatile String pendingSpeak = null;
    private volatile String pendingQueue = null;

    private final List<String> enginesToTry = new ArrayList<>();
    private int engineIndex = 0;
    private final List<Utterance> queue = new ArrayList<>();
    private int queueIndex = 0;

    public TtsBridge(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
        this.audioManager = (AudioManager) activity.getSystemService(Context.AUDIO_SERVICE);
        activity.runOnUiThread(this::ensureTts);
    }

    @JavascriptInterface
    public String getStatus() {
        try {
            return new JSONObject()
                    .put("ok", true)
                    .put("ready", ready)
                    .put("speaking", speaking)
                    .put("languageOk", languageOk)
                    .put("engine", enginePackage == null ? "" : enginePackage)
                    .put("engineLabel", engineLabel == null ? "系统语音" : engineLabel)
                    .put("generation", generation)
                    .toString();
        } catch (Exception error) {
            return "{\"ok\":true,\"ready\":false,\"speaking\":false}";
        }
    }

    @JavascriptInterface
    public String setRate(String rate) {
        try {
            float value = Float.parseFloat(String.valueOf(rate == null ? "1" : rate));
            if (value < 0.6f) value = 0.6f;
            if (value > 1.8f) value = 1.8f;
            speechRate = value;
            if (tts != null && ready) tts.setSpeechRate(speechRate);
            return new JSONObject().put("ok", true).put("rate", speechRate).toString();
        } catch (Exception error) {
            return errorJson(error);
        }
    }

    @JavascriptInterface
    public String speak(String text) {
        try {
            if (text == null || text.trim().isEmpty()) throw new IllegalArgumentException("没有可朗读的经文");
            generation++;
            cancelled = false;
            if (!ready || tts == null) {
                pendingSpeak = text.trim();
                pendingQueue = null;
                activity.runOnUiThread(this::ensureTts);
                return new JSONObject().put("ok", true).put("queued", true).put("generation", generation).toString();
            }
            pendingSpeak = null;
            final List<String> parts = splitText(text);
            final int gen = generation;
            activity.runOnUiThread(() -> startParts(parts, gen));
            return new JSONObject().put("ok", true).put("parts", parts.size()).put("generation", generation).toString();
        } catch (Throwable error) {
            return errorJson(error);
        }
    }

    @JavascriptInterface
    public String speakQueue(String jsonArray) {
        try {
            if (jsonArray == null || jsonArray.trim().isEmpty() || "[]".equals(jsonArray.trim())) {
                throw new IllegalArgumentException("没有可朗读的经文");
            }
            generation++;
            cancelled = false;
            if (!ready || tts == null) {
                pendingQueue = jsonArray;
                pendingSpeak = null;
                activity.runOnUiThread(this::ensureTts);
                return new JSONObject().put("ok", true).put("queued", true).put("generation", generation).toString();
            }
            pendingQueue = null;
            final String payload = jsonArray;
            final int gen = generation;
            activity.runOnUiThread(() -> startQueue(payload, gen));
            return new JSONObject().put("ok", true).put("generation", generation).toString();
        } catch (Throwable error) {
            return errorJson(error);
        }
    }

    @JavascriptInterface
    public String stop() {
        generation++;
        cancelled = true;
        pendingSpeak = null;
        pendingQueue = null;
        speaking = false;
        final int gen = generation;
        activity.runOnUiThread(() -> {
            queue.clear();
            queueIndex = 0;
            hardStopPlayback();
            abandonFocus();
            emit("stop", "", gen);
        });
        try {
            return new JSONObject().put("ok", true).put("generation", generation).toString();
        } catch (Exception error) {
            return "{\"ok\":true}";
        }
    }

    public void shutdown() {
        cancelled = true;
        pendingSpeak = null;
        pendingQueue = null;
        queue.clear();
        if (tts != null) {
            try { tts.stop(); } catch (Exception ignored) {}
            try { tts.shutdown(); } catch (Exception ignored) {}
            tts = null;
        }
        abandonFocus();
        ready = false;
        starting = false;
    }

    private void ensureTts() {
        if (tts != null || starting) return;
        starting = true;
        enginesToTry.clear();
        enginesToTry.addAll(rankedEngines());
        engineIndex = 0;
        startNextEngine();
    }

    private void startNextEngine() {
        if (engineIndex >= enginesToTry.size()) {
            starting = false;
            ready = false;
            emit("error", "系统没有可用的朗读引擎。请到系统设置打开「文字转语音」，安装 Google 语音或讯飞语音，并下载中文语音包。", generation);
            pendingSpeak = null;
            pendingQueue = null;
            return;
        }
        final String pkg = enginesToTry.get(engineIndex++);
        final int token = ++initToken;
        if (tts != null) {
            try { tts.stop(); } catch (Exception ignored) {}
            try { tts.shutdown(); } catch (Exception ignored) {}
            tts = null;
            ready = false;
        }
        TextToSpeech.OnInitListener listener = status -> {
            if (token != initToken) return;
            activity.runOnUiThread(() -> handleInit(pkg, status, token));
        };
        Context ctx = activity.getApplicationContext();
        try {
            if (pkg == null || pkg.isEmpty()) tts = new TextToSpeech(ctx, listener);
            else tts = new TextToSpeech(ctx, listener, pkg);
        } catch (Exception error) {
            startNextEngine();
        }
    }

    private void handleInit(String pkg, int status, int token) {
        if (token != initToken) return;
        if (status != TextToSpeech.SUCCESS || tts == null) {
            startNextEngine();
            return;
        }
        int lang = applyChinese(tts);
        boolean langOk = lang != TextToSpeech.LANG_MISSING_DATA && lang != TextToSpeech.LANG_NOT_SUPPORTED;
        boolean last = engineIndex >= enginesToTry.size();
        if (!langOk && !last && !isXiaoAi(pkg)) {
            startNextEngine();
            return;
        }
        languageOk = langOk;
        enginePackage = (pkg == null || pkg.isEmpty()) ? safeDefaultEngine() : pkg;
        engineLabel = labelFor(enginePackage);
        try {
            tts.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build());
        } catch (Exception ignored) {}
        tts.setSpeechRate(speechRate);
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override
            public void onStart(String utteranceId) {
                ParsedId parsed = parseId(utteranceId);
                if (cancelled || parsed.generation != generation) return;
                speaking = true;
                emit("start", parsed.verseId, parsed.generation);
            }

            @Override
            public void onDone(String utteranceId) {
                ParsedId parsed = parseId(utteranceId);
                if (cancelled || parsed.generation != generation) return;
                activity.runOnUiThread(() -> advanceQueue(parsed.generation));
            }

            @Override
            public void onError(String utteranceId) {
                onError(utteranceId, -1);
            }

            @Override
            public void onError(String utteranceId, int errorCode) {
                ParsedId parsed = parseId(utteranceId);
                if (cancelled || parsed.generation != generation) return;
                speaking = false;
                activity.runOnUiThread(() -> {
                    queue.clear();
                    queueIndex = 0;
                    abandonFocus();
                    emit("error", languageHint("朗读失败"), parsed.generation);
                });
            }

            @Override
            public void onStop(String utteranceId, boolean interrupted) {
                ParsedId parsed = parseId(utteranceId);
                if (!cancelled || parsed.generation != generation) return;
                speaking = false;
                emit("stop", parsed.verseId, parsed.generation);
            }
        });
        ready = true;
        starting = false;
        emit("ready", engineLabel + (languageOk ? "" : "（中文语音包可能未装全）"), generation);
        String queuedJson = pendingQueue;
        String queued = pendingSpeak;
        pendingQueue = null;
        pendingSpeak = null;
        if (cancelled) return;
        if (queuedJson != null && !queuedJson.isEmpty()) startQueue(queuedJson, generation);
        else if (queued != null && !queued.isEmpty()) startParts(splitText(queued), generation);
    }

    private void startQueue(String jsonArray, int gen) {
        if (gen != generation || cancelled || tts == null) return;
        try {
            JSONArray raw = new JSONArray(jsonArray);
            List<Utterance> items = new ArrayList<>();
            for (int i = 0; i < raw.length(); i++) {
                JSONObject item = raw.optJSONObject(i);
                String text;
                String id;
                if (item != null) {
                    text = item.optString("text", "").trim();
                    id = item.optString("id", "v" + (i + 1));
                } else {
                    text = raw.optString(i, "").trim();
                    id = "part-" + i;
                }
                if (text.isEmpty()) continue;
                items.add(new Utterance(id, text));
            }
            beginQueue(items, gen);
        } catch (Exception error) {
            emit("error", error.getMessage() == null ? "朗读失败" : error.getMessage(), gen);
        }
    }

    private void startParts(List<String> parts, int gen) {
        if (gen != generation || cancelled || tts == null || parts.isEmpty()) return;
        List<Utterance> items = new ArrayList<>();
        for (int i = 0; i < parts.size(); i++) items.add(new Utterance("part-" + i, parts.get(i)));
        beginQueue(items, gen);
    }

    private void beginQueue(List<Utterance> items, int gen) {
        if (gen != generation || cancelled) return;
        if (items.isEmpty()) {
            emit("error", "没有可朗读的经文", gen);
            return;
        }
        queue.clear();
        queue.addAll(items);
        queueIndex = 0;
        speaking = true;
        tts.setSpeechRate(speechRate);
        speakCurrent(gen);
    }

    private void speakCurrent(int gen) {
        if (gen != generation || cancelled || tts == null) return;
        if (queueIndex >= queue.size()) {
            speaking = false;
            abandonFocus();
            emit("done", "", gen);
            return;
        }
        Utterance item = queue.get(queueIndex);
        Bundle params = new Bundle();
        params.putInt(TextToSpeech.Engine.KEY_PARAM_STREAM, AudioManager.STREAM_MUSIC);
        requestFocus();
        int result = tts.speak(item.text, TextToSpeech.QUEUE_FLUSH, params, gen + "|" + item.id);
        if (result != TextToSpeech.SUCCESS) {
            speaking = false;
            abandonFocus();
            emit("error", languageHint("当前语音引擎无法朗读"), gen);
        }
    }

    private void advanceQueue(int gen) {
        if (gen != generation || cancelled) return;
        queueIndex += 1;
        speakCurrent(gen);
    }

    private void hardStopPlayback() {
        if (tts == null) return;
        try { tts.stop(); } catch (Exception ignored) {}
        if (isXiaoAi(enginePackage)) {
            try { tts.shutdown(); } catch (Exception ignored) {}
            tts = null;
            ready = false;
            starting = false;
        }
    }

    private List<String> rankedEngines() {
        List<String> found = listEnginePackages();
        Collections.sort(found, Comparator.comparingInt(this::engineScore).reversed());
        found.add("");
        return found;
    }

    private List<String> listEnginePackages() {
        List<String> names = new ArrayList<>();
        try {
            Intent intent = new Intent(TextToSpeech.Engine.INTENT_ACTION_TTS_SERVICE);
            PackageManager pm = activity.getPackageManager();
            List<ResolveInfo> resolved = pm.queryIntentServices(intent, 0);
            for (ResolveInfo info : resolved) {
                if (info.serviceInfo != null && info.serviceInfo.packageName != null) {
                    String pkg = info.serviceInfo.packageName;
                    if (!names.contains(pkg)) names.add(pkg);
                }
            }
        } catch (Exception ignored) {}
        return names;
    }

    private int engineScore(String pkg) {
        if (pkg == null) return 0;
        String p = pkg.toLowerCase(Locale.US);
        if (p.equals("com.google.android.tts")) return 100;
        if (p.contains("google")) return 90;
        if (p.contains("iflytek") || p.contains("vflynote") || p.contains("speechsuite")) return 80;
        if (p.contains("samsung.smt")) return 70;
        if (p.contains("huawei") || p.contains("harmony")) return 50;
        if (isXiaoAi(p)) return 8;
        return 40;
    }

    private boolean isXiaoAi(String pkg) {
        if (pkg == null) return false;
        String p = pkg.toLowerCase(Locale.US);
        return p.contains("xiaomi") || p.contains("mibrain") || p.contains("aiasst") || p.contains("miui");
    }

    private String safeDefaultEngine() {
        try {
            if (tts != null) {
                String def = tts.getDefaultEngine();
                if (def != null && !def.isEmpty()) return def;
            }
        } catch (Exception ignored) {}
        return enginePackage == null ? "" : enginePackage;
    }

    private String labelFor(String pkg) {
        if (pkg == null || pkg.isEmpty()) return "系统语音";
        String p = pkg.toLowerCase(Locale.US);
        if (p.contains("google")) return "Google 语音";
        if (p.contains("iflytek") || p.contains("vflynote") || p.contains("speechsuite")) return "讯飞语音";
        if (isXiaoAi(p)) return "小爱语音";
        if (p.contains("samsung")) return "三星语音";
        if (p.contains("huawei") || p.contains("harmony")) return "华为语音";
        return "系统语音";
    }

    private int applyChinese(TextToSpeech engine) {
        Locale[] locales = {
                Locale.CHINA,
                Locale.SIMPLIFIED_CHINESE,
                new Locale("zh", "CN"),
                new Locale("zh"),
                Locale.CHINESE,
                Locale.TAIWAN
        };
        int last = TextToSpeech.LANG_NOT_SUPPORTED;
        for (Locale locale : locales) {
            try {
                last = engine.setLanguage(locale);
            } catch (Exception error) {
                continue;
            }
            if (last != TextToSpeech.LANG_MISSING_DATA && last != TextToSpeech.LANG_NOT_SUPPORTED) return last;
        }
        return last;
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

    private void requestFocus() {
        if (audioManager == null) return;
        try {
            if (Build.VERSION.SDK_INT >= 26) {
                if (focusRequest == null) {
                    focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
                            .setAudioAttributes(new AudioAttributes.Builder()
                                    .setUsage(AudioAttributes.USAGE_MEDIA)
                                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                                    .build())
                            .build();
                }
                audioManager.requestAudioFocus(focusRequest);
            } else {
                audioManager.requestAudioFocus(null, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK);
            }
        } catch (Exception ignored) {}
    }

    private void abandonFocus() {
        if (audioManager == null) return;
        try {
            if (Build.VERSION.SDK_INT >= 26) {
                if (focusRequest != null) audioManager.abandonAudioFocusRequest(focusRequest);
            } else {
                audioManager.abandonAudioFocus(null);
            }
        } catch (Exception ignored) {}
    }

    private String languageHint(String prefix) {
        if (languageOk) return prefix;
        return prefix + "。请到系统设置 → 文字转语音，安装 Google 语音或讯飞，并下载中文语音包。小爱引擎经常缺中文数据。";
    }

    private static final class ParsedId {
        final int generation;
        final String verseId;

        ParsedId(int generation, String verseId) {
            this.generation = generation;
            this.verseId = verseId;
        }
    }

    private ParsedId parseId(String utteranceId) {
        if (utteranceId == null) return new ParsedId(-1, "");
        int split = utteranceId.indexOf('|');
        if (split < 0) return new ParsedId(-1, utteranceId);
        try {
            return new ParsedId(Integer.parseInt(utteranceId.substring(0, split)), utteranceId.substring(split + 1));
        } catch (Exception error) {
            return new ParsedId(-1, utteranceId);
        }
    }

    private void emit(String type, String text, int gen) {
        if (webView == null) return;
        String script = "window.handleAndroidTts && window.handleAndroidTts("
                + JSONObject.quote(type) + ","
                + JSONObject.quote(text == null ? "" : text) + ","
                + gen + ")";
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
