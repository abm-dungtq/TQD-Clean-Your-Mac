import React from "react";
import { 
  LayoutDashboard, 
  Trash2, 
  Cpu, 
  PackageMinus, 
  Terminal, 
  Sliders, 
  ShieldCheck,
  HardDrive
} from "lucide-react";

export type NavTab = "dashboard" | "clean" | "dev_purge" | "uninstaller" | "optimizer" | "settings";

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isScanning: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, isScanning }) => {
  const menuItems = [
    { id: "dashboard", label: "Tổng quan hệ thống", icon: LayoutDashboard, badge: null },
    { id: "clean", label: "Dọn dẹp bộ nhớ đệm", icon: Trash2, badge: null },
    { id: "dev_purge", label: "Dọn rác lập trình", icon: HardDrive, badge: "Dev" },
    { id: "uninstaller", label: "Gỡ cài đặt ứng dụng", icon: PackageMinus, badge: null },
    { id: "optimizer", label: "Tối ưu & Tăng tốc", icon: Cpu, badge: "RAM/DNS" },
    { id: "settings", label: "Cài đặt & Danh sách an toàn", icon: Sliders, badge: null },
  ];

  return (
    <aside className="w-80 bg-[#09090b]/80 backdrop-blur-2xl border-r border-cyber-cyan/15 flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="pt-10 pb-5 px-6 border-b border-cyber-cyan/10">
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-void border border-cyber-cyan shadow-neon-cyan group shrink-0">
            {/* Cyber Shield Icon */}
            <svg className="w-6 h-6 text-cyber-cyan animate-pulse-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
              <path d="M12 7v5l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyber-green rounded-full shadow-neon-green"></div>
          </div>
          <div className="min-w-0">
            <h1 className="font-hud font-bold text-lg tracking-wider text-white flex items-center gap-1.5">
              TQD<span className="text-cyber-cyan font-mono text-sm px-1.5 py-0.5 rounded bg-cyber-cyan/10 border border-cyber-cyan/30">MAC</span>
            </h1>
            <p className="text-[11px] text-[#849495] tracking-tight font-sans truncate">Dọn dẹp & Tối ưu hóa Mac</p>
            <div className="flex items-center gap-1 text-[10px] font-mono text-cyber-cyan/90 mt-0.5">
              <span className="text-[#849495]">Tác giả:</span>
              <span className="text-white font-semibold">TQD - 0976202028</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-mono tracking-widest text-[#849495] uppercase">
          // Bảng điều hướng
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id as NavTab)}
              disabled={isScanning}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? "bg-cyber-cyan/15 text-white border border-cyber-cyan/50 shadow-neon-cyan"
                  : "text-[#b9cacb] hover:text-white hover:bg-surface-card border border-transparent hover:border-cyber-cyan/20"
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? "text-cyber-cyan" : "text-[#849495]"}`} />
                <span className="whitespace-nowrap font-sans text-sm">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                  isActive ? "bg-cyber-cyan text-black font-bold" : "bg-surface-high text-[#849495]"
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Status Footer */}
      <div className="p-4 border-t border-cyber-cyan/10 bg-void/60 space-y-2">
        <div className="flex items-center justify-between text-xs px-2.5 py-2 rounded-lg bg-surface border border-surface-border">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-green"></span>
            </span>
            <span className="font-mono text-[11px] text-[#e5e2e1]">Engine: Sẵn sàng</span>
          </div>
          <span className="text-[10px] font-mono text-cyber-cyan">v1.53.0</span>
        </div>
        <div className="flex items-center justify-between px-2 text-[10px] font-mono text-[#849495]">
          <span>Tác giả:</span>
          <a href="tel:0976202028" className="text-cyber-cyan hover:underline font-bold tracking-tight">
            TQD - 0976202028
          </a>
        </div>
      </div>
    </aside>
  );
};
