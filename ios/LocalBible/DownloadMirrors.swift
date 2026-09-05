import Foundation

enum DownloadMirrors {
    static let githubRelease = "https://github.com/cuizihao1992/local-bible-reader-offline/releases/download"
    static let extraBibles = "bibles-extra-v1.3.0.zip"
    static let commentaries = "commentaries-v1.3.0.zip"
    static let extraBiblesSize: Int64 = 152_367_407
    static let commentariesSize: Int64 = 123_662_016

    static let prefixes = [
        "https://ghfast.top/",
        "https://gh-proxy.com/",
        "https://ghproxy.net/",
    ]

    static func githubAsset(_ fileName: String, tag: String = "v1.3.0") -> String {
        "\(githubRelease)/\(tag)/\(fileName)"
    }

    static func candidates(_ url: String) -> [String] {
        var list: [String] = []
        func add(_ item: String) {
            if !item.isEmpty && !list.contains(item) { list.append(item) }
        }
        add(url)
        if isGithub(url) {
            for prefix in prefixes { add(prefix + url) }
        }
        return list
    }

    static func isGithub(_ url: String) -> Bool {
        url.hasPrefix("https://github.com/")
            || url.hasPrefix("https://api.github.com/")
            || url.contains("githubusercontent.com")
    }

    static func packageFileName(_ id: String) -> String? {
        switch id {
        case "extra-bibles": return extraBibles
        case "commentaries": return commentaries
        default: return nil
        }
    }

    static func expectedSize(_ id: String) -> Int64 {
        switch id {
        case "extra-bibles": return extraBiblesSize
        case "commentaries": return commentariesSize
        default: return 0
        }
    }
}
