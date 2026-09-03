import { spawn, execSync, ChildProcess } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const HOME = os.homedir();

export function resolveMolePath(): string {
  if (process.env.TQD_MOLE_PATH && fs.existsSync(process.env.TQD_MOLE_PATH)) {
    return process.env.TQD_MOLE_PATH;
  }
  // 1. Khi chạy trong macOS App Bundle: Contents/MacOS/tqd-backend -> Contents/Resources/mole
  const bundleResourcesMole = path.resolve(path.dirname(process.execPath), "../Resources/mole");
  if (fs.existsSync(bundleResourcesMole)) return bundleResourcesMole;

  // 2. Khi chạy từ build/bin/tqd-backend -> AGY/mole
  const relativeFromBin = path.resolve(path.dirname(process.execPath), "../../mole");
  if (fs.existsSync(relativeFromBin)) return relativeFromBin;

  // 3. Khi chạy dev từ server/index.ts
  const devMole = path.resolve(__dirname, "../mole");
  if (fs.existsSync(devMole)) return devMole;

  // 4. Dự phòng thư mục hiện tại
  const cwdMole = path.resolve(process.cwd(), "mole");
  if (fs.existsSync(cwdMole)) return cwdMole;

  return devMole;
}

export const MOLE_DIR = resolveMolePath();
export const MOLE_CLI = path.join(MOLE_DIR, "mole");
const WHITELIST_PATH = path.join(HOME, ".config/mole/whitelist");
const OPERATIONS_LOG_PATH = path.join(HOME, "Library/Logs/mole/operations.log");

export interface ScanCategoryItem {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  sizeString: string;
  sizeBytes: number;
  safe: boolean;
  paths?: string[];
  requiresFDA?: boolean;
  requiresRoot?: boolean;
  tier?: 1 | 2;
}

export interface ScanResult {
  totalSizeString: string;
  totalSizeBytes: number;
  categories: ScanCategoryItem[];
  timestamp: number;
}

let cachedScanResult: ScanResult | null = null;
let lastScanTime = 0;
let isCleanProcessActive = false;

export const MOLE_SECTION_TO_CATEGORY_MAP: Record<string, { id: string; name: string }> = {
  "User essentials": { id: "user_app_cache", name: "Bộ nhớ đệm ứng dụng người dùng (App Cache)" },
  "App caches": { id: "user_app_cache", name: "Bộ nhớ đệm ứng dụng người dùng (App Cache)" },
  "Browsers": { id: "browser_cache", name: "Bộ nhớ đệm trình duyệt Web (Chrome & Safari)" },
  "Developer tools": { id: "dev_tools_cache", name: "Bộ nhớ đệm công cụ lập trình (npm, Playwright, Gradle)" },
  "Xcode": { id: "xcode_derived", name: "Bộ nhớ đệm Xcode DerivedData" },
  "Homebrew": { id: "brew_cache", name: "Bộ nhớ đệm Homebrew Downloads" },
  "Trash": { id: "user_trash", name: "Thùng rác hệ thống (Trash)" },
  "System": { id: "user_logs", name: "Nhật ký ứng dụng & Báo cáo lỗi (Logs)" },
  "Application Support": { id: "user_app_cache", name: "Bộ nhớ đệm ứng dụng người dùng (App Cache)" },
  "App leftovers": { id: "user_app_cache", name: "Bộ nhớ đệm ứng dụng người dùng (App Cache)" },
  "Project artifacts": { id: "dev_tools_cache", name: "Bộ nhớ đệm công cụ lập trình" },
};

export function parseSizeToBytes(sizeStr: string): number {
  const match = sizeStr.trim().match(/([0-9.]+)\s*([KMGTP]?B?)/i);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  if (unit.startsWith("K")) return val * 1024;
  if (unit.startsWith("M")) return val * 1024 * 1024;
  if (unit.startsWith("G")) return val * 1024 * 1024 * 1024;
  if (unit.startsWith("T")) return val * 1024 * 1024 * 1024 * 1024;
  return val;
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

// 1. Quét toàn diện nhanh & chính xác (Fast & Reliable Comprehensive Scan)
export async function runComprehensiveScan(forceRefresh = false): Promise<ScanResult> {
  if (!forceRefresh && cachedScanResult && Date.now() - lastScanTime < 60000) {
    return cachedScanResult;
  }

  const categories: ScanCategoryItem[] = [];

  const checkDirSize = (dirPath: string): { bytes: number; count: number } => {
    if (!fs.existsSync(dirPath)) return { bytes: 0, count: 0 };
    try {
      const out = execSync(`du -sk "${dirPath}" 2>/dev/null`, { encoding: "utf8" }).trim().split(/\s+/)[0];
      const bytes = (parseInt(out, 10) || 0) * 1024;
      return { bytes, count: 1 };
    } catch {
      return { bytes: 0, count: 0 };
    }
  };

  // 1. User app cache (Các thư mục lớn trong ~/Library/Caches)
  const userCachesDir = path.join(HOME, "Library/Caches");
  if (fs.existsSync(userCachesDir)) {
    try {
      const duList = execSync(`du -sk "${userCachesDir}"/* 2>/dev/null | sort -nr | head -n 30`, { encoding: "utf8" });
      const lines = duList.trim().split("\n");
      let totalAppCacheBytes = 0;
      let appCacheCount = 0;

      for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          const kb = parseInt(parts[0], 10) || 0;
          const folder = parts.slice(1).join(" ");
          if (folder.includes("CloudKit") || folder.includes("Mobile Documents")) continue;
          totalAppCacheBytes += kb * 1024;
          appCacheCount++;
        }
      }

      if (totalAppCacheBytes > 0) {
        categories.push({
          id: "user_app_cache",
          name: "Bộ nhớ đệm ứng dụng người dùng (App Cache)",
          description: "Dữ liệu bộ nhớ tạm tích tụ từ các ứng dụng macOS đã sử dụng",
          itemCount: appCacheCount,
          sizeString: formatBytes(totalAppCacheBytes),
          sizeBytes: totalAppCacheBytes,
          safe: true,
          tier: 1,
          requiresFDA: false,
          requiresRoot: false,
        });
      }
    } catch {}
  }

  // 2. Trình duyệt Google Chrome / Safari Cache
  const chromeCache = checkDirSize(path.join(HOME, "Library/Caches/Google"));
  const safariCache = checkDirSize(path.join(HOME, "Library/Caches/com.apple.Safari"));
  const browserBytes = chromeCache.bytes + safariCache.bytes;
  if (browserBytes > 0) {
    categories.push({
      id: "browser_cache",
      name: "Bộ nhớ đệm trình duyệt Web (Chrome & Safari)",
      description: "Tệp tin hình ảnh, script tạm của các trang web đã truy cập",
      itemCount: 2,
      sizeString: formatBytes(browserBytes),
      sizeBytes: browserBytes,
      safe: true,
      tier: 1,
      requiresFDA: false,
      requiresRoot: false,
    });
  }

  // 3. Bộ nhớ đệm công cụ lập trình (npm, pnpm, yarn, gradle, playwright)
  const npmCache = checkDirSize(path.join(HOME, ".npm/_cacache"));
  const playwrightCache = checkDirSize(path.join(HOME, "Library/Caches/ms-playwright"));
  const gradleCache = checkDirSize(path.join(HOME, ".gradle/caches"));
  const nodeGypCache = checkDirSize(path.join(HOME, "Library/Caches/node-gyp"));
  const devToolsBytes = npmCache.bytes + playwrightCache.bytes + gradleCache.bytes + nodeGypCache.bytes;
  if (devToolsBytes > 0) {
    categories.push({
      id: "dev_tools_cache",
      name: "Bộ nhớ đệm công cụ lập trình (npm, Playwright, Gradle)",
      description: "Các gói thư viện và browser binaries trung gian tải về",
      itemCount: 4,
      sizeString: formatBytes(devToolsBytes),
      sizeBytes: devToolsBytes,
      safe: true,
      tier: 1,
      requiresFDA: false,
      requiresRoot: false,
    });
  }

  // 4. Xcode DerivedData
  const xcodeDerived = checkDirSize(path.join(HOME, "Library/Developer/Xcode/DerivedData"));
  if (xcodeDerived.bytes > 10 * 1024 * 1024) {
    categories.push({
      id: "xcode_derived",
      name: "Bộ nhớ đệm Xcode DerivedData",
      description: "Dữ liệu build trung gian của các dự án phát triển ứng dụng Apple",
      itemCount: 1,
      sizeString: formatBytes(xcodeDerived.bytes),
      sizeBytes: xcodeDerived.bytes,
      safe: true,
      tier: 1,
      requiresFDA: false,
      requiresRoot: false,
    });
  }

  // 5. Nhật ký hệ thống & báo cáo sự cố (Logs & Crash Reports)
  const userLogs = checkDirSize(path.join(HOME, "Library/Logs"));
  if (userLogs.bytes > 0) {
    categories.push({
      id: "user_logs",
      name: "Nhật ký ứng dụng & Báo cáo lỗi (Logs)",
      description: "Tệp nhật ký log ghi chép hoạt động cũ trong ~/Library/Logs",
      itemCount: 12,
      sizeString: formatBytes(userLogs.bytes),
      sizeBytes: userLogs.bytes,
      safe: true,
      tier: 1,
      requiresFDA: false,
      requiresRoot: false,
    });
  }

  // 6. Thùng rác người dùng (.Trash)
  const trash = checkDirSize(path.join(HOME, ".Trash"));
  if (trash.bytes > 0) {
    categories.push({
      id: "user_trash",
      name: "Thùng rác hệ thống (Trash)",
      description: "Các tệp tin bạn đã xóa bỏ nhưng chưa dọn sạch hoàn toàn",
      itemCount: 1,
      sizeString: formatBytes(trash.bytes),
      sizeBytes: trash.bytes,
      safe: true,
      tier: 1,
      requiresFDA: false,
      requiresRoot: false,
    });
  }

  // 7. Bộ nhớ đệm Homebrew
  const brewCache = checkDirSize(path.join(HOME, "Library/Caches/Homebrew"));
  if (brewCache.bytes > 5 * 1024 * 1024) {
    categories.push({
      id: "brew_cache",
      name: "Bộ nhớ đệm Homebrew Downloads",
      description: "Các gói cài đặt Homebrew đã tải về",
      itemCount: 1,
      sizeString: formatBytes(brewCache.bytes),
      sizeBytes: brewCache.bytes,
      safe: true,
      tier: 1,
      requiresFDA: false,
      requiresRoot: false,
    });
  }

  // 8. Tầng 2: Bộ nhớ đệm hệ thống sâu (yêu cầu Full Disk Access / Root)
  const sysCache = checkDirSize("/Library/Caches");
  if (sysCache.bytes > 0) {
    categories.push({
      id: "system_cache",
      name: "Bộ nhớ đệm hệ thống sâu (System Caches)",
      description: "Các tệp đệm dùng chung của macOS và tiến trình hệ thống cấp cao",
      itemCount: 1,
      sizeString: formatBytes(sysCache.bytes),
      sizeBytes: sysCache.bytes,
      safe: false,
      tier: 2,
      requiresFDA: true,
      requiresRoot: true,
    });
  }

  const totalSizeBytes = categories.reduce((sum, c) => sum + c.sizeBytes, 0);

  const result: ScanResult = {
    totalSizeString: formatBytes(totalSizeBytes),
    totalSizeBytes,
    categories,
    timestamp: Date.now(),
  };

  cachedScanResult = result;
  lastScanTime = Date.now();
  return result;
}

// 2. Chạy dọn dẹp thực tế với Line Accumulator Buffer và Section-to-Category Demuxer
export function executeCleanProcess(
  categoryIds: string[],
  onLog: (line: string) => void,
  onCategoryEvent: (event: "start" | "done", categoryId: string, categoryName: string) => void,
  onDone: (success: boolean) => void
): { child: ChildProcess | null; error?: string } {
  if (isCleanProcessActive) {
    return { child: null, error: "Một tiến trình dọn dẹp khác đang chạy. Vui lòng chờ hoàn tất." };
  }

  isCleanProcessActive = true;
  onLog("[KHỞI ĐỘNG] Đang chuẩn bị dọn dẹp hệ thống với Mole Core...");

  let activeCategoryId: string | null = null;
  let stdoutBuffer = "";
  let stderrBuffer = "";

  // Tạo danh sách category nếu có chỉ định
  const child = spawn("bash", [MOLE_CLI, "clean"], {
    cwd: MOLE_DIR,
    env: { ...process.env, MO_NON_INTERACTIVE: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const processLine = (rawLine: string) => {
    // Xóa sạch ANSI escape codes, cursor positioning, và carriage return \r
    const cleanLine = rawLine
      .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "")
      .replace(/\x1b\([0-9;]*[a-zA-Z]/g, "")
      .replace(/\r/g, "")
      .trim();

    if (!cleanLine) return;

    // Nhận diện chuyển giao danh mục của Mole: "➤ User essentials", "➤ App caches", "➤ Browsers", etc.
    const sectionMatch = cleanLine.match(/^[➤>]\s*(.+)$/);
    if (sectionMatch) {
      const sectionName = sectionMatch[1].trim();
      const mapped = MOLE_SECTION_TO_CATEGORY_MAP[sectionName];
      if (mapped) {
        if (activeCategoryId && activeCategoryId !== mapped.id) {
          onCategoryEvent("done", activeCategoryId, "");
        }
        activeCategoryId = mapped.id;
        onCategoryEvent("start", mapped.id, mapped.name);
      }
    }

    // Nhận diện dòng xóa tệp: "→ User app cache · 9 items..." hoặc "✓ Cleared..."
    if (cleanLine.includes("User app cache") || cleanLine.includes("App caches")) {
      if (!activeCategoryId) {
        activeCategoryId = "user_app_cache";
        onCategoryEvent("start", "user_app_cache", "Bộ nhớ đệm ứng dụng người dùng (App Cache)");
      }
    } else if (cleanLine.includes("Chrome") || cleanLine.includes("Safari") || cleanLine.includes("Browser")) {
      if (activeCategoryId !== "browser_cache") {
        if (activeCategoryId) onCategoryEvent("done", activeCategoryId, "");
        activeCategoryId = "browser_cache";
        onCategoryEvent("start", "browser_cache", "Bộ nhớ đệm trình duyệt Web (Chrome & Safari)");
      }
    } else if (cleanLine.includes("npm") || cleanLine.includes("pnpm") || cleanLine.includes("yarn") || cleanLine.includes("gradle")) {
      if (activeCategoryId !== "dev_tools_cache") {
        if (activeCategoryId) onCategoryEvent("done", activeCategoryId, "");
        activeCategoryId = "dev_tools_cache";
        onCategoryEvent("start", "dev_tools_cache", "Bộ nhớ đệm công cụ lập trình");
      }
    }

    onLog(cleanLine);
  };

  child.stdout.on("data", (chunk: Buffer) => {
    stdoutBuffer += chunk.toString("utf8");
    const lines = stdoutBuffer.split("\n");
    stdoutBuffer = lines.pop() || ""; // Giữ lại phần chưa có ký tự xuống dòng
    for (const l of lines) processLine(l);
  });

  child.stderr.on("data", (chunk: Buffer) => {
    stderrBuffer += chunk.toString("utf8");
    const lines = stderrBuffer.split("\n");
    stderrBuffer = lines.pop() || "";
    for (const l of lines) {
      const cleanLine = l.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "").replace(/\r/g, "").trim();
      if (cleanLine) onLog(`[CẢNH BÁO] ${cleanLine}`);
    }
  });

  child.on("close", (code) => {
    if (stdoutBuffer.trim()) processLine(stdoutBuffer.trim());
    if (stderrBuffer.trim()) onLog(`[CẢNH BÁO] ${stderrBuffer.trim()}`);

    if (activeCategoryId) {
      onCategoryEvent("done", activeCategoryId, "");
      activeCategoryId = null;
    }

    isCleanProcessActive = false;
    cachedScanResult = null; // Xóa cache sau dọn dẹp để quét mới
    onLog(code === 0 ? "[HOÀN TẤT] Quá trình dọn dẹp hoàn thành thành công!" : `[KẾT THÚC] Tiến trình kết thúc với mã: ${code}`);
    onDone(code === 0);
  });

  child.on("error", (err) => {
    isCleanProcessActive = false;
    onLog(`[LỖI TIẾN TRÌNH] ${err.message}`);
    onDone(false);
  });

  return { child };
}

// 3. Tối ưu hóa hệ thống (Optimize)
export async function executeOptimization(type: "purge_ram" | "flush_dns" | "rebuild_spotlight" | "rebuild_launchservices"): Promise<{ success: boolean; cancelled?: boolean; message: string }> {
  try {
    switch (type) {
      case "purge_ram":
        execSync("osascript -e 'do shell script \"purge\" with administrator privileges'", { timeout: 15000 });
        return { success: true, message: "Đã giải phóng bộ nhớ RAM không hoạt động thành công." };
      case "flush_dns":
        execSync("osascript -e 'do shell script \"dscacheutil -flushcache; killall -HUP mDNSResponder\" with administrator privileges'", { timeout: 15000 });
        return { success: true, message: "Đã làm mới bộ nhớ đệm DNS hệ thống thành công." };
      case "rebuild_spotlight":
        execSync("osascript -e 'do shell script \"mdutil -E /\" with administrator privileges'", { timeout: 20000 });
        return { success: true, message: "Đã yêu cầu macOS lập lại chỉ mục Spotlight cho toàn ổ đĩa." };
      case "rebuild_launchservices":
        execSync("/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -kill -r -domain local -domain system -domain user", { timeout: 30000 });
        return { success: true, message: "Đã làm mới cơ sở dữ liệu LaunchServices (sửa lỗi menu Open With)." };
      default:
        return { success: false, message: "Tác vụ không hợp lệ." };
    }
  } catch (err: any) {
    const msg = String(err?.message || err || "");
    if (msg.includes("User canceled") || msg.includes("code 128") || msg.includes("canceled")) {
      return { success: false, cancelled: true, message: "Đã hủy thao tác xác thực Touch ID / Quản trị viên." };
    }
    return { success: false, message: `Lỗi thực thi: ${msg}` };
  }
}

// 4. Quản lý Danh Sách Trắng (Whitelist)
export function getWhitelist(): string[] {
  if (!fs.existsSync(WHITELIST_PATH)) return [];
  try {
    const content = fs.readFileSync(WHITELIST_PATH, "utf8");
    return content.split("\n").map(s => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

export function saveWhitelist(items: string[]): boolean {
  try {
    const dir = path.dirname(WHITELIST_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(WHITELIST_PATH, items.join("\n") + "\n", "utf8");
    return true;
  } catch {
    return false;
  }
}

// 5. Lịch sử dọn dẹp
export function getOperationsHistory(): any {
  try {
    const jsonOutput = execSync(`bash "${MOLE_CLI}" history --json 2>/dev/null`, {
      encoding: "utf8",
      env: { ...process.env, MO_NON_INTERACTIVE: "1" },
    });
    return JSON.parse(jsonOutput);
  } catch {
    return { sessions: [], deletions: [] };
  }
}

// 6. Kiểm tra quyền Full Disk Access
export function checkFullDiskAccess(): { hasAccess: boolean; guidanceUrl: string } {
  const testPath = path.join(HOME, "Library/Safari");
  let hasAccess = false;
  try {
    fs.readdirSync(testPath);
    hasAccess = true;
  } catch {
    hasAccess = false;
  }
  return {
    hasAccess,
    guidanceUrl: "x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles",
  };
}

// 7. Quét các tệp rác dự án lập trình (Dev Purge)
export interface DevArtifactItem {
  id: string;
  path: string;
  type: "node_modules" | "target" | ".gradle" | "venv" | "DerivedData";
  sizeString: string;
  sizeBytes: number;
  lastModifiedDays: number;
}

export async function scanDevArtifacts(): Promise<DevArtifactItem[]> {
  const artifacts: DevArtifactItem[] = [];
  const searchRoots = [
    path.join(HOME, "Projects"),
    path.join(HOME, "Workspace"),
    path.join(HOME, "Code"),
    path.join(HOME, "Documents"),
    path.join(HOME, "Downloads"),
    "/Users/tqd/AGY",
  ].filter(p => fs.existsSync(p));

  for (const root of searchRoots) {
    try {
      const cmd = `find "${root}" -maxdepth 4 -type d \\( -name "node_modules" -o -name "target" -o -name ".gradle" -o -name "venv" -o -name ".venv" \\) 2>/dev/null | head -n 30`;
      const out = execSync(cmd, { encoding: "utf8" });
      const paths = out.split("\n").map(s => s.trim()).filter(Boolean);

      for (const itemPath of paths) {
        try {
          const stat = fs.statSync(itemPath);
          const daysOld = Math.floor((Date.now() - stat.mtimeMs) / (1000 * 60 * 60 * 24));
          const sizeOut = execSync(`du -sk "${itemPath}" 2>/dev/null`, { encoding: "utf8" }).trim().split(/\s+/)[0];
          const bytes = (parseInt(sizeOut, 10) || 0) * 1024;

          let typeName: DevArtifactItem["type"] = "node_modules";
          if (itemPath.endsWith("target")) typeName = "target";
          else if (itemPath.endsWith(".gradle")) typeName = ".gradle";
          else if (itemPath.includes("venv")) typeName = "venv";

          artifacts.push({
            id: `dev_${artifacts.length + 1}`,
            path: itemPath,
            type: typeName,
            sizeString: formatBytes(bytes),
            sizeBytes: bytes,
            lastModifiedDays: daysOld,
          });
        } catch {}
      }
    } catch {}
  }

  return artifacts;
}

// 8. Xóa thư mục dev artifact
export function deleteDevArtifacts(paths: string[]): { deleted: string[]; failed: string[] } {
  const deleted: string[] = [];
  const failed: string[] = [];
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) {
        fs.rmSync(p, { recursive: true, force: true });
        deleted.push(p);
      }
    } catch {
      failed.push(p);
    }
  }
  return { deleted, failed };
}

// 9. Danh sách ứng dụng cài đặt trong /Applications
export interface InstalledApp {
  name: string;
  path: string;
  sizeString: string;
  sizeBytes: number;
}

export function listInstalledApplications(): InstalledApp[] {
  const appDirs = ["/Applications", path.join(HOME, "Applications")];
  const apps: InstalledApp[] = [];

  for (const dir of appDirs) {
    if (!fs.existsSync(dir)) continue;
    try {
      const files = fs.readdirSync(dir);
      for (const f of files) {
        if (f.endsWith(".app")) {
          const appPath = path.join(dir, f);
          try {
            const sizeOut = execSync(`du -sk "${appPath}" 2>/dev/null`, { encoding: "utf8" }).trim().split(/\s+/)[0];
            const sizeBytes = (parseInt(sizeOut, 10) || 0) * 1024;
            apps.push({
              name: f.replace(".app", ""),
              path: appPath,
              sizeString: formatBytes(sizeBytes),
              sizeBytes,
            });
          } catch {
            apps.push({
              name: f.replace(".app", ""),
              path: appPath,
              sizeString: "100 MB",
              sizeBytes: 100 * 1024 * 1024,
            });
          }
        }
      }
    } catch {}
  }

  return apps.sort((a, b) => b.sizeBytes - a.sizeBytes);
}
