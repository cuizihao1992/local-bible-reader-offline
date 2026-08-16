package local.bible.reader;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.media.MediaRecorder;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.nio.charset.StandardCharsets;

public class VoiceBridge {
    private final Activity activity;
    private final WebView webView;
    private MediaRecorder cloudRecorder;
    private File cloudAudioFile;
    private String cloudKey = "";
    private String cloudModel = "mimo-v2.5-asr";
    private String cloudBaseUrl = "https://api.xiaomimimo.com/v1";

    public VoiceBridge(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
    }

    @JavascriptInterface
    public String startCloud(String provider, String key, String model, String baseUrl) {
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
                    emitError("请先在设置里填写小米 MiMo Key");
                    return;
                }
                stopCloudRecorder(true);
                cloudKey = key.trim();
                cloudModel = model == null || model.trim().isEmpty() ? "mimo-v2.5-asr" : model.trim();
                cloudBaseUrl = baseUrl == null || baseUrl.trim().isEmpty() ? "https://api.xiaomimimo.com/v1" : baseUrl.trim();
                cloudAudioFile = new File(activity.getCacheDir(), "mimo-voice-" + System.currentTimeMillis() + ".m4a");
                cloudRecorder = new MediaRecorder();
                cloudRecorder.setAudioSource(MediaRecorder.AudioSource.MIC);
                cloudRecorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
                cloudRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
                cloudRecorder.setAudioSamplingRate(16000);
                cloudRecorder.setAudioEncodingBitRate(64000);
                cloudRecorder.setOutputFile(cloudAudioFile.getAbsolutePath());
                cloudRecorder.prepare();
                cloudRecorder.start();
                emit("start", "");
            } catch (Throwable error) {
                stopCloudRecorder(true);
                emitError(message(error));
            }
        });
        return "{\"ok\":true}";
    }

    @JavascriptInterface
    public String stopCloud() {
        activity.runOnUiThread(() -> {
            File file = cloudAudioFile;
            String key = cloudKey;
            String model = cloudModel;
            String baseUrl = cloudBaseUrl;
            try {
                if (cloudRecorder == null) return;
                cloudRecorder.stop();
                stopCloudRecorder(false);
                emit("end", "");
                new Thread(() -> uploadCloudAudio(key, model, baseUrl, file), "mimo-asr").start();
            } catch (Throwable error) {
                stopCloudRecorder(true);
                emitError(message(error));
            }
        });
        return "{\"ok\":true}";
    }

    @JavascriptInterface
    public String cancel() {
        activity.runOnUiThread(() -> stopCloudRecorder(true));
        return "{\"ok\":true}";
    }

    private void uploadCloudAudio(String key, String model, String baseUrl, File file) {
        try {
            if (file == null || !file.exists() || file.length() < 512) {
                throw new IllegalArgumentException("录音太短，请按住说完后再松开");
            }
            emit("ready", "");
            emit("result", requestMimoAsr(key, model, baseUrl, file));
        } catch (Throwable error) {
            emitError(message(error));
        } finally {
            if (file != null) {
                try {
                    file.delete();
                } catch (Throwable ignored) {
                }
            }
        }
    }

    private String requestMimoAsr(String key, String model, String baseUrl, File file) throws Exception {
        String audioBase64 = Base64.encodeToString(readAll(new FileInputStream(file)), Base64.NO_WRAP);
        JSONObject inputAudio = new JSONObject().put("data", "data:audio/mp4;base64," + audioBase64);
        JSONObject audioContent = new JSONObject().put("type", "input_audio").put("input_audio", inputAudio);
        JSONObject message = new JSONObject().put("role", "user").put("content", new JSONArray().put(audioContent));
        JSONObject body = new JSONObject()
                .put("model", model == null || model.isEmpty() ? "mimo-v2.5-asr" : model)
                .put("messages", new JSONArray().put(message))
                .put("asr_options", new JSONObject().put("language", "auto"));
        String endpoint = normalizeChatUrl(baseUrl);
        HttpURLConnection connection = HttpSupport.open(activity, endpoint, 20000, 60000);
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
                errorText = "MiMo Key 鉴权失败。普通 Key 用默认地址；tp- 开头的 Token Plan 请在设置里选 CodePlan 并填写后台专属 Base URL。";
            }
            throw new RuntimeException(errorText);
        }
        JSONObject response = new JSONObject(new String(responseBytes, StandardCharsets.UTF_8));
        return response.getJSONArray("choices").getJSONObject(0).getJSONObject("message").optString("content", "");
    }

    private byte[] readAll(InputStream input) throws Exception {
        if (input == null) return new byte[0];
        byte[] buffer = new byte[8192];
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        int read;
        while ((read = input.read(buffer)) != -1) output.write(buffer, 0, read);
        return output.toByteArray();
    }

    private String normalizeChatUrl(String value) {
        String raw = value == null || value.trim().isEmpty() ? "https://api.xiaomimimo.com/v1" : value.trim();
        while (raw.endsWith("/")) raw = raw.substring(0, raw.length() - 1);
        if (raw.endsWith("/chat/completions")) return raw;
        return raw + "/chat/completions";
    }

    private void stopCloudRecorder(boolean deleteFile) {
        if (cloudRecorder != null) {
            try {
                cloudRecorder.release();
            } catch (Throwable ignored) {
            }
            cloudRecorder = null;
        }
        if (deleteFile && cloudAudioFile != null) {
            try {
                cloudAudioFile.delete();
            } catch (Throwable ignored) {
            }
            cloudAudioFile = null;
        }
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
