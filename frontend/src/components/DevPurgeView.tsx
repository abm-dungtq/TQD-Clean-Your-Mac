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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-macos-border shadow-macos-card">
        <div>
          <h2 className="text-2xl font-bold text-macos-text-primary flex items-center gap-2 tracking-tight">
            <FolderCode className="w-6 h-6 text-macos-blue" />
            Dọn Dẹp Dự Án Lập Trình (Dev Purge)
          </h2>
          <p className="text-xs text-macos-text-secondary mt-1 font-sans">
            Tìm và giải phóng hàng chục GB thư mục build trung gian: <code className="text-macos-blue font-semibold">node_modules</code>, <code className="text-macos-indigo font-semibold">target</code>, <code className="text-macos-green font-semibold">.gradle</code>, <code className="text-macos-amber font-semibold">venv</code> cũ.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchArtifacts}
            disabled={loading}
            className="px-4 py-2 rounded-full border border-macos-border bg-white hover:bg-gray-50 text-macos-text-primary text-xs font-semibold shadow-macos-card transition-all flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Đang quét code..." : "Quét Lại"}</span>
          </button>
          <button
            onClick={handleDeleteSelected}
            disabled={loading || selectedCount === 0}
            className="px-5 py-2 rounded-full bg-macos-red hover:bg-[#E02B20] text-white font-semibold text-xs shadow-macos-button transition-all flex items-center gap-1.5 disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa Đã Chọn ({formatGb(selectedBytes)})</span>
          </button>
        </div>
      </div>

      {/* Filter & Warning Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white border border-macos-border shadow-macos-card text-xs">
        <div className="flex items-center space-x-2 text-macos-amber">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span className="font-medium text-macos-text-primary">An toàn: Chỉ quét và xóa thư mục dependencies, không làm mất mã nguồn hoặc commit Git của bạn.</span>
        </div>
        <div className="flex items-center space-x-2 text-macos-text-secondary font-sans font-medium">
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
            className="bg-[#F9F9FB] border border-macos-border text-macos-text-primary px-3 py-1 rounded-lg text-xs font-medium"
          >
            <option value="0">Tất cả thư mục</option>
            <option value="14">&gt; 14 ngày</option>
            <option value="30">&gt; 30 ngày (Khuyến nghị)</option>
            <option value="60">&gt; 60 ngày</option>
          </select>
        </div>
      </div>

      {/* Artifacts List */}
      <div className="bg-white rounded-2xl p-6 border border-macos-border shadow-macos-card space-y-3">
        {loading ? (
          <div className="py-16 text-center text-macos-blue font-mono text-xs animate-pulse">
            Đang truy tìm các thư mục dependencies trong Workspace và Projects...
          </div>
        ) : artifacts.length === 0 ? (
          <div className="py-16 text-center text-macos-text-secondary space-y-2">
            <CheckCircle2 className="w-8 h-8 text-macos-green mx-auto" />
            <p className="font-bold text-macos-text-primary text-sm">Không phát hiện thư mục build dư thừa nào!</p>
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
                    ? "bg-macos-indigo-subtle/30 border-macos-indigo/50 shadow-xs"
                    : "bg-white border-macos-border hover:border-macos-indigo/30"
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 transition-all ${
                    isSelected ? "bg-macos-indigo border-macos-indigo text-white font-bold" : "border-[#C7C7CC] bg-white"
                  }`}>
                    {isSelected && "✓"}
                  </div>
                  <div className="truncate">
                    <div className="text-sm font-semibold text-macos-text-primary flex items-center gap-2 truncate">
                      <span className="text-macos-indigo font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-macos-indigo-subtle border border-macos-indigo/20">
                        {item.type}
                      </span>
                      <span className="truncate">{item.path}</span>
                    </div>
                    <p className="text-xs text-macos-text-caption font-sans mt-0.5">
                      Không chỉnh sửa trong {item.lastModifiedDays} ngày qua
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <div className="font-mono text-sm font-bold text-macos-indigo">{item.sizeString}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
