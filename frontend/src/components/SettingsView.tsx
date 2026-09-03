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
      <div className="glass-panel p-6 rounded-2xl border border-cyber-cyan/20">
        <h2 className="text-2xl font-hud font-bold text-white flex items-center gap-2">
          <Sliders className="w-6 h-6 text-cyber-cyan" />
          CÀI ĐẶT & DANH SÁCH AN TOÀN (WHITELIST)
        </h2>
        <p className="text-sm text-[#b9cacb] mt-1 font-sans">
          Quản lý các thư mục loại trừ không bao giờ bị xóa, kiểm tra quyền hệ thống và xem lại lịch sử thao tác.
        </p>
      </div>

      {/* FDA Section */}
      <div className="glass-panel p-6 rounded-2xl border border-surface-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-hud font-bold text-base text-white">Quyền Truy Cập Toàn Bộ Ổ Đĩa (Full Disk Access)</span>
            {fdaStatus.hasAccess ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-green/20 text-cyber-green border border-cyber-green/30">
                ĐÃ KÍCH HOẠT
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-amber/20 text-cyber-amber border border-cyber-amber/30">
                CHƯA KÍCH HOẠT
              </span>
            )}
          </div>
          <p className="text-xs text-[#849495] mt-1 font-sans">
            Cần thiết để Mole quét sạch bộ đệm Safari, Mail và các tệp hệ thống bảo mật trong ~/Library.
          </p>
        </div>
        <a
          href={fdaStatus.guidanceUrl}
          className="px-4 py-2 rounded-xl bg-surface-card hover:bg-cyber-cyan hover:text-black border border-cyber-cyan/30 text-xs font-mono text-white transition-all flex items-center gap-1.5 shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Mở Cài Đặt Hệ Thống Mac
        </a>
      </div>

      {/* Whitelist Manager */}
      <div className="glass-panel p-6 rounded-2xl border border-cyber-cyan/15 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-cyber-cyan" />
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
              Danh Mục Loại Trừ (~/.config/mole/whitelist)
            </h3>
          </div>
          <button
            onClick={handleSaveWhitelist}
            className="px-4 py-1.5 rounded-xl bg-cyber-cyan text-black font-hud font-bold text-xs shadow-neon-cyan transition-all flex items-center gap-1.5"
          >
            {saveSuccess ? <CheckCircle2 className="w-3.5 h-3.5 text-black" /> : <Save className="w-3.5 h-3.5" />}
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
            className="flex-1 px-4 py-2.5 rounded-xl bg-void border border-surface-border text-white text-xs font-mono focus:outline-none focus:border-cyber-cyan"
          />
          <button
            onClick={handleAddRule}
            className="px-4 py-2.5 rounded-xl bg-surface-card hover:bg-cyber-cyan hover:text-black border border-surface-border text-xs font-mono font-bold text-white transition-all flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Thêm
          </button>
        </div>

        {/* Items */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {whitelist.length === 0 ? (
            <div className="text-xs text-[#849495] italic py-4 text-center">
              Chưa có mục loại trừ nào. Mole tự động bảo vệ các thư mục mặc định của hệ thống.
            </div>
          ) : (
            whitelist.map((rule, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-void/60 border border-surface-border text-xs font-mono text-[#b9cacb]"
              >
                <span>{rule}</span>
                <button
                  onClick={() => handleRemoveRule(idx)}
                  className="text-[#849495] hover:text-cyber-red p-1 transition-colors"
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
      <div className="glass-panel p-6 rounded-2xl border border-surface-border space-y-4">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-cyber-purple" />
          <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
            Nhật Ký Dọn Dẹp Gần Đây (Cleanup History)
          </h3>
        </div>

        {history?.sessions?.length > 0 ? (
          <div className="space-y-2">
            {history.sessions.slice(0, 5).map((s: any, idx: number) => (
              <div key={idx} className="p-3 rounded-xl bg-void border border-surface-border flex items-center justify-between text-xs font-mono">
                <div>
                  <div className="text-white font-bold">Lệnh: {s.command}</div>
                  <div className="text-[#849495]">{s.started_at}</div>
                </div>
                <div className="text-right">
                  <div className="text-cyber-green font-bold">Giải phóng: {s.size}</div>
                  <div className="text-[#849495]">{s.items} tệp đã xử lý</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-[#849495] py-4 text-center">
            Chưa ghi nhận phiên dọn dẹp nào gần đây.
          </div>
        )}
      </div>

      {/* Author & System Information Card */}
      <div className="glass-panel p-6 rounded-2xl border border-cyber-cyan/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-cyber-cyan" />
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
              Thông Tin Ứng Dụng & Tác Giả
            </h3>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan font-bold">
            v1.53.0
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-void border border-surface-border space-y-1">
            <span className="text-[#849495] block text-[10px]">TÁC GIẢ / DEVELOPER</span>
            <span className="text-white font-bold text-sm block">TQD</span>
            <a href="tel:0976202028" className="text-cyber-cyan hover:underline block text-xs font-semibold">
              📞 0976.202.028
            </a>
          </div>

          <div className="p-3.5 rounded-xl bg-void border border-surface-border space-y-1">
            <span className="text-[#849495] block text-[10px]">ĐỘNG CƠ CỐT LÕI</span>
            <span className="text-cyber-green font-bold text-sm block">tw93/mole Core</span>
            <span className="text-[#849495] block text-[11px]">Shell & Go Engine Native</span>
          </div>

          <div className="p-3.5 rounded-xl bg-void border border-surface-border space-y-1">
            <span className="text-[#849495] block text-[10px]">KIẾN TRÚC ỨNG DỤNG</span>
            <span className="text-cyber-purple font-bold text-sm block">macOS AppKit Shell</span>
            <span className="text-[#849495] block text-[11px]">100% Standalone (0 Terminal)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
