import Foundation
import SQLite3

final class Sqlite {
    private var db: OpaquePointer?

    init(path: String, readonly: Bool) throws {
        var handle: OpaquePointer?
        let flags = readonly
            ? SQLITE_OPEN_READONLY | SQLITE_OPEN_FULLMUTEX
            : SQLITE_OPEN_CREATE | SQLITE_OPEN_READWRITE | SQLITE_OPEN_FULLMUTEX
        guard sqlite3_open_v2(path, &handle, flags, nil) == SQLITE_OK, let handle else {
            throw NSError(domain: "sqlite", code: 1, userInfo: [NSLocalizedDescriptionKey: "无法打开数据库"])
        }
        db = handle
    }

    deinit {
        if let db { sqlite3_close(db) }
    }

    func hasTable(_ name: String) -> Bool {
        let rows = query("select name from sqlite_master where type='table' and name=?", args: [name])
        return !rows.isEmpty
    }

    func hasColumn(_ table: String, _ column: String) -> Bool {
        query("pragma table_info(\(table))").contains { ($0["name"] as? String) == column }
    }

    @discardableResult
    func execute(_ sql: String, args: [Any] = []) -> Bool {
        var stmt: OpaquePointer?
        defer { sqlite3_finalize(stmt) }
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else { return false }
        bind(stmt, args)
        return sqlite3_step(stmt) == SQLITE_DONE
    }

    func query(_ sql: String, args: [Any] = []) -> [[String: Any]] {
        var stmt: OpaquePointer?
        defer { sqlite3_finalize(stmt) }
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else { return [] }
        bind(stmt, args)
        var rows: [[String: Any]] = []
        while sqlite3_step(stmt) == SQLITE_ROW {
            var row: [String: Any] = [:]
            let count = sqlite3_column_count(stmt)
            for i in 0..<count {
                let name = String(cString: sqlite3_column_name(stmt, i))
                switch sqlite3_column_type(stmt, i) {
                case SQLITE_INTEGER:
                    row[name] = Int(sqlite3_column_int64(stmt, i))
                case SQLITE_FLOAT:
                    row[name] = sqlite3_column_double(stmt, i)
                case SQLITE_NULL:
                    break
                default:
                    if let cstr = sqlite3_column_text(stmt, i) {
                        row[name] = String(cString: cstr)
                    }
                }
            }
            rows.append(row)
        }
        return rows
    }

    func blob(_ sql: String, args: [Any] = []) -> Data? {
        var stmt: OpaquePointer?
        defer { sqlite3_finalize(stmt) }
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else { return nil }
        bind(stmt, args)
        guard sqlite3_step(stmt) == SQLITE_ROW else { return nil }
        guard let bytes = sqlite3_column_blob(stmt, 0) else { return nil }
        let length = Int(sqlite3_column_bytes(stmt, 0))
        return Data(bytes: bytes, count: length)
    }

    private func bind(_ stmt: OpaquePointer?, _ args: [Any]) {
        for (index, arg) in args.enumerated() {
            let i = Int32(index + 1)
            if let value = arg as? Int {
                sqlite3_bind_int64(stmt, i, Int64(value))
            } else if let value = arg as? Int64 {
                sqlite3_bind_int64(stmt, i, value)
            } else if let value = arg as? Bool {
                sqlite3_bind_int(stmt, i, value ? 1 : 0)
            } else {
                let text = String(describing: arg)
                sqlite3_bind_text(stmt, i, (text as NSString).utf8String, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))
            }
        }
    }
}
