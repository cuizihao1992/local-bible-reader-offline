import Foundation

enum NativeJS {
    static let bridge = """
    (function () {
      function send(name, payload) {
        try {
          window.webkit.messageHandlers[name].postMessage(payload || {});
        } catch (e) {}
      }
      window.AndroidTtsApi = {
        getStatus: function () { return JSON.stringify({ ok: true, ready: true, speaking: false, engineLabel: '系统语音' }); },
        setRate: function (rate) { send('tts', { op: 'setRate', rate: String(rate) }); return '{"ok":true}'; },
        setNowPlaying: function (title, text) { send('tts', { op: 'nowPlaying', title: title, text: text }); return '{"ok":true}'; },
        speakQueue: function (json) { send('tts', { op: 'speakQueue', json: json }); return '{"ok":true}'; },
        speak: function (text) { send('tts', { op: 'speak', text: text }); return '{"ok":true}'; },
        stop: function () { send('tts', { op: 'stop' }); return '{"ok":true}'; }
      };
      window.AndroidShareApi = {
        shareText: function (text, fileName) { send('share', { op: 'text', text: text, fileName: fileName }); return '{"ok":true}'; },
        shareImage: function (dataUrl, text) { send('share', { op: 'image', dataUrl: dataUrl, text: text }); return '{"ok":true}'; }
      };
      window.AndroidVoiceApi = {
        startCloud: function (provider, key, model, url) { send('voice', { op: 'start', provider: provider, key: key, model: model, url: url }); return '{"ok":true}'; },
        stopCloud: function () { send('voice', { op: 'stop' }); return '{"ok":true}'; },
        cancel: function () { send('voice', { op: 'cancel' }); return '{"ok":true}'; },
        completeChat: function (key, model, url, systemPrompt, userText) {
          send('voice', { op: 'chat', key: key, model: model, url: url, systemPrompt: systemPrompt, userText: userText });
          return '{"started":true}';
        },
        completeChatMessages: function (key, model, url, messagesJson, api) {
          send('voice', { op: 'chatMessages', key: key, model: model, url: url, messages: messagesJson, api: api });
          return '{"started":true}';
        }
      };
      window.AndroidUpdateApi = {
        checkLatest: function () {
          return JSON.stringify({
            currentVersion: '\(JsonUtil.appVersion)',
            version: '\(JsonUtil.appVersion)',
            tagName: 'v\(JsonUtil.appVersion)',
            name: 'v\(JsonUtil.appVersion)',
            body: 'iOS 请通过 TestFlight 或 App Store 更新应用。译本和注释可继续在应用内下载。',
            assets: []
          });
        },
        localApkStatus: function () { return '{"exists":false,"ready":false}'; },
        downloadAndInstall: function () { return '{"error":"iOS 不能像安卓那样直接安装安装包，请使用 TestFlight 或 App Store"}'; },
        downloadStatus: function () { return '{}'; },
        clearDownloadCache: function () { return '{"ok":true}'; }
      };
      window.AndroidBibleApi = window.AndroidBibleApi || {};
      window.AndroidBibleApi.setNightMode = function (night) { send('native', { op: 'night', value: !!night }); };
      window.AndroidBibleApi.setKeepScreenOn = function (keep) { send('native', { op: 'keepScreen', value: !!keep }); };
      window.AndroidBibleApi.installPackage = function () { return '{"error":"iOS 首版暂不支持资源包安装，请用电脑或安卓下载注释"}'; };
      window.AndroidBibleApi.downloadStatus = function () { return '{}'; };
      window.AndroidBibleApi.clearDownloadCache = function () { return '{"ok":true}'; };
    })();
    """
}
