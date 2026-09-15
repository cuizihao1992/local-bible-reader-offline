async function readResponse(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    if (!response.ok) throw new Error(text || `请求失败 ${response.status}`);
    throw new Error("服务器返回了无法解析的内容");
  }
}

async function api(path, options) {
  if (window.AndroidBibleApi && window.AndroidBibleApi.getJson && !(options && options.method && options.method !== "GET")) {
    const data = JSON.parse(window.AndroidBibleApi.getJson(path));
    if (data.error) throw new Error(data.error);
    return data;
  }
  const response = await fetch(path, options);
  const data = await readResponse(response);
  if (!response.ok || data.error) throw new Error(data.error || `请求失败 ${response.status}`);
  return data;
}

function postJson(path, payload) {
  if (window.AndroidBibleApi && window.AndroidBibleApi.postJson) {
    const data = JSON.parse(window.AndroidBibleApi.postJson(path, JSON.stringify(payload)));
    if (data.error) throw new Error(data.error);
    return Promise.resolve(data);
  }
  return api(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

if (window.Bible) window.Bible.api = { request: api, post: postJson };
