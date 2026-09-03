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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-macos-border shadow-macos-card">
        <div>
          <h2 className="text-2xl font-bold text-macos-text-primary flex items-center gap-2 tracking-tight">
            <PackageMinus className="w-6 h-6 text-macos-blue" />
            Gỡ Cài Đặt Ứng Dụng Tận Gốc (Uninstaller)
          </h2>
          <p className="text-xs text-macos-text-secondary mt-1 font-sans">
            Quét và gỡ bỏ ứng dụng cùng toàn bộ tệp tàn dư mồ côi (Application Support, Caches, Preferences, LaunchAgents).
          </p>
        </div>
        <button
          onClick={fetchApps}
          disabled={loading}
          className="px-4 py-2 rounded-full border border-macos-border bg-white hover:bg-gray-50 text-macos-text-primary text-xs font-semibold shadow-macos-card transition-all flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "Đang quét..." : "Làm Mới Danh Sách"}</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-macos-text-caption" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm ứng dụng cần gỡ bỏ..."
          className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border border-macos-border shadow-macos-card text-macos-text-primary text-xs focus:outline-none focus:border-macos-blue font-sans placeholder:text-macos-text-caption"
        />
      </div>

      {/* Apps List */}
      <div className="bg-white rounded-2xl p-6 border border-macos-border shadow-macos-card space-y-2">
        <div className="text-xs font-semibold text-macos-text-secondary uppercase tracking-wider mb-2">
          ĐÃ CÀI ĐẶT: {filtered.length} ỨNG DỤNG
        </div>

        {loading ? (
          <div className="py-16 text-center text-macos-blue font-mono text-xs animate-pulse">
            Đang liệt kê các ứng dụng trong /Applications...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-macos-text-secondary text-xs">Không tìm thấy ứng dụng phù hợp.</div>
        ) : (
          filtered.map(app => (
            <div
              key={app.path}
              className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-macos-border hover:border-macos-blue/40 shadow-xs transition-all"
            >
              <div className="flex items-center space-x-3 truncate">
                <div className="w-10 h-10 rounded-xl bg-macos-blue-subtle border border-macos-blue/20 flex items-center justify-center font-bold text-macos-blue shrink-0">
                  {app.name.charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <div className="text-sm font-semibold text-macos-text-primary truncate">{app.name}</div>
                  <div className="text-xs text-macos-text-caption font-mono truncate">{app.path}</div>
                </div>
              </div>
              <div className="flex items-center space-x-4 shrink-0 ml-4">
                <span className="text-xs font-mono font-medium text-macos-text-secondary">{app.sizeString}</span>
                <button
                  onClick={() => handleUninstall(app)}
                  className="px-3.5 py-1.5 rounded-full border border-macos-red/20 bg-macos-red-subtle hover:bg-macos-red hover:text-white text-macos-red text-xs font-semibold transition-all flex items-center gap-1.5"
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
