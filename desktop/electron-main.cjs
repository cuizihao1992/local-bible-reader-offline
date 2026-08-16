const { app, BrowserWindow, dialog, shell } = require("electron");
const { spawn } = require("node:child_process");
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");

let mainWindow = null;
let serverProcess = null;
let serverUrl = "";

app.setName("本地圣经");

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

function waitForHealth(url, timeoutMs = 15000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    function tryOnce() {
      const req = http.get(`${url}/api/health`, (res) => {
        res.resume();
        if (res.statusCode === 200) {
          resolve();
          return;
        }
        retry();
      });
      req.on("error", retry);
      req.setTimeout(1200, () => {
        req.destroy();
        retry();
      });
    }

    function retry() {
      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error("本地后台启动超时，请确认 D:\\bibleDownload 数据目录存在。"));
        return;
      }
      setTimeout(tryOnce, 250);
    }

    tryOnce();
  });
}

async function startLocalServer() {
  const port = await findFreePort();
  serverUrl = `http://127.0.0.1:${port}`;
  const appRoot = app.getAppPath();
  const serverPath = path.join(appRoot, "server.js");

  serverProcess = spawn(process.execPath, ["--no-warnings", serverPath], {
    cwd: appRoot,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      BIBLE_READER_HOST: "127.0.0.1",
      BIBLE_READER_PORT: String(port),
      BIBLE_READER_USER_DATA_DIR: app.getPath("userData"),
    },
    stdio: "pipe",
    windowsHide: true,
  });

  serverProcess.stdout.on("data", (chunk) => console.log(String(chunk).trim()));
  serverProcess.stderr.on("data", (chunk) => console.error(String(chunk).trim()));

  await waitForHealth(serverUrl);
  return serverUrl;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 980,
    minHeight: 640,
    title: "本地圣经",
    backgroundColor: "#fbfaf6",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  try {
    const url = await startLocalServer();
    await mainWindow.loadURL(url);
  } catch (error) {
    await dialog.showMessageBox(mainWindow, {
      type: "error",
      title: "启动失败",
      message: "本地圣经启动失败",
      detail: error.message || String(error),
    });
    app.quit();
  }
}

function stopLocalServer() {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
  }
  serverProcess = null;
}

if (gotLock) {
  app.whenReady().then(createWindow);
}

app.on("window-all-closed", () => {
  stopLocalServer();
  app.quit();
});

app.on("before-quit", stopLocalServer);
