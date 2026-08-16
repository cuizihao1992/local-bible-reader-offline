package local.bible.reader;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.nio.charset.StandardCharsets;

public class VoiceBridge {
    private static final String MIMO_CHAT_URL = "https://api.xiaomimimo.com/v1/chat/completions";
    private static final String MIMO_CODEPLAN_CHAT_URL = "https://token-plan-cn.xiaomimimo.com/v1/chat/completions";
    private static final int SAMPLE_RATE = 16000;
    private final Activity activity;
    private final WebView webView;
    private AudioRecord audioRecord;
    private Thread recordThread;
    private ByteArrayOutputStream pcmOut;
    private volatile boolean recording;
    private String cloudKey = "";
    private String cloudModel = "mimo-v2.5-asr";
    private String cloudBaseUrl = MIMO_CHAT_URL;

    public VoiceBridge(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
    }

    @JavascriptInterface
    public String startCloud(String provider, String key, String model, String ignoredBaseUrl) {
        activity.runOnUiThread(() -> {
            try {
                if (android.os.Build.VERSION.SDK_INT >= 23
                        && activity.checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                    activity.requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, 42);
                    emitError("请允许麦克风权限后再按住一次");
                    return;
                }
                if (!"mimo".equals(provider)) {
                    emitError("当前只支持小米 MiMo 语音识别");
                    return;
                }
                if (key == null || key.trim().isEmpty()) {
                    emitError("请先在设置里填写小米 MiMo 普通 Key");
                    return;
                }
                stopRecording();
                cloudKey = key.trim();
                cloudModel = model == null || model.trim().isEmpty() ? "mimo-v2.5-asr" : model.trim();
                cloudBaseUrl = normalizeChatUrl(ignoredBaseUrl, cloudKey);
                startWavRecording();
                emit("start", "");
            } catch (Throwable error) {
                stopRecording();
                emitError(message(error));
            }
        });
        return "{\"ok\":true}";
    }

    @JavascriptInterface
    public String stopCloud() {
        activity.runOnUiThread(() -> {
            String key = cloudKey;
            String model = cloudModel;
            String baseUrl = cloudBaseUrl;
            try {
                if (!recording && audioRecord == null) return;
                byte[] wav = stopRecording();
                emit("end", "");
                new Thread(() -> uploadCloudAudio(key, model, baseUrl, wav), "mimo-asr").start();
            } catch (Throwable error) {
                stopRecording();
                emitError(message(error));
            }
        });
        return "{\"ok\":true}";
    }

    @JavascriptInterface
    public String completeChat(String key, String model, String baseUrl, String systemPrompt, String userText) {
        final String safeKey = key == null ? "" : key.trim();
        final String safeModel = model == null || model.trim().isEmpty() ? "mimo-v2.5" : model.trim();
        final String safeBase = baseUrl;
        final String sys = systemPrompt == null ? "" : systemPrompt;
        final String user = userText == null ? "" : userText;
        new Thread(() -> {
            try {
                emit("intent", requestMimoChat(safeKey, safeModel, safeBase, sys, user));
            } catch (Throwable error) {
                emit("intentError", message(error));
            }
        }, "mimo-chat").start();
        return "{\"started\":true}";
    }

    @JavascriptInterface
    public String cancel() {
        activity.runOnUiThread(this::stopRecording);
        return "{\"ok\":true}";
    }

    private void startWavRecording() {
        int channel = AudioFormat.CHANNEL_IN_MONO;
        int encoding = AudioFormat.ENCODING_PCM_16BIT;
        int min = AudioRecord.getMinBufferSize(SAMPLE_RATE, channel, encoding);
        if (min <= 0) throw new IllegalStateException("无法初始化麦克风");
        int bufferSize = Math.max(min, SAMPLE_RATE) * 2;
        audioRecord = new AudioRecord(MediaRecorder.AudioSource.MIC, SAMPLE_RATE, channel, encoding, bufferSize);
        if (audioRecord.getState() != AudioRecord.STATE_INITIALIZED) {
            audioRecord.release();
            audioRecord = null;
            throw new IllegalStateException("麦克风不可用");
        }
        pcmOut = new ByteArrayOutputStream();
        recording = true;
        audioRecord.startRecording();
        final int readSize = min;
        recordThread = new Thread(() -> {
            byte[] buffer = new byte[readSize];
            while (recording && audioRecord != null) {
                int read = audioRecord.read(buffer, 0, buffer.length);
                if (read > 0) {
                    synchronized (pcmOut) {
                        pcmOut.write(buffer, 0, read);
                    }
                }
            }
        }, "mimo-wav");
        recordThread.start();
    }

    private byte[] stopRecording() {
        recording = false;
        if (recordThread != null) {
            try {
                recordThread.join(1200);
            } catch (InterruptedException ignored) {
                Thread.currentThread().interrupt();
            }
            recordThread = null;
        }
        if (audioRecord != null) {
            try {
                audioRecord.stop();
            } catch (Throwable ignored) {
            }
            try {
                audioRecord.release();
            } catch (Throwable ignored) {
            }
            audioRecord = null;
        }
        byte[] pcm = new byte[0];
        if (pcmOut != null) {
            synchronized (pcmOut) {
                pcm = pcmOut.toByteArray();
            }
            pcmOut = null;
        }
        return wrapWav(pcm, SAMPLE_RATE, 1, 16);
    }

    private static byte[] wrapWav(byte[] pcm, int sampleRate, int channels, int bits) {
        int dataLen = pcm == null ? 0 : pcm.length;
        ByteArrayOutputStream out = new ByteArrayOutputStream(44 + dataLen);
        try {
            writeAscii(out, "RIFF");
            writeIntLE(out, 36 + dataLen);
            writeAscii(out, "WAVE");
            writeAscii(out, "fmt ");
            writeIntLE(out, 16);
            writeShortLE(out, 1);
            writeShortLE(out, channels);
            writeIntLE(out, sampleRate);
            writeIntLE(out, sampleRate * channels * bits / 8);
            writeShortLE(out, channels * bits / 8);
            writeShortLE(out, bits);
            writeAscii(out, "data");
            writeIntLE(out, dataLen);
            if (dataLen > 0) out.write(pcm);
        } catch (Exception error) {
            return new byte[0];
        }
        return out.toByteArray();
    }

    private static void writeAscii(ByteArrayOutputStream out, String text) {
        out.write(text.getBytes(StandardCharsets.US_ASCII), 0, text.length());
    }

    private static void writeIntLE(ByteArrayOutputStream out, int value) {
        out.write(value & 0xff);
        out.write((value >> 8) & 0xff);
        out.write((value >> 16) & 0xff);
        out.write((value >> 24) & 0xff);
    }

    private static void writeShortLE(ByteArrayOutputStream out, int value) {
        out.write(value & 0xff);
        out.write((value >> 8) & 0xff);
    }

    private void uploadCloudAudio(String key, String model, String baseUrl, byte[] wav) {
        try {
            if (wav == null || wav.length < 1024) {
                throw new IllegalArgumentException("录音太短，请按住说完后再松开");
            }
            emit("ready", "");
            emit("result", requestMimoAsr(key, model, baseUrl, wav));
        } catch (Throwable error) {
            emitError(message(error));
        }
    }

    private String requestMimoAsr(String key, String model, String baseUrl, byte[] wav) throws Exception {
        String audioBase64 = Base64.encodeToString(wav, Base64.NO_WRAP);
        JSONObject inputAudio = new JSONObject().put("data", "data:audio/wav;base64," + audioBase64);
        JSONObject audioContent = new JSONObject().put("type", "input_audio").put("input_audio", inputAudio);
        JSONObject message = new JSONObject().put("role", "user").put("content", new JSONArray().put(audioContent));
        JSONObject body = new JSONObject()
                .put("model", model == null || model.isEmpty() ? "mimo-v2.5-asr" : model)
                .put("messages", new JSONArray().put(message))
                .put("asr_options", new JSONObject().put("language", "auto"));
        HttpURLConnection connection = HttpSupport.open(activity, normalizeChatUrl(baseUrl, key), 20000, 60000);
        connection.setRequestMethod("POST");
        connection.setDoOutput(true);
        connection.setRequestProperty("Authorization", "Bearer " + key);
        connection.setRequestProperty("api-key", key);
        connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
        byte[] payload = body.toString().getBytes(StandardCharsets.UTF_8);
        try (OutputStream output = connection.getOutputStream()) {
            output.write(payload);
        }
        byte[] responseBytes;
        int code = connection.getResponseCode();
        if (code >= 200 && code < 300) {
            responseBytes = readAll(connection.getInputStream());
        } else {
            responseBytes = readAll(connection.getErrorStream());
            String errorText = new String(responseBytes, StandardCharsets.UTF_8);
            if (code == 401) {
                errorText = isCodePlanKey(key)
                        ? "Code Plan / Token Plan 鉴权失败。请确认 Key 是 tp- 开头，并填写后台显示的专属 Base URL。"
                        : "普通 Key 鉴权失败。请确认是 sk- 开头的按量 Key，不要填 Token Plan 地址。";
            }
            throw new RuntimeException(errorText);
        }
        JSONObject response = new JSONObject(new String(responseBytes, StandardCharsets.UTF_8));
        return response.getJSONArray("choices").getJSONObject(0).getJSONObject("message").optString("content", "");
    }

    private String requestMimoChat(String key, String model, String baseUrl, String systemPrompt, String userText) throws Exception {
        JSONArray messages = new JSONArray()
                .put(new JSONObject().put("role", "system").put("content", systemPrompt))
                .put(new JSONObject().put("role", "user").put("content", userText));
        JSONObject body = new JSONObject()
                .put("model", model == null || model.isEmpty() ? "mimo-v2.5" : model)
                .put("temperature", 0)
                .put("messages", messages);
        HttpURLConnection connection = HttpSupport.open(activity, normalizeChatUrl(baseUrl, key), 20000, 45000);
        connection.setRequestMethod("POST");
        connection.setDoOutput(true);
        connection.setRequestProperty("Authorization", "Bearer " + key);
        connection.setRequestProperty("api-key", key);
        connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
        byte[] payload = body.toString().getBytes(StandardCharsets.UTF_8);
        try (OutputStream output = connection.getOutputStream()) {
            output.write(payload);
        }
        byte[] responseBytes;
        int code = connection.getResponseCode();
        if (code >= 200 && code < 300) {
            responseBytes = readAll(connection.getInputStream());
        } else {
            responseBytes = readAll(connection.getErrorStream());
            throw new RuntimeException(new String(responseBytes, StandardCharsets.UTF_8));
        }
        JSONObject response = new JSONObject(new String(responseBytes, StandardCharsets.UTF_8));
        return response.getJSONArray("choices").getJSONObject(0).getJSONObject("message").optString("content", "");
    }

    private boolean isCodePlanKey(String key) {
        return key != null && key.trim().regionMatches(true, 0, "tp-", 0, 3);
    }

    private String normalizeChatUrl(String value, String key) {
        String raw = value == null ? "" : value.trim();
        if (raw.isEmpty()) raw = isCodePlanKey(key) ? MIMO_CODEPLAN_CHAT_URL : MIMO_CHAT_URL;
        while (raw.endsWith("/")) raw = raw.substring(0, raw.length() - 1);
        if (raw.endsWith("/chat/completions")) return raw;
        if (raw.endsWith("/v1")) return raw + "/chat/completions";
        return raw + "/v1/chat/completions";
    }

    private byte[] readAll(InputStream input) throws Exception {
        if (input == null) return new byte[0];
        byte[] buffer = new byte[8192];
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        int read;
        while ((read = input.read(buffer)) != -1) output.write(buffer, 0, read);
        return output.toByteArray();
    }

    private void emitError(String text) {
        emit("error", text);
    }

    private void emit(String type, String text) {
        String script = "window.handleAndroidVoice && window.handleAndroidVoice(" + quote(type) + "," + quote(text) + ")";
        webView.post(() -> webView.evaluateJavascript(script, null));
    }

    private String message(Throwable error) {
        return error == null || error.getMessage() == null ? "语音识别异常" : error.getMessage();
    }

    private String quote(String value) {
        return "\"" + quoteValue(value) + "\"";
    }

    private String quoteValue(String value) {
        String safe = value == null ? "" : value;
        return safe.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
    }
}
