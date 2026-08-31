import AVFoundation
import Foundation
import WebKit

final class VoiceController: NSObject, AVAudioRecorderDelegate {
    private let webView: WKWebView
    private var recorder: AVAudioRecorder?
    private var fileURL: URL?
    private var cloudKey = ""
    private var cloudModel = "mimo-v2.5-asr"
    private var cloudBase = "https://api.xiaomimimo.com/v1/chat/completions"

    init(webView: WKWebView) {
        self.webView = webView
    }

    func handle(_ body: [String: Any]) {
        switch body["op"] as? String {
        case "start":
            start(body)
        case "stop":
            stopAndUpload()
        case "cancel":
            recorder?.stop()
            recorder = nil
        case "chat":
            chat(body)
        case "chatMessages":
            chatMessages(body)
        default:
            break
        }
    }

    private func start(_ body: [String: Any]) {
        AVAudioSession.sharedInstance().requestRecordPermission { [weak self] ok in
            DispatchQueue.main.async {
                guard let self else { return }
                guard ok else {
                    self.emit("error", "请允许麦克风权限后再按住一次")
                    return
                }
                self.cloudKey = body["key"] as? String ?? ""
                self.cloudModel = (body["model"] as? String).flatMap { $0.isEmpty ? nil : $0 } ?? "mimo-v2.5-asr"
                self.cloudBase = (body["url"] as? String).flatMap { $0.isEmpty ? nil : $0 } ?? self.cloudBase
                do {
                    try AVAudioSession.sharedInstance().setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker])
                    try AVAudioSession.sharedInstance().setActive(true)
                    let url = FileManager.default.temporaryDirectory.appendingPathComponent("mimo.wav")
                    self.fileURL = url
                    let settings: [String: Any] = [
                        AVFormatIDKey: Int(kAudioFormatLinearPCM),
                        AVSampleRateKey: 16000,
                        AVNumberOfChannelsKey: 1,
                        AVLinearPCMBitDepthKey: 16,
                        AVLinearPCMIsFloatKey: false,
                        AVLinearPCMIsBigEndianKey: false,
                    ]
                    self.recorder = try AVAudioRecorder(url: url, settings: settings)
                    self.recorder?.record()
                    self.emit("start", "")
                } catch {
                    self.emit("error", error.localizedDescription)
                }
            }
        }
    }

    private func stopAndUpload() {
        recorder?.stop()
        recorder = nil
        emit("end", "")
        guard let fileURL, let data = try? Data(contentsOf: fileURL) else { return }
        let key = cloudKey
        let model = cloudModel
        let base = cloudBase
        DispatchQueue.global().async { [weak self] in
            do {
                let text = try self?.requestAsr(key: key, model: model, base: base, wav: data) ?? ""
                self?.emit("result", text)
            } catch {
                self?.emit("error", error.localizedDescription)
            }
        }
    }

    private func chat(_ body: [String: Any]) {
        let key = body["key"] as? String ?? ""
        let model = body["model"] as? String ?? "mimo-v2.5"
        let url = body["url"] as? String ?? cloudBase
        let system = body["systemPrompt"] as? String ?? ""
        let user = body["userText"] as? String ?? ""
        DispatchQueue.global().async { [weak self] in
            do {
                let text = try self?.requestChat(key: key, model: model, base: url, messages: [
                    ["role": "system", "content": system],
                    ["role": "user", "content": user],
                ]) ?? ""
                self?.emit("intent", text)
            } catch {
                self?.emit("intentError", error.localizedDescription)
            }
        }
    }

    private func chatMessages(_ body: [String: Any]) {
        let key = body["key"] as? String ?? ""
        let model = body["model"] as? String ?? "mimo-v2.5"
        let url = body["url"] as? String ?? cloudBase
        let raw = body["messages"] as? String ?? "[]"
        let messages = (try? JSONSerialization.jsonObject(with: Data(raw.utf8))) as? [[String: Any]] ?? []
        DispatchQueue.global().async { [weak self] in
            do {
                let text = try self?.requestChat(key: key, model: model, base: url, messages: messages) ?? ""
                self?.emit("intent", text)
            } catch {
                self?.emit("intentError", error.localizedDescription)
            }
        }
    }

    private func requestAsr(key: String, model: String, base: String, wav: Data) throws -> String {
        let b64 = wav.base64EncodedString()
        let payload: [String: Any] = [
            "model": model,
            "messages": [[
                "role": "user",
                "content": [[
                    "type": "input_audio",
                    "input_audio": ["data": b64, "format": "wav"],
                ]],
            ]],
        ]
        return try postJSON(base: base, key: key, payload: payload)
    }

    private func requestChat(key: String, model: String, base: String, messages: [[String: Any]]) throws -> String {
        try postJSON(base: base, key: key, payload: ["model": model, "messages": messages])
    }

    private func postJSON(base: String, key: String, payload: [String: Any]) throws -> String {
        var urlString = base
        if !urlString.contains("/chat/completions") {
            urlString = urlString.trimmingCharacters(in: CharacterSet(charactersIn: "/")) + "/chat/completions"
        }
        guard let url = URL(string: urlString) else { throw URLError(.badURL) }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(key)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)
        let sem = DispatchSemaphore(value: 0)
        var resultData: Data?
        var resultError: Error?
        URLSession.shared.dataTask(with: request) { data, _, error in
            resultData = data
            resultError = error
            sem.signal()
        }.resume()
        sem.wait()
        if let resultError { throw resultError }
        guard let resultData,
              let obj = try JSONSerialization.jsonObject(with: resultData) as? [String: Any]
        else { throw URLError(.cannotParseResponse) }
        if let err = obj["error"] as? [String: Any], let message = err["message"] as? String, !message.isEmpty {
            throw NSError(domain: "mimo", code: 1, userInfo: [NSLocalizedDescriptionKey: message])
        }
        let choices = obj["choices"] as? [[String: Any]]
        let message = choices?.first?["message"] as? [String: Any]
        return message?["content"] as? String ?? ""
    }

    private func emit(_ type: String, _ text: String) {
        let payload = (try? JSONSerialization.data(withJSONObject: [type, text])) ?? Data()
        // build JS string args
        let t = jsonString(type)
        let s = jsonString(text)
        let script = "window.handleAndroidVoice && window.handleAndroidVoice(\(t),\(s))"
        DispatchQueue.main.async { [weak self] in
            self?.webView.evaluateJavaScript(script, completionHandler: nil)
        }
        _ = payload
    }

    private func jsonString(_ value: String) -> String {
        let data = try? JSONSerialization.data(withJSONObject: value, options: .fragmentsAllowed)
        return String(data: data ?? Data("\"\"".utf8), encoding: .utf8) ?? "\"\""
    }
}
