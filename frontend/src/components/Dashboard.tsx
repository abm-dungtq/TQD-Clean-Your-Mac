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
  let healthColor = "text-cyber-green border-cyber-green/40 bg-cyber-green/10";
  if (healthScore < 60) healthColor = "text-cyber-red border-cyber-red/40 bg-cyber-red/10";
  else if (healthScore < 85) healthColor = "text-cyber-amber border-cyber-amber/40 bg-cyber-amber/10";

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Hero Radar & Health Score */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-8 border border-cyber-cyan/20">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-cyber-cyan/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-cyber-purple/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Left Text */}
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-cyber-cyan/30 bg-cyber-cyan/5 text-xs font-mono text-cyber-cyan">
              <span className="w-2 h-2 rounded-full bg-cyber-cyan animate-ping"></span>
              <span>CHẾ ĐỘ GIÁM SÁT THỜI GIAN THỰC</span>
            </div>
            <h2 className="text-3xl font-hud font-bold text-white tracking-wide">
              BẢNG ĐIỀU KHIỂN HỆ THỐNG
            </h2>
            <p className="text-sm text-[#b9cacb] leading-relaxed font-sans">
              Dọn dẹp tệp rác, giải phóng bộ nhớ RAM, gỡ bỏ tàn dư ứng dụng mồ côi và tối ưu hóa hiệu năng macOS của bạn dựa trên động cơ Mole Core.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className={`px-4 py-2 rounded-xl border font-mono text-sm font-bold flex items-center gap-2 ${healthColor}`}>
                <Activity className="w-4 h-4" />
                <span>Điểm Sức Khỏe: {healthScore}/100</span>
                <span className="text-xs font-normal">({telemetry?.healthStatus || "TỐI ƯU"})</span>
              </div>
              {reclaimableSize && (
                <div className="px-4 py-2 rounded-xl border border-cyber-purple/40 bg-cyber-purple/10 font-mono text-sm text-cyber-purple flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Có thể giải phóng: ~{reclaimableSize}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Radar Scanning Button */}
          <div className="relative flex items-center justify-center">
            {/* Concentric Pulsing Radar Rings */}
            <div className="relative flex items-center justify-center w-52 h-52">
              <div className={`absolute inset-0 rounded-full border border-cyber-cyan/20 ${isScanning ? "animate-ping" : ""}`}></div>
              <div className="absolute inset-3 rounded-full border border-cyber-cyan/30"></div>
              <div className="absolute inset-8 rounded-full border border-dashed border-cyber-cyan/40 animate-radar-spin"></div>
              <div className="absolute inset-14 rounded-full border border-cyber-purple/30"></div>

              {/* Central Trigger Button */}
              <button
                onClick={onTriggerScan}
                disabled={isScanning}
                className={`relative z-20 w-32 h-32 rounded-full flex flex-col items-center justify-center font-hud font-bold text-center transition-all transform active:scale-95 shadow-2xl ${
                  isScanning
                    ? "bg-cyber-cyan/20 text-cyber-cyan border-2 border-cyber-cyan shadow-neon-cyan cursor-wait"
                    : "bg-void hover:bg-cyber-cyan/15 text-white hover:text-cyber-cyan border-2 border-cyber-cyan hover:shadow-neon-cyan group cursor-pointer"
                }`}
              >
                <RefreshCw className={`w-8 h-8 mb-1.5 transition-transform duration-700 ${isScanning ? "animate-spin text-cyber-cyan" : "group-hover:rotate-180 text-cyber-cyan"}`} />
                <span className="text-[11px] uppercase tracking-wider font-bold">
                  {isScanning ? "Đang quét..." : "QUÉT TOÀN DIỆN"}
                </span>
                <span className="text-[9px] text-[#849495] font-mono tracking-tighter mt-0.5">
                  {isScanning ? "Vui lòng đợi" : "1-Click Scan"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Realtime Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Card */}
        <div className="glass-panel glass-panel-hover rounded-xl p-5 border border-cyber-cyan/20 relative overflow-hidden">
          <div className="flex items-center justify-between text-[#849495] text-xs font-mono mb-3">
            <span className="flex items-center gap-1.5 text-cyber-cyan">
              <Cpu className="w-4 h-4" /> VI XỬ LÝ (CPU)
            </span>
            <span>[CPU_CORE]</span>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-3xl font-hud font-bold text-white">
              {telemetry?.cpu.totalUsage ?? 0}<span className="text-sm font-normal text-[#849495]">%</span>
            </span>
            <span className="text-xs text-[#849495] font-mono">
              User: {telemetry?.cpu.user ?? 0}%
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-void rounded-full h-1.5 overflow-hidden border border-cyber-cyan/20">
            <div 
              className="bg-cyber-cyan h-full rounded-full transition-all duration-500 shadow-neon-cyan"
              style={{ width: `${Math.min(100, telemetry?.cpu.totalUsage ?? 0)}%` }}
            ></div>
          </div>
          <div className="mt-3 text-[11px] text-[#849495] truncate font-mono">
            {telemetry?.cpu.brand || "Apple Silicon"}
          </div>
        </div>

        {/* RAM Card */}
        <div className="glass-panel glass-panel-hover rounded-xl p-5 border border-cyber-purple/20 relative overflow-hidden">
          <div className="flex items-center justify-between text-[#849495] text-xs font-mono mb-3">
            <span className="flex items-center gap-1.5 text-cyber-purple">
              <Layers className="w-4 h-4" /> BỘ NHỚ RAM
            </span>
            <button
              onClick={onQuickPurgeRam}
              disabled={isPurgingRam}
              className="px-2 py-0.5 rounded bg-cyber-purple/20 hover:bg-cyber-purple text-cyber-purple hover:text-black text-[10px] font-mono transition-colors font-bold flex items-center gap-1"
              title="Giải phóng bộ nhớ RAM không hoạt động"
            >
              <Zap className="w-3 h-3" />
              {isPurgingRam ? "Đang xả..." : "Giải phóng"}
            </button>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-3xl font-hud font-bold text-white">
              {telemetry ? formatGb(telemetry.memory.usedBytes) : 0}
              <span className="text-sm font-normal text-[#849495]"> / {telemetry ? formatGb(telemetry.memory.totalBytes) : 0} GB</span>
            </span>
            <span className="text-xs text-cyber-purple font-mono">
              {telemetry?.memory.usagePercent ?? 0}%
            </span>
          </div>
          <div className="w-full bg-void rounded-full h-1.5 overflow-hidden border border-cyber-purple/20">
            <div 
              className="bg-cyber-purple h-full rounded-full transition-all duration-500 shadow-neon-purple"
              style={{ width: `${telemetry?.memory.usagePercent ?? 0}%` }}
            ></div>
          </div>
          <div className="mt-3 text-[11px] text-[#849495] font-mono flex justify-between">
            <span>Active: {telemetry ? formatGb(telemetry.memory.activeBytes) : 0} GB</span>
            <span>Free: {telemetry ? formatGb(telemetry.memory.freeBytes) : 0} GB</span>
          </div>
        </div>

        {/* SSD Card */}
        <div className="glass-panel glass-panel-hover rounded-xl p-5 border border-cyber-green/20 relative overflow-hidden">
          <div className="flex items-center justify-between text-[#849495] text-xs font-mono mb-3">
            <span className="flex items-center gap-1.5 text-cyber-green">
              <HardDrive className="w-4 h-4" /> Ổ CỨNG SSD
            </span>
            <span>[NVMe_SSD]</span>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-3xl font-hud font-bold text-white">
              {telemetry ? formatGb(telemetry.disk.availableBytes) : 0}
              <span className="text-sm font-normal text-[#849495]"> GB trống</span>
            </span>
            <span className="text-xs text-cyber-green font-mono">
              {telemetry?.disk.usagePercent ?? 0}% dùng
            </span>
          </div>
          <div className="w-full bg-void rounded-full h-1.5 overflow-hidden border border-cyber-green/20">
            <div 
              className="bg-cyber-green h-full rounded-full transition-all duration-500 shadow-neon-green"
              style={{ width: `${telemetry?.disk.usagePercent ?? 0}%` }}
            ></div>
          </div>
          <div className="mt-3 text-[11px] text-[#849495] font-mono flex justify-between">
            <span>Tổng dung lượng:</span>
            <span>{telemetry ? formatGb(telemetry.disk.totalBytes) : 0} GB</span>
          </div>
        </div>

        {/* Battery & System Card */}
        <div className="glass-panel glass-panel-hover rounded-xl p-5 border border-cyber-amber/20 relative overflow-hidden">
          <div className="flex items-center justify-between text-[#849495] text-xs font-mono mb-3">
            <span className="flex items-center gap-1.5 text-cyber-amber">
              <Battery className="w-4 h-4" /> PIN & NGUỒN ĐIỆN
            </span>
            <span>[POWER_MGMT]</span>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-3xl font-hud font-bold text-white">
              {telemetry?.battery?.percentage ?? 100}<span className="text-sm font-normal text-[#849495]">%</span>
            </span>
            <span className="text-xs text-cyber-green font-mono">
              {telemetry?.battery?.isCharging ? "Đang sạc" : "Ổn định"}
            </span>
          </div>
          <div className="w-full bg-void rounded-full h-1.5 overflow-hidden border border-cyber-amber/20">
            <div 
              className="bg-cyber-amber h-full rounded-full transition-all duration-500"
              style={{ width: `${telemetry?.battery?.percentage ?? 100}%` }}
            ></div>
          </div>
          <div className="mt-3 text-[11px] text-[#849495] font-mono truncate">
            Nguồn: {telemetry?.battery?.source || "Bộ sạc AC"}
          </div>
        </div>
      </div>

      {/* Activity Stream Terminal */}
      <div className="glass-panel rounded-2xl p-6 border border-cyber-cyan/20">
        <div className="flex items-center justify-between border-b border-cyber-cyan/15 pb-4 mb-4">
          <div className="flex items-center space-x-2">
            <TerminalIcon className="w-4 h-4 text-cyber-cyan" />
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
              Dòng Hoạt Động Hệ Thống (Activity Stream Terminal)
            </h3>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-cyber-red/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-cyber-amber/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-cyber-green/80"></div>
          </div>
        </div>

        <div className="bg-void/90 rounded-xl p-4 font-mono text-xs text-[#e5e2e1] h-48 overflow-y-auto space-y-1.5 border border-surface-border">
          {terminalLogs.length === 0 ? (
            <div className="text-[#849495] flex items-center gap-2 italic">
              <span className="w-2 h-2 rounded-full bg-cyber-cyan animate-pulse"></span>
              Đang kết nối lắng nghe tiến trình Mole Core... Chưa có lệnh nào đang chạy.
            </div>
          ) : (
            terminalLogs.map((log, idx) => {
              let colorClass = "text-[#e5e2e1]";
              if (log.includes("[KHỞI ĐỘNG]") || log.includes("[QUÉT]")) colorClass = "text-cyber-cyan";
              else if (log.includes("[HOÀN TẤT]")) colorClass = "text-cyber-green font-bold";
              else if (log.includes("[CẢNH BÁO]") || log.includes("[LỖI]")) colorClass = "text-cyber-red";
              return (
                <div key={idx} className={`leading-relaxed ${colorClass}`}>
                  <span className="text-[#849495] mr-2">›</span>
                  {log}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
