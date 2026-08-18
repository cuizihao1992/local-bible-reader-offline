package local.bible.reader;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.net.Uri;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public class OfflineApi {
    private final Context context;
    private final File bibleDir;
    private final File commentaryDir;
    private final SQLiteDatabase userDb;
    private volatile JSONObject downloadStatus = new JSONObject();

    private static final Object[][] BOOKS = new Object[][]{
            {"创", "创世记", 50}, {"出", "出埃及记", 40}, {"利", "利未记", 27}, {"民", "民数记", 36},
            {"申", "申命记", 34}, {"书", "约书亚记", 24}, {"士", "士师记", 21}, {"得", "路得记", 4},
            {"撒上", "撒母耳记上", 31}, {"撒下", "撒母耳记下", 24}, {"王上", "列王纪上", 22}, {"王下", "列王纪下", 25},
            {"代上", "历代志上", 29}, {"代下", "历代志下", 36}, {"拉", "以斯拉记", 10}, {"尼", "尼希米记", 13},
            {"斯", "以斯帖记", 10}, {"伯", "约伯记", 42}, {"诗", "诗篇", 150}, {"箴", "箴言", 31},
            {"传", "传道书", 12}, {"歌", "雅歌", 8}, {"赛", "以赛亚书", 66}, {"耶", "耶利米书", 52},
            {"哀", "耶利米哀歌", 5}, {"结", "以西结书", 48}, {"但", "但以理书", 12}, {"何", "何西阿书", 14},
            {"珥", "约珥书", 3}, {"摩", "阿摩司书", 9}, {"俄", "俄巴底亚书", 1}, {"拿", "约拿书", 4},
            {"弥", "弥迦书", 7}, {"鸿", "那鸿书", 3}, {"哈", "哈巴谷书", 3}, {"番", "西番雅书", 3},
            {"该", "哈该书", 2}, {"亚", "撒迦利亚书", 14}, {"玛", "玛拉基书", 4}, {"太", "马太福音", 28},
            {"可", "马可福音", 16}, {"路", "路加福音", 24}, {"约", "约翰福音", 21}, {"徒", "使徒行传", 28},
            {"罗", "罗马书", 16}, {"林前", "哥林多前书", 16}, {"林后", "哥林多后书", 13}, {"加", "加拉太书", 6},
            {"弗", "以弗所书", 6}, {"腓", "腓立比书", 4}, {"西", "歌罗西书", 4}, {"帖前", "帖撒罗尼迦前书", 5},
            {"帖后", "帖撒罗尼迦后书", 3}, {"提前", "提摩太前书", 6}, {"提后", "提摩太后书", 4}, {"多", "提多书", 3},
            {"门", "腓利门书", 1}, {"来", "希伯来书", 13}, {"雅", "雅各书", 5}, {"彼前", "彼得前书", 5},
            {"彼后", "彼得后书", 3}, {"约一", "约翰一书", 5}, {"约二", "约翰二书", 1}, {"约三", "约翰三书", 1},
            {"犹", "犹大书", 1}, {"启", "启示录", 22}
    };

    public OfflineApi(Context context) {
        this.context = context.getApplicationContext();
        this.bibleDir = new File(context.getFilesDir(), "bibles");
        this.commentaryDir = new File(context.getFilesDir(), "commentaries");
        this.commentaryDir.mkdirs();
        copyBundledBibles();
        this.userDb = SQLiteDatabase.openOrCreateDatabase(new File(context.getFilesDir(), "user.sqlite"), null);
        initUserDb();
    }

    public String handle(String method, Uri uri) {
        try {
            String path = uri.getPath();
            if ("/api/health".equals(path)) return health().toString();
            if ("/api/versions".equals(path)) return new JSONObject().put("versions", versions()).toString();
            if ("/api/books".equals(path)) return new JSONObject().put("books", books()).toString();
            if ("/api/chapters".equals(path)) return chapters(uri).toString();
            if ("/api/chapter".equals(path)) return chapter(query(uri, "version"), intQuery(uri, "book", 1), intQuery(uri, "chapter", 1)).toString();
            if ("/api/search".equals(path)) return search(uri).toString();
            if ("/api/user/marks".equals(path)) return marks(uri).toString();
            if ("/api/user/marks/all".equals(path)) return allMarks(uri).toString();
            if ("/api/user/progress".equals(path) && "GET".equalsIgnoreCase(method)) return progress(query(uri, "version")).toString();
            if ("/api/user/history".equals(path) && "GET".equalsIgnoreCase(method)) return new JSONObject().put("history", getHistory()).toString();
            if ("/api/user/export".equals(path) && "GET".equalsIgnoreCase(method)) return exportUserData().toString();
            if ("/api/packages".equals(path)) return new JSONObject().put("packages", packages()).toString();
            if ("/api/commentaries".equals(path)) return new JSONObject().put("commentaries", commentaries()).toString();
            if ("/api/commentary".equals(path)) return commentary(uri).toString();
            if ("/api/dictionaries".equals(path)) return new JSONObject().put("dictionaries", new JSONArray()).toString();
            if ("/api/dictionary/search".equals(path)) return new JSONObject().put("results", new JSONArray()).put("query", query(uri, "q")).put("title", "").toString();
            if ("/api/audio".equals(path)) return new JSONObject().put("audio", new JSONArray()).toString();
            if ("/api/diagnostics".equals(path)) return diagnostics().toString();
            if ("/api/strong".equals(path)) return new JSONObject().put("error", "Android 离线版暂未内置原文库").toString();
            return new JSONObject().put("error", "Android 离线版暂未支持此接口：" + path).toString();
        } catch (Exception error) {
            return "{\"error\":\"" + escapeJson(error.getMessage()) + "\"}";
        }
    }

    public String handlePost(String path, String payload) {
        try {
            JSONObject body = payload == null || payload.isEmpty() ? new JSONObject() : new JSONObject(payload);
            if ("/api/user/mark".equals(path)) return new JSONObject().put("mark", saveMark(body)).toString();
            if ("/api/user/history".equals(path)) return new JSONObject().put("history", saveHistory(body)).toString();
            if ("/api/user/progress".equals(path)) return saveProgress(body).toString();
            if ("/api/user/export".equals(path)) return exportUserData().toString();
            if ("/api/user/import".equals(path)) return importUserData(body).toString();
            if ("/api/package/install".equals(path)) return installPackage(body.optString("id"), body.optString("url"));
            return new JSONObject().put("error", "Android 离线版暂未支持此 POST 接口：" + path).toString();
        } catch (Exception error) {
            return "{\"error\":\"" + escapeJson(error.getMessage()) + "\"}";
        }
    }

    private void copyBundledBibles() {
        bibleDir.mkdirs();
        try {
            String[] files = context.getAssets().list("bibles");
            if (files == null) return;
            for (String name : files) {
                File target = new File(bibleDir, name);
                if (target.exists() && target.length() > 0) continue;
                try (InputStream in = context.getAssets().open("bibles/" + name);
                     FileOutputStream out = new FileOutputStream(target)) {
                    byte[] buffer = new byte[1024 * 64];
                    int read;
                    while ((read = in.read(buffer)) > 0) out.write(buffer, 0, read);
                }
            }
        } catch (Exception ignored) {
        }
    }

    private void initUserDb() {
        userDb.execSQL("create table if not exists verse_marks (version text not null, book integer not null, chapter integer not null, verse integer not null, favorite integer not null default 0, highlighted integer not null default 0, note text not null default '', tags text not null default '', updated_at text not null, primary key(version, book, chapter, verse))");
        userDb.execSQL("create table if not exists reading_history (id integer primary key check(id=1), version text not null, book integer not null, chapter integer not null, updated_at text not null)");
        userDb.execSQL("create table if not exists reading_progress (version text not null, book integer not null, chapter integer not null, read_at text not null, primary key(version, book, chapter))");
        try {
            userDb.execSQL("alter table verse_marks add column highlight_color text not null default ''");
        } catch (Exception ignored) {
        }
    }

    public String installPackage(String packageId, String downloadUrl) {
        try {
            return installDataPackage(packageId, downloadUrl).toString();
        } catch (Exception error) {
            setDownloadStatus(packageId == null ? "package" : packageId, "error", 0, 0, error.getMessage());
            return "{\"error\":\"" + escapeJson(error.getMessage()) + "\"}";
        }
    }

    public String downloadStatus() {
        return downloadStatus.toString();
    }

    public String clearDownloadCache() {
        long bytes = deleteChildren(new File(context.getCacheDir(), "downloads"));
        setDownloadStatus("cache", "cleared", 0, 0, "已清理下载缓存");
        try {
            return new JSONObject().put("ok", true).put("bytes", bytes).put("message", "已清理下载缓存").toString();
        } catch (Exception error) {
            return "{\"ok\":true,\"bytes\":" + bytes + "}";
        }
    }

    private JSONArray packages() throws Exception {
        JSONArray array = new JSONArray();
        array.put(packageInfo("extra-bibles", "更多译本", "下载补充经文译本", "bibles-extra-v1.3.0.zip", bibleDir, 26));
        array.put(packageInfo("commentaries", "基础注释库", "下载常用注释（不含超大图解库）", "commentaries-v1.3.0.zip", commentaryDir, 14));
        return array;
    }

    private JSONObject packageInfo(String id, String title, String description, String fileName, File targetDir, int fullCount) throws Exception {
        int installed = countDbFiles(targetDir);
        return new JSONObject()
                .put("id", id)
                .put("title", title)
                .put("description", description)
                .put("fileName", fileName)
                .put("url", "https://github.com/cuizihao1992/local-bible-reader-offline/releases/download/v1.3.0/" + fileName)
                .put("installedCount", installed)
                .put("fullCount", fullCount)
                .put("installed", "extra-bibles".equals(id) ? installed >= 8 : installed >= 3);
    }

    private JSONObject installDataPackage(String packageId, String downloadUrl) throws Exception {
        String fileName;
        File targetDir;
        if ("extra-bibles".equals(packageId)) {
            fileName = "bibles-extra-v1.3.0.zip";
            targetDir = bibleDir;
        } else if ("commentaries".equals(packageId)) {
            fileName = "commentaries-v1.3.0.zip";
            targetDir = commentaryDir;
        } else {
            throw new Exception("未知资源包：" + packageId);
        }
        String urlText = downloadUrl != null && downloadUrl.startsWith("https://github.com/") ? downloadUrl : "https://github.com/cuizihao1992/local-bible-reader-offline/releases/download/v1.3.0/" + fileName;
        targetDir.mkdirs();
        File downloadDir = new File(context.getCacheDir(), "downloads");
        downloadDir.mkdirs();
        File cached = new File(downloadDir, fileName);
        File temp = new File(downloadDir, fileName + ".part");
        long downloaded = cached.exists() ? cached.length() : 0;
        long total = downloaded;
        if (!isCompleteZip(cached)) {
            String resolved = HttpSupport.resolveRedirects(context, urlText, 20000, 30000);
            HttpURLConnection connection = HttpSupport.open(context, resolved, 20000, 120000);
            int status = connection.getResponseCode();
            if (status < 200 || status >= 300) throw new Exception("下载失败：" + status);
            total = connection.getContentLengthLong();
            downloaded = 0;
            setDownloadStatus(packageId, "downloading", 0, total, "正在下载资源包");
            try (InputStream in = connection.getInputStream(); FileOutputStream out = new FileOutputStream(temp)) {
                byte[] buffer = new byte[1024 * 64];
                int read;
                while ((read = in.read(buffer)) > 0) {
                    out.write(buffer, 0, read);
                    downloaded += read;
                    setDownloadStatus(packageId, "downloading", downloaded, total, "正在下载资源包");
                }
            } finally {
                connection.disconnect();
            }
            if (cached.exists() && !cached.delete()) throw new Exception("无法替换已下载的资源包");
            if (!temp.renameTo(cached)) {
                throw new Exception("保存资源包失败");
            }
        } else {
            setDownloadStatus(packageId, "installing", downloaded, total, "已有资源包，正在安装");
        }
        setDownloadStatus(packageId, "installing", downloaded, total > 0 ? total : downloaded, "正在安装资源包");
        int installed = 0;
        try (ZipInputStream zip = new ZipInputStream(new FileInputStream(cached))) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                if (entry.isDirectory() || !entry.getName().toLowerCase().endsWith(".db")) continue;
                String name = safeName(new File(entry.getName()).getName());
                if (name.isEmpty()) continue;
                File target = new File(targetDir, name);
                try (FileOutputStream out = new FileOutputStream(target)) {
                    byte[] buffer = new byte[1024 * 64];
                    int read;
                    while ((read = zip.read(buffer)) > 0) out.write(buffer, 0, read);
                }
                installed++;
            }
        }
        setDownloadStatus(packageId, "done", downloaded, total, "资源包安装完成");
        return new JSONObject().put("id", packageId).put("installed", installed).put("packages", packages());
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

    private boolean isCompleteZip(File file) {
        if (file == null || !file.isFile() || file.length() < 1024 * 1024) return false;
        try (FileInputStream in = new FileInputStream(file)) {
            byte[] header = new byte[2];
            return in.read(header) == 2 && header[0] == 'P' && header[1] == 'K';
        } catch (Exception error) {
            return false;
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

    private int countDbFiles(File dir) {
        File[] files = dir.listFiles((file, name) -> name.endsWith(".db"));
        return files == null ? 0 : files.length;
    }

    private JSONArray commentaries() throws Exception {
        JSONArray array = new JSONArray();
        File[] files = commentaryDir.listFiles((dir, name) -> name.endsWith(".db"));
        if (files == null) return array;
        List<File> sorted = new ArrayList<>();
        for (File file : files) sorted.add(file);
        sorted.sort(Comparator.comparing(File::getName));
        for (File file : sorted) {
            String name = file.getName();
            int count = 0;
            SQLiteDatabase db = SQLiteDatabase.openDatabase(file.getAbsolutePath(), null, SQLiteDatabase.OPEN_READONLY);
            try (Cursor cursor = db.rawQuery("select count(*) from commentary", null)) {
                if (cursor.moveToNext()) count = cursor.getInt(0);
            } catch (Exception ignored) {
            } finally {
                db.close();
            }
            array.put(new JSONObject()
                    .put("id", name)
                    .put("title", name.replace(".db", ""))
                    .put("fileName", name)
                    .put("count", count)
                    .put("readable", count > 0));
        }
        return array;
    }

    private JSONObject commentary(Uri uri) throws Exception {
        String source = query(uri, "source");
        int book = intQuery(uri, "book", 1);
        int chapter = intQuery(uri, "chapter", 1);
        File file = new File(commentaryDir, safeName(source));
        if (!file.exists()) throw new Exception("找不到注释：" + source);
        SQLiteDatabase db = SQLiteDatabase.openDatabase(file.getAbsolutePath(), null, SQLiteDatabase.OPEN_READONLY);
        JSONArray entries = new JSONArray();
        try (Cursor cursor = db.rawQuery("select Chapter, FromVerse, ToVerse, Data from commentary where Book=? and (Chapter=? or Chapter=0) order by Chapter, FromVerse",
                new String[]{String.valueOf(book), String.valueOf(chapter)})) {
            while (cursor.moveToNext()) {
                entries.put(new JSONObject()
                        .put("chapter", cursor.getInt(0))
                        .put("fromVerse", cursor.getInt(1))
                        .put("toVerse", cursor.getInt(2))
                        .put("text", cleanText(cursor.getString(3)))
                        .put("hasImages", false));
            }
        } finally {
            db.close();
        }
        return new JSONObject()
                .put("source", source)
                .put("title", source.replace(".db", ""))
                .put("readable", true)
                .put("book", book)
                .put("chapter", chapter)
                .put("entries", entries);
    }

    private JSONArray versions() throws Exception {
        JSONArray array = new JSONArray();
        File[] files = bibleDir.listFiles((dir, name) -> name.endsWith(".db"));
        if (files == null) return array;
        List<File> sorted = new ArrayList<>();
        for (File file : files) sorted.add(file);
        sorted.sort(Comparator.comparing(File::getName));
        for (File file : sorted) {
            String name = file.getName();
            array.put(new JSONObject()
                    .put("id", name)
                    .put("name", name.replace(".db", ""))
                    .put("shortName", name.replace(".db", ""))
                    .put("fileName", name)
                    .put("sizeMb", Math.round(file.length() / 1024.0 / 1024.0 * 100.0) / 100.0)
                    .put("titleCount", countTitles(file)));
        }
        return array;
    }

    private int countTitles(File file) {
        SQLiteDatabase db = null;
        try {
            db = SQLiteDatabase.openDatabase(file.getAbsolutePath(), null, SQLiteDatabase.OPEN_READONLY);
            if (!hasTable(db, "Titles")) return 0;
            try (Cursor cursor = db.rawQuery("select count(*) from Titles", null)) {
                return cursor.moveToFirst() ? cursor.getInt(0) : 0;
            }
        } catch (Exception ignored) {
            return 0;
        } finally {
            if (db != null) db.close();
        }
    }

    private JSONArray books() throws Exception {
        JSONArray array = new JSONArray();
        for (int i = 0; i < BOOKS.length; i++) {
            array.put(new JSONObject()
                    .put("id", i + 1)
                    .put("shortName", BOOKS[i][0])
                    .put("longName", BOOKS[i][1])
                    .put("chapterCount", BOOKS[i][2]));
        }
        return array;
    }

    private JSONObject chapters(Uri uri) throws Exception {
        JSONArray versions = new JSONArray();
        List<String> requested = uri.getQueryParameters("version");
        int book = intQuery(uri, "book", 1);
        int chapter = intQuery(uri, "chapter", 1);
        for (String version : requested) versions.put(chapter(version, book, chapter));
        return new JSONObject().put("chapters", versions);
    }

    private JSONObject chapter(String version, int book, int chapter) throws Exception {
        SQLiteDatabase db = openBible(version);
        JSONArray verses = new JSONArray();
        JSONArray titles = new JSONArray();
        String titleSource = "none";
        String titleSourceVersion = "";
        String titleSourceName = "";
        try (Cursor cursor = db.rawQuery("select Verse, Scripture from Bible where Book=? and Chapter=? order by Verse",
                new String[]{String.valueOf(book), String.valueOf(chapter)})) {
            while (cursor.moveToNext()) {
                verses.put(new JSONObject()
                        .put("verse", cursor.getInt(0))
                        .put("text", cleanText(cursor.getString(1)))
                        .put("strongs", new JSONArray()));
            }
            if (hasTable(db, "Titles")) {
                try (Cursor titleCursor = db.rawQuery("select Verse, Scripture from Titles where Book=? and Chapter=? order by Verse",
                        new String[]{String.valueOf(book), String.valueOf(chapter)})) {
                    while (titleCursor.moveToNext()) {
                        String title = cleanText(titleCursor.getString(1));
                        if (!title.isEmpty()) {
                            titles.put(new JSONObject()
                                    .put("verse", titleCursor.getInt(0))
                                    .put("text", title));
                        }
                    }
                }
            }
            if (titles.length() > 0) {
                titleSource = "db";
                titleSourceVersion = version;
                titleSourceName = version.replace(".db", "");
            } else {
                JSONObject fallback = fallbackChapterTitles(version, book, chapter);
                titles = fallback.getJSONArray("titles");
                titleSource = fallback.getString("titleSource");
                titleSourceVersion = fallback.getString("titleSourceVersion");
                titleSourceName = fallback.getString("titleSourceName");
            }
        } finally {
            db.close();
        }
        return new JSONObject()
                .put("version", version)
                .put("versionName", version.replace(".db", ""))
                .put("shortName", version.replace(".db", ""))
                .put("book", book)
                .put("bookName", bookName(book))
                .put("chapter", chapter)
                .put("titles", titles)
                .put("titleSource", titleSource)
                .put("titleSourceVersion", titleSourceVersion)
                .put("titleSourceName", titleSourceName)
                .put("verses", verses);
    }

    private JSONObject fallbackChapterTitles(String version, int book, int chapter) throws Exception {
        File[] files = bibleDir.listFiles((dir, name) -> name.endsWith(".db") && !name.equals(version));
        if (files == null) {
            return emptyTitleFallback();
        }
        List<File> sorted = new ArrayList<>();
        for (File file : files) sorted.add(file);
        sorted.sort(Comparator.comparing(File::getName));
        for (File file : sorted) {
            if (countTitles(file) <= 0) continue;
            SQLiteDatabase fallbackDb = SQLiteDatabase.openDatabase(file.getAbsolutePath(), null, SQLiteDatabase.OPEN_READONLY);
            JSONArray fallbackTitles = new JSONArray();
            try (Cursor titleCursor = fallbackDb.rawQuery("select Verse, Scripture from Titles where Book=? and Chapter=? order by Verse",
                    new String[]{String.valueOf(book), String.valueOf(chapter)})) {
                while (titleCursor.moveToNext()) {
                    String title = cleanText(titleCursor.getString(1));
                    if (!title.isEmpty()) {
                        fallbackTitles.put(new JSONObject()
                                .put("verse", titleCursor.getInt(0))
                                .put("text", title));
                    }
                }
            } finally {
                fallbackDb.close();
            }
            if (fallbackTitles.length() > 0) {
                String name = file.getName();
                return new JSONObject()
                        .put("titles", fallbackTitles)
                        .put("titleSource", "reference")
                        .put("titleSourceVersion", name)
                        .put("titleSourceName", name.replace(".db", ""));
            }
        }
        return emptyTitleFallback();
    }

    private JSONObject emptyTitleFallback() throws Exception {
        return new JSONObject()
                .put("titles", new JSONArray())
                .put("titleSource", "none")
                .put("titleSourceVersion", "")
                .put("titleSourceName", "");
    }

    private boolean hasTable(SQLiteDatabase db, String tableName) {
        try (Cursor cursor = db.rawQuery("select name from sqlite_master where type='table' and name=?", new String[]{tableName})) {
            return cursor.moveToFirst();
        }
    }

    private String searchLikePattern(String keyword, boolean fuzzy) {
        String cleaned = keyword == null ? "" : keyword.replaceAll("\\s+", "");
        String source = cleaned.isEmpty() ? String.valueOf(keyword == null ? "" : keyword) : cleaned;
        StringBuilder escaped = new StringBuilder();
        for (int i = 0; i < source.length(); ) {
            int code = source.codePointAt(i);
            String ch = new String(Character.toChars(code));
            if (ch.equals("\\") || ch.equals("%") || ch.equals("_")) escaped.append('\\');
            escaped.append(ch);
            i += Character.charCount(code);
        }
        if (!fuzzy || cleaned.codePointCount(0, cleaned.length()) < 2) return "%" + escaped + "%";
        StringBuilder pattern = new StringBuilder("%");
        for (int i = 0; i < cleaned.length(); ) {
            int code = cleaned.codePointAt(i);
            String ch = new String(Character.toChars(code));
            if (ch.equals("\\") || ch.equals("%") || ch.equals("_")) pattern.append('\\');
            pattern.append(ch).append('%');
            i += Character.charCount(code);
        }
        return pattern.toString();
    }

    private JSONObject search(Uri uri) throws Exception {
        String version = query(uri, "version");
        String q = query(uri, "q");
        int limit = Math.max(1, Math.min(intQuery(uri, "limit", 40), 80));
        int offset = Math.max(0, intQuery(uri, "offset", 0));
        int currentBook = intQuery(uri, "book", 0);
        String scope = query(uri, "scope");
        boolean fuzzy = "1".equals(query(uri, "fuzzy")) || "true".equalsIgnoreCase(query(uri, "fuzzy"));
        SQLiteDatabase db = openBible(version);
        JSONArray results = new JSONArray();
        boolean hasMore = false;
        String where = "Scripture like ? escape '\\'";
        List<String> args = new ArrayList<>();
        args.add(searchLikePattern(q, fuzzy));
        if ("ot".equals(scope)) where += " and Book <= 39";
        if ("nt".equals(scope)) where += " and Book >= 40";
        if ("book".equals(scope) && currentBook > 0) {
            where += " and Book = ?";
            args.add(String.valueOf(currentBook));
        }
        args.add(String.valueOf(limit + 1));
        args.add(String.valueOf(offset));
        try (Cursor cursor = db.rawQuery("select Book, Chapter, Verse, Scripture from Bible where " + where + " order by Book, Chapter, Verse limit ? offset ?",
                args.toArray(new String[0]))) {
            while (cursor.moveToNext()) {
                if (results.length() >= limit) {
                    hasMore = true;
                    break;
                }
                int book = cursor.getInt(0);
                results.put(new JSONObject()
                        .put("book", book)
                        .put("bookName", bookName(book))
                        .put("chapter", cursor.getInt(1))
                        .put("verse", cursor.getInt(2))
                        .put("text", cleanText(cursor.getString(3))));
            }
        } finally {
            db.close();
        }
        return new JSONObject()
                .put("query", q)
                .put("fuzzy", fuzzy)
                .put("scope", scope)
                .put("limit", limit)
                .put("offset", offset)
                .put("nextOffset", offset + results.length())
                .put("hasMore", hasMore)
                .put("results", results);
    }

    private JSONObject marks(Uri uri) throws Exception {
        JSONArray marks = new JSONArray();
        try (Cursor cursor = userDb.rawQuery("select version, book, chapter, verse, favorite, highlighted, note, tags, updated_at, highlight_color from verse_marks where version=? and book=? and chapter=? order by verse",
                new String[]{query(uri, "version"), query(uri, "book"), query(uri, "chapter")})) {
            while (cursor.moveToNext()) marks.put(markFromCursor(cursor));
        }
        return new JSONObject().put("marks", marks);
    }

    private JSONObject allMarks(Uri uri) throws Exception {
        JSONArray marks = new JSONArray();
        String kind = query(uri, "kind");
        String tag = query(uri, "tag");
        String sql = "select version, book, chapter, verse, favorite, highlighted, note, tags, updated_at, highlight_color from verse_marks";
        List<String> args = new ArrayList<>();
        List<String> where = new ArrayList<>();
        if ("favorite".equals(kind)) where.add("favorite = 1");
        if ("note".equals(kind)) where.add("(note <> '' or tags <> '')");
        if ("highlight".equals(kind) || "highlighted".equals(kind)) {
            where.add("(highlighted = 1 or ifnull(highlight_color, '') <> '')");
        }
        if (!tag.isEmpty()) {
            where.add("tags like ?");
            args.add("%" + tag + "%");
        }
        if (!where.isEmpty()) sql += " where " + String.join(" and ", where);
        sql += " order by updated_at desc limit ?";
        args.add(String.valueOf(intQuery(uri, "limit", 200)));
        try (Cursor cursor = userDb.rawQuery(sql, args.toArray(new String[0]))) {
            while (cursor.moveToNext()) {
                JSONObject mark = markFromCursor(cursor);
                mark.put("bookName", bookName(mark.getInt("book")));
                marks.put(mark);
            }
        }
        return new JSONObject().put("marks", marks);
    }

    private JSONObject progress(String version) throws Exception {
        JSONArray read = new JSONArray();
        try (Cursor cursor = userDb.rawQuery("select version, book, chapter, read_at from reading_progress where version=? order by book, chapter", new String[]{version})) {
            while (cursor.moveToNext()) {
                read.put(new JSONObject().put("version", cursor.getString(0)).put("book", cursor.getInt(1)).put("chapter", cursor.getInt(2)).put("readAt", cursor.getString(3)));
            }
        }
        int total = 0;
        for (Object[] book : BOOKS) total += (Integer) book[2];
        JSONArray bookStats = new JSONArray();
        for (int i = 0; i < BOOKS.length; i++) {
            int bookId = i + 1;
            int chapterCount = (Integer) BOOKS[i][2];
            int readCount = 0;
            for (int j = 0; j < read.length(); j++) {
                if (read.getJSONObject(j).getInt("book") == bookId) readCount++;
            }
            bookStats.put(new JSONObject()
                    .put("id", bookId)
                    .put("shortName", BOOKS[i][0])
                    .put("longName", BOOKS[i][1])
                    .put("chapterCount", chapterCount)
                    .put("read", readCount)
                    .put("unread", chapterCount - readCount));
        }
        return new JSONObject()
                .put("version", version)
                .put("total", total)
                .put("read", read.length())
                .put("percent", total == 0 ? 0 : Math.round(read.length() * 1000.0 / total) / 10.0)
                .put("readChapters", read)
                .put("books", bookStats);
    }

    private JSONObject getHistory() throws Exception {
        try (Cursor cursor = userDb.rawQuery("select version, book, chapter, updated_at from reading_history where id=1", null)) {
            if (!cursor.moveToNext()) return null;
            return new JSONObject().put("version", cursor.getString(0)).put("book", cursor.getInt(1)).put("chapter", cursor.getInt(2)).put("updatedAt", cursor.getString(3));
        }
    }

    private JSONObject saveMark(JSONObject body) throws Exception {
        String updatedAt = isoNow();
        ContentValues values = new ContentValues();
        values.put("version", body.optString("version"));
        values.put("book", body.optInt("book"));
        values.put("chapter", body.optInt("chapter"));
        values.put("verse", body.optInt("verse"));
        values.put("favorite", body.optBoolean("favorite") ? 1 : 0);
        values.put("highlighted", body.optBoolean("highlighted") ? 1 : 0);
        values.put("note", body.optString("note", ""));
        values.put("tags", body.optString("tags", ""));
        String highlightColor = body.optString("highlightColor", body.optString("highlight_color", ""));
        values.put("highlight_color", highlightColor);
        if (!highlightColor.isEmpty()) values.put("highlighted", 1);
        values.put("updated_at", updatedAt);
        userDb.insertWithOnConflict("verse_marks", null, values, SQLiteDatabase.CONFLICT_REPLACE);
        return new JSONObject()
                .put("version", values.getAsString("version"))
                .put("book", values.getAsInteger("book"))
                .put("chapter", values.getAsInteger("chapter"))
                .put("verse", values.getAsInteger("verse"))
                .put("favorite", values.getAsInteger("favorite") == 1)
                .put("highlighted", values.getAsInteger("highlighted") == 1)
                .put("highlightColor", highlightColor)
                .put("note", values.getAsString("note"))
                .put("tags", values.getAsString("tags"))
                .put("updatedAt", updatedAt);
    }

    private JSONObject saveHistory(JSONObject body) throws Exception {
        String updatedAt = isoNow();
        ContentValues values = new ContentValues();
        values.put("id", 1);
        values.put("version", body.optString("version"));
        values.put("book", body.optInt("book"));
        values.put("chapter", body.optInt("chapter"));
        values.put("updated_at", updatedAt);
        userDb.insertWithOnConflict("reading_history", null, values, SQLiteDatabase.CONFLICT_REPLACE);
        return new JSONObject()
                .put("version", values.getAsString("version"))
                .put("book", values.getAsInteger("book"))
                .put("chapter", values.getAsInteger("chapter"))
                .put("updatedAt", updatedAt);
    }

    private JSONObject saveProgress(JSONObject body) throws Exception {
        String version = body.optString("version");
        int book = body.optInt("book");
        int chapter = body.optInt("chapter");
        boolean read = body.optBoolean("read", true);
        String updatedAt = isoNow();
        if (read) {
            ContentValues values = new ContentValues();
            values.put("version", version);
            values.put("book", book);
            values.put("chapter", chapter);
            values.put("read_at", updatedAt);
            userDb.insertWithOnConflict("reading_progress", null, values, SQLiteDatabase.CONFLICT_REPLACE);
        } else {
            userDb.delete("reading_progress", "version=? and book=? and chapter=?", new String[]{version, String.valueOf(book), String.valueOf(chapter)});
        }
        return new JSONObject()
                .put("version", version)
                .put("book", book)
                .put("chapter", chapter)
                .put("read", read)
                .put("readAt", read ? updatedAt : JSONObject.NULL)
                .put("progress", progress(version));
    }

    private JSONObject exportUserData() throws Exception {
        JSONArray marks = new JSONArray();
        try (Cursor cursor = userDb.rawQuery("select version, book, chapter, verse, favorite, highlighted, note, tags, updated_at, highlight_color from verse_marks order by updated_at desc", null)) {
            while (cursor.moveToNext()) marks.put(markFromCursor(cursor));
        }
        JSONArray progressRows = new JSONArray();
        try (Cursor cursor = userDb.rawQuery("select version, book, chapter, read_at from reading_progress order by read_at desc", null)) {
            while (cursor.moveToNext()) {
                progressRows.put(new JSONObject()
                        .put("version", cursor.getString(0))
                        .put("book", cursor.getInt(1))
                        .put("chapter", cursor.getInt(2))
                        .put("read_at", cursor.getString(3)));
            }
        }
        return new JSONObject()
                .put("exportedAt", isoNow())
                .put("marks", marks)
                .put("history", getHistory())
                .put("progress", progressRows);
    }

    private JSONObject importUserData(JSONObject body) throws Exception {
        JSONArray marks = body.optJSONArray("marks");
        int imported = 0;
        if (marks != null) {
            for (int i = 0; i < marks.length(); i++) {
                saveMark(marks.getJSONObject(i));
                imported++;
            }
        }
        JSONArray progressRows = body.optJSONArray("progress");
        int progressImported = 0;
        if (progressRows != null) {
            for (int i = 0; i < progressRows.length(); i++) {
                JSONObject row = progressRows.getJSONObject(i);
                row.put("read", true);
                saveProgress(row);
                progressImported++;
            }
        }
        JSONObject history = body.optJSONObject("history");
        if (history != null) saveHistory(history);
        return new JSONObject().put("imported", imported).put("progressImported", progressImported);
    }

    private JSONObject health() throws Exception {
        return new JSONObject()
                .put("ok", true)
                .put("app", "bible-reader")
                .put("platform", "android-offline")
                .put("version", "1.15.0")
                .put("versionCount", versions().length());
    }

    private JSONObject diagnostics() throws Exception {
        JSONArray checks = new JSONArray();
        checks.put(new JSONObject().put("name", "离线经文库").put("ok", versions().length() > 0).put("detail", versions().length() + " 个译本"));
        checks.put(new JSONObject().put("name", "用户数据库").put("ok", true).put("detail", "App 私有目录"));
        return new JSONObject().put("ok", versions().length() > 0).put("checks", checks);
    }

    private JSONObject markFromCursor(Cursor cursor) throws Exception {
        return new JSONObject()
                .put("version", cursor.getString(0))
                .put("book", cursor.getInt(1))
                .put("chapter", cursor.getInt(2))
                .put("verse", cursor.getInt(3))
                .put("favorite", cursor.getInt(4) == 1)
                .put("note", cursor.getString(6))
                .put("tags", cursor.getString(7))
                .put("updatedAt", cursor.getString(8))
                .put("highlightColor", cursor.getColumnCount() > 9 ? cursor.getString(9) : "")
                .put("highlighted", cursor.getInt(5) == 1 || (cursor.getColumnCount() > 9 && cursor.getString(9) != null && !cursor.getString(9).isEmpty()));
    }

    private SQLiteDatabase openBible(String version) {
        File file = new File(bibleDir, safeName(version));
        return SQLiteDatabase.openDatabase(file.getAbsolutePath(), null, SQLiteDatabase.OPEN_READONLY);
    }

    private String bookName(int book) {
        if (book < 1 || book > BOOKS.length) return "第 " + book + " 卷";
        return (String) BOOKS[book - 1][1];
    }

    private String query(Uri uri, String name) {
        String value = uri.getQueryParameter(name);
        return value == null ? "" : URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    private int intQuery(Uri uri, String name, int fallback) {
        try {
            String value = query(uri, name);
            return value.isEmpty() ? fallback : Integer.parseInt(value);
        } catch (Exception ignored) {
            return fallback;
        }
    }

    private String safeName(String name) {
        return name == null ? "" : name.replace("/", "").replace("\\", "");
    }

    private String cleanText(String value) {
        if (value == null) return "";
        return value.replaceAll("<[^>]+>", "").replace("&nbsp;", " ").trim();
    }

    private String isoNow() {
        return new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US).format(new java.util.Date());
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
    }
}
