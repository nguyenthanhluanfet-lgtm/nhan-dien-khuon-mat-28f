import React, { useState } from 'react';
import { 
  PlusCircle, 
  X, 
  LogIn, 
  LogOut, 
  Check, 
  AlertCircle,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import type { SinhVien } from '../types';
import { addManualAttendance } from '../services/firebaseService';

interface ManualCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: SinhVien[];
}

export function ManualCheckInModal({ isOpen, onClose, students }: ManualCheckInModalProps) {
  const [selectedStudentMode, setSelectedStudentMode] = useState<'existing' | 'manual'>('existing');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  
  const [customMaSv, setCustomMaSv] = useState('');
  const [customHoTen, setCustomHoTen] = useState('');
  const [customLop, setCustomLop] = useState('');
  
  const [trangThai, setTrangThai] = useState<'VÀO' | 'RA'>('VÀO');
  const [ghiChu, setGhiChu] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let ma_sinh_vien = '';
    let ho_ten = '';
    let lop = '';

    if (selectedStudentMode === 'existing') {
      const sv = students.find((s) => s.ma_sinh_vien === selectedStudentId);
      if (!sv) {
        setError('Vui lòng chọn một sinh viên từ danh sách.');
        return;
      }
      ma_sinh_vien = sv.ma_sinh_vien;
      ho_ten = sv.ho_ten;
      lop = sv.lop;
    } else {
      if (!customMaSv.trim() || !customHoTen.trim() || !customLop.trim()) {
        setError('Vui lòng điền đầy đủ Mã SV, Họ tên và Lớp học.');
        return;
      }
      ma_sinh_vien = customMaSv.trim().toUpperCase();
      ho_ten = customHoTen.trim();
      lop = customLop.trim();
    }

    setIsSubmitting(true);
    try {
      await addManualAttendance({
        ma_sinh_vien,
        ho_ten,
        lop,
        trang_thai: trangThai,
        ghi_chu: ghiChu.trim()
      });
      onClose();
    } catch (err) {
      console.error('Lỗi khi ghi điểm danh:', err);
      setError('Lỗi khi lưu điểm danh lên Firestore. Kiểm tra quyền truy cập Security Rules.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Ghi Nhận Điểm Danh Bổ Sung</h3>
              <p className="text-[11px] text-slate-400">Ghi trực tiếp vào collection diem_danh (Firestore)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Mode switch */}
          {students.length > 0 && (
            <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedStudentMode('existing')}
                className={`flex-1 py-1.5 rounded-md font-medium transition cursor-pointer ${
                  selectedStudentMode === 'existing'
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Chọn từ DB ({students.length} SV)
              </button>
              <button
                type="button"
                onClick={() => setSelectedStudentMode('manual')}
                className={`flex-1 py-1.5 rounded-md font-medium transition cursor-pointer ${
                  selectedStudentMode === 'manual'
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Nhập mã SV mới
              </button>
            </div>
          )}

          {selectedStudentMode === 'existing' && students.length > 0 ? (
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Chọn sinh viên <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="">-- Chọn sinh viên --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.ma_sinh_vien}>
                    {s.ma_sinh_vien} - {s.ho_ten} ({s.lop})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Mã sinh viên <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customMaSv}
                  onChange={(e) => setCustomMaSv(e.target.value.toUpperCase())}
                  placeholder="VD: B21DCCN001"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Họ và tên <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customHoTen}
                  onChange={(e) => setCustomHoTen(e.target.value)}
                  placeholder="VD: Nguyễn Văn An"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Lớp <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customLop}
                  onChange={(e) => setCustomLop(e.target.value)}
                  placeholder="VD: CNTT-K15"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>
            </>
          )}

          {/* Trạng thái VÀO / RA */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">Trạng thái điểm danh</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTrangThai('VÀO')}
                className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  trangThai === 'VÀO'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>VÀO (Check-in)</span>
              </button>

              <button
                type="button"
                onClick={() => setTrangThai('RA')}
                className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  trangThai === 'RA'
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <LogOut className="w-4 h-4" />
                <span>RA (Check-out)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Ghi chú (Tùy chọn)</label>
            <input
              type="text"
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
              placeholder="VD: Điểm danh bù, lỗi camera..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Ghi nhận điểm danh</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
