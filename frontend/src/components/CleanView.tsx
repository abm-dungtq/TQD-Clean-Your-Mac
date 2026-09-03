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
        <div className="p-4 rounded-2xl bg-macos-indigo-subtle border border-macos-indigo/30 text-macos-indigo flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Terminal className="w-5 h-5" />
            <div>
              <div className="font-bold text-sm text-macos-text-primary">ĐỒNG BỘ TIẾN TRÌNH TỪ TERMINAL HỆ THỐNG</div>
              <div className="text-xs text-macos-text-secondary">Đang phát hiện lệnh dọn dẹp chạy trực tiếp từ Terminal macOS (mo clean). Giao diện đang cập nhật thời gian thực.</div>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-white border border-macos-indigo/30 text-macos-indigo font-bold shadow-xs">Terminal Active</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-macos-border shadow-macos-card">
        <div>
          <h2 className="text-2xl font-bold text-macos-text-primary flex items-center gap-2 tracking-tight">
            <Trash2 className="w-6 h-6 text-macos-blue" />
            Dọn Dẹp Bộ Nhớ Đệm & Tệp Rác
          </h2>
          <p className="text-xs text-macos-text-secondary mt-1 font-sans">
            Quét và loại bỏ an toàn các tệp nhật ký, bộ đệm trình duyệt, tệp tạm hệ thống và ứng dụng.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRunScan}
            disabled={isScanning || isCleaning}
            className="px-4 py-2 rounded-full border border-macos-border bg-white hover:bg-gray-50 text-macos-text-primary text-xs font-semibold shadow-macos-card transition-all flex items-center gap-1.5 disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
            <span>{isScanning ? "Đang quét..." : "Quét Lại (Dry-Run)"}</span>
          </button>
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isCleaning || selectedCount === 0}
            className="px-5 py-2 rounded-full bg-macos-blue hover:bg-macos-blue-hover text-white font-semibold text-xs shadow-macos-button transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isCleaning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span>{activeCategoryObj ? `Đang dọn: ${activeCategoryObj.name.slice(0, 18)}...` : "Đang dọn dẹp..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Dọn Dẹp Ngay ({formatGb(selectedBytes)})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Stat (3 Cards) */}
      {scanResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-macos-border shadow-macos-card">
            <span className="text-xs font-medium text-macos-text-secondary uppercase tracking-wider">Tổng rác phát hiện</span>
            <div className="text-2xl font-bold text-macos-blue mt-1 tracking-tight">
              {scanResult.totalSizeString}
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-macos-border shadow-macos-card">
            <span className="text-xs font-medium text-macos-text-secondary uppercase tracking-wider">Mục đã chọn</span>
            <div className="text-2xl font-bold text-macos-indigo mt-1 tracking-tight">
              {selectedCount} / {scanResult.categories.length} danh mục
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-macos-border shadow-macos-card">
            <span className="text-xs font-medium text-macos-text-secondary uppercase tracking-wider">Dung lượng sẽ thu hồi</span>
            <div className="text-2xl font-bold text-macos-green mt-1 tracking-tight">
              {formatGb(selectedBytes)}
            </div>
          </div>
        </div>
      )}

      {/* Categories Checklist */}
      <div className="bg-white p-6 rounded-2xl border border-macos-border shadow-macos-card space-y-3">
        <div className="flex items-center justify-between text-xs font-medium text-macos-text-secondary uppercase tracking-wider pb-3 border-b border-macos-border/70">
          <span className="flex items-center gap-1.5 text-macos-text-primary font-bold">
            <ShieldCheck className="w-4 h-4 text-macos-green" /> Danh mục tệp dọn dẹp được bảo vệ
          </span>
          {isCleaning && activeCategoryObj && (
            <span className="text-macos-blue font-bold flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ĐANG XỬ LÝ: {activeCategoryObj.name}
            </span>
          )}
        </div>

        {!scanResult || scanResult.categories.length === 0 ? (
          <div className="text-center py-8 text-macos-text-secondary text-sm">
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
                    className={`relative overflow-hidden flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                      isActive
                        ? "bg-macos-blue-subtle border-macos-blue ring-1 ring-macos-blue cursor-default"
                        : isCompleted
                        ? "bg-macos-green-subtle/40 border-macos-green/30 cursor-default"
                        : isCleaning
                        ? "bg-gray-50 border-macos-border opacity-50 cursor-not-allowed"
                        : isSelected
                        ? "bg-macos-blue-subtle/30 border-macos-blue/40 shadow-xs cursor-pointer"
                        : "bg-white border-macos-border hover:border-macos-blue/30 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center space-x-3.5 pl-1">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                        isActive
                          ? "border-macos-blue bg-macos-blue text-white"
                          : isCompleted
                          ? "border-macos-green bg-macos-green text-white"
                          : isSelected
                          ? "bg-macos-blue border-macos-blue text-white"
                          : "border-[#C7C7CC] bg-white"
                      }`}>
                        {isActive ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        ) : isCompleted ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white stroke-[3]" />
                        ) : isSelected ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : null}
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-macos-text-primary flex items-center gap-2">
                          <span className={isActive ? "text-macos-blue font-bold" : ""}>{cat.name}</span>

                          {isActive ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-macos-blue text-white font-bold flex items-center gap-1">
                              ĐANG DỌN DẸP...
                            </span>
                          ) : isCompleted ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-macos-green-subtle text-[#248A3D] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              ĐÃ HOÀN THÀNH
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-macos-green-subtle text-[#248A3D] border border-macos-green/20">
                              ✓ An toàn
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-macos-text-secondary mt-0.5">{cat.description}</p>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div className={`text-sm font-bold ${isActive ? "text-macos-blue" : "text-macos-text-primary"}`}>
                        {cat.sizeString}
                      </div>
                      <div className="text-[11px] text-macos-text-caption">
                        {isCompleted ? "Đã giải phóng" : `${cat.itemCount} phần tử`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TẦNG 2: HỆ THỐNG SÂU (YÊU CẦU TOUCH ID / FDA) */}
            {scanResult.categories.some(c => c.tier === 2) && (
              <div className="pt-4 border-t border-macos-border/70 space-y-2.5">
                <div className="flex items-center justify-between pb-1">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-macos-indigo tracking-wider uppercase">
                    <Fingerprint className="w-4 h-4 text-macos-indigo" />
                    Tối Ưu Hóa Hệ Thống Sâu (Yêu Cầu Quyền Quản Trị / FDA)
                  </span>
                  <button
                    onClick={handleOpenFDA}
                    disabled={openingFDA}
                    className="text-[11px] font-semibold text-macos-blue hover:underline bg-macos-blue-subtle px-2.5 py-1 rounded-lg transition-all flex items-center gap-1"
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
                      className={`relative overflow-hidden flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                        isActive
                          ? "bg-macos-blue-subtle border-macos-blue ring-1 ring-macos-blue cursor-default"
                          : isCompleted
                          ? "bg-macos-green-subtle/40 border-macos-green/30 cursor-default"
                          : isCleaning
                          ? "bg-gray-50 border-macos-border opacity-50 cursor-not-allowed"
                          : isSelected
                          ? "bg-macos-indigo-subtle/40 border-macos-indigo/50 shadow-xs cursor-pointer"
                          : "bg-white border-macos-border hover:border-macos-indigo/30 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center space-x-3.5 pl-1">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          isActive
                            ? "border-macos-blue bg-macos-blue text-white"
                            : isCompleted
                            ? "border-macos-green bg-macos-green text-white"
                            : isSelected
                            ? "bg-macos-indigo border-macos-indigo text-white"
                            : "border-[#C7C7CC] bg-white"
                        }`}>
                          {isActive ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                          ) : isCompleted ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-white stroke-[3]" />
                          ) : isSelected ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : null}
                        </div>

                        <div>
                          <div className="text-sm font-semibold text-macos-text-primary flex items-center gap-2">
                            <span className={isActive ? "text-macos-blue font-bold" : ""}>{cat.name}</span>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-macos-indigo-subtle text-macos-indigo border border-macos-indigo/20 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              Touch ID / Admin
                            </span>
                          </div>
                          <p className="text-xs text-macos-text-secondary mt-0.5">{cat.description}</p>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className={`text-sm font-bold ${isActive ? "text-macos-blue" : "text-macos-text-primary"}`}>
                          {cat.sizeString}
                        </div>
                        <div className="text-[11px] text-macos-text-caption">
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

      {/* Embedded Activity Feed on CleanView */}
      <div className="bg-white rounded-2xl p-5 border border-macos-border shadow-macos-card space-y-3">
        <div className="flex items-center justify-between border-b border-macos-border/70 pb-3">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-macos-blue" />
            <h3 className="font-bold text-sm text-macos-text-primary">
              Nhật Ký Dọn Dẹp Trực Tiếp (Mole Activity Console)
            </h3>
          </div>
          {isCleaning && (
            <span className="flex items-center gap-1.5 text-xs text-macos-blue font-medium">
              <Loader2 className="w-3 h-3 animate-spin" />
              Đang kết nối Mole Engine...
            </span>
          )}
        </div>

        <div
          ref={logContainerRef}
          className="h-44 overflow-y-auto rounded-xl bg-[#F9F9FB] p-3.5 border border-macos-border font-mono text-xs text-macos-text-primary space-y-1.5"
        >
          {terminalLogs.length === 0 ? (
            <div className="text-macos-text-secondary italic py-2">Chờ nhận tín hiệu từ Terminal...</div>
          ) : (
            terminalLogs.slice(0, 60).map((log, idx) => (
              <div key={idx} className="flex items-start space-x-2 leading-relaxed">
                <span className="text-macos-blue select-none">›</span>
                <span className={log.includes("[LỖI]") || log.includes("[CẢNH BÁO]") ? "text-macos-red font-semibold" : log.includes("[ĐANG XỬ LÝ]") || log.includes("[TIẾN TRÌNH]") ? "text-macos-blue font-bold" : log.includes("[HOÀN TẤT]") ? "text-macos-green font-bold" : "text-macos-text-primary"}>
                  {log}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full border border-macos-border shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-macos-amber">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-lg text-macos-text-primary">Xác nhận dọn dẹp hệ thống</h3>
            </div>
            <p className="text-sm text-macos-text-secondary leading-relaxed">
              Bạn sắp tiến hành dọn dẹp <strong className="text-macos-text-primary">{selectedCount} danh mục</strong> đã chọn với tổng dung lượng giải phóng dự kiến là <strong className="text-macos-blue">{formatGb(selectedBytes)}</strong>.
            </p>
            <div className="p-3.5 rounded-xl bg-[#F9F9FB] border border-macos-border text-xs text-macos-text-secondary space-y-1.5">
              <div className="text-macos-text-primary font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-macos-green" /> Cơ chế an toàn được kích hoạt:
              </div>
              <div>• Danh sách loại trừ (Whitelist) sẽ được bảo vệ tuyệt đối.</div>
              <div>• Thao tác dọn dẹp được ghi nhật ký đầy đủ vào operations.log.</div>
            </div>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-macos-text-secondary hover:text-macos-text-primary hover:bg-gray-100 transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleStartClean}
                className="px-5 py-2 rounded-xl bg-macos-blue hover:bg-macos-blue-hover text-white font-semibold text-xs shadow-macos-button transition-all flex items-center gap-1.5"
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
