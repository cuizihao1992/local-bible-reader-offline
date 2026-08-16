package local.bible.reader;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.net.Uri;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class OfflineApi {
    private final Context context;
    private final File bibleDir;
    private final SQLiteDatabase userDb;

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
            if ("/api/commentaries".equals(path)) return new JSONObject().put("commentaries", new JSONArray()).toString();
            if ("/api/commentary".equals(path)) return new JSONObject().put("source", "").put("title", "").put("readable", true).put("entries", new JSONArray()).toString();
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

    private JSONObject search(Uri uri) throws Exception {
        String version = query(uri, "version");
        String q = query(uri, "q");
        int limit = Math.max(1, Math.min(intQuery(uri, "limit", 40), 80));
        int offset = Math.max(0, intQuery(uri, "offset", 0));
        int currentBook = intQuery(uri, "book", 0);
        String scope = query(uri, "scope");
        SQLiteDatabase db = openBible(version);
        JSONArray results = new JSONArray();
        boolean hasMore = false;
        String where = "Scripture like ?";
        List<String> args = new ArrayList<>();
        args.add("%" + q + "%");
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
                .put("scope", scope)
                .put("limit", limit)
                .put("offset", offset)
                .put("nextOffset", offset + results.length())
                .put("hasMore", hasMore)
                .put("results", results);
    }

    private JSONObject marks(Uri uri) throws Exception {
        JSONArray marks = new JSONArray();
        try (Cursor cursor = userDb.rawQuery("select version, book, chapter, verse, favorite, highlighted, note, tags, updated_at from verse_marks where version=? and book=? and chapter=? order by verse",
                new String[]{query(uri, "version"), query(uri, "book"), query(uri, "chapter")})) {
            while (cursor.moveToNext()) marks.put(markFromCursor(cursor));
        }
        return new JSONObject().put("marks", marks);
    }

    private JSONObject allMarks(Uri uri) throws Exception {
        JSONArray marks = new JSONArray();
        String kind = query(uri, "kind");
        String tag = query(uri, "tag");
        String sql = "select version, book, chapter, verse, favorite, highlighted, note, tags, updated_at from verse_marks";
        List<String> args = new ArrayList<>();
        List<String> where = new ArrayList<>();
        if ("favorite".equals(kind)) where.add("favorite = 1");
        if ("note".equals(kind)) where.add("(note <> '' or tags <> '')");
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
        values.put("updated_at", updatedAt);
        userDb.insertWithOnConflict("verse_marks", null, values, SQLiteDatabase.CONFLICT_REPLACE);
        return new JSONObject()
                .put("version", values.getAsString("version"))
                .put("book", values.getAsInteger("book"))
                .put("chapter", values.getAsInteger("chapter"))
                .put("verse", values.getAsInteger("verse"))
                .put("favorite", values.getAsInteger("favorite") == 1)
                .put("highlighted", values.getAsInteger("highlighted") == 1)
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
        try (Cursor cursor = userDb.rawQuery("select version, book, chapter, verse, favorite, highlighted, note, tags, updated_at from verse_marks order by updated_at desc", null)) {
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
                .put("version", "1.0.0")
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
                .put("highlighted", cursor.getInt(5) == 1)
                .put("note", cursor.getString(6))
                .put("tags", cursor.getString(7))
                .put("updatedAt", cursor.getString(8));
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
