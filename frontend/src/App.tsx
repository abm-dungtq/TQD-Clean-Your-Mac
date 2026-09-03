import React, { useState, useEffect, useRef } from "react";
import { Sidebar, NavTab } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { CleanView } from "./components/CleanView";
import { DevPurgeView } from "./components/DevPurgeView";
import { UninstallView } from "./components/UninstallView";
import { OptimizerView } from "./components/OptimizerView";
import { SettingsView } from "./components/SettingsView";
import { SystemTelemetry, ScanResult, CategoryRunStatus } from "./types";
import confetti from "canvas-confetti";

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>("dashboard");
  const [token, setToken] = useState<string>("");
  const [telemetry, setTelemetry] = useState<SystemTelemetry | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [categoryStatuses, setCategoryStatuses] = useState<Record<string, CategoryRunStatus>>({});
  const [sessionSource, setSessionSource] = useState<"web" | "terminal" | null>(null);
  const [isPurgingRam, setIsPurgingRam] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString("vi-VN")}] [HỆ THỐNG] Khởi tạo kết nối TQD-Clean Your Mac...`,
    `[${new Date().toLocaleTimeString("vi-VN")}] [BẢO MẬT] Động cơ Mole Core v1.53.0 sẵn sàng.`,
  ]);

  const activeCleanSourceRef = useRef<EventSource | null>(null);

  // 1. Khởi tạo Token và bắt tay Backend
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      setToken(urlToken);
    } else {
      fetch("/api/handshake")
        .then(res => res.json())
        .then(data => {
          if (data.token) setToken(data.token);
        })
        .catch(err => console.error("Handshake error:", err));
    }
  }, []);

  // 2. Định kỳ lấy Telemetry mỗi 1.5 giây
  useEffect(() => {
    if (!token) return;

    const fetchTelemetry = async () => {
      try {
        const res = await fetch(`/api/telemetry?token=${token}`);
        if (res.ok) {
          const data: SystemTelemetry = await res.json();
          setTelemetry(data);
        }
      } catch {}
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 1500);
    return () => clearInterval(interval);
  }, [token]);

  // 2b. Kiểm tra phiên bản mới trong nền
  useEffect(() => {
    if (!token) return;
    fetch(`/api/system/check-update?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d && d.hasUpdate) {
          setHasUpdate(true);
        }
      })
      .catch(() => {});
  }, [token]);

  // 3. Kết nối kênh lắng nghe sự kiện Terminal nền (External Terminal Watcher)
  useEffect(() => {
    if (!token) return;

    const bgSource = new EventSource(`/api/stream/clean?token=${token}&trigger=false`);

    bgSource.addEventListener("session_start", (e: any) => {
      try {
        const data = JSON.parse(e.data);
        setIsCleaning(true);
        setSessionSource("terminal");
        setTerminalLogs(prev => [
          `[${new Date().toLocaleTimeString("vi-VN")}] [TERMINAL SYNC] ${data.message || "Phát hiện tiến trình dọn dẹp từ Terminal ngoài"}`,
          ...prev,
        ]);
      } catch {}
    });

    bgSource.addEventListener("category_start", (e: any) => {
      try {
        const data = JSON.parse(e.data);
        setActiveCategoryId(data.categoryId);
        setCategoryStatuses(prev => ({ ...prev, [data.categoryId]: "cleaning" }));
        setTerminalLogs(prev => [
          `[${new Date().toLocaleTimeString("vi-VN")}] [TIẾN TRÌNH] Đang dọn dẹp: ${data.categoryName || data.categoryId}...`,
          ...prev,
        ]);
      } catch {}
    });

    bgSource.addEventListener("category_done", (e: any) => {
      try {
        const data = JSON.parse(e.data);
        setCategoryStatuses(prev => ({ ...prev, [data.categoryId]: "completed" }));
      } catch {}
    });

    bgSource.addEventListener("log", (e: any) => {
      try {
        const data = JSON.parse(e.data);
        setTerminalLogs(prev => [`[${data.time}] ${data.line}`, ...prev]);
      } catch {}
    });

    bgSource.addEventListener("done", () => {
      setIsCleaning(false);
      setActiveCategoryId(null);
      setSessionSource(null);
      setTerminalLogs(prev => [
        `[${new Date().toLocaleTimeString("vi-VN")}] [HOÀN TẤT] Tiến trình dọn dẹp đã hoàn thành!`,
        ...prev,
      ]);
      handleTriggerScan(true);
    });

    return () => {
      bgSource.close();
    };
  }, [token]);

  // 4. Quét toàn diện Dry-Run ban đầu
  const handleTriggerScan = async (refresh = false) => {
    if (!token) return;
    setIsScanning(true);
    setTerminalLogs(prev => [
      `[${new Date().toLocaleTimeString("vi-VN")}] [QUÉT HỆ THỐNG] Đang chạy phân tích ${refresh ? "làm mới " : ""}mô phỏng Mole dry-run...`,
      ...prev,
    ]);

    try {
      const res = await fetch(`/api/scan?token=${token}${refresh ? "&refresh=true" : ""}`);
      const data: ScanResult = await res.json();
      setScanResult(data);
      setTerminalLogs(prev => [
        `[${new Date().toLocaleTimeString("vi-VN")}] [HOÀN TẤT] Quét hoàn tất: Phát hiện ${data.totalSizeString} dung lượng rác có thể giải phóng.`,
        ...prev,
      ]);
    } catch (err: any) {
      setTerminalLogs(prev => [
        `[${new Date().toLocaleTimeString("vi-VN")}] [LỖI] Không thể quét hệ thống: ${err.message}`,
        ...prev,
      ]);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (token) {
      handleTriggerScan();
    }
  }, [token]);

  // 5. Kích hoạt dọn dẹp từ WebApp
  const handleExecuteClean = async (selectedIds: string[]) => {
    if (activeCleanSourceRef.current) {
      activeCleanSourceRef.current.close();
    }

    setIsCleaning(true);
    setSessionSource("web");
    setActiveCategoryId(null);

    // Đánh dấu các danh mục đã chọn sang trạng thái chờ/idle
    const initStatus: Record<string, CategoryRunStatus> = {};
    selectedIds.forEach(id => {
      initStatus[id] = "idle";
    });
    setCategoryStatuses(initStatus);

    setTerminalLogs(prev => [
      `[${new Date().toLocaleTimeString("vi-VN")}] [BẮT ĐẦU DỌN DẸP] Đang dọn ${selectedIds.length} danh mục đã chọn...`,
      ...prev,
    ]);

    const categoriesQuery = encodeURIComponent(selectedIds.join(","));
    const eventSource = new EventSource(`/api/stream/clean?token=${token}&categories=${categoriesQuery}&trigger=true`);
    activeCleanSourceRef.current = eventSource;

    eventSource.addEventListener("category_start", (event: any) => {
      try {
        const payload = JSON.parse(event.data);
        setActiveCategoryId(payload.categoryId);
        setCategoryStatuses(prev => ({ ...prev, [payload.categoryId]: "cleaning" }));
        setTerminalLogs(prev => [
          `[${payload.time || new Date().toLocaleTimeString("vi-VN")}] [ĐANG XỬ LÝ] ${payload.categoryName || payload.categoryId}`,
          ...prev,
        ]);
      } catch {}
    });

    eventSource.addEventListener("category_done", (event: any) => {
      try {
        const payload = JSON.parse(event.data);
        setCategoryStatuses(prev => ({ ...prev, [payload.categoryId]: "completed" }));
      } catch {}
    });

    eventSource.addEventListener("log", (event: any) => {
      try {
        const payload = JSON.parse(event.data);
        setTerminalLogs(prev => [`[${payload.time}] ${payload.line}`, ...prev]);
      } catch {}
    });

    eventSource.addEventListener("done", () => {
      eventSource.close();
      activeCleanSourceRef.current = null;
      setIsCleaning(false);
      setActiveCategoryId(null);
      setSessionSource(null);

      // Hiệu ứng pháo hoa ăn mừng chuẩn màu Apple
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#007AFF", "#5856D6", "#34C759", "#FF9500"],
      });

      // Quét lại hệ thống
      handleTriggerScan(true);
    });

    eventSource.onerror = () => {
      eventSource.close();
      activeCleanSourceRef.current = null;
      setIsCleaning(false);
      setActiveCategoryId(null);
      setSessionSource(null);
    };
  };

  // 6. Xả RAM nhanh từ nút bấm trên Dashboard
  const handleQuickPurgeRam = async () => {
    setIsPurgingRam(true);
    setTerminalLogs(prev => [
      `[${new Date().toLocaleTimeString("vi-VN")}] [PURGE RAM] Yêu cầu macOS giải phóng bộ nhớ không hoạt động...`,
      ...prev,
    ]);
    try {
      const res = await fetch(`/api/optimize?token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "purge_ram" }),
      });
      const data = await res.json();
      setTerminalLogs(prev => [
        `[${new Date().toLocaleTimeString("vi-VN")}] [PURGE RAM] ${data.message || "Đã giải phóng RAM"}`,
        ...prev,
      ]);
    } catch (err: any) {
      setTerminalLogs(prev => [
        `[${new Date().toLocaleTimeString("vi-VN")}] [LỖI] ${err.message}`,
        ...prev,
      ]);
    } finally {
      setIsPurgingRam(false);
    }
  };

  return (
    <div className="flex h-screen bg-macos-canvas text-macos-text-primary font-sans overflow-hidden select-none">
      {/* Sidebar Navigation */}
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} isScanning={isScanning} hasUpdate={hasUpdate} />

      {/* Main Content Viewport */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 pt-10">
        {currentTab === "dashboard" && (
          <Dashboard
            telemetry={telemetry}
            onTriggerScan={() => handleTriggerScan(true)}
            isScanning={isScanning}
            onQuickPurgeRam={handleQuickPurgeRam}
            isPurgingRam={isPurgingRam}
            terminalLogs={terminalLogs}
            reclaimableSize={scanResult?.totalSizeString || ""}
          />
        )}

        {currentTab === "clean" && (
          <CleanView
            scanResult={scanResult}
            isScanning={isScanning}
            onRunScan={() => handleTriggerScan(true)}
            onExecuteClean={handleExecuteClean}
            isCleaning={isCleaning}
            activeCategoryId={activeCategoryId}
            categoryStatuses={categoryStatuses}
            terminalLogs={terminalLogs}
            sessionSource={sessionSource}
            token={token}
          />
        )}

        {currentTab === "dev_purge" && (
          <DevPurgeView token={token} />
        )}

        {currentTab === "uninstaller" && (
          <UninstallView token={token} />
        )}

        {currentTab === "optimizer" && (
          <OptimizerView token={token} />
        )}

        {currentTab === "settings" && (
          <SettingsView token={token} />
        )}
      </main>
    </div>
  );
};

export default App;
