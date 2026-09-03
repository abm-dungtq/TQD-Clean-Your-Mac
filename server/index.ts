import http from "http";
import url from "url";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { exec } from "child_process";
import { getTelemetry } from "./telemetry";
import {
  runComprehensiveScan,
  executeCleanProcess,
  executeOptimization,
  getWhitelist,
  saveWhitelist,
  getOperationsHistory,
  checkFullDiskAccess,
  scanDevArtifacts,
  deleteDevArtifacts,
  listInstalledApplications,
} from "./mole_bridge";
import { externalWatcher } from "./external_watcher";

const PORT = parseInt(process.env.PORT || "42100", 10);
const HOST = "127.0.0.1";
// Sinh token ngẫu nhiên bảo vệ chống CSRF
const SESSION_TOKEN = process.env.TQD_TOKEN || crypto.randomBytes(16).toString("hex");

export function resolveFrontendPath(): string {
  if (process.env.TQD_FRONTEND_PATH && fs.existsSync(process.env.TQD_FRONTEND_PATH)) {
    return process.env.TQD_FRONTEND_PATH;
  }
  // 1. Khi chạy trong macOS App Bundle: Contents/MacOS/tqd-backend -> Contents/Resources/frontend
  const bundleFrontend = path.resolve(path.dirname(process.execPath), "../Resources/frontend");
  if (fs.existsSync(bundleFrontend)) return bundleFrontend;

  // 2. Khi chạy từ build/bin/tqd-backend -> AGY/frontend/dist
  const relativeFrontend = path.resolve(path.dirname(process.execPath), "../../frontend/dist");
  if (fs.existsSync(relativeFrontend)) return relativeFrontend;

  // 3. Khi chạy dev từ server/index.ts
  const devFrontend = path.resolve(__dirname, "../frontend/dist");
  if (fs.existsSync(devFrontend)) return devFrontend;

  const cwdFrontend = path.resolve(process.cwd(), "frontend/dist");
  if (fs.existsSync(cwdFrontend)) return cwdFrontend;

  return devFrontend;
}

const FRONTEND_DIST = resolveFrontendPath();

console.log("==================================================");
console.log("   🛡️  TQD-CLEAN YOUR MAC - BACKEND CORE ENGINE   ");
console.log("==================================================");
console.log(`[BẢO MẬT] Token phiên: ${SESSION_TOKEN}`);

// Quản lý các client SSE đang kết nối để broadcast dữ liệu thời gian thực
type ClientBroadcaster = (event: string, data: any) => void;
const sseClients = new Set<ClientBroadcaster>();

externalWatcher.setBroadcaster((event, data) => {
  for (const client of sseClients) {
    try {
      client(event, data);
    } catch {}
  }
});
externalWatcher.start();

// Phục vụ tệp tĩnh (Static Assets)
function serveStatic(req: http.IncomingMessage, res: http.ServerResponse, pathname: string) {
  let filePath = path.join(FRONTEND_DIST, pathname === "/" ? "index.html" : pathname);

  if (!fs.existsSync(filePath)) {
    filePath = path.join(FRONTEND_DIST, "index.html");
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
  };

  const contentType = mimeTypes[ext] || "application/octet-stream";

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-TQD-Token",
    });
    res.end(data);
  } catch (err: any) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
}

// Máy chủ HTTP & SSE
const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-TQD-Token");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url || "", true);
  const pathname = parsedUrl.pathname || "";

  // 0. Handshake endpoint
  if (pathname === "/api/handshake") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, token: SESSION_TOKEN, version: "1.0.0" }));
    return;
  }

  // Kiểm tra xác thực token (qua header hoặc query param)
  const clientToken = (req.headers["x-tqd-token"] as string) || parsedUrl.query.token;
  const isStatic = !pathname.startsWith("/api/");

  if (!isStatic && clientToken !== SESSION_TOKEN && process.env.NODE_ENV !== "development") {
    res.writeHead(401, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Unauthorized: Mã xác thực không hợp lệ." }));
    return;
  }

  // 1. GET /api/telemetry
  if (pathname === "/api/telemetry" && req.method === "GET") {
    try {
      const data = getTelemetry();
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(data));
    } catch (err: any) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 2. GET /api/scan (Quét toàn diện hệ thống dạng Dry-run)
  if (pathname === "/api/scan" && req.method === "GET") {
    try {
      const force = parsedUrl.query.refresh === "true";
      const result = await runComprehensiveScan(force);
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(result));
    } catch (err: any) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 3. GET /api/stream/clean (SSE Stream quá trình dọn dẹp và kết nối terminal)
  if (pathname === "/api/stream/clean" && req.method === "GET") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });

    const sendEvent: ClientBroadcaster = (event: string, data: any) => {
      try {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      } catch {}
    };

    sseClients.add(sendEvent);

    const categoriesRaw = (parsedUrl.query.categories as string) || "";
    const selectedCategories = categoriesRaw ? categoriesRaw.split(",").filter(Boolean) : [];
    const shouldExecute = parsedUrl.query.trigger !== "false";

    let spawnedChild: any = null;

    if (shouldExecute) {
      const run = executeCleanProcess(
        selectedCategories,
        (line) => {
          sendEvent("log", { line, time: new Date().toLocaleTimeString("vi-VN") });
        },
        (event, categoryId, categoryName) => {
          if (event === "start") {
            sendEvent("category_start", { categoryId, categoryName, time: new Date().toLocaleTimeString("vi-VN") });
          } else if (event === "done") {
            sendEvent("category_done", { categoryId, time: new Date().toLocaleTimeString("vi-VN") });
          }
        },
        (success) => {
          sendEvent("done", { success, time: new Date().toLocaleTimeString("vi-VN") });
        }
      );

      if (run.error) {
        sendEvent("log", { line: `[CẢNH BÁO] ${run.error}`, time: new Date().toLocaleTimeString("vi-VN") });
      } else {
        spawnedChild = run.child;
      }
    }

    req.on("close", () => {
      sseClients.delete(sendEvent);
      if (spawnedChild && !spawnedChild.killed) {
        try {
          spawnedChild.kill("SIGTERM");
        } catch {}
      }
    });

    return;
  }

  // 4. POST /api/optimize
  if (pathname === "/api/optimize" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", async () => {
      try {
        const payload = JSON.parse(body || "{}");
        const optType = payload.type;
        const result = await executeOptimization(optType);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(result));
      } catch (err: any) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 5. GET/POST /api/whitelist
  if (pathname === "/api/whitelist") {
    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ whitelist: getWhitelist() }));
      return;
    }
    if (req.method === "POST") {
      let body = "";
      req.on("data", chunk => body += chunk);
      req.on("end", () => {
        try {
          const payload = JSON.parse(body || "{}");
          const ok = saveWhitelist(payload.items || []);
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ success: ok }));
        } catch (err: any) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }
  }

  // 6. GET /api/history
  if (pathname === "/api/history" && req.method === "GET") {
    try {
      const hist = getOperationsHistory();
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(hist));
    } catch (err: any) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 7. GET /api/fda-status
  if (pathname === "/api/fda-status" && req.method === "GET") {
    const fda = checkFullDiskAccess();
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(fda));
    return;
  }

  // 7b. POST /api/open-fda (Deep-link mở thẳng Cài đặt Quyền riêng tư & Bảo mật macOS)
  if (pathname === "/api/open-fda" && req.method === "POST") {
    try {
      exec('open "x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles"');
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: true, message: "Đã mở trang Cài đặt Hệ thống macOS." }));
    } catch (err: any) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // 8. GET /api/dev-purge/scan
  if (pathname === "/api/dev-purge/scan" && req.method === "GET") {
    try {
      const items = await scanDevArtifacts();
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ artifacts: items }));
    } catch (err: any) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 9. POST /api/dev-purge/delete
  if (pathname === "/api/dev-purge/delete" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");
        const resObj = deleteDevArtifacts(payload.paths || []);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(resObj));
      } catch (err: any) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 10. GET /api/uninstall/list
  if (pathname === "/api/uninstall/list" && req.method === "GET") {
    try {
      const apps = listInstalledApplications();
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ apps }));
    } catch (err: any) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Default: Serve frontend static UI
  if (isStatic) {
    serveStatic(req, res, pathname);
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Endpoint not found" }));
});

let currentPort = PORT;
const MAX_PORT_RETRIES = 10;
let retryCount = 0;

function startServer(portToTry: number) {
  const errorHandler = (err: any) => {
    if (err.code === "EADDRINUSE" && retryCount < MAX_PORT_RETRIES) {
      retryCount++;
      console.log(`[CẢNH BÁO] Cổng ${portToTry} đã bị chiếm dụng. Đang thử cổng tiếp theo: ${portToTry + 1}...`);
      server.removeListener("error", errorHandler);
      startServer(portToTry + 1);
    } else {
      console.error(`[LỖI NGHIÊM TRỌNG] Không thể lắng nghe trên cổng mạng:`, err);
      process.exit(1);
    }
  };

  server.once("error", errorHandler);

  server.listen(portToTry, HOST, () => {
    currentPort = portToTry;
    server.removeListener("error", errorHandler);
    console.log(`[HOẠT ĐỘNG] Server đã khởi chạy tại: http://${HOST}:${currentPort}/?token=${SESSION_TOKEN}`);
    // Xuất token và port ra stdout định dạng chuẩn để Native App Wrapper phân tích
    console.log(`__TQD_READY__ PORT=${currentPort} TOKEN=${SESSION_TOKEN}`);

    if (!process.env.NO_OPEN && !process.env.TQD_NATIVE_SHELL) {
      exec(`open "http://${HOST}:${currentPort}/?token=${SESSION_TOKEN}"`);
    }
  });
}

startServer(currentPort);

// Xử lý dọn sạch tiến trình khi nhận tín hiệu kết thúc từ macOS / Native Shell (< 300ms)
function handleCleanExit(signal: string) {
  console.log(`[HỆ THỐNG] Nhận tín hiệu ${signal}. Đang dọn dẹp và giải phóng tài nguyên...`);
  try {
    externalWatcher.stop();
  } catch {}
  server.close(() => {
    console.log(`[HỆ THỐNG] Máy chủ đã đóng an toàn.`);
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 400).unref();
}

process.on("SIGTERM", () => handleCleanExit("SIGTERM"));
process.on("SIGINT", () => handleCleanExit("SIGINT"));
