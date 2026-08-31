import Foundation
import UniformTypeIdentifiers
import WebKit

final class SchemeHandler: NSObject, WKURLSchemeHandler {
    let api: OfflineApi
    let www: URL

    init(api: OfflineApi, www: URL) {
        self.api = api
        self.www = www
    }

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url else {
            urlSchemeTask.didFailWithError(URLError(.badURL))
            return
        }
        let path = url.path.isEmpty ? "/index.html" : url.path
        if path.hasPrefix("/api/") {
            let method = urlSchemeTask.request.httpMethod ?? "GET"
            var body: String?
            if let data = urlSchemeTask.request.httpBody {
                body = String(data: data, encoding: .utf8)
            }
            let (data, mime) = api.handle(method: method, url: url, body: body)
            finish(urlSchemeTask, data: data, mime: mime, url: url)
            return
        }
        var filePath = path
        if filePath.hasPrefix("/") { filePath.removeFirst() }
        if filePath.isEmpty { filePath = "index.html" }
        let file = www.appendingPathComponent(filePath)
        guard FileManager.default.fileExists(atPath: file.path),
              let data = try? Data(contentsOf: file)
        else {
            urlSchemeTask.didFailWithError(URLError(.fileDoesNotExist))
            return
        }
        finish(urlSchemeTask, data: data, mime: mime(for: filePath), url: url)
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}

    private func finish(_ task: WKURLSchemeTask, data: Data, mime: String, url: URL) {
        let response = URLResponse(url: url, mimeType: mime, expectedContentLength: data.count, textEncodingName: "utf-8")
        task.didReceive(response)
        task.didReceive(data)
        task.didFinish()
    }

    private func mime(for path: String) -> String {
        switch URL(fileURLWithPath: path).pathExtension.lowercased() {
        case "html": return "text/html"
        case "css": return "text/css"
        case "js": return "text/javascript"
        case "json": return "application/json"
        case "png": return "image/png"
        case "jpg", "jpeg": return "image/jpeg"
        case "svg": return "image/svg+xml"
        case "woff", "woff2": return "font/woff"
        default: return "application/octet-stream"
        }
    }
}
