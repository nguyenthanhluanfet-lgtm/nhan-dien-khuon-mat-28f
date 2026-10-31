import { useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle2, 
  Database, 
  Info, 
  Copy, 
  Check, 
  ExternalLink 
} from 'lucide-react';
import type { ConnectionInfo } from '../types';

interface ConnectionBannerProps {
  connection: ConnectionInfo;
  onReconnect: () => void;
  isRefreshing: boolean;
}

export function ConnectionBanner({ connection, onReconnect, isRefreshing }: ConnectionBannerProps) {
  const [showSecurityRuleHelp, setShowSecurityRuleHelp] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Chưa đồng bộ';
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const mon = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${h}:${m}:${s} - ${d}/${mon}/${y}`;
  };

  const sampleRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 1. Chỉ tài khoản Admin được tạo từ Firebase mới được xem dữ liệu điểm danh
    match /diem_danh/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null || (
        request.resource.data.ma_sinh_vien is string
        && request.resource.data.ho_ten is string
      );
      allow update, delete: if request.auth != null;
    }
    
    // 2. Chỉ tài khoản Admin mới được đọc và quản lý danh sách sinh viên
    match /sinh_vien/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}`;

  const copyRulesToClipboard = () => {
    navigator.clipboard.writeText(sampleRules);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2500);
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-200 px-4 py-2.5 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Project & Live Status */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/60 font-mono text-xs">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Project:</span>
            <span className="text-amber-300 font-semibold">nhan-dien-a2471</span>
          </div>

          <div className="flex items-center gap-2">
            {connection.status === 'connected' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <Wifi className="w-3.5 h-3.5" />
                Firestore Trực Tuyến (Live)
              </span>
            )}
            {connection.status === 'connecting' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Đang kết nối Firestore...
              </span>
            )}
            {connection.status === 'error' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
                <WifiOff className="w-3.5 h-3.5" />
                Lỗi kết nối Firebase
              </span>
            )}
          </div>

          {/* Sync Stats */}
          <div className="hidden md:flex items-center gap-3 text-slate-400 text-xs">
            <span>
              Bản ghi điểm danh: <strong className="text-slate-200">{connection.attendanceCount}</strong>
            </span>
            <span className="text-slate-700">|</span>
            <span>
              Sinh viên trong DB: <strong className="text-slate-200">{connection.studentCount}</strong>
            </span>
            <span className="text-slate-700">|</span>
            <span>
              Đồng bộ lúc: <span className="text-slate-300 font-mono">{formatLastSync(connection.lastSynced)}</span>
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {connection.errorType === 'permission' && (
            <button
              onClick={() => setShowSecurityRuleHelp(!showSecurityRuleHelp)}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded border border-amber-500/40 transition cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Sửa lỗi Security Rules
            </button>
          )}

          <button
            onClick={onReconnect}
            disabled={isRefreshing}
            title="Thử kết nối lại và làm mới dữ liệu"
            className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded text-xs font-medium border border-slate-700 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Đang tải...' : 'Thử kết nối lại'}
          </button>
        </div>
      </div>

      {/* Error Alert Bar if any error */}
      {connection.status === 'error' && connection.errorMessage && (
        <div className="max-w-7xl mx-auto mt-2 p-3 bg-rose-950/60 border border-rose-800/80 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-rose-200">
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-xs sm:text-sm text-rose-200">{connection.errorMessage}</p>
              <p className="text-xs text-rose-300/80 mt-0.5">
                {connection.errorType === 'permission'
                  ? 'Gợi ý: Collection "diem_danh" và "sinh_vien" cần được mở quyền đọc/ghi trong Firestore Security Rules của project nhan-dien-a2471.'
                  : 'Kiểm tra đường truyền internet hoặc xem hướng dẫn thiết lập.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSecurityRuleHelp(true)}
            className="text-xs underline text-rose-300 hover:text-white shrink-0 cursor-pointer"
          >
            Xem cách cấu hình Rules
          </button>
        </div>
      )}

      {/* Security Rule Helper Modal/Accordion */}
      {showSecurityRuleHelp && (
        <div className="max-w-7xl mx-auto mt-3 p-4 bg-slate-800/95 border border-amber-500/40 rounded-lg text-slate-200 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h4 className="font-semibold text-sm text-white">
                Hướng dẫn mở quyền Firestore Security Rules (Dự án: nhan-dien-a2471)
              </h4>
            </div>
            <button
              onClick={() => setShowSecurityRuleHelp(false)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer px-2 py-0.5 rounded bg-slate-700"
            >
              Đóng
            </button>
          </div>

          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Nếu bạn thấy lỗi <code className="bg-slate-900 px-1 py-0.5 rounded text-rose-400">permission-denied</code>, nghĩa là Firestore đang chặn các truy vấn từ Web hoặc Python. Hãy truy cập Firebase Console và dán cấu hình sau vào tab <strong>Rules</strong>:
          </p>

          <div className="relative mt-2">
            <pre className="bg-slate-950 p-3 rounded font-mono text-xs text-emerald-300 overflow-x-auto border border-slate-800">
              {sampleRules}
            </pre>
            <button
              onClick={copyRulesToClipboard}
              className="absolute top-2 right-2 flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded border border-slate-700 cursor-pointer"
            >
              {copiedRules ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedRules ? 'Đã sao chép' : 'Sao chép Rules'}
            </button>
          </div>

          <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
            <span>Sau khi nhấn "Publish" trên Firebase Console, quay lại đây và nhấn <strong>"Thử kết nối lại"</strong>.</span>
            <a
              href="https://console.firebase.google.com/project/nhan-dien-a2471/firestore/rules"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sky-400 hover:underline cursor-pointer"
            >
              Mở Firebase Console Rules <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
