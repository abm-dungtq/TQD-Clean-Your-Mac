import React, { useState, useEffect } from "react";
import { HardDrive, RefreshCw, Trash2, FolderCode, CheckCircle2, ShieldAlert } from "lucide-react";
import { DevArtifactItem } from "../types";

interface DevPurgeViewProps {
  token: string;
}

export const DevPurgeView: React.FC<DevPurgeViewProps> = ({ token }) => {
  const [artifacts, setArtifacts] = useState<DevArtifactItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState<Record<string, boolean>>({});
  const [filterDays, setFilterDays] = useState<number>(30); // Lọc các thư mục không đụng tới > 30 ngày

  const fetchArtifacts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dev-purge/scan?token=${token}`);
      const data = await res.json();
      setArtifacts(data.artifacts || []);
      // Mặc định chọn các thư mục > 30 ngày
      const initial: Record<string, boolean> = {};
      (data.artifacts || []).forEach((a: DevArtifactItem) => {
        if (a.lastModifiedDays >= filterDays) initial[a.path] = true;
      });
      setSelectedPaths(initial);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtifacts();
  }, []);

  const toggleSelect = (path: string) => {
    setSelectedPaths(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const selectedCount = Object.values(selectedPaths).filter(Boolean).length;
  const selectedBytes = artifacts
    .filter(a => selectedPaths[a.path])
    .reduce((sum, a) => sum + a.sizeBytes, 0);

  const formatGb = (bytes: number) => {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  };

  const handleDeleteSelected = async () => {
    const paths = Object.keys(selectedPaths).filter(p => selectedPaths[p]);
    if (!paths.length) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa ${paths.length} thư mục build đã chọn không? Mã nguồn Git sẽ không bị ảnh hưởng.`)) return;

    setLoading(true);
    try {
      await fetch(`/api/dev-purge/delete?token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths }),
      });
      await fetchArtifacts();
    } catch (err) {
      alert("Lỗi khi xóa tệp: " + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-cyber-cyan/20">
        <div>
          <h2 className="text-2xl font-hud font-bold text-white flex items-center gap-2">
            <FolderCode className="w-6 h-6 text-cyber-cyan" />
            DỌN DẸP DỰ ÁN LẬP TRÌNH (DEV PURGE)
          </h2>
          <p className="text-sm text-[#b9cacb] mt-1 font-sans">
            Tìm và giải phóng hàng chục GB thư mục build trung gian: <code className="text-cyber-cyan">node_modules</code>, <code className="text-cyber-purple">target</code>, <code className="text-cyber-green">.gradle</code>, <code className="text-cyber-amber">venv</code> cũ.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchArtifacts}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-cyber-cyan/40 bg-cyber-cyan/10 hover:bg-cyber-cyan hover:text-black text-cyber-cyan text-sm font-mono font-bold transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Đang quét code..." : "Quét Lại"}
          </button>
          <button
            onClick={handleDeleteSelected}
            disabled={loading || selectedCount === 0}
            className="px-6 py-2.5 rounded-xl bg-cyber-purple hover:bg-white text-black font-hud font-bold text-sm shadow-neon-purple transition-all flex items-center gap-2 disabled:opacity-40"
          >
            <Trash2 className="w-4 h-4" />
            Xóa Đã Chọn ({formatGb(selectedBytes)})
          </button>
        </div>
      </div>

      {/* Filter & Warning Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl glass-panel border border-cyber-amber/20 text-xs">
        <div className="flex items-center space-x-2 text-cyber-amber">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>An toàn: Chỉ quét và xóa thư mục dependencies, không làm mất mã nguồn hoặc commit Git của bạn.</span>
        </div>
        <div className="flex items-center space-x-2 text-[#849495] font-mono">
          <span>Lọc không truy cập &gt;</span>
          <select
            value={filterDays}
            onChange={(e) => {
              const d = parseInt(e.target.value, 10);
              setFilterDays(d);
              const initial: Record<string, boolean> = {};
              artifacts.forEach(a => {
                if (a.lastModifiedDays >= d) initial[a.path] = true;
              });
              setSelectedPaths(initial);
            }}
            className="bg-void border border-surface-border text-white px-2 py-1 rounded text-xs"
          >
            <option value="0">Tất cả thư mục</option>
            <option value="14">&gt; 14 ngày</option>
            <option value="30">&gt; 30 ngày (Khuyến nghị)</option>
            <option value="60">&gt; 60 ngày</option>
          </select>
        </div>
      </div>

      {/* Artifacts List */}
      <div className="glass-panel rounded-2xl p-6 border border-cyber-cyan/15 space-y-3">
        {loading ? (
          <div className="py-16 text-center text-cyber-cyan font-mono text-sm animate-pulse">
            Đang truy tìm các thư mục dependencies trong Workspace và Projects...
          </div>
        ) : artifacts.length === 0 ? (
          <div className="py-16 text-center text-[#849495] space-y-2">
            <CheckCircle2 className="w-8 h-8 text-cyber-green mx-auto" />
            <p className="font-bold text-white">Không phát hiện thư mục build dư thừa nào!</p>
            <p className="text-xs">Không gian làm việc của bạn đang ở trạng thái tối ưu.</p>
          </div>
        ) : (
          artifacts.map(item => {
            const isSelected = !!selectedPaths[item.path];
            return (
              <div
                key={item.id}
                onClick={() => toggleSelect(item.path)}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-cyber-purple/10 border-cyber-purple/40 shadow-neon-purple/20"
                    : "bg-surface-card border-surface-border opacity-70 hover:opacity-100"
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <div className={`w-5 h-5 rounded flex items-center justify-center border shrink-0 ${
                    isSelected ? "bg-cyber-purple border-cyber-purple text-black font-bold" : "border-[#849495]"
                  }`}>
                    {isSelected && "✓"}
                  </div>
                  <div className="truncate">
                    <div className="text-sm font-bold text-white flex items-center gap-2 truncate">
                      <span className="text-cyber-cyan font-mono text-xs px-1.5 py-0.5 rounded bg-cyber-cyan/10">
                        {item.type}
                      </span>
                      <span className="truncate">{item.path}</span>
                    </div>
                    <p className="text-xs text-[#849495] font-mono mt-0.5">
                      Không chỉnh sửa trong {item.lastModifiedDays} ngày qua
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <div className="font-mono text-sm font-bold text-cyber-purple">{item.sizeString}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
