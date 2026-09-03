import React, { useState } from "react";
import { Cpu, Zap, Wifi, Search, AppWindow, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";

interface OptimizerViewProps {
  token: string;
}

export const OptimizerView: React.FC<OptimizerViewProps> = ({ token }) => {
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [resultMsg, setResultMsg] = useState<{ success: boolean; text: string } | null>(null);

  const handleOptimize = async (type: "purge_ram" | "flush_dns" | "rebuild_spotlight" | "rebuild_launchservices", label: string) => {
    setLoadingType(type);
    setResultMsg(null);
    try {
      const res = await fetch(`/api/optimize?token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      setResultMsg({ success: data.success, text: data.message });
    } catch (err: any) {
      setResultMsg({ success: false, text: "Lỗi kết nối: " + err.message });
    } finally {
      setLoadingType(null);
    }
  };

  const tasks = [
    {
      id: "purge_ram",
      title: "Giải Phóng Bộ Nhớ RAM (Purge)",
      desc: "Xả bộ nhớ đệm kernel và inactive memory đang bị chiếm dụng, tăng RAM trống ngay lập tức.",
      icon: Zap,
      color: "cyber-purple",
      badge: "Root/Admin",
    },
    {
      id: "flush_dns",
      title: "Làm Mới Bộ Đệm DNS (Flush DNS)",
      desc: "Xóa sạch bộ nhớ tạm phân giải tên miền hệ thống, tăng tốc kết nối mạng và giải quyết lỗi phân giải IP.",
      icon: Wifi,
      color: "cyber-cyan",
      badge: "Root/Admin",
    },
    {
      id: "rebuild_spotlight",
      title: "Tái Lập Chỉ Mục Tìm Kiếm Spotlight",
      desc: "Xây dựng lại siêu dữ liệu tìm kiếm toàn đĩa (mdutil), giải quyết tình trạng tìm kiếm file bị lag hoặc thiếu.",
      icon: Search,
      color: "cyber-green",
      badge: "Root/Admin",
    },
    {
      id: "rebuild_launchservices",
      title: "Sửa Lỗi Trùng Lặp Menu Mở Tệp (Open With)",
      desc: "Khởi động lại cơ sở dữ liệu LaunchServices, loại bỏ các mục ứng dụng bị trùng lặp hoặc mồ côi.",
      icon: AppWindow,
      color: "cyber-amber",
      badge: "User",
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white p-6 rounded-2xl border border-macos-border shadow-macos-card">
        <h2 className="text-2xl font-bold text-macos-text-primary flex items-center gap-2 tracking-tight">
          <Cpu className="w-6 h-6 text-macos-blue" />
          Tối Ưu Hóa & Tăng Tốc Hệ Thống (System Optimizer)
        </h2>
        <p className="text-xs text-macos-text-secondary mt-1 font-sans">
          Thực thi các tác vụ bảo trì hệ thống chuyên sâu an toàn của macOS để khôi phục độ mượt mà tối đa.
        </p>
      </div>

      {resultMsg && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          resultMsg.success ? "bg-macos-green-subtle border-macos-green/30 text-[#248A3D]" : "bg-macos-red-subtle border-macos-red/30 text-macos-red"
        }`}>
          {resultMsg.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span className="text-xs font-medium">{resultMsg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map(task => {
          const Icon = task.icon;
          const isLoading = loadingType === task.id;
          return (
            <div
              key={task.id}
              className="bg-white p-6 rounded-2xl border border-macos-border shadow-macos-card hover:shadow-macos-card-hover transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-macos-blue-subtle border border-macos-blue/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-macos-blue" />
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F2F2F7] text-macos-text-secondary border border-macos-border">
                    {task.badge}
                  </span>
                </div>
                <h3 className="font-bold text-base text-macos-text-primary">{task.title}</h3>
                <p className="text-xs text-macos-text-secondary leading-relaxed font-sans">{task.desc}</p>
              </div>

              <button
                onClick={() => handleOptimize(task.id as any, task.title)}
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-macos-blue hover:text-white border border-macos-border hover:border-macos-blue text-macos-text-primary text-xs font-semibold shadow-macos-card transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                {isLoading ? (
                  <>
                    <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                    Đang thực thi...
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-macos-amber" />
                    Kích Hoạt Tối Ưu
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
