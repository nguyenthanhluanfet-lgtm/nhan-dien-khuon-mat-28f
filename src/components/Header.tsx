import React from 'react';
import { 
  ScanFace, 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  Terminal, 
  LogIn, 
  LogOut, 
  UserCheck, 
  PlusCircle, 
  FileSpreadsheet,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export type TabType = 'overview' | 'attendance' | 'students' | 'python_sync';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenExportModal: () => void;
  onOpenManualModal: () => void;
  totalRecords: number;
}

export function Header({
  activeTab,
  onTabChange,
  onOpenExportModal,
  onOpenManualModal,
  totalRecords
}: HeaderProps) {
  const { currentUser, logout } = useAuth();

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & System Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white shrink-0">
              <ScanFace className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg text-white tracking-tight">
                  Face Attendance Cloud
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Firebase Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Hệ thống giám sát & quản trị điểm danh nhận diện khuôn mặt
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenExportModal}
              disabled={totalRecords === 0}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer disabled:opacity-40"
              title="Xuất báo cáo dữ liệu điểm danh ra file CSV (Excel)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Xuất Excel/CSV</span>
            </button>

            <button
              onClick={onOpenManualModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white transition shadow shadow-sky-600/30 cursor-pointer"
              title="Thêm lượt điểm danh thủ công khi cần"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Điểm danh bổ sung</span>
              <span className="sm:hidden">Thêm</span>
            </button>

            {/* Admin Profile & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1 justify-end">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Admin'}
                </span>
                <span className="text-[10px] text-slate-400">{currentUser?.email}</span>
              </div>
              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-700/50 transition cursor-pointer"
                title="Đăng xuất khỏi hệ thống"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 sm:space-x-3 overflow-x-auto py-2 border-t border-slate-800/80 scrollbar-none">
          <button
            onClick={() => onTabChange('overview')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer shrink-0 ${
              activeTab === 'overview'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Tổng quan & Báo cáo</span>
          </button>

          <button
            onClick={() => onTabChange('attendance')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer shrink-0 ${
              activeTab === 'attendance'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Lịch sử điểm danh (Realtime)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
              {totalRecords}
            </span>
          </button>

          <button
            onClick={() => onTabChange('students')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer shrink-0 ${
              activeTab === 'students'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Quản lý sinh viên & Lớp học</span>
          </button>

          <button
            onClick={() => onTabChange('python_sync')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer shrink-0 ${
              activeTab === 'python_sync'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Tích hợp Python & Kiểm thử (7 Tiêu chí)</span>
          </button>
        </div>
      </div>
    </header>
  );
}
