package local.bible.reader;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.util.Base64;
import android.webkit.JavascriptInterface;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;

public class ShareBridge {
    private final Activity activity;

    public ShareBridge(Activity activity) {
        this.activity = activity;
    }

    @JavascriptInterface
    public String shareText(String text, String fileName) {
        try {
            String safeName = fileName == null || fileName.trim().isEmpty() ? "bible-reader-data.json" : fileName.replace("/", "").replace("\\", "");
            File file = new File(activity.getExternalFilesDir("updates"), safeName);
            File parent = file.getParentFile();
            if (parent != null) parent.mkdirs();
            try (FileOutputStream out = new FileOutputStream(file)) {
                out.write((text == null ? "" : text).getBytes(java.nio.charset.StandardCharsets.UTF_8));
            }
            Uri contentUri = Uri.parse("content://" + activity.getPackageName() + ".apkprovider/" + file.getName());
            activity.runOnUiThread(() -> {
                Intent intent = new Intent(Intent.ACTION_SEND);
                intent.setType("application/json");
                intent.putExtra(Intent.EXTRA_STREAM, contentUri);
                intent.putExtra(Intent.EXTRA_TEXT, "本地圣经个人数据");
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                activity.startActivity(Intent.createChooser(intent, "导出个人数据"));
            });
            return new JSONObject().put("ok", true).toString();
        } catch (Throwable error) {
            String message = error.getMessage() == null ? "导出失败" : error.getMessage();
            return "{\"error\":\"" + message.replace("\\", "\\\\").replace("\"", "\\\"") + "\"}";
        }
    }

    @JavascriptInterface
    public String shareImage(String dataUrl, String text) {
        try {
            String raw = dataUrl == null ? "" : dataUrl;
            int comma = raw.indexOf(",");
            if (comma < 0) throw new IllegalArgumentException("图片数据无效");
            byte[] bytes = Base64.decode(raw.substring(comma + 1), Base64.DEFAULT);
            Bitmap bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
            if (bitmap == null) throw new IllegalArgumentException("无法解析分享图片");
            File shareFile = new File(activity.getExternalFilesDir("updates"), "bible-verse.png");
            File parent = shareFile.getParentFile();
            if (parent != null) parent.mkdirs();
            try (FileOutputStream out = new FileOutputStream(shareFile)) {
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, out);
            }
            Uri contentUri = Uri.parse("content://" + activity.getPackageName() + ".apkprovider/" + shareFile.getName());
            activity.runOnUiThread(() -> {
                Intent intent = new Intent(Intent.ACTION_SEND);
                intent.setType("image/png");
                intent.putExtra(Intent.EXTRA_STREAM, contentUri);
                if (text != null && !text.isEmpty()) intent.putExtra(Intent.EXTRA_TEXT, text);
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                activity.startActivity(Intent.createChooser(intent, "分享经文"));
            });
            return new JSONObject().put("ok", true).toString();
        } catch (Throwable error) {
            String message = error.getMessage() == null ? "分享失败" : error.getMessage();
            return "{\"error\":\"" + message.replace("\\", "\\\\").replace("\"", "\\\"") + "\"}";
        }
    }
}
