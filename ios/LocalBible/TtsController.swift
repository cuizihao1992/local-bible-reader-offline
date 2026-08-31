import AVFoundation
import Foundation
import MediaPlayer
import UIKit
import WebKit

final class TtsController: NSObject, AVSpeechSynthesizerDelegate {
    private let webView: WKWebView
    private let synth = AVSpeechSynthesizer()
    private var queue: [(id: String, text: String)] = []
    private var index = 0
    private var generation = 0
    private var cancelled = false
    private var rate: Float = 1
    private var title = "朗读"

    init(webView: WKWebView) {
        self.webView = webView
        super.init()
        synth.delegate = self
        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenAudio, options: [.duckOthers])
        try? AVAudioSession.sharedInstance().setActive(true)
        UIApplication.shared.beginReceivingRemoteControlEvents()
        MPRemoteCommandCenter.shared().pauseCommand.addTarget { [weak self] _ in
            self?.stop()
            return .success
        }
        MPRemoteCommandCenter.shared().stopCommand.addTarget { [weak self] _ in
            self?.stop()
            return .success
        }
        MPRemoteCommandCenter.shared().playCommand.isEnabled = false
    }

    func handle(_ body: [String: Any]) {
        switch body["op"] as? String {
        case "setRate":
            rate = Float(body["rate"] as? String ?? "1") ?? 1
        case "nowPlaying":
            title = body["title"] as? String ?? "朗读"
        case "speakQueue":
            speakQueue(body["json"] as? String ?? "[]")
        case "speak":
            speakText(body["text"] as? String ?? "")
        case "stop":
            stop()
        default:
            break
        }
    }

    private func speakQueue(_ json: String) {
        generation += 1
        cancelled = false
        guard let data = json.data(using: .utf8),
              let raw = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]]
        else {
            emit("error", "没有可朗读的经文")
            return
        }
        queue = raw.compactMap { item in
            let text = (item["text"] as? String ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            guard !text.isEmpty else { return nil }
            return (id: item["id"] as? String ?? "v", text: text)
        }
        index = 0
        speakNext()
    }

    private func speakText(_ text: String) {
        generation += 1
        cancelled = false
        queue = [(id: "part-0", text: text)]
        index = 0
        speakNext()
    }

    func stop() {
        generation += 1
        cancelled = true
        queue.removeAll()
        synth.stopSpeaking(at: .immediate)
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
        emit("stop", "")
    }

    private func speakNext() {
        if cancelled { return }
        if index >= queue.count {
            MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
            emit("done", "")
            return
        }
        let item = queue[index]
        MPNowPlayingInfoCenter.default().nowPlayingInfo = [
            MPMediaItemPropertyTitle: title,
            MPMediaItemPropertyArtist: "本地圣经",
            MPMediaItemPropertyAlbumTitle: item.text,
        ]
        emit("start", item.id)
        let utterance = AVSpeechUtterance(string: item.text)
        utterance.voice = AVSpeechSynthesisVoice(language: "zh-CN")
        utterance.rate = AVSpeechUtteranceDefaultSpeechRate * max(0.6, min(rate, 1.8))
        synth.speak(utterance)
    }

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        if cancelled { return }
        index += 1
        speakNext()
    }

    private func emit(_ type: String, _ text: String) {
        let script = "window.handleAndroidTts && window.handleAndroidTts(\(jsonString(type)),\(jsonString(text)),\(generation))"
        DispatchQueue.main.async { [weak self] in
            self?.webView.evaluateJavaScript(script, completionHandler: nil)
        }
    }

    private func jsonString(_ value: String) -> String {
        let data = try? JSONSerialization.data(withJSONObject: value, options: .fragmentsAllowed)
        return String(data: data ?? Data("\"\"".utf8), encoding: .utf8) ?? "\"\""
    }
}
