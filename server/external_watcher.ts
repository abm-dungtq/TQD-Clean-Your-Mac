import fs from "fs";
import path from "path";
import os from "os";
import { exec } from "child_process";

const HOME = os.homedir();
const OPERATIONS_LOG = path.join(HOME, "Library/Logs/mole/operations.log");

export type Broadcaster = (event: string, data: any) => void;

export class ExternalTerminalWatcher {
  private lastSize: number = 0;
  private broadcaster: Broadcaster | null = null;
  private isExternalRunning: boolean = false;
  private activeCategory: string | null = null;
  private pollInterval: NodeJS.Timeout | null = null;

  constructor() {
    if (fs.existsSync(OPERATIONS_LOG)) {
      try {
        this.lastSize = fs.statSync(OPERATIONS_LOG).size;
      } catch {
        this.lastSize = 0;
      }
    }
  }

  public setBroadcaster(fn: Broadcaster) {
    this.broadcaster = fn;
  }

  public start() {
    // 1. Theo dõi tệp operations.log
    if (fs.existsSync(path.dirname(OPERATIONS_LOG))) {
      try {
        fs.watchFile(OPERATIONS_LOG, { interval: 300 }, (curr, prev) => {
          if (curr.size > prev.size) {
            this.readNewLogEntries(prev.size, curr.size);
          } else if (curr.size < prev.size) {
            this.lastSize = curr.size; // Log rotated
          }
        });
      } catch (err: any) {
        console.error("Watch file error:", err?.message);
      }
    }

    // 2. Định kỳ kiểm tra tiến trình mole clean ngoài terminal
    this.pollInterval = setInterval(() => {
      this.checkProcessLiveness();
    }, 2000);
  }

  public stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (fs.existsSync(OPERATIONS_LOG)) {
      try {
        fs.unwatchFile(OPERATIONS_LOG);
      } catch {}
    }
  }

  private checkProcessLiveness() {
    exec("pgrep -fl 'mole.*clean|bin/clean\\.sh'", (err, stdout) => {
      const isRunning = !err && stdout.trim().length > 0;
      if (isRunning && !this.isExternalRunning) {
        this.isExternalRunning = true;
        if (this.broadcaster) {
          this.broadcaster("session_start", {
            source: "terminal",
            message: "Phát hiện lệnh dọn dẹp đang chạy từ macOS Terminal",
            time: new Date().toLocaleTimeString("vi-VN"),
          });
        }
      } else if (!isRunning && this.isExternalRunning) {
        this.isExternalRunning = false;
        if (this.activeCategory && this.broadcaster) {
          this.broadcaster("category_done", { categoryId: this.activeCategory });
          this.activeCategory = null;
        }
        if (this.broadcaster) {
          this.broadcaster("done", {
            success: true,
            source: "terminal",
            time: new Date().toLocaleTimeString("vi-VN"),
          });
        }
      }
    });
  }

  private readNewLogEntries(startOffset: number, endOffset: number) {
    try {
      const stream = fs.createReadStream(OPERATIONS_LOG, {
        start: startOffset,
        end: endOffset,
        encoding: "utf8",
      });

      let buffer = "";
      stream.on("data", (chunk: string) => {
        buffer += chunk;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          this.parseLogLine(line.trim());
        }
      });

      stream.on("end", () => {
        if (buffer.trim()) {
          this.parseLogLine(buffer.trim());
        }
      });
    } catch {}
  }

  private parseLogLine(line: string) {
    if (!line || !this.broadcaster) return;

    // Session start marker
    if (line.includes("clean session started")) {
      this.isExternalRunning = true;
      this.broadcaster("session_start", {
        source: "terminal",
        time: new Date().toLocaleTimeString("vi-VN"),
      });
      return;
    }

    // Session end marker
    if (line.includes("clean session ended")) {
      this.isExternalRunning = false;
      if (this.activeCategory) {
        this.broadcaster("category_done", { categoryId: this.activeCategory });
        this.activeCategory = null;
      }
      this.broadcaster("done", {
        success: true,
        source: "terminal",
        time: new Date().toLocaleTimeString("vi-VN"),
      });
      return;
    }

    // Deletion event: [YYYY-MM-DD HH:MM:SS] [clean] REMOVED /path (size)
    if (line.includes("[clean] REMOVED")) {
      const catId = this.inferCategoryFromPath(line);
      if (catId && catId !== this.activeCategory) {
        if (this.activeCategory) {
          this.broadcaster("category_done", { categoryId: this.activeCategory });
        }
        this.activeCategory = catId;
        this.broadcaster("category_start", {
          categoryId: catId,
          categoryName: this.getCategoryName(catId),
          source: "terminal",
        });
      }

      this.broadcaster("log", {
        line: `[Terminal] ${line}`,
        time: new Date().toLocaleTimeString("vi-VN"),
        categoryId: catId,
      });
    }
  }

  private inferCategoryFromPath(targetPath: string): string {
    if (targetPath.includes("/Caches/Google") || targetPath.includes("/Caches/com.apple.Safari")) return "browser_cache";
    if (targetPath.includes("/.npm") || targetPath.includes("/.gradle") || targetPath.includes("/ms-playwright")) return "dev_tools_cache";
    if (targetPath.includes("/Xcode/DerivedData")) return "xcode_derived";
    if (targetPath.includes("/Library/Logs")) return "user_logs";
    if (targetPath.includes("/.Trash")) return "user_trash";
    if (targetPath.includes("/Caches/Homebrew")) return "brew_cache";
    if (targetPath.includes("/Library/Caches")) return "user_app_cache";
    return "user_app_cache";
  }

  private getCategoryName(catId: string): string {
    const map: Record<string, string> = {
      user_app_cache: "Bộ nhớ đệm ứng dụng người dùng (App Cache)",
      browser_cache: "Bộ nhớ đệm trình duyệt Web (Chrome & Safari)",
      dev_tools_cache: "Bộ nhớ đệm công cụ lập trình (npm, Playwright, Gradle)",
      xcode_derived: "Bộ nhớ đệm Xcode DerivedData",
      user_logs: "Nhật ký ứng dụng & Báo cáo lỗi (Logs)",
      user_trash: "Thùng rác hệ thống (Trash)",
      brew_cache: "Bộ nhớ đệm Homebrew Downloads",
    };
    return map[catId] || catId;
  }
}

export const externalWatcher = new ExternalTerminalWatcher();
