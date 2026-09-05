import UIKit
import WebKit

final class WebViewController: UIViewController, WKScriptMessageHandler {
    private var webView: WKWebView!
    private var store: DataStore!
    private var api: OfflineApi!
    private var tts: TtsController!
    private var voice: VoiceController!
    private var packageInstaller: PackageInstaller!

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.98, green: 0.95, blue: 0.90, alpha: 1)
        store = DataStore()
        api = OfflineApi(store: store)

        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        config.setURLSchemeHandler(SchemeHandler(api: api, www: store.www), forURLScheme: "bible")
        config.userContentController.addUserScript(
            WKUserScript(source: NativeJS.bridge, injectionTime: .atDocumentStart, forMainFrameOnly: false)
        )
        config.userContentController.add(self, name: "tts")
        config.userContentController.add(self, name: "share")
        config.userContentController.add(self, name: "voice")
        config.userContentController.add(self, name: "native")
        config.defaultWebpagePreferences.allowsContentJavaScript = true

        webView = WKWebView(frame: view.bounds, configuration: config)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.scrollView.bounces = false
        webView.allowsBackForwardNavigationGestures = false
        if #available(iOS 16.4, *) { webView.isInspectable = true }
        view.addSubview(webView)

        tts = TtsController(webView: webView)
        voice = VoiceController(webView: webView)
        packageInstaller = PackageInstaller(store: store, webView: webView)
        api.packages = packageInstaller
        let index = store.www.appendingPathComponent("index.html")
        if !FileManager.default.fileExists(atPath: index.path) {
            let label = UILabel(frame: view.bounds)
            label.numberOfLines = 0
            label.textAlignment = .center
            label.text = "还没有网页资源。\n请在仓库根目录运行 scripts/sync-ios-assets.sh"
            view.addSubview(label)
            return
        }
        webView.load(URLRequest(url: URL(string: "bible://app/index.html")!))
    }

    override var preferredStatusBarStyle: UIStatusBarStyle {
        overrideUserInterfaceStyle == .dark ? .lightContent : .darkContent
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        let body = message.body as? [String: Any] ?? [:]
        switch message.name {
        case "tts":
            tts.handle(body)
        case "share":
            ShareController.handle(body, from: self)
        case "voice":
            voice.handle(body)
        case "native":
            if body["op"] as? String == "night" {
                overrideUserInterfaceStyle = (body["value"] as? Bool) == true ? .dark : .light
                setNeedsStatusBarAppearanceUpdate()
            } else if body["op"] as? String == "keepScreen" {
                UIApplication.shared.isIdleTimerDisabled = (body["value"] as? Bool) == true
            } else if body["op"] as? String == "installPackage" {
                packageInstaller.install(id: body["id"] as? String ?? "", url: body["url"] as? String ?? "")
            } else if body["op"] as? String == "clearDownloadCache" {
                _ = packageInstaller.clearCache()
            }
        default:
            break
        }
    }
}
