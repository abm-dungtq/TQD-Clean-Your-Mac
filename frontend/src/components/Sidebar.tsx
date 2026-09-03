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
    <aside className="w-80 macos-glass-sidebar border-r border-macos-border flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="pt-10 pb-5 px-6 border-b border-macos-border/70">
        <div className="flex items-center space-x-3.5">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-white border border-macos-border shadow-macos-card shrink-0">
            {/* Apple Native Shield / Broom Icon */}
            <svg className="w-6 h-6 text-macos-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
              <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-macos-green rounded-full border-2 border-white shadow-xs"></div>
          </div>
          <div className="min-w-0">
            <h1 className="font-sans font-bold text-base tracking-tight text-macos-text-primary flex items-center gap-1.5">
              TQD-Clean<span className="text-macos-blue font-mono text-[11px] font-bold px-1.5 py-0.2 rounded bg-macos-blue-subtle border border-macos-blue/20">MAC</span>
            </h1>
            <p className="text-[12px] text-macos-text-secondary tracking-tight font-sans truncate">Dọn dẹp & Tối ưu hóa Mac</p>
            <div className="flex items-center gap-1 text-[11px] font-sans text-macos-text-caption mt-0.5">
              <span>Tác giả:</span>
              <a href="tel:0976202028" className="text-macos-blue font-semibold hover:underline">TQD - 0976202028</a>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="p-3.5 space-y-1.5 flex-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-macos-text-caption uppercase">
          Menu Điều Hướng
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
                  ? "bg-macos-blue text-white shadow-macos-button font-semibold"
                  : "text-macos-text-secondary hover:text-macos-text-primary hover:bg-black/[0.04]"
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${isActive ? "text-white" : "text-macos-text-secondary"}`} />
                <span className="whitespace-nowrap font-sans text-[13px]">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md shrink-0 ${
                  isActive ? "bg-white/20 text-white font-bold" : "bg-macos-border text-macos-text-secondary"
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Status Footer */}
      <div className="p-4 border-t border-macos-border/70 space-y-2.5">
        <div className="flex items-center justify-between text-xs px-3 py-2.5 rounded-xl bg-white/90 border border-macos-border shadow-macos-card">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="inline-flex rounded-full h-2 w-2 bg-macos-green"></span>
            </span>
            <span className="font-sans text-[12px] font-medium text-macos-text-primary">Engine: Sẵn sàng</span>
          </div>
          <span className="text-[11px] font-mono font-semibold text-macos-blue">v1.53.0</span>
        </div>
        <div className="flex items-center justify-between px-2 text-[11px] text-macos-text-caption">
          <span>Hỗ trợ kỹ thuật:</span>
          <a href="tel:0976202028" className="text-macos-blue hover:underline font-semibold">
            0976.202.028
          </a>
        </div>
      </div>
    </aside>
  );
};
