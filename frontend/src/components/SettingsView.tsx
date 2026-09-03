import React, { useState, useEffect } from "react";
import { Sliders, ShieldCheck, History, ExternalLink, Plus, Trash2, Save, CheckCircle2 } from "lucide-react";

interface SettingsViewProps {
  token: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ token }) => {
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [newRule, setNewRule] = useState("");
  const [history, setHistory] = useState<any>(null);
  const [fdaStatus, setFdaStatus] = useState<{ hasAccess: boolean; guidanceUrl: string }>({ hasAccess: false, guidanceUrl: "" });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // 1. Whitelist
    fetch(`/api/whitelist?token=${token}`)
      .then(r => r.json())
      .then(d => setWhitelist(d.whitelist || []))
      .catch(console.error);

    // 2. History
    fetch(`/api/history?token=${token}`)
      .then(r => r.json())
      .then(d => setHistory(d))
      .catch(console.error);

    // 3. FDA
    fetch(`/api/fda-status?token=${token}`)
      .then(r => r.json())
      .then(d => setFdaStatus(d))
      .catch(console.error);
  }, [token]);

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    if (whitelist.includes(newRule.trim())) return;
    setWhitelist([...whitelist, newRule.trim()]);
    setNewRule("");
  };

  const handleRemoveRule = (index: number) => {
    setWhitelist(whitelist.filter((_, i) => i !== index));
  };

  const handleSaveWhitelist = async () => {
    try {
      await fetch(`/api/whitelist?token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whitelist }),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert("Lỗi khi lưu: " + err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white p-6 rounded-2xl border border-macos-border shadow-macos-card">
        <h2 className="text-2xl font-bold text-macos-text-primary flex items-center gap-2 tracking-tight">
          <Sliders className="w-6 h-6 text-macos-blue" />
          Cài Đặt & Danh Sách An Toàn (Whitelist)
        </h2>
        <p className="text-xs text-macos-text-secondary mt-1 font-sans">
          Quản lý các thư mục loại trừ không bao giờ bị xóa, kiểm tra quyền hệ thống và xem lại lịch sử thao tác.
        </p>
      </div>

      {/* FDA Section */}
      <div className="bg-white p-6 rounded-2xl border border-macos-border shadow-macos-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-base text-macos-text-primary">Quyền Truy Cập Toàn Bộ Ổ Đĩa (Full Disk Access)</span>
            {fdaStatus.hasAccess ? (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-macos-green-subtle text-[#248A3D] border border-macos-green/20">
                ĐÃ KÍCH HOẠT
              </span>
            ) : (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-macos-amber-subtle text-[#B25E02] border border-macos-amber/20">
                CHƯA KÍCH HOẠT
              </span>
            )}
          </div>
          <p className="text-xs text-macos-text-secondary mt-1 font-sans">
            Cần thiết để Mole quét sạch bộ đệm Safari, Mail và các tệp hệ thống bảo mật trong ~/Library.
          </p>
        </div>
        <a
          href={fdaStatus.guidanceUrl}
          className="px-4 py-2 rounded-full bg-white hover:bg-gray-50 border border-macos-border text-xs font-semibold text-macos-text-primary shadow-macos-card transition-all flex items-center gap-1.5 shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Mở Cài Đặt Hệ Thống Mac
        </a>
      </div>

      {/* Whitelist Manager */}
      <div className="bg-white p-6 rounded-2xl border border-macos-border shadow-macos-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-macos-blue" />
            <h3 className="text-sm font-bold text-macos-text-primary">
              Danh Mục Loại Trừ (~/.config/mole/whitelist)
            </h3>
          </div>
          <button
            onClick={handleSaveWhitelist}
            className="px-4 py-1.5 rounded-full bg-macos-blue hover:bg-macos-blue-hover text-white font-semibold text-xs shadow-macos-button transition-all flex items-center gap-1.5"
          >
            {saveSuccess ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <Save className="w-3.5 h-3.5" />}
            {saveSuccess ? "Đã Lưu!" : "Lưu Danh Sách"}
          </button>
        </div>

        {/* Add Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddRule()}
            placeholder="Nhập đường dẫn hoặc tên thư mục cần bảo vệ (VD: ~/Documents/SecretFolder)..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#F9F9FB] border border-macos-border text-macos-text-primary text-xs focus:outline-none focus:border-macos-blue placeholder:text-macos-text-caption"
          />
          <button
            onClick={handleAddRule}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-macos-border text-xs font-semibold text-macos-text-primary shadow-macos-card transition-all flex items-center gap-1"
          >
            <Plus className="w-4 h-4 text-macos-blue" /> Thêm
          </button>
        </div>

        {/* Items */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {whitelist.length === 0 ? (
            <div className="text-xs text-macos-text-secondary italic py-4 text-center">
              Chưa có mục loại trừ nào. Mole tự động bảo vệ các thư mục mặc định của hệ thống.
            </div>
          ) : (
            whitelist.map((rule, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#F9F9FB] border border-macos-border text-xs font-mono text-macos-text-primary"
              >
                <span>{rule}</span>
                <button
                  onClick={() => handleRemoveRule(idx)}
                  className="text-macos-text-secondary hover:text-macos-red p-1 transition-colors"
                  title="Xóa mục này"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Operations History Log */}
      <div className="bg-white p-6 rounded-2xl border border-macos-border shadow-macos-card space-y-4">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-macos-indigo" />
          <h3 className="text-sm font-bold text-macos-text-primary">
            Nhật Ký Dọn Dẹp Gần Đây (Cleanup History)
          </h3>
        </div>

        {history?.sessions?.length > 0 ? (
          <div className="space-y-2">
            {history.sessions.slice(0, 5).map((s: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-xl bg-[#F9F9FB] border border-macos-border flex items-center justify-between text-xs">
                <div>
                  <div className="text-macos-text-primary font-bold">Lệnh: {s.command}</div>
                  <div className="text-macos-text-caption font-mono text-[11px] mt-0.5">{s.started_at}</div>
                </div>
                <div className="text-right">
                  <div className="text-macos-green font-bold font-mono">{s.size}</div>
                  <div className="text-macos-text-caption font-mono text-[11px]">{s.items} tệp đã xử lý</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-macos-text-secondary py-4 text-center">
            Chưa ghi nhận phiên dọn dẹp nào gần đây.
          </div>
        )}
      </div>

      {/* Author & System Information Card */}
      <div className="bg-white p-6 rounded-2xl border border-macos-border shadow-macos-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-macos-blue" />
            <h3 className="text-sm font-bold text-macos-text-primary">
              Thông Tin Ứng Dụng & Tác Giả
            </h3>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-macos-blue-subtle text-macos-blue font-bold">
            v1.53.0
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 text-xs">
          <div className="p-4 rounded-xl bg-[#F9F9FB] border border-macos-border space-y-1">
            <span className="text-macos-text-caption block text-[10px] font-semibold uppercase tracking-wider">TÁC GIẢ / DEVELOPER</span>
            <span className="text-macos-text-primary font-bold text-sm block">TQD</span>
            <a href="tel:0976202028" className="text-macos-blue hover:underline block text-xs font-semibold">
              📞 0976.202.028
            </a>
          </div>

          <div className="p-4 rounded-xl bg-[#F9F9FB] border border-macos-border space-y-1">
            <span className="text-macos-text-caption block text-[10px] font-semibold uppercase tracking-wider">ĐỘNG CƠ CỐT LÕI</span>
            <span className="text-[#248A3D] font-bold text-sm block">tw93/mole Core</span>
            <span className="text-macos-text-secondary block text-[11px]">Shell & Go Engine Native</span>
          </div>

          <div className="p-4 rounded-xl bg-[#F9F9FB] border border-macos-border space-y-1">
            <span className="text-macos-text-caption block text-[10px] font-semibold uppercase tracking-wider">KIẾN TRÚC ỨNG DỤNG</span>
            <span className="text-macos-indigo font-bold text-sm block">macOS AppKit Shell</span>
            <span className="text-macos-text-secondary block text-[11px]">100% Standalone (0 Terminal)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
