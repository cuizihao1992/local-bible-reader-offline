package local.bible.reader;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.ProxyInfo;

import java.net.HttpURLConnection;
import java.net.InetSocketAddress;
import java.net.Proxy;
import java.net.ProxySelector;
import java.net.URI;
import java.net.URL;
import java.util.List;

final class HttpSupport {
    static final String USER_AGENT = "LocalBibleReader/1.14.0";

    static {
        try {
            System.setProperty("java.net.useSystemProxies", "true");
        } catch (Throwable ignored) {
        }
    }

    private HttpSupport() {}

    static Proxy selectProxy(Context context, URI uri) {
        try {
            ProxySelector selector = ProxySelector.getDefault();
            if (selector != null && uri != null) {
                List<Proxy> list = selector.select(uri);
                if (list != null) {
                    for (Proxy proxy : list) {
                        if (proxy != null && proxy.type() != Proxy.Type.DIRECT) return proxy;
                    }
                }
            }
        } catch (Throwable ignored) {
        }
        try {
            if (context != null) {
                ConnectivityManager manager = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
                ProxyInfo info = manager == null ? null : manager.getDefaultProxy();
                if (info != null && info.getHost() != null && !info.getHost().isEmpty() && info.getPort() > 0) {
                    return new Proxy(Proxy.Type.HTTP, new InetSocketAddress(info.getHost(), info.getPort()));
                }
            }
        } catch (Throwable ignored) {
        }
        try {
            String host = android.net.Proxy.getDefaultHost();
            int port = android.net.Proxy.getDefaultPort();
            if (host != null && !host.isEmpty() && port > 0) {
                return new Proxy(Proxy.Type.HTTP, new InetSocketAddress(host, port));
            }
        } catch (Throwable ignored) {
        }
        return Proxy.NO_PROXY;
    }

    static JSONProxy snapshot(Context context) {
        Proxy proxy = selectProxy(context, URI.create("https://github.com/"));
        if (proxy == null || proxy.type() == Proxy.Type.DIRECT || proxy.address() == null) {
            return new JSONProxy("direct", "", 0);
        }
        InetSocketAddress address = (InetSocketAddress) proxy.address();
        return new JSONProxy(proxy.type().name().toLowerCase(), address.getHostString(), address.getPort());
    }

    static HttpURLConnection open(Context context, String urlText, int connectMs, int readMs) throws Exception {
        URL url = new URL(urlText);
        URI uri;
        try {
            uri = url.toURI();
        } catch (Exception error) {
            uri = URI.create(url.getProtocol() + "://" + url.getHost() + "/");
        }
        HttpURLConnection connection = (HttpURLConnection) url.openConnection(selectProxy(context, uri));
        connection.setInstanceFollowRedirects(false);
        connection.setConnectTimeout(connectMs);
        connection.setReadTimeout(readMs);
        connection.setRequestProperty("User-Agent", USER_AGENT);
        return connection;
    }

    static String resolveRedirects(Context context, String urlText, int connectMs, int readMs) throws Exception {
        String current = urlText;
        for (int hop = 0; hop < 6; hop += 1) {
            HttpURLConnection connection = open(context, current, connectMs, readMs);
            connection.setRequestMethod("GET");
            connection.setRequestProperty("Accept", "*/*");
            try {
                int code = connection.getResponseCode();
                if (code == HttpURLConnection.HTTP_MOVED_PERM
                        || code == HttpURLConnection.HTTP_MOVED_TEMP
                        || code == HttpURLConnection.HTTP_SEE_OTHER
                        || code == 307
                        || code == 308) {
                    String location = connection.getHeaderField("Location");
                    if (location == null || location.isEmpty()) return current;
                    current = new URL(new URL(current), location).toString();
                    continue;
                }
                return current;
            } finally {
                connection.disconnect();
            }
        }
        return current;
    }

    static final class JSONProxy {
        final String type;
        final String host;
        final int port;

        JSONProxy(String type, String host, int port) {
            this.type = type;
            this.host = host == null ? "" : host;
            this.port = port;
        }
    }
}
