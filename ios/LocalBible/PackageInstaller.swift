import Foundation
import WebKit

final class PackageInstaller: NSObject, URLSessionDownloadDelegate {
    private let store: DataStore
    private weak var webView: WKWebView?
    private let work = DispatchQueue(label: "local.bible.package")
    private lazy var session: URLSession = {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 60
        config.timeoutIntervalForResource = 1800
        config.waitsForConnectivity = true
        return URLSession(configuration: config, delegate: self, delegateQueue: nil)
    }()

    private var busy = false
    private var status: [String: Any] = [:]
    private var downloadSem: DispatchSemaphore?
    private var downloadFile: URL?
    private var downloadError: Error?
    private var currentId = ""
    private var currentExpected: Int64 = 0

    init(store: DataStore, webView: WKWebView) {
        self.store = store
        self.webView = webView
        super.init()
    }

    func packages() -> [[String: Any]] {
        [
            packageInfo(
                id: "extra-bibles",
                title: "更多译本",
                description: "下载补充经文译本",
                fileName: DownloadMirrors.extraBibles,
                count: store.dbFiles(in: store.bibles).count,
                fullCount: 26,
                installedAt: 8
            ),
            packageInfo(
                id: "commentaries",
                title: "基础注释库",
                description: "下载常用注释（不含超大图解库）",
                fileName: DownloadMirrors.commentaries,
                count: store.dbFiles(in: store.commentaries).count,
                fullCount: 14,
                installedAt: 3
            ),
        ]
    }

    func install(id: String, url: String) {
        work.async { [weak self] in
            guard let self else { return }
            if self.busy {
                self.setStatus(id, "error", 0, 0, "已有资源包正在下载")
                return
            }
            self.busy = true
            defer { self.busy = false }
            do {
                try self.installNow(id: id, url: url)
            } catch {
                self.setStatus(id, "error", 0, 0, error.localizedDescription)
            }
        }
    }

    func clearCache() -> Int64 {
        let dir = cacheDir()
        let bytes = folderSize(dir)
        try? FileManager.default.removeItem(at: dir)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        setStatus("cache", "cleared", 0, 0, "已清理下载缓存")
        return bytes
    }

    private func installNow(id: String, url: String) throws {
        guard let fileName = DownloadMirrors.packageFileName(id) else {
            throw NSError(domain: "package", code: 1, userInfo: [NSLocalizedDescriptionKey: "未知资源包：\(id)"])
        }
        let targetDir = id == "commentaries" ? store.commentaries : store.bibles
        try FileManager.default.createDirectory(at: targetDir, withIntermediateDirectories: true)
        let expected = DownloadMirrors.expectedSize(id)
        let zip = cacheDir().appendingPathComponent(fileName)
        if !isCompleteZip(zip, expected: expected) {
            let source = url.hasPrefix("https://") ? url : DownloadMirrors.githubAsset(fileName)
            try download(id: id, urls: DownloadMirrors.candidates(source), to: zip, expected: expected)
        } else {
            setStatus(id, "installing", expected, expected, "已有资源包，正在安装")
        }
        setStatus(id, "installing", expected, expected, "正在安装资源包")
        let installed = try ZipUtil.extractDbFiles(from: zip, to: targetDir)
        setStatus(id, "done", expected, expected, "资源包安装完成（\(installed) 个文件）")
    }

    private func download(id: String, urls: [String], to dest: URL, expected: Int64) throws {
        var lastError: Error = NSError(
            domain: "package",
            code: 2,
            userInfo: [NSLocalizedDescriptionKey: "下载失败"]
        )
        for (index, text) in urls.enumerated() {
            guard let url = URL(string: text) else { continue }
            setStatus(id, "downloading", 0, expected, "正在下载资源包（源 \(index + 1)/\(urls.count)）")
            do {
                try downloadOne(id: id, url: url, to: dest, expected: expected)
                return
            } catch {
                lastError = error
            }
        }
        throw NSError(
            domain: "package",
            code: 3,
            userInfo: [NSLocalizedDescriptionKey: lastError.localizedDescription + "。已尝试 GitHub 和国内加速，仍失败。"]
        )
    }

    private func downloadOne(id: String, url: URL, to dest: URL, expected: Int64) throws {
        try FileManager.default.createDirectory(at: dest.deletingLastPathComponent(), withIntermediateDirectories: true)
        if FileManager.default.fileExists(atPath: dest.path) {
            try? FileManager.default.removeItem(at: dest)
        }
        currentId = id
        currentExpected = expected
        downloadFile = nil
        downloadError = nil
        let sem = DispatchSemaphore(value: 0)
        downloadSem = sem
        var request = URLRequest(url: url)
        request.setValue("LocalBibleReader/\(JsonUtil.appVersion)", forHTTPHeaderField: "User-Agent")
        request.timeoutInterval = 1800
        session.downloadTask(with: request).resume()
        sem.wait()
        if let error = downloadError { throw error }
        guard let temp = downloadFile else {
            throw NSError(domain: "package", code: 4, userInfo: [NSLocalizedDescriptionKey: "下载没有保存到文件"])
        }
        if temp != dest {
            try? FileManager.default.removeItem(at: dest)
            try FileManager.default.moveItem(at: temp, to: dest)
        }
        if !isCompleteZip(dest, expected: expected) {
            throw NSError(domain: "package", code: 5, userInfo: [NSLocalizedDescriptionKey: "下载的资源包不完整"])
        }
    }

    func urlSession(
        _ session: URLSession,
        downloadTask: URLSessionDownloadTask,
        didWriteData bytesWritten: Int64,
        totalBytesWritten: Int64,
        totalBytesExpectedToWrite: Int64
    ) {
        let total = totalBytesExpectedToWrite > 0 ? totalBytesExpectedToWrite : currentExpected
        setStatus(currentId, "downloading", totalBytesWritten, total, "正在下载资源包")
    }

    func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didFinishDownloadingTo location: URL) {
        let dest = cacheDir().appendingPathComponent(UUID().uuidString + ".zip")
        try? FileManager.default.createDirectory(at: cacheDir(), withIntermediateDirectories: true)
        try? FileManager.default.copyItem(at: location, to: dest)
        downloadFile = dest
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        downloadError = error
        downloadSem?.signal()
        downloadSem = nil
    }

    private func packageInfo(
        id: String,
        title: String,
        description: String,
        fileName: String,
        count: Int,
        fullCount: Int,
        installedAt: Int
    ) -> [String: Any] {
        [
            "id": id,
            "title": title,
            "description": description,
            "fileName": fileName,
            "url": DownloadMirrors.githubAsset(fileName),
            "installedCount": count,
            "fullCount": fullCount,
            "installed": count >= installedAt,
        ]
    }

    private func isCompleteZip(_ url: URL, expected: Int64) -> Bool {
        guard let size = (try? FileManager.default.attributesOfItem(atPath: url.path)[.size] as? Int64),
              size > 10 * 1024 * 1024
        else { return false }
        guard let handle = try? FileHandle(forReadingFrom: url) else { return false }
        defer { try? handle.close() }
        let header = (try? handle.read(upToCount: 2)) ?? Data()
        if header.count < 2 || header[0] != 0x50 || header[1] != 0x4b { return false }
        if expected > 10 * 1024 * 1024 { return size >= expected - 2048 }
        return true
    }

    private func cacheDir() -> URL {
        let dir = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("downloads", isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }

    private func folderSize(_ dir: URL) -> Int64 {
        let files = (try? FileManager.default.contentsOfDirectory(at: dir, includingPropertiesForKeys: [.fileSizeKey])) ?? []
        return files.reduce(0) { sum, url in
            sum + ((try? url.resourceValues(forKeys: [.fileSizeKey]).fileSize).map { Int64($0) } ?? 0)
        }
    }

    private func setStatus(_ id: String, _ state: String, _ downloaded: Int64, _ total: Int64, _ message: String) {
        let percent = total > 0 ? Int(min(100, (downloaded * 100) / total)) : 0
        status = [
            "id": id,
            "state": state,
            "downloaded": downloaded,
            "total": total,
            "percent": percent,
            "message": message,
        ]
        let json = JsonUtil.string(status)
        DispatchQueue.main.async { [weak self] in
            self?.webView?.evaluateJavaScript("window.__iosPackageStatus = \(json);", completionHandler: nil)
        }
    }
}
