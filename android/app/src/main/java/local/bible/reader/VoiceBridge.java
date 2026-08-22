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
    public String completeChatMessages(String key, String model, String baseUrl, String messagesJson, String api) {
        final String safeKey = key == null ? "" : key.trim();
        final String safeModel = model == null || model.trim().isEmpty() ? "mimo-v2.5" : model.trim();
        final String safeBase = baseUrl;
        final String rawMessages = messagesJson == null ? "[]" : messagesJson;
        final String safeApi = api == null || api.trim().isEmpty() ? "openai-completions" : api.trim();
        new Thread(() -> {
            try {
                emit("intent", requestChatMessages(safeKey, safeModel, safeBase, new JSONArray(rawMessages), safeApi));
            } catch (Throwable error) {
                emit("intentError", message(error));
            }
        }, "llm-chat").start();
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
        return requestChatMessages(key, model, baseUrl, messages, "openai-completions");
    }

    private String requestChatMessages(String key, String model, String baseUrl, JSONArray messages, String api) throws Exception {
        boolean anthropic = "anthropic-messages".equals(api);
        JSONObject body = anthropic
                ? anthropicBody(model, messages)
                : new JSONObject()
                    .put("model", model == null || model.isEmpty() ? "mimo-v2.5" : model)
                    .put("temperature", 0)
                    .put("messages", messages);
        String url = anthropic ? normalizeAnthropicUrl(baseUrl) : normalizeChatUrl(baseUrl, key);
        HttpURLConnection connection = HttpSupport.open(activity, url, 20000, 60000);
        connection.setRequestMethod("POST");
        connection.setDoOutput(true);
        connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
        connection.setRequestProperty("Authorization", "Bearer " + key);
        if (anthropic) {
            connection.setRequestProperty("x-api-key", key);
            connection.setRequestProperty("anthropic-version", "2023-06-01");
        } else {
            connection.setRequestProperty("api-key", key);
        }
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
            throw new RuntimeException(chatErrorText(new String(responseBytes, StandardCharsets.UTF_8), code));
        }
        JSONObject response = new JSONObject(new String(responseBytes, StandardCharsets.UTF_8));
        return anthropic ? anthropicMessageContent(response) : chatMessageContent(response);
    }

    private JSONObject anthropicBody(String model, JSONArray messages) throws Exception {
        StringBuilder system = new StringBuilder();
        JSONArray out = new JSONArray();
        for (int i = 0; i < messages.length(); i++) {
            JSONObject item = messages.optJSONObject(i);
            if (item == null) continue;
            String role = item.optString("role", "user");
            String content = item.optString("content", "");
            if ("system".equals(role)) {
                if (system.length() > 0) system.append('\n');
                system.append(content);
                continue;
            }
            if (!"assistant".equals(role)) role = "user";
            if (out.length() > 0) {
                JSONObject prev = out.getJSONObject(out.length() - 1);
                if (role.equals(prev.optString("role"))) {
                    prev.put("content", prev.optString("content") + "\n" + content);
                    continue;
                }
            }
            out.put(new JSONObject().put("role", role).put("content", content));
        }
        if (out.length() == 0) {
            out.put(new JSONObject().put("role", "user").put("content", "请继续"));
        } else if (!"user".equals(out.getJSONObject(0).optString("role"))) {
            JSONArray prefixed = new JSONArray();
            prefixed.put(new JSONObject().put("role", "user").put("content", "请根据系统说明回答。"));
            for (int i = 0; i < out.length(); i++) prefixed.put(out.get(i));
            out = prefixed;
        }
        JSONObject body = new JSONObject()
                .put("model", model == null || model.isEmpty() ? "claude-sonnet-4-6" : model)
                .put("max_tokens", 8192)
                .put("temperature", 0)
                .put("messages", out);
        if (system.length() > 0) body.put("system", system.toString());
        return body;
    }

    private String anthropicMessageContent(JSONObject response) {
        JSONArray content = response.optJSONArray("content");
        if (content != null) {
            StringBuilder text = new StringBuilder();
            for (int i = 0; i < content.length(); i++) {
                JSONObject block = content.optJSONObject(i);
                if (block != null && "text".equals(block.optString("type"))) {
                    text.append(block.optString("text", ""));
                }
            }
            if (text.length() > 0) return text.toString().trim();
        }
        return "";
    }

    private String chatErrorText(String raw, int code) {
        try {
            JSONObject error = new JSONObject(raw).optJSONObject("error");
            if (error != null) {
                String message = error.optString("message", "").trim();
                if (!message.isEmpty()) return message;
            }
        } catch (Exception ignored) {
        }
        if (raw != null && !raw.trim().isEmpty()) return raw.trim();
        return "理解失败 " + code;
    }

    private String chatMessageContent(JSONObject response) throws Exception {
        JSONObject message = response.getJSONArray("choices").getJSONObject(0).getJSONObject("message");
        String content = message.optString("content", "").trim();
        if (!content.isEmpty() && !"null".equals(content)) return content;
        content = message.optString("reasoning_content", "").trim();
        if (!content.isEmpty()) return content;
        JSONArray toolCalls = message.optJSONArray("tool_calls");
        if (toolCalls != null && toolCalls.length() > 0) {
            JSONObject fn = toolCalls.getJSONObject(0).optJSONObject("function");
            if (fn != null) {
                String arguments = fn.optString("arguments", "").trim();
                if (!arguments.isEmpty()) return arguments;
            }
        }
        return "";
    }

    private boolean isCodePlanKey(String key) {
        return key != null && key.trim().regionMatches(true, 0, "tp-", 0, 3);
    }

    private String normalizeChatUrl(String value, String key) {
        String raw = value == null ? "" : value.trim();
        if (raw.isEmpty()) raw = isCodePlanKey(key) ? MIMO_CODEPLAN_CHAT_URL : MIMO_CHAT_URL;
        while (raw.endsWith("/")) raw = raw.substring(0, raw.length() - 1);
        if (raw.endsWith("/chat/completions") || raw.endsWith("/messages")) return raw;
        if (raw.endsWith("/v1")) return raw + "/chat/completions";
        return raw + "/v1/chat/completions";
    }

    private String normalizeAnthropicUrl(String value) {
        String raw = value == null ? "" : value.trim();
        if (raw.isEmpty()) raw = "https://api.anthropic.com";
        while (raw.endsWith("/")) raw = raw.substring(0, raw.length() - 1);
        if (raw.endsWith("/messages")) return raw;
        if (raw.endsWith("/v1")) return raw + "/messages";
        return raw + "/v1/messages";
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
        return JSONObject.quote(value == null ? "" : value);
    }
}
