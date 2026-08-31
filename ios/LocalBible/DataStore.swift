import Foundation

final class DataStore {
    let root: URL
    let bibles: URL
    let orig: URL
    let dictionaries: URL
    let commentaries: URL
    let www: URL
    let userDb: URL

    init() {
        let fm = FileManager.default
        let support = fm.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("LocalBible", isDirectory: true)
        try? fm.createDirectory(at: support, withIntermediateDirectories: true)
        root = support
        bibles = support.appendingPathComponent("bibles", isDirectory: true)
        orig = support.appendingPathComponent("orig", isDirectory: true)
        dictionaries = support.appendingPathComponent("dictionaries", isDirectory: true)
        commentaries = support.appendingPathComponent("commentaries", isDirectory: true)
        www = Bundle.main.url(forResource: "www", withExtension: nil)
            ?? Bundle.main.bundleURL.appendingPathComponent("www")
        userDb = support.appendingPathComponent("user.sqlite")
        copyFolder("bibles", to: bibles)
        copyFolder("orig", to: orig)
        copyFolder("dictionaries", to: dictionaries)
        copyFolder("commentaries", to: commentaries)
        initUserDb()
    }

    func biblePath(_ version: String) -> String {
        bibles.appendingPathComponent(safe(version)).path
    }

    func origPath() -> String {
        orig.appendingPathComponent("cbol.db").path
    }

    func dictionaryPath(_ source: String) -> String {
        dictionaries.appendingPathComponent(safe(source)).path
    }

    func commentaryPath(_ source: String) -> String {
        commentaries.appendingPathComponent(safe(source)).path
    }

    func dbFiles(in directory: URL) -> [URL] {
        (try? FileManager.default.contentsOfDirectory(at: directory, includingPropertiesForKeys: nil))
            ?.filter { $0.pathExtension.lowercased() == "db" }
            .sorted { $0.lastPathComponent.localizedStandardCompare($1.lastPathComponent) == .orderedAscending }
            ?? []
    }

    private func copyFolder(_ name: String, to dest: URL) {
        let fm = FileManager.default
        try? fm.createDirectory(at: dest, withIntermediateDirectories: true)
        guard let src = Bundle.main.url(forResource: name, withExtension: nil) else { return }
        let files = (try? fm.contentsOfDirectory(atPath: src.path)) ?? []
        for file in files where !file.hasPrefix(".") {
            let target = dest.appendingPathComponent(file)
            if fm.fileExists(atPath: target.path) { continue }
            try? fm.copyItem(at: src.appendingPathComponent(file), to: target)
        }
    }

    private func safe(_ name: String) -> String {
        name.replacingOccurrences(of: "/", with: "").replacingOccurrences(of: "\\", with: "")
    }

    private func initUserDb() {
        guard let db = try? Sqlite(path: userDb.path, readonly: false) else { return }
        db.execute("""
            create table if not exists verse_marks (
              version text not null,
              book integer not null,
              chapter integer not null,
              verse integer not null,
              favorite integer not null default 0,
              highlighted integer not null default 0,
              note text not null default '',
              tags text not null default '',
              highlight_color text not null default '',
              updated_at text not null,
              primary key (version, book, chapter, verse)
            )
            """)
        db.execute("""
            create table if not exists reading_history (
              id integer primary key check (id = 1),
              version text not null,
              book integer not null,
              chapter integer not null,
              updated_at text not null
            )
            """)
        db.execute("""
            create table if not exists reading_progress (
              version text not null,
              book integer not null,
              chapter integer not null,
              read_at text not null,
              primary key (version, book, chapter)
            )
            """)
    }
}
