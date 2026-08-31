import UIKit

enum ShareController {
    static func handle(_ body: [String: Any], from vc: UIViewController) {
        if body["op"] as? String == "image" {
            shareImage(body["dataUrl"] as? String, text: body["text"] as? String, from: vc)
        } else {
            shareText(body["text"] as? String, from: vc)
        }
    }

    private static func shareText(_ text: String?, from vc: UIViewController) {
        let items: [Any] = [text ?? ""]
        present(items, from: vc)
    }

    private static func shareImage(_ dataUrl: String?, text: String?, from vc: UIViewController) {
        var items: [Any] = []
        if let dataUrl, let comma = dataUrl.firstIndex(of: ","),
           let data = Data(base64Encoded: String(dataUrl[dataUrl.index(after: comma)...])),
           let image = UIImage(data: data) {
            items.append(image)
        }
        if let text, !text.isEmpty { items.append(text) }
        present(items, from: vc)
    }

    private static func present(_ items: [Any], from vc: UIViewController) {
        let sheet = UIActivityViewController(activityItems: items, applicationActivities: nil)
        if let pop = sheet.popoverPresentationController {
            pop.sourceView = vc.view
            pop.sourceRect = CGRect(x: vc.view.bounds.midX, y: vc.view.bounds.midY, width: 1, height: 1)
        }
        vc.present(sheet, animated: true)
    }
}
