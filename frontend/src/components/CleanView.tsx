import React, { useState, useEffect, useRef } from "react";
import {
  Trash2,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Check,
  Loader2,
  CheckCircle2,
  Terminal,
  Lock,
  ExternalLink,
  Fingerprint,
} from "lucide-react";
import { ScanResult, CategoryRunStatus, ScanCategoryItem } from "../types";

interface CleanViewProps {
  scanResult: ScanResult | null;
  isScanning: boolean;
  onRunScan: () => void;
  onExecuteClean: (selectedIds: string[]) => void;
  isCleaning: boolean;
  activeCategoryId?: string | null;
  categoryStatuses?: Record<string, CategoryRunStatus>;
  terminalLogs?: string[];
  sessionSource?: "web" | "terminal" | null;
  token?: string;
}

export const CleanView: React.FC<CleanViewProps> = ({
  scanResult,
  isScanning,
  onRunScan,
  onExecuteClean,
  isCleaning,
  activeCategoryId,
  categoryStatuses = {},
  terminalLogs = [],
  sessionSource,
  token,
}) => {
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [openingFDA, setOpeningFDA] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Khởi tạo các mục được chọn mặc định: Chỉ chọn Tier 1 (Safe User Space) để người dùng có thể dọn 1-click ngay mà không bị hỏi quyền
  useEffect(() => {
    if (scanResult) {
      const initial: Record<string, boolean> = {};
      scanResult.categories.forEach(c => {
        initial[c.id] = c.tier !== 2 && c.safe;
      });
      setSelectedIds(initial);
    }
  }, [scanResult]);

  const handleOpenFDA = async () => {
    setOpeningFDA(true);
    try {
      await fetch(`/api/open-fda?token=${token || ""}`, { method: "POST" });
    } catch {}
    setTimeout(() => setOpeningFDA(false), 2500);
  };

  // Tự động cuộn log console khi có log mới
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [terminalLogs]);

  const toggleSelect = (id: string) => {
    if (isCleaning) return;
    setSelectedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedCount = Object.values(selectedIds).filter(Boolean).length;
  const selectedBytes = (scanResult?.categories || [])
    .filter(c => selectedIds[c.id])
    .reduce((sum, c) => sum + c.sizeBytes, 0);

  const formatGb = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleStartClean = () => {
    setShowConfirmModal(false);
    const ids = Object.keys(selectedIds).filter(id => selectedIds[id]);
    onExecuteClean(ids);
  };

  // Xác định tên danh mục đang hoạt động
  const activeCategoryObj = scanResult?.categories.find(c => c.id === activeCategoryId);

  return (
    <div className="space-y-6 pb-12">
      {/* Banner thông báo đồng bộ từ Terminal ngoài nếu có */}
      {sessionSource === "terminal" && (
        <div className="p-4 rounded-2xl bg-cyber-purple/15 border border-cyber-purple/40 text-cyber-purple flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-3">
            <Terminal className="w-5 h-5 animate-bounce" />
            <div>
              <div className="font-hud font-bold text-sm text-white">ĐỒNG BỘ TIẾN TRÌNH TỪ TERMINAL HỆ THỐNG</div>
              <div className="text-xs text-[#b9cacb]">Đang phát hiện lệnh dọn dẹp chạy trực tiếp từ Terminal macOS (mo clean). Giao diện đang cập nhật thời gian thực.</div>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-cyber-purple/30 border border-cyber-purple/50 text-white">Terminal Active</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-cyber-cyan/20">
        <div>
          <h2 className="text-2xl font-hud font-bold text-white flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-cyber-cyan" />
            DỌN DẸP BỘ NHỚ ĐỆM & TỆP RÁC
          </h2>
          <p className="text-sm text-[#b9cacb] mt-1 font-sans">
            Quét và loại bỏ an toàn các tệp nhật ký, bộ đệm trình duyệt, tệp tạm hệ thống và ứng dụng.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRunScan}
            disabled={isScanning || isCleaning}
            className="px-4 py-2.5 rounded-xl border border-cyber-cyan/40 bg-cyber-cyan/10 hover:bg-cyber-cyan hover:text-black text-cyber-cyan text-sm font-mono font-bold transition-all flex items-center gap-2 disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} />
            {isScanning ? "Đang quét..." : "Quét Lại (Dry-Run)"}
          </button>
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isCleaning || selectedCount === 0}
            className="px-6 py-2.5 rounded-xl bg-cyber-cyan hover:bg-white text-black font-hud font-bold text-sm shadow-neon-cyan transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isCleaning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>{activeCategoryObj ? `Đang dọn: ${activeCategoryObj.name.slice(0, 18)}...` : "Đang dọn dẹp..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Dọn Dẹp Ngay ({formatGb(selectedBytes)})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Stat */}
      {scanResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-panel p-4 rounded-xl border border-surface-border">
            <span className="text-xs font-mono text-[#849495] uppercase">Tổng rác phát hiện</span>
            <div className="text-2xl font-hud font-bold text-cyber-cyan mt-1">
              {scanResult.totalSizeString}
            </div>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-surface-border">
            <span className="text-xs font-mono text-[#849495] uppercase">Mục đã chọn</span>
            <div className="text-2xl font-hud font-bold text-cyber-purple mt-1">
              {selectedCount} / {scanResult.categories.length} danh mục
            </div>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-surface-border">
            <span className="text-xs font-mono text-[#849495] uppercase">Dung lượng sẽ thu hồi</span>
            <div className="text-2xl font-hud font-bold text-cyber-green mt-1">
              {formatGb(selectedBytes)}
            </div>
          </div>
        </div>
      )}

      {/* Categories Checklist */}
      <div className="glass-panel p-6 rounded-2xl border border-surface-border space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-[#849495] uppercase tracking-wider pb-2 border-b border-surface-border">
          <span className="flex items-center gap-1.5 text-cyber-green">
            <ShieldCheck className="w-4 h-4" /> Danh mục tệp dọn dẹp được bảo vệ
          </span>
          {isCleaning && activeCategoryObj && (
            <span className="text-cyber-cyan animate-pulse font-bold">
              ⚡ ĐANG XỬ LÝ: {activeCategoryObj.name}
            </span>
          )}
        </div>

        {!scanResult || scanResult.categories.length === 0 ? (
          <div className="text-center py-8 text-[#849495] font-mono text-sm">
            {isScanning ? "Đang phân tích các thành phần rác trên hệ thống..." : "Không tìm thấy tệp rác nào cần dọn dẹp."}
          </div>
        ) : (
          <>
            {/* TẦNG 1: USER SPACE (KHÔNG CẦN QUYỀN) */}
            <div className="space-y-2.5">
              {scanResult.categories.filter(c => c.tier !== 2).map(cat => {
                const isSelected = !!selectedIds[cat.id];
                const status = categoryStatuses[cat.id] || "idle";
                const isActive = activeCategoryId === cat.id || status === "cleaning";
                const isCompleted = status === "completed";

                return (
                  <div
                    key={cat.id}
                    onClick={() => toggleSelect(cat.id)}
                    className={`relative overflow-hidden flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                      isActive
                        ? "bg-cyber-cyan/15 border-cyber-cyan shadow-[0_0_20px_rgba(0,242,255,0.4)] ring-1 ring-cyber-cyan animate-pulse cursor-default"
                        : isCompleted
                        ? "bg-cyber-green/10 border-cyber-green/40 opacity-90 cursor-default"
                        : isCleaning
                        ? "bg-surface-card border-surface-border opacity-50 cursor-not-allowed"
                        : isSelected
                        ? "bg-cyber-cyan/10 border-cyber-cyan/40 shadow-neon-cyan/20 cursor-pointer"
                        : "bg-surface-card border-surface-border hover:border-cyber-cyan/20 opacity-70 cursor-pointer"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-cyber-cyan animate-pulse" />
                    )}

                    <div className="flex items-center space-x-3.5 pl-1">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                        isActive
                          ? "border-cyber-cyan bg-cyber-cyan/20 text-cyber-cyan"
                          : isCompleted
                          ? "border-cyber-green bg-cyber-green text-black"
                          : isSelected
                          ? "bg-cyber-cyan border-cyber-cyan text-black"
                          : "border-[#849495]"
                      }`}>
                        {isActive ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyber-cyan" />
                        ) : isCompleted ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-black stroke-[3]" />
                        ) : isSelected ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : null}
                      </div>

                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          <span className={isActive ? "text-cyber-cyan font-bold" : ""}>{cat.name}</span>

                          {isActive ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyber-cyan/30 text-cyber-cyan border border-cyber-cyan/50 animate-pulse font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan animate-ping" />
                              ĐANG DỌN DẸP...
                            </span>
                          ) : isCompleted ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyber-green/20 text-cyber-green border border-cyber-green/40 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              ĐÃ HOÀN THÀNH
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyber-green/20 text-cyber-green border border-cyber-green/30">
                              ✓ Không cần quyền
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#849495] mt-0.5">{cat.description}</p>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div className={`text-sm font-bold ${isActive ? "text-cyber-cyan" : "text-white"}`}>
                        {cat.sizeString}
                      </div>
                      <div className="text-[11px] text-[#849495]">
                        {isCompleted ? "Đã giải phóng" : `${cat.itemCount} phần tử`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TẦNG 2: HỆ THỐNG SÂU (YÊU CẦU TOUCH ID / FDA) */}
            {scanResult.categories.some(c => c.tier === 2) && (
              <div className="pt-4 border-t border-surface-border/70 space-y-2.5">
                <div className="flex items-center justify-between pb-1">
                  <span className="flex items-center gap-1.5 text-xs font-mono text-cyber-purple font-bold tracking-wider uppercase">
                    <Fingerprint className="w-4 h-4 text-cyber-purple" />
                    Tối Ưu Hóa Hệ Thống Sâu (Yêu Cầu Touch ID / FDA)
                  </span>
                  <button
                    onClick={handleOpenFDA}
                    disabled={openingFDA}
                    className="text-[11px] font-mono text-cyber-cyan hover:text-white bg-cyber-cyan/10 hover:bg-cyber-cyan/20 border border-cyber-cyan/30 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {openingFDA ? "Đang mở Cài đặt..." : "Mở Cài Đặt FDA"}
                  </button>
                </div>

                {scanResult.categories.filter(c => c.tier === 2).map(cat => {
                  const isSelected = !!selectedIds[cat.id];
                  const status = categoryStatuses[cat.id] || "idle";
                  const isActive = activeCategoryId === cat.id || status === "cleaning";
                  const isCompleted = status === "completed";

                  return (
                    <div
                      key={cat.id}
                      onClick={() => toggleSelect(cat.id)}
                      className={`relative overflow-hidden flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                        isActive
                          ? "bg-cyber-cyan/15 border-cyber-cyan shadow-[0_0_20px_rgba(0,242,255,0.4)] ring-1 ring-cyber-cyan animate-pulse cursor-default"
                          : isCompleted
                          ? "bg-cyber-green/10 border-cyber-green/40 opacity-90 cursor-default"
                          : isCleaning
                          ? "bg-surface-card border-surface-border opacity-50 cursor-not-allowed"
                          : isSelected
                          ? "bg-cyber-purple/15 border-cyber-purple/40 shadow-[0_0_15px_rgba(188,19,254,0.2)] cursor-pointer"
                          : "bg-surface-card border-surface-border hover:border-cyber-purple/30 opacity-70 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center space-x-3.5 pl-1">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          isActive
                            ? "border-cyber-cyan bg-cyber-cyan/20 text-cyber-cyan"
                            : isCompleted
                            ? "border-cyber-green bg-cyber-green text-black"
                            : isSelected
                            ? "bg-cyber-purple border-cyber-purple text-white"
                            : "border-[#849495]"
                        }`}>
                          {isActive ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyber-cyan" />
                          ) : isCompleted ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-black stroke-[3]" />
                          ) : isSelected ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : null}
                        </div>

                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            <span className={isActive ? "text-cyber-cyan font-bold" : ""}>{cat.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/40 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              Touch ID / Admin
                            </span>
                          </div>
                          <p className="text-xs text-[#849495] mt-0.5">{cat.description}</p>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className={`text-sm font-bold ${isActive ? "text-cyber-cyan" : "text-white"}`}>
                          {cat.sizeString}
                        </div>
                        <div className="text-[11px] text-[#849495]">
                          {isCompleted ? "Đã giải phóng" : `${cat.itemCount} phần tử`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Embedded Terminal Stream Drawer on CleanView */}
      <div className="glass-panel rounded-2xl p-5 border border-cyber-cyan/30 space-y-3">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-cyber-cyan" />
            <h3 className="font-hud font-bold text-sm text-white uppercase tracking-wider">
              Dòng Hoạt Động Terminal Thời Gian Thực (Activity Console)
            </h3>
          </div>
          {isCleaning && (
            <span className="flex items-center gap-1.5 text-xs font-mono text-cyber-cyan">
              <span className="w-2 h-2 rounded-full bg-cyber-cyan animate-ping" />
              Đang kết nối Mole Engine...
            </span>
          )}
        </div>

        <div
          ref={logContainerRef}
          className="h-44 overflow-y-auto rounded-xl bg-[#030303] p-3.5 border border-surface-border font-mono text-xs text-[#b9cacb] space-y-1.5"
        >
          {terminalLogs.length === 0 ? (
            <div className="text-[#849495] italic">Chờ nhận tín hiệu từ Terminal...</div>
          ) : (
            terminalLogs.slice(0, 60).map((log, idx) => (
              <div key={idx} className="flex items-start space-x-2 leading-relaxed">
                <span className="text-cyber-cyan select-none">›</span>
                <span className={log.includes("[LỖI]") || log.includes("[CẢNH BÁO]") ? "text-cyber-amber" : log.includes("[ĐANG XỬ LÝ]") || log.includes("[TIẾN TRÌNH]") ? "text-cyber-cyan font-bold" : log.includes("[HOÀN TẤT]") ? "text-cyber-green font-bold" : "text-[#b9cacb]"}>
                  {log}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-cyber-cyan/40 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-cyber-cyan">
              <AlertTriangle className="w-6 h-6 text-cyber-amber" />
              <h3 className="font-hud font-bold text-lg text-white">Xác nhận dọn dẹp hệ thống</h3>
            </div>
            <p className="text-sm text-[#b9cacb] leading-relaxed">
              Bạn sắp tiến hành dọn dẹp <strong className="text-cyber-green">{selectedCount} danh mục</strong> đã chọn với tổng dung lượng giải phóng dự kiến là <strong className="text-cyber-cyan">{formatGb(selectedBytes)}</strong>.
            </p>
            <div className="p-3 rounded-lg bg-surface border border-surface-border text-xs text-[#849495] font-mono space-y-1">
              <div className="text-white font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyber-green" /> Cơ chế an toàn được kích hoạt:
              </div>
              <div>• Danh sách loại trừ (Whitelist) sẽ được bỏ qua tuyệt đối.</div>
              <div>• Thao tác được ghi nhật ký vào operations.log.</div>
            </div>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-mono text-[#849495] hover:text-white hover:bg-surface transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleStartClean}
                className="px-5 py-2 rounded-xl bg-cyber-cyan hover:bg-white text-black font-hud font-bold text-sm shadow-neon-cyan transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" /> Bắt đầu dọn dẹp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CleanView;
