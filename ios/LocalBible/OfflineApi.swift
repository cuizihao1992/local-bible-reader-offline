import Foundation

final class OfflineApi {
    let store: DataStore
    weak var packages: PackageInstaller?

    init(store: DataStore) {
        self.store = store
    }

    func handle(method: String, url: URL, body: String?) -> (Data, String) {
        let path = url.path
        if path == "/api/commentary/image" || path == "/api/dictionary/image" {
            if let bytes = moduleImage(url: url, path: path) {
                return (bytes, mimeForImage(JsonUtil.query(url, "name")))
            }
            return (Data(), "text/plain")
        }
        let json: Data
        do {
            if method.uppercased() == "POST" {
                json = try handlePost(path, body ?? "{}")
            } else {
                json = try handleGet(url, path)
            }
        } catch {
            json = JsonUtil.error(error.localizedDescription)
        }
        return (json, "application/json")
    }

    private func handleGet(_ url: URL, _ path: String) throws -> Data {
        switch path {
        case "/api/health":
            return JsonUtil.data([
                "ok": true,
                "app": "bible-reader",
                "platform": "ios-offline",
                "version": JsonUtil.appVersion,
                "versionCount": store.dbFiles(in: store.bibles).count,
                "commentaryCount": store.dbFiles(in: store.commentaries).count,
                "dictionaryCount": store.dbFiles(in: store.dictionaries).count,
            ])
        case "/api/versions":
            return JsonUtil.data(["versions": versions()])
        case "/api/books":
            return JsonUtil.data(["books": Books.json()])
        case "/api/chapter":
            return JsonUtil.data(try chapter(JsonUtil.query(url, "version"), JsonUtil.intQuery(url, "book", 1), JsonUtil.intQuery(url, "chapter", 1)))
        case "/api/chapters":
            let versions = JsonUtil.queryAll(url, "version")
            let book = JsonUtil.intQuery(url, "book", 1)
            let chapterNo = JsonUtil.intQuery(url, "chapter", 1)
            let chapters = try versions.map { try chapter($0, book, chapterNo) }
            return JsonUtil.data(["chapters": chapters])
        case "/api/search":
            return JsonUtil.data(try search(url))
        case "/api/user/marks":
            return JsonUtil.data(["marks": marks(url)])
        case "/api/user/marks/all":
            return JsonUtil.data(["marks": allMarks(url)])
        case "/api/user/progress":
            return JsonUtil.data(progress(JsonUtil.query(url, "version")))
        case "/api/user/history":
            return JsonUtil.data(["history": getHistory() as Any])
        case "/api/user/export":
            return try handlePost("/api/user/export", "{}")
        case "/api/packages":
            return JsonUtil.data(["packages": packages?.packages() ?? []])
        case "/api/commentaries":
            return JsonUtil.data(["commentaries": commentaries()])
        case "/api/commentary":
            return JsonUtil.data(try commentary(url))
        case "/api/dictionaries":
            return JsonUtil.data(["dictionaries": dictionaries()])
        case "/api/dictionary/search":
            return JsonUtil.data(try dictionarySearch(url))
        case "/api/audio":
            return JsonUtil.data(["audio": [] as [Any]])
        case "/api/diagnostics":
            return JsonUtil.data(diagnostics())
        case "/api/strong":
            return JsonUtil.data(try lookupStrong(JsonUtil.query(url, "code")))
        case "/api/verse-library":
            return JsonUtil.data(try verseLibrary(url))
        default:
            return JsonUtil.error("iOS 离线版暂未支持此接口：\(path)")
        }
    }

    private func handlePost(_ path: String, _ payload: String) throws -> Data {
        let body = JsonUtil.parse(payload)
        switch path {
        case "/api/user/mark":
            return JsonUtil.data(["mark": saveMark(body)])
        case "/api/user/history":
            return JsonUtil.data(["history": saveHistory(body)])
        case "/api/user/progress":
            return JsonUtil.data(saveProgress(body))
        case "/api/user/export":
            return JsonUtil.data(exportUser())
        case "/api/user/import":
            return JsonUtil.data(importUser(body))
        default:
            return JsonUtil.error("iOS 离线版暂未支持此 POST 接口：\(path)")
        }
    }

    private func versions() -> [[String: Any]] {
        store.dbFiles(in: store.bibles).map { file in
            let name = file.lastPathComponent
            return [
                "id": name,
                "name": name.replacingOccurrences(of: ".db", with: ""),
                "shortName": name.replacingOccurrences(of: ".db", with: ""),
                "fileName": name,
                "sizeMb": (Double(fileSize(file)) / 1024 / 1024 * 100).rounded() / 100,
                "titleCount": countTitles(file.path),
            ]
        }
    }

    private func chapter(_ version: String, _ book: Int, _ chapter: Int) throws -> [String: Any] {
        let db = try Sqlite(path: store.biblePath(version), readonly: true)
        let verseRows = db.query(
            "select Verse, Scripture from Bible where Book=? and Chapter=? order by Verse",
            args: [book, chapter]
        )
        let verses: [[String: Any]] = verseRows.map { row in
            let scripture = row["Scripture"] as? String ?? ""
            return [
                "verse": row["Verse"] as? Int ?? 0,
                "text": JsonUtil.cleanText(scripture),
                "strongs": extractStrongs(scripture),
            ]
        }
        var titles: [[String: Any]] = []
        var titleSource = "none"
        var titleSourceVersion = ""
        var titleSourceName = ""
        if db.hasTable("Titles") {
            titles = db.query(
                "select Verse, Scripture from Titles where Book=? and Chapter=? order by Verse",
                args: [book, chapter]
            ).compactMap { row in
                let text = JsonUtil.cleanText(row["Scripture"] as? String)
                guard !text.isEmpty else { return nil }
                return ["verse": row["Verse"] as? Int ?? 0, "text": text]
            }
        }
        if !titles.isEmpty {
            titleSource = "db"
            titleSourceVersion = version
            titleSourceName = version.replacingOccurrences(of: ".db", with: "")
        } else {
            let fallback = fallbackTitles(except: version, book: book, chapter: chapter)
            titles = fallback.titles
            titleSource = fallback.source
            titleSourceVersion = fallback.version
            titleSourceName = fallback.name
        }
        return [
            "version": version,
            "versionName": version.replacingOccurrences(of: ".db", with: ""),
            "shortName": version.replacingOccurrences(of: ".db", with: ""),
            "book": book,
            "bookName": Books.name(book),
            "chapter": chapter,
            "titles": titles,
            "titleSource": titleSource,
            "titleSourceVersion": titleSourceVersion,
            "titleSourceName": titleSourceName,
            "verses": verses,
        ]
    }

    private func fallbackTitles(except version: String, book: Int, chapter: Int) -> (titles: [[String: Any]], source: String, version: String, name: String) {
        for file in store.dbFiles(in: store.bibles) where file.lastPathComponent != version {
            guard let db = try? Sqlite(path: file.path, readonly: true), db.hasTable("Titles") else { continue }
            let titles = db.query(
                "select Verse, Scripture from Titles where Book=? and Chapter=? order by Verse",
                args: [book, chapter]
            ).compactMap { row -> [String: Any]? in
                let text = JsonUtil.cleanText(row["Scripture"] as? String)
                guard !text.isEmpty else { return nil }
                return ["verse": row["Verse"] as? Int ?? 0, "text": text]
            }
            if !titles.isEmpty {
                let name = file.lastPathComponent
                return (titles, "reference", name, name.replacingOccurrences(of: ".db", with: ""))
            }
        }
        return ([], "none", "", "")
    }

    private func search(_ url: URL) throws -> [String: Any] {
        let version = JsonUtil.query(url, "version")
        let q = JsonUtil.query(url, "q")
        let limit = min(max(JsonUtil.intQuery(url, "limit", 40), 1), 80)
        let offset = max(JsonUtil.intQuery(url, "offset", 0), 0)
        let currentBook = JsonUtil.intQuery(url, "book", 0)
        let scope = JsonUtil.query(url, "scope")
        let fuzzy = JsonUtil.query(url, "fuzzy") == "1" || JsonUtil.query(url, "fuzzy").lowercased() == "true"
        let db = try Sqlite(path: store.biblePath(version), readonly: true)
        var whereSql = "Scripture like ? escape '\\'"
        var args: [Any] = [likePattern(q, fuzzy)]
        if scope == "ot" { whereSql += " and Book <= 39" }
        if scope == "nt" { whereSql += " and Book >= 40" }
        if scope == "book" && currentBook > 0 {
            whereSql += " and Book = ?"
            args.append(currentBook)
        }
        args.append(contentsOf: [currentBook, limit + 1, offset])
        let rows = db.query(
            "select Book, Chapter, Verse, Scripture from Bible where \(whereSql) order by case when Book = ? then 0 else 1 end, Book, Chapter, Verse limit ? offset ?",
            args: args
        )
        var results: [[String: Any]] = []
        var hasMore = false
        for row in rows {
            if results.count >= limit {
                hasMore = true
                break
            }
            let book = row["Book"] as? Int ?? 0
            results.append([
                "book": book,
                "bookName": Books.name(book),
                "chapter": row["Chapter"] as? Int ?? 0,
                "verse": row["Verse"] as? Int ?? 0,
                "text": JsonUtil.cleanText(row["Scripture"] as? String),
            ])
        }
        return [
            "query": q,
            "fuzzy": fuzzy,
            "scope": scope,
            "limit": limit,
            "offset": offset,
            "nextOffset": offset + results.count,
            "hasMore": hasMore,
            "results": results,
        ]
    }

    private func likePattern(_ keyword: String, _ fuzzy: Bool) -> String {
        let cleaned = keyword.replacingOccurrences(of: "\\s+", with: "", options: .regularExpression)
        let source = cleaned.isEmpty ? keyword : cleaned
        let escaped = source
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "%", with: "\\%")
            .replacingOccurrences(of: "_", with: "\\_")
        if !fuzzy || cleaned.count < 2 { return "%\(escaped)%" }
        return "%" + cleaned.map { ch -> String in
            var piece = String(ch)
            if piece == "\\" || piece == "%" || piece == "_" { piece = "\\" + piece }
            return piece + "%"
        }.joined()
    }

    private func marks(_ url: URL) -> [[String: Any]] {
        guard let db = try? Sqlite(path: store.userDb.path, readonly: true) else { return [] }
        return db.query(
            "select version, book, chapter, verse, favorite, highlighted, note, tags, updated_at, highlight_color from verse_marks where version=? and book=? and chapter=? order by verse",
            args: [JsonUtil.query(url, "version"), JsonUtil.intQuery(url, "book", 1), JsonUtil.intQuery(url, "chapter", 1)]
        ).map(markFromRow)
    }

    private func allMarks(_ url: URL) -> [[String: Any]] {
        guard let db = try? Sqlite(path: store.userDb.path, readonly: true) else { return [] }
        let kind = JsonUtil.query(url, "kind")
        let tag = JsonUtil.query(url, "tag")
        var whereSql: [String] = []
        var args: [Any] = []
        if kind == "favorite" { whereSql.append("favorite = 1") }
        else if kind == "note" { whereSql.append("(note <> '' or tags <> '')") }
        else if kind == "highlight" || kind == "highlighted" {
            whereSql.append("(highlighted = 1 or ifnull(highlight_color, '') <> '')")
        } else {
            whereSql.append("(favorite = 1 or highlighted = 1 or ifnull(highlight_color, '') <> '' or note <> '' or tags <> '')")
        }
        if !tag.isEmpty {
            whereSql.append("(tags like ? or note like ?)")
            args.append("%\(tag)%")
            args.append("%\(tag)%")
        }
        args.append(200)
        let sql = "select version, book, chapter, verse, favorite, highlighted, note, tags, updated_at, highlight_color from verse_marks where \(whereSql.joined(separator: " and ")) order by updated_at desc limit ?"
        return db.query(sql, args: args).map(markFromRow)
    }

    private func markFromRow(_ row: [String: Any]) -> [String: Any] {
        let color = row["highlight_color"] as? String ?? ""
        let highlighted = (row["highlighted"] as? Int ?? 0) == 1 || !color.isEmpty
        let book = row["book"] as? Int ?? 0
        return [
            "version": row["version"] as? String ?? "",
            "book": book,
            "bookName": Books.name(book),
            "chapter": row["chapter"] as? Int ?? 0,
            "verse": row["verse"] as? Int ?? 0,
            "favorite": (row["favorite"] as? Int ?? 0) == 1,
            "highlighted": highlighted,
            "note": row["note"] as? String ?? "",
            "tags": row["tags"] as? String ?? "",
            "updatedAt": row["updated_at"] as? String ?? "",
            "highlightColor": color,
        ]
    }

    private func saveMark(_ body: [String: Any]) -> [String: Any] {
        let version = body["version"] as? String ?? ""
        let book = intVal(body["book"])
        let chapter = intVal(body["chapter"])
        let verse = intVal(body["verse"])
        let color = String(body["highlightColor"] as? String ?? body["highlight_color"] as? String ?? "").prefix(20)
        let favorite = boolVal(body["favorite"])
        let highlighted = boolVal(body["highlighted"]) || !color.isEmpty
        let note = String((body["note"] as? String ?? "").prefix(4000))
        let tags = String((body["tags"] as? String ?? "").prefix(500))
        let updated = JsonUtil.isoNow()
        if let db = try? Sqlite(path: store.userDb.path, readonly: false) {
            db.execute(
                """
                insert into verse_marks (version, book, chapter, verse, favorite, highlighted, note, tags, highlight_color, updated_at)
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                on conflict(version, book, chapter, verse)
                do update set favorite=excluded.favorite, highlighted=excluded.highlighted,
                  note=excluded.note, tags=excluded.tags, highlight_color=excluded.highlight_color, updated_at=excluded.updated_at
                """,
                args: [version, book, chapter, verse, favorite, highlighted, note, tags, String(color), updated]
            )
        }
        return [
            "version": version, "book": book, "chapter": chapter, "verse": verse,
            "favorite": favorite, "highlighted": highlighted, "highlightColor": String(color),
            "note": note, "tags": tags, "updatedAt": updated,
        ]
    }

    private func saveHistory(_ body: [String: Any]) -> [String: Any] {
        let version = body["version"] as? String ?? ""
        let book = intVal(body["book"])
        let chapter = intVal(body["chapter"])
        let updated = JsonUtil.isoNow()
        if let db = try? Sqlite(path: store.userDb.path, readonly: false) {
            db.execute(
                "insert into reading_history (id, version, book, chapter, updated_at) values (1, ?, ?, ?, ?) on conflict(id) do update set version=excluded.version, book=excluded.book, chapter=excluded.chapter, updated_at=excluded.updated_at",
                args: [version, book, chapter, updated]
            )
        }
        return ["version": version, "book": book, "chapter": chapter, "updatedAt": updated]
    }

    private func getHistory() -> [String: Any]? {
        guard let db = try? Sqlite(path: store.userDb.path, readonly: true) else { return nil }
        guard let row = db.query("select version, book, chapter, updated_at from reading_history where id=1").first else { return nil }
        return [
            "version": row["version"] as? String ?? "",
            "book": row["book"] as? Int ?? 1,
            "chapter": row["chapter"] as? Int ?? 1,
            "updatedAt": row["updated_at"] as? String ?? "",
        ]
    }

    private func progress(_ version: String) -> [String: Any] {
        let total = Books.totalChapters
        guard let db = try? Sqlite(path: store.userDb.path, readonly: true) else {
            return ["version": version, "read": 0, "total": total, "percent": 0, "chapters": [] as [Any]]
        }
        let rows = db.query("select book, chapter, read_at from reading_progress where version=?", args: [version])
        let read = rows.count
        let percent = total > 0 ? Int((Double(read) / Double(total) * 100).rounded()) : 0
        return [
            "version": version,
            "read": read,
            "total": total,
            "percent": percent,
            "chapters": rows.map { ["book": $0["book"] as? Int ?? 0, "chapter": $0["chapter"] as? Int ?? 0, "readAt": $0["read_at"] as? String ?? ""] },
        ]
    }

    private func saveProgress(_ body: [String: Any]) -> [String: Any] {
        let version = body["version"] as? String ?? ""
        let book = intVal(body["book"])
        let chapter = intVal(body["chapter"])
        let read = boolVal(body["read"])
        if let db = try? Sqlite(path: store.userDb.path, readonly: false) {
            if read {
                db.execute(
                    "insert into reading_progress (version, book, chapter, read_at) values (?, ?, ?, ?) on conflict(version, book, chapter) do update set read_at=excluded.read_at",
                    args: [version, book, chapter, JsonUtil.isoNow()]
                )
            } else {
                db.execute("delete from reading_progress where version=? and book=? and chapter=?", args: [version, book, chapter])
            }
        }
        return progress(version)
    }

    private func exportUser() -> [String: Any] {
        guard let db = try? Sqlite(path: store.userDb.path, readonly: true) else {
            return ["marks": [] as [Any], "progress": [] as [Any], "history": NSNull()]
        }
        return [
            "marks": db.query("select * from verse_marks order by updated_at desc").map(markFromRow),
            "progress": db.query("select version, book, chapter, read_at from reading_progress"),
            "history": getHistory() as Any,
        ]
    }

    private func importUser(_ body: [String: Any]) -> [String: Any] {
        var imported = 0
        if let marks = body["marks"] as? [[String: Any]] {
            for mark in marks {
                _ = saveMark(mark)
                imported += 1
            }
        }
        return ["imported": imported, "progressImported": 0]
    }

    private func commentaries() -> [[String: Any]] {
        store.dbFiles(in: store.commentaries).map { file in
            let name = file.lastPathComponent
            return ["id": name, "title": name.replacingOccurrences(of: ".db", with: ""), "fileName": name, "count": 0, "readable": true]
        }
    }

    private func commentary(_ url: URL) throws -> [String: Any] {
        let source = JsonUtil.query(url, "source")
        let book = JsonUtil.intQuery(url, "book", 1)
        let chapterNo = JsonUtil.intQuery(url, "chapter", 1)
        let db = try Sqlite(path: store.commentaryPath(source), readonly: true)
        guard db.hasTable("commentary") else {
            throw NSError(domain: "api", code: 400, userInfo: [NSLocalizedDescriptionKey: "这个数据库没有 commentary 表"])
        }
        let hasImages = db.hasColumn("commentary", "Images")
        let sql = hasImages
            ? "select Book, Chapter, FromVerse, ToVerse, Data, Images from commentary where Book = ? and (Chapter = ? or Chapter = 0) order by Chapter, FromVerse, ToVerse"
            : "select Book, Chapter, FromVerse, ToVerse, Data from commentary where Book = ? and (Chapter = ? or Chapter = 0) order by Chapter, FromVerse, ToVerse"
        let entries = db.query(sql, args: [book, chapterNo]).map { row -> [String: Any] in
            let decoded = decodeModule(row["Data"] as? String)
            var names = decoded.images
            if hasImages { names.append(contentsOf: parseImageNames(row["Images"] as? String)) }
            let unique = Array(Set(names))
            return [
                "book": row["Book"] as? Int ?? 0,
                "chapter": row["Chapter"] as? Int ?? 0,
                "fromVerse": row["FromVerse"] as? Int ?? 0,
                "toVerse": row["ToVerse"] as? Int ?? 0,
                "text": decoded.text,
                "encrypted": decoded.encrypted,
                "images": unique.map { ["name": $0, "url": "/api/commentary/image?source=\(encode($0, source: source))"] as [String: Any] },
                "hasImages": !unique.isEmpty,
            ]
        }
        return [
            "source": source,
            "title": source.replacingOccurrences(of: ".db", with: ""),
            "readable": entries.contains { !(($0["text"] as? String) ?? "").isEmpty } || !entries.contains { $0["encrypted"] as? Bool == true },
            "encrypted": entries.contains { $0["encrypted"] as? Bool == true },
            "book": book,
            "chapter": chapterNo,
            "entries": entries,
        ]
    }

    private func dictionaries() -> [[String: Any]] {
        store.dbFiles(in: store.dictionaries).map { file in
            let name = file.lastPathComponent
            var count = 0
            var readable = true
            if let db = try? Sqlite(path: file.path, readonly: true), db.hasTable("Dictionary") {
                count = db.query("select count(*) as c from Dictionary").first?["c"] as? Int ?? 0
                if let sample = db.query("select Description from Dictionary where Description is not null and Description <> '' limit 1").first {
                    readable = !JsonUtil.looksEncrypted(sample["Description"] as? String)
                }
            }
            return ["id": name, "title": name.replacingOccurrences(of: ".db", with: ""), "fileName": name, "count": count, "readable": readable]
        }
    }

    private func dictionarySearch(_ url: URL) throws -> [String: Any] {
        let source = JsonUtil.query(url, "source")
        let keyword = JsonUtil.query(url, "q").trimmingCharacters(in: .whitespacesAndNewlines)
        if keyword.isEmpty { throw NSError(domain: "api", code: 400, userInfo: [NSLocalizedDescriptionKey: "请输入词条关键词"]) }
        let db = try Sqlite(path: store.dictionaryPath(source), readonly: true)
        let hasImages = db.hasColumn("Dictionary", "Images")
        let sql = hasImages
            ? "select id, Word, Description, ComeFrom, Images from Dictionary where Word like ? order by length(Word), Word limit 30"
            : "select id, Word, Description, ComeFrom from Dictionary where Word like ? order by length(Word), Word limit 30"
        let results = db.query(sql, args: ["%\(keyword)%"]).map { row -> [String: Any] in
            let decoded = decodeModule(row["Description"] as? String)
            var names = decoded.images
            if hasImages { names.append(contentsOf: parseImageNames(row["Images"] as? String)) }
            let unique = Array(Set(names))
            return [
                "id": row["id"] as? Int ?? 0,
                "word": row["Word"] as? String ?? "",
                "comeFrom": row["ComeFrom"] as? String ?? "",
                "text": decoded.text,
                "encrypted": decoded.encrypted,
                "images": unique.map { ["name": $0, "url": "/api/dictionary/image?source=\(encode($0, source: source))"] as [String: Any] },
            ]
        }
        return ["source": source, "title": source.replacingOccurrences(of: ".db", with: ""), "query": keyword, "results": results]
    }

    private func lookupStrong(_ code: String) throws -> [String: Any] {
        guard let match = code.trimmingCharacters(in: .whitespaces).uppercased()
            .range(of: "^(?:W)?([HG])0*(\\d{1,5})$", options: .regularExpression)
        else {
            throw NSError(domain: "api", code: 400, userInfo: [NSLocalizedDescriptionKey: "Strong 编号格式无效"])
        }
        let ns = code.trimmingCharacters(in: .whitespaces).uppercased() as NSString
        let regex = try NSRegularExpression(pattern: "^(?:W)?([HG])0*(\\d{1,5})$", options: .caseInsensitive)
        guard let result = regex.firstMatch(in: ns as String, range: NSRange(location: 0, length: ns.length)),
              result.numberOfRanges >= 3
        else {
            throw NSError(domain: "api", code: 400, userInfo: [NSLocalizedDescriptionKey: "Strong 编号格式无效"])
        }
        _ = match
        let type = ns.substring(with: result.range(at: 1)).uppercased()
        let rawNumber = ns.substring(with: result.range(at: 2))
        let number = String(format: "%05d", Int(rawNumber) ?? 0)
        let orig = store.origPath()
        guard FileManager.default.fileExists(atPath: orig) else {
            throw NSError(domain: "api", code: 404, userInfo: [NSLocalizedDescriptionKey: "找不到原文库 cbol.db"])
        }
        let table = type == "H" ? "hfhl" : "gfhl"
        let column = type == "H" ? "hsnum" : "gsnum"
        let db = try Sqlite(path: orig, readonly: true)
        guard let row = db.query("select \(column), txt, orig, orig_fhl from \(table) where \(column)=?", args: [number]).first else {
            throw NSError(domain: "api", code: 404, userInfo: [NSLocalizedDescriptionKey: "找不到 Strong 编号：\(type)\(Int(rawNumber) ?? 0)"])
        }
        return [
            "code": "\(type)\(Int(rawNumber) ?? 0)",
            "type": type,
            "number": number,
            "original": JsonUtil.cleanText(row["orig"] as? String),
            "transliteration": JsonUtil.cleanText(row["orig_fhl"] as? String),
            "definition": JsonUtil.cleanText(row["txt"] as? String),
            "occurrences": strongOccurrences(type, rawNumber),
        ]
    }

    private func strongOccurrences(_ type: String, _ number: String) -> [[String: Any]] {
        let padded = String(format: "%05d", Int(number) ?? 0)
        let kjv = store.bibles.appendingPathComponent("KJV.db")
        let target = FileManager.default.fileExists(atPath: kjv.path) ? kjv : store.dbFiles(in: store.bibles).first
        guard let target, let db = try? Sqlite(path: target.path, readonly: true) else { return [] }
        return db.query(
            "select Book, Chapter, Verse from Bible where Scripture like ? or Scripture like ? order by Book, Chapter, Verse limit 30",
            args: ["%<W\(type)\(number)>%", "%<W\(type)\(padded)>%"]
        ).map { row in
            let book = row["Book"] as? Int ?? 0
            return [
                "version": target.lastPathComponent.replacingOccurrences(of: ".db", with: ""),
                "book": book,
                "bookName": Books.name(book),
                "chapter": row["Chapter"] as? Int ?? 0,
                "verse": row["Verse"] as? Int ?? 0,
            ]
        }
    }

    private func verseLibrary(_ url: URL) throws -> [String: Any] {
        let catalogURL = store.www.appendingPathComponent("verse-library.json")
        let data = try Data(contentsOf: catalogURL)
        guard let catalog = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw NSError(domain: "api", code: 500, userInfo: [NSLocalizedDescriptionKey: "经文库文件无效"])
        }
        let version = JsonUtil.query(url, "version").isEmpty
            ? (store.dbFiles(in: store.bibles).first?.lastPathComponent ?? "和合本.db")
            : JsonUtil.query(url, "version")
        let themeId = JsonUtil.query(url, "theme")
        let q = JsonUtil.query(url, "q").lowercased()
        let themes = catalog["themes"] as? [[String: Any]] ?? []
        let themeNames = Dictionary(uniqueKeysWithValues: themes.compactMap { item -> (String, String)? in
            guard let id = item["id"] as? String else { return nil }
            return (id, item["name"] as? String ?? id)
        })
        var rawItems = catalog["items"] as? [[String: Any]] ?? []
        if !themeId.isEmpty {
            rawItems = rawItems.filter { (($0["themes"] as? [String]) ?? []).contains(themeId) }
        }
        let db = try Sqlite(path: store.biblePath(version), readonly: true)
        var items: [[String: Any]] = []
        for raw in rawItems {
            let book = intVal(raw["book"])
            let chapterNo = intVal(raw["chapter"])
            let verse = intVal(raw["verse"])
            var verseEnd = intVal(raw["verseEnd"])
            if verseEnd < verse { verseEnd = verse }
            let rows = db.query(
                "select Verse, Scripture from Bible where Book=? and Chapter=? and Verse>=? and Verse<=? order by Verse",
                args: [book, chapterNo, verse, verseEnd]
            )
            let text = rows.map { JsonUtil.cleanText($0["Scripture"] as? String) }.joined()
            let themeIds = raw["themes"] as? [String] ?? []
            let names = themeIds.map { themeNames[$0] ?? $0 }
            let bookName = Books.name(book)
            let ref = verseEnd > verse ? "\(bookName) \(chapterNo):\(verse)-\(verseEnd)" : "\(bookName) \(chapterNo):\(verse)"
            if !q.isEmpty {
                let hay = "\(ref) \(text) \(names.joined(separator: " "))".lowercased()
                if !hay.contains(q) { continue }
            }
            items.append([
                "id": raw["id"] as? String ?? "",
                "book": book,
                "bookName": bookName,
                "chapter": chapterNo,
                "verse": verse,
                "verseEnd": verseEnd,
                "ref": ref,
                "themes": themeIds,
                "themeNames": names,
                "text": text,
            ])
        }
        return [
            "ok": true,
            "id": catalog["id"] as? String ?? "",
            "name": catalog["name"] as? String ?? "经文库",
            "note": catalog["note"] as? String ?? "",
            "version": version,
            "versionName": version.replacingOccurrences(of: ".db", with: ""),
            "count": items.count,
            "total": (catalog["items"] as? [Any])?.count ?? items.count,
            "themes": themes,
            "items": items,
        ]
    }

    private func diagnostics() -> [String: Any] {
        let origOk = FileManager.default.fileExists(atPath: store.origPath())
        let checks: [[String: Any]] = [
            ["name": "离线经文库", "ok": !store.dbFiles(in: store.bibles).isEmpty, "detail": "\(store.dbFiles(in: store.bibles).count) 个译本"],
            ["name": "原文库", "ok": origOk, "detail": origOk ? "cbol.db" : "未安装，请运行 scripts/sync-ios-assets"],
            ["name": "辞典", "ok": !store.dbFiles(in: store.dictionaries).isEmpty, "detail": "\(store.dbFiles(in: store.dictionaries).count) 个"],
            ["name": "用户数据库", "ok": true, "detail": "App 私有目录"],
        ]
        return ["ok": checks.allSatisfy { $0["ok"] as? Bool == true }, "checks": checks]
    }

    private func moduleImage(url: URL, path: String) -> Data? {
        let source = JsonUtil.query(url, "source")
        let name = JsonUtil.query(url, "name")
        let file = path.contains("dictionary") ? store.dictionaryPath(source) : store.commentaryPath(source)
        guard let db = try? Sqlite(path: file, readonly: true) else { return nil }
        return db.blob("select Data from Images where FileName=?", args: [name])
    }

    private func extractStrongs(_ scripture: String) -> [[String: Any]] {
        let regex = try? NSRegularExpression(pattern: "<W([HG])0*(\\d{1,5})>", options: .caseInsensitive)
        let ns = scripture as NSString
        var seen = Set<String>()
        var out: [[String: Any]] = []
        regex?.enumerateMatches(in: scripture, range: NSRange(location: 0, length: ns.length)) { match, _, _ in
            guard let match, match.numberOfRanges >= 3 else { return }
            let type = ns.substring(with: match.range(at: 1)).uppercased()
            let raw = ns.substring(with: match.range(at: 2))
            let key = type + raw
            guard seen.insert(key).inserted else { return }
            out.append([
                "code": "\(type)\(Int(raw) ?? 0)",
                "type": type,
                "number": String(format: "%05d", Int(raw) ?? 0),
            ])
        }
        return out
    }

    private func decodeModule(_ value: String?) -> (text: String, encrypted: Bool, images: [String]) {
        let raw = value ?? ""
        let images = parseImageNames(raw)
        if raw.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return ("", false, images)
        }
        if JsonUtil.looksEncrypted(raw) { return ("", true, images) }
        return (JsonUtil.cleanText(raw), false, images)
    }

    private func parseImageNames(_ value: String?) -> [String] {
        guard let value, !value.isEmpty else { return [] }
        return value.split(whereSeparator: { ";,\n".contains($0) })
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { $0.range(of: "\\.(png|jpe?g|gif|webp|bmp)$", options: [.regularExpression, .caseInsensitive]) != nil }
    }

    private func countTitles(_ path: String) -> Int {
        guard let db = try? Sqlite(path: path, readonly: true), db.hasTable("Titles") else { return 0 }
        return db.query("select count(*) as c from Titles").first?["c"] as? Int ?? 0
    }

    private func fileSize(_ url: URL) -> Int {
        (try? FileManager.default.attributesOfItem(atPath: url.path)[.size] as? Int) ?? 0
    }

    private func encode(_ name: String, source: String) -> String {
        let src = source.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? source
        let file = name.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? name
        return "\(src)&name=\(file)"
    }

    private func mimeForImage(_ name: String) -> String {
        let lower = name.lowercased()
        if lower.hasSuffix(".jpg") || lower.hasSuffix(".jpeg") { return "image/jpeg" }
        if lower.hasSuffix(".gif") { return "image/gif" }
        if lower.hasSuffix(".webp") { return "image/webp" }
        return "image/png"
    }

    private func intVal(_ value: Any?) -> Int {
        if let n = value as? Int { return n }
        if let n = value as? Double { return Int(n) }
        if let n = value as? String { return Int(n) ?? 0 }
        return 0
    }

    private func boolVal(_ value: Any?) -> Bool {
        if let n = value as? Bool { return n }
        if let n = value as? Int { return n != 0 }
        if let n = value as? String { return n == "1" || n.lowercased() == "true" }
        return false
    }
}
