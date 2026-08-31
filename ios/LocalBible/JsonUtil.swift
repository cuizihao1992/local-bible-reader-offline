import Foundation

enum JsonUtil {
    static let appVersion = "1.35.0"

    static func data(_ object: Any) -> Data {
        (try? JSONSerialization.data(withJSONObject: object, options: [])) ?? Data("{}".utf8)
    }

    static func string(_ object: Any) -> String {
        String(data: data(object), encoding: .utf8) ?? "{}"
    }

    static func error(_ message: String) -> Data {
        data(["error": message])
    }

    static func parse(_ text: String?) -> [String: Any] {
        guard let text, let raw = text.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: raw) as? [String: Any]
        else { return [:] }
        return obj
    }

    static func cleanText(_ value: String?) -> String {
        guard var text = value else { return "" }
        text = text.replacingOccurrences(of: "<br\\s*/?>", with: "\n", options: .regularExpression)
        text = text.replacingOccurrences(of: "</p>", with: "\n", options: .caseInsensitive)
        text = text.replacingOccurrences(of: "<[^>]+>", with: "", options: .regularExpression)
        text = text.replacingOccurrences(of: "&nbsp;", with: " ")
        text = text.replacingOccurrences(of: "&quot;", with: "\"")
        text = text.replacingOccurrences(of: "&amp;", with: "&")
        return text.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    static func looksEncrypted(_ value: String?) -> Bool {
        let text = (value ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        if text.count < 24 { return false }
        if text.range(of: "[\\u4e00-\\u9fff]", options: .regularExpression) != nil { return false }
        if text.contains("<p") || text.contains("<div") || text.contains("<br") { return false }
        let compact = text.replacingOccurrences(of: "\\s+", with: "", options: .regularExpression)
        if compact.count < 24 || compact.count % 4 != 0 { return false }
        let allowed = CharacterSet(charactersIn: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=")
        return compact.unicodeScalars.allSatisfy { allowed.contains($0) }
    }

    static func query(_ url: URL, _ name: String) -> String {
        URLComponents(url: url, resolvingAgainstBaseURL: false)?
            .queryItems?
            .first(where: { $0.name == name })?
            .value ?? ""
    }

    static func queryAll(_ url: URL, _ name: String) -> [String] {
        URLComponents(url: url, resolvingAgainstBaseURL: false)?
            .queryItems?
            .filter { $0.name == name }
            .compactMap { $0.value } ?? []
    }

    static func intQuery(_ url: URL, _ name: String, _ fallback: Int) -> Int {
        Int(query(url, name)) ?? fallback
    }

    static func isoNow() -> String {
        ISO8601DateFormatter().string(from: Date())
    }
}
