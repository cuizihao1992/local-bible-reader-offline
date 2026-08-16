export function sendJson(res, payload, status = 200) {
  const body = Buffer.from(JSON.stringify(payload), "utf8");
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": body.length,
  });
  res.end(body);
}

export function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024 * 5) {
        reject(httpError("请求体过大", 413));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(httpError("JSON 格式无效"));
      }
    });
    req.on("error", reject);
  });
}

export function httpError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function parsePositiveInt(value, name) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw httpError(`${name} 必须是正整数`);
  }
  return number;
}

export function clampPositiveInt(value, fallback, max) {
  const number = Number(value || fallback);
  if (!Number.isInteger(number) || number < 1) return fallback;
  return Math.min(number, max);
}

export function clampNonNegativeInt(value, fallback = 0) {
  const number = Number(value || fallback);
  if (!Number.isInteger(number) || number < 0) return fallback;
  return number;
}

export const MIME_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".svg", "image/svg+xml"],
]);
