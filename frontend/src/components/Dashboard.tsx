import React from "react";
import { 
  Cpu, 
  HardDrive, 
  Zap, 
  Activity, 
  Battery, 
  Terminal as TerminalIcon, 
  RefreshCw,
  Sparkles,
  Layers
} from "lucide-react";
import { SystemTelemetry } from "../types";

interface DashboardProps {
  telemetry: SystemTelemetry | null;
  onTriggerScan: () => void;
  isScanning: boolean;
  onQuickPurgeRam: () => void;
  isPurgingRam: boolean;
  terminalLogs: string[];
  reclaimableSize: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  telemetry,
  onTriggerScan,
  isScanning,
  onQuickPurgeRam,
  isPurgingRam,
  terminalLogs,
  reclaimableSize,
}) => {
  const formatGb = (bytes: number) => (bytes / (1024 * 1024 * 1024)).toFixed(1);

  const healthScore = telemetry?.healthScore ?? 92;
  const healthStatus = telemetry?.healthStatus || (healthScore >= 85 ? "Hệ thống Tối ưu" : healthScore >= 60 ? "Cần Chú Ý" : "Cần Dọn Dẹp Ngay");

  // Tính toán stroke dash cho vòng tròn điểm sức khỏe (bán kính 38, chu vi ~ 238.76)
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Action Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-macos-text-primary tracking-tight">Tổng quan hệ thống</h2>
          <p className="text-xs text-macos-text-secondary mt-0.5">Giám sát tài nguyên và bảo trì hiệu năng macOS</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onQuickPurgeRam}
            disabled={isPurgingRam}
            className="px-4 py-2 rounded-full bg-white hover:bg-[#F9F9FB] text-macos-text-primary border border-macos-border text-xs font-semibold shadow-macos-card transition-all flex items-center gap-1.5 active:scale-98"
            title="Giải phóng bộ nhớ RAM không hoạt động"
          >
            <Zap className="w-3.5 h-3.5 text-macos-amber" />
            <span>{isPurgingRam ? "Đang xả..." : "XẢ RAM NHANH"}</span>
          </button>

          <button
            onClick={onTriggerScan}
            disabled={isScanning}
            className="px-5 py-2 rounded-full bg-macos-blue hover:bg-macos-blue-hover text-white text-xs font-semibold shadow-macos-button transition-all flex items-center gap-2 active:scale-98"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
            <span>{isScanning ? "Đang phân tích..." : "QUÉT TOÀN BỘ HỆ THỐNG"}</span>
          </button>
        </div>
      </div>

      {/* Hero Health Score Card (Stitch Cupertino Style) */}
      <div className="bg-white border border-macos-border rounded-2xl p-6 shadow-macos-card flex flex-col md:flex-row items-center gap-6 md:gap-8">
        {/* Circular Gauge */}
        <div className="relative flex items-center justify-center shrink-0 w-28 h-28">
          <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="text-[#E5E5EA]"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Progress Arc */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="text-macos-blue transition-all duration-1000 ease-out"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-macos-text-primary tracking-tight">{healthScore}</span>
            <span className="text-[11px] font-medium text-macos-text-secondary">/ 100</span>
          </div>
        </div>

        {/* Health Description & Details */}
        <div className="flex-1 text-center md:text-left space-y-1.5">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
            <h3 className="text-xl font-bold text-macos-text-primary">{healthStatus}</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-macos-green-subtle text-[#248A3D] border border-macos-green/20">
              Ổn định
            </span>
          </div>
          <p className="text-xs text-macos-text-secondary leading-relaxed max-w-2xl">
            Mac của bạn đang trong tình trạng hoạt động tối ưu. Hệ thống phân tích không phát hiện mối đe dọa hoặc rác nghiêm trọng. Các tiến trình nền đang sử dụng tài nguyên cân bằng.
          </p>
          {reclaimableSize && (
            <div className="pt-1 flex items-center gap-2">
              <span className="text-xs text-macos-text-secondary">Dung lượng có thể giải phóng:</span>
              <span className="text-xs font-bold text-macos-blue bg-macos-blue-subtle px-2 py-0.5 rounded-md">
                ~{reclaimableSize}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Realtime Telemetry Grid (4 Cupertino Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Card */}
        <div className="bg-white rounded-2xl p-5 border border-macos-border shadow-macos-card hover:shadow-macos-card-hover transition-all relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-macos-text-secondary text-xs font-medium mb-3">
              <span className="flex items-center gap-1.5 text-macos-text-primary font-semibold">
                <Cpu className="w-4 h-4 text-macos-blue shrink-0" /> CPU
              </span>
              <span className="text-[11px] font-mono text-macos-text-caption">Apple Silicon</span>
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-3xl font-bold text-macos-text-primary tracking-tight">
                {telemetry?.cpu.totalUsage ?? 0}<span className="text-sm font-normal text-macos-text-secondary">%</span>
              </span>
              <span className="text-xs text-macos-text-secondary font-mono font-medium">
                User: {telemetry?.cpu.user ?? 0}%
              </span>
            </div>
            
            {/* Sparkline Wave SVG */}
            <div className="h-8 w-full my-1">
              <svg className="w-full h-full" viewBox="0 0 100 25" preserveAspectRatio="none">
                <path
                  d="M0,20 Q20,24 35,12 T70,16 T100,6"
                  fill="none"
                  stroke="#007AFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          <div className="pt-2 border-t border-macos-border/60 text-[11px] text-macos-text-secondary flex justify-between">
            <span>System: {telemetry?.cpu.system ?? 0}%</span>
            <span>Idle: {telemetry?.cpu.idle ?? 0}%</span>
          </div>
        </div>

        {/* RAM Card */}
        <div className="bg-white rounded-2xl p-5 border border-macos-border shadow-macos-card hover:shadow-macos-card-hover transition-all relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-macos-text-secondary text-xs font-medium mb-3">
              <span className="flex items-center gap-1.5 text-macos-text-primary font-semibold">
                <Layers className="w-4 h-4 text-macos-indigo shrink-0" /> RAM
              </span>
              <span className="text-[11px] font-mono text-macos-text-caption">
                {telemetry ? formatGb(telemetry.memory.totalBytes) : 0} GB
              </span>
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-3xl font-bold text-macos-text-primary tracking-tight">
                {telemetry?.memory.usagePercent ?? 0}<span className="text-sm font-normal text-macos-text-secondary">%</span>
              </span>
              <span className="text-xs text-macos-text-secondary font-mono">
                {telemetry ? formatGb(telemetry.memory.usedBytes) : 0} GB dùng
              </span>
            </div>
            
            {/* Apple Progress Bar */}
            <div className="w-full bg-[#E5E5EA] rounded-full h-2 overflow-hidden my-2">
              <div 
                className="bg-macos-amber h-full rounded-full transition-all duration-500"
                style={{ width: `${telemetry?.memory.usagePercent ?? 0}%` }}
              ></div>
            </div>
          </div>

          <div className="pt-2 border-t border-macos-border/60 text-[11px] text-macos-text-secondary flex justify-between items-center">
            <span>Active: {telemetry ? formatGb(telemetry.memory.activeBytes) : 0} GB</span>
            <span>Free: {telemetry ? formatGb(telemetry.memory.freeBytes) : 0} GB</span>
          </div>
        </div>

        {/* SSD Card */}
        <div className="bg-white rounded-2xl p-5 border border-macos-border shadow-macos-card hover:shadow-macos-card-hover transition-all relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-macos-text-secondary text-xs font-medium mb-3">
              <span className="flex items-center gap-1.5 text-macos-text-primary font-semibold">
                <HardDrive className="w-4 h-4 text-macos-blue shrink-0" /> Ổ CỨNG SSD
              </span>
              <span className="text-[11px] font-mono text-macos-text-caption">APFS</span>
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-3xl font-bold text-macos-text-primary tracking-tight">
                {telemetry?.disk.usagePercent ?? 0}<span className="text-sm font-normal text-macos-text-secondary">%</span>
              </span>
              <span className="text-xs font-semibold text-macos-blue font-sans">
                {telemetry ? formatGb(telemetry.disk.availableBytes) : 0} GB trống
              </span>
            </div>

            {/* Apple Progress Bar */}
            <div className="w-full bg-[#E5E5EA] rounded-full h-2 overflow-hidden my-2">
              <div 
                className="bg-macos-blue h-full rounded-full transition-all duration-500"
                style={{ width: `${telemetry?.disk.usagePercent ?? 0}%` }}
              ></div>
            </div>
          </div>

          <div className="pt-2 border-t border-macos-border/60 text-[11px] text-macos-text-secondary flex justify-between items-center">
            <span>Đã dùng: {telemetry ? formatGb(telemetry.disk.usedBytes) : 0} GB</span>
            <span>Tổng: {telemetry ? formatGb(telemetry.disk.totalBytes) : 0} GB</span>
          </div>
        </div>

        {/* Battery Card */}
        <div className="bg-white rounded-2xl p-5 border border-macos-border shadow-macos-card hover:shadow-macos-card-hover transition-all relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-macos-text-secondary text-xs font-medium mb-3">
              <span className="flex items-center gap-1.5 text-macos-text-primary font-semibold">
                <Battery className="w-4 h-4 text-macos-green shrink-0" /> PIN & NGUỒN
              </span>
              <span className="text-[11px] font-medium text-[#248A3D] bg-macos-green-subtle px-2 py-0.5 rounded-full">
                {telemetry?.battery?.isCharging ? "Đang sạc" : "Tuyệt vời"}
              </span>
            </div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-3xl font-bold text-macos-text-primary tracking-tight">
                {telemetry?.battery?.percentage ?? 100}<span className="text-sm font-normal text-macos-text-secondary">%</span>
              </span>
              <span className="text-xs text-macos-text-secondary font-medium">
                {telemetry?.battery?.source || "Pin nguồn"}
              </span>
            </div>

            {/* Apple Progress Bar */}
            <div className="w-full bg-[#E5E5EA] rounded-full h-2 overflow-hidden my-2">
              <div 
                className="bg-macos-green h-full rounded-full transition-all duration-500"
                style={{ width: `${telemetry?.battery?.percentage ?? 100}%` }}
              ></div>
            </div>
          </div>

          <div className="pt-2 border-t border-macos-border/60 text-[11px] text-macos-text-secondary flex justify-between items-center">
            <span>Tình trạng: Bình thường</span>
            <span>Chu kỳ: Ổn định</span>
          </div>
        </div>
      </div>

      {/* Activity Stream Card (Cupertino Activity Feed) */}
      <div className="bg-white rounded-2xl p-6 border border-macos-border shadow-macos-card">
        <div className="flex items-center justify-between border-b border-macos-border/70 pb-3.5 mb-2">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-macos-blue" />
            <h3 className="text-sm font-bold text-macos-text-primary">
              Hoạt động hệ thống
            </h3>
          </div>
          <span className="text-xs text-macos-text-secondary font-medium">
            {terminalLogs.length} sự kiện gần đây
          </span>
        </div>

        <div className="divide-y divide-macos-border/60 max-h-56 overflow-y-auto">
          {terminalLogs.length === 0 ? (
            <div className="py-6 text-center text-macos-text-secondary text-xs italic">
              Đang lắng nghe tiến trình Mole Core... Chưa có hoạt động nào phát sinh.
            </div>
          ) : (
            terminalLogs.slice(0, 15).map((log, idx) => {
              const isSuccess = log.includes("[HOÀN TẤT]");
              const isAlert = log.includes("[CẢNH BÁO]") || log.includes("[LỖI]");
              const isAction = log.includes("[QUÉT]") || log.includes("[PURGE]") || log.includes("[DỌN]");

              return (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs hover:bg-[#F9F9FB] px-2 rounded-lg transition-colors">
                  <div className="flex items-center space-x-2.5 min-w-0 pr-4">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      isSuccess ? "bg-macos-green" : isAlert ? "bg-macos-red" : isAction ? "bg-macos-blue" : "bg-[#AEAEB2]"
                    }`}></span>
                    <span className="font-sans text-macos-text-primary truncate">
                      {log}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-macos-text-caption shrink-0">
                    Gần đây
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
