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
            if let data = requestBody(urlSchemeTask.request) {
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

    private func requestBody(_ request: URLRequest) -> Data? {
        if let data = request.httpBody, !data.isEmpty { return data }
        guard let stream = request.httpBodyStream else { return nil }
        stream.open()
        defer { stream.close() }
        let bufferSize = 4096
        let buffer = UnsafeMutablePointer<UInt8>.allocate(capacity: bufferSize)
        defer { buffer.deallocate() }
        var data = Data()
        while stream.hasBytesAvailable {
            let read = stream.read(buffer, maxLength: bufferSize)
            if read <= 0 { break }
            data.append(buffer, count: read)
        }
        return data.isEmpty ? nil : data
    }

    private func finish(_ task: WKURLSchemeTask, data: Data, mime: String, url: URL) {
        let contentType: String
        if mime.contains("charset") || (!mime.hasPrefix("text/") && mime != "application/json") {
            contentType = mime
        } else {
            contentType = "\(mime); charset=utf-8"
        }
        let headers = [
            "Content-Type": contentType,
            "Content-Length": "\(data.count)",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-cache",
        ]
        let response = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: headers)
            ?? URLResponse(url: url, mimeType: mime, expectedContentLength: data.count, textEncodingName: "utf-8")
        task.didReceive(response)
        if !data.isEmpty { task.didReceive(data) }
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
