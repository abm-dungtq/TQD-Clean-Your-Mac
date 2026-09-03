import React, { useState, useEffect } from "react";
import { PackageMinus, Search, RefreshCw, Trash2, ShieldCheck } from "lucide-react";
import { InstalledApp } from "../types";

interface UninstallViewProps {
  token: string;
}

export const UninstallView: React.FC<UninstallViewProps> = ({ token }) => {
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchApps = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/uninstall/list?token=${token}`);
      const data = await res.json();
      setApps(data.apps || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const filtered = apps.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleUninstall = (app: InstalledApp) => {
    alert(`Để đảm bảo an toàn tối đa cho hệ điều hành, bạn có thể sử dụng lệnh Mole CLI trực tiếp trong Terminal:\n\nmo uninstall "${app.name}"\n\nTính năng này sẽ quét và dọn sạch cả Application Support, Preferences và LaunchAgents của ứng dụng.`);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-cyber-cyan/20">
        <div>
          <h2 className="text-2xl font-hud font-bold text-white flex items-center gap-2">
            <PackageMinus className="w-6 h-6 text-cyber-cyan" />
            GỠ CÀI ĐẶT ỨNG DỤNG TẬN GỐC (UNINSTALLER)
          </h2>
          <p className="text-sm text-[#b9cacb] mt-1 font-sans">
            Quét và gỡ bỏ ứng dụng cùng toàn bộ tệp tàn dư mồ côi (Application Support, Caches, Preferences, LaunchAgents).
          </p>
        </div>
        <button
          onClick={fetchApps}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl border border-cyber-cyan/40 bg-cyber-cyan/10 hover:bg-cyber-cyan hover:text-black text-cyber-cyan text-sm font-mono font-bold transition-all flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Đang quét..." : "Làm Mới Danh Sách"}
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#849495]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm ứng dụng cần gỡ bỏ..."
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface-card border border-surface-border text-white text-sm focus:outline-none focus:border-cyber-cyan font-sans"
        />
      </div>

      {/* Apps List */}
      <div className="glass-panel rounded-2xl p-6 border border-cyber-cyan/15 space-y-2">
        <div className="text-xs font-mono text-[#849495] uppercase tracking-wider mb-2">
          ĐÃ CÀI ĐẶT: {filtered.length} ỨNG DỤNG
        </div>

        {loading ? (
          <div className="py-16 text-center text-cyber-cyan font-mono text-sm animate-pulse">
            Đang liệt kê các ứng dụng trong /Applications...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-[#849495]">Không tìm thấy ứng dụng phù hợp.</div>
        ) : (
          filtered.map(app => (
            <div
              key={app.path}
              className="flex items-center justify-between p-3.5 rounded-xl bg-surface border border-surface-border hover:border-cyber-cyan/30 transition-all"
            >
              <div className="flex items-center space-x-3 truncate">
                <div className="w-10 h-10 rounded-lg bg-void border border-cyber-cyan/20 flex items-center justify-center font-bold text-cyber-cyan shrink-0">
                  {app.name.charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <div className="text-sm font-bold text-white truncate">{app.name}</div>
                  <div className="text-xs text-[#849495] font-mono truncate">{app.path}</div>
                </div>
              </div>
              <div className="flex items-center space-x-4 shrink-0 ml-4">
                <span className="text-xs font-mono font-bold text-[#b9cacb]">{app.sizeString}</span>
                <button
                  onClick={() => handleUninstall(app)}
                  className="px-3 py-1.5 rounded-lg border border-cyber-red/30 bg-cyber-red/10 hover:bg-cyber-red hover:text-white text-cyber-red text-xs font-mono font-bold transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Gỡ Bỏ
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
