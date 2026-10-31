import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  X, 
  Download, 
  Calendar, 
  GraduationCap, 
  CheckCircle2,
  Filter
} from 'lucide-react';
import type { DiemDanhRecord } from '../types';
import { formatDateTime, extractDateString } from '../firebase/config';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allRecords: DiemDanhRecord[];
  currentFilteredRecords: DiemDanhRecord[];
}

export function ExportModal({
  isOpen,
  onClose,
  allRecords,
  currentFilteredRecords
}: ExportModalProps) {
  const [exportScope, setExportScope] = useState<'current_filter' | 'all' | 'custom_range'>('current_filter');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'VÀO' | 'RA'>('all');

  if (!isOpen) return null;

  const handleExportCSV = () => {
    let datasetToExport: DiemDanhRecord[] = [];

    if (exportScope === 'current_filter') {
      datasetToExport = currentFilteredRecords;
    } else if (exportScope === 'all') {
      datasetToExport = allRecords;
    } else {
      datasetToExport = allRecords.filter((r) => {
        const dStr = extractDateString(r.ngay_gio || r.thoi_gian, typeof r.ngay === 'string' ? r.ngay : undefined);
        if (startDate && dStr < startDate) return false;
        if (endDate && dStr > endDate) return false;
        if (statusFilter !== 'all') {
          const rawStatus = (r.trang_thai || '').toString().toUpperCase();
          if (statusFilter === 'VÀO' && !rawStatus.includes('VÀO') && !rawStatus.includes('VAO') && !rawStatus.includes('IN')) return false;
          if (statusFilter === 'RA' && !rawStatus.includes('RA') && !rawStatus.includes('OUT')) return false;
        }
        return true;
      });
    }

    if (datasetToExport.length === 0) {
      alert('Không có dữ liệu nào khớp để xuất file!');
      return;
    }

    // Tiêu đề các cột
    const headers = [
      'STT',
      'Mã Sinh Viên',
      'Họ và Tên',
      'Lớp',
      'Trạng Thái',
      'Thời Điểm Điểm Danh',
      'Ngày',
      'Giờ',
      'Nguồn Ghi Nhận'
    ];

    // Tạo nội dung CSV
    const rows = datasetToExport.map((r, index) => {
      const fullTime = formatDateTime(
        r.ngay_gio || r.thoi_gian,
        typeof r.ngay === 'string' ? r.ngay : undefined,
        typeof r.gio === 'string' ? r.gio : undefined
      );

      return [
        index + 1,
        `"${(r.ma_sinh_vien || '').replace(/"/g, '""')}"`,
        `"${(r.ho_ten || '').replace(/"/g, '""')}"`,
        `"${(r.lop || '').replace(/"/g, '""')}"`,
        `"${(r.trang_thai || 'VÀO').replace(/"/g, '""')}"`,
        `"${fullTime.replace(/"/g, '""')}"`,
        `"${(String(r.ngay || '')).replace(/"/g, '""')}"`,
        `"${(String(r.gio || '')).replace(/"/g, '""')}"`,
        `"${(String(r.nguon || 'Nhận diện khuôn mặt')).replace(/"/g, '""')}"`
      ].join(',');
    });

    // Thêm UTF-8 BOM (\uFEFF) để Excel hiển thị đúng dấu tiếng Việt
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const timestampStr = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute('download', `diem_danh_nhan_dien_${timestampStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Xuất Báo Cáo Điểm Danh (CSV / Excel)</h3>
              <p className="text-[11px] text-slate-400">Hỗ trợ mã hóa UTF-8 tiếng Việt cho Excel</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Phạm vi xuất dữ liệu:</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={exportScope === 'current_filter'}
                  onChange={() => setExportScope('current_filter')}
                  className="text-sky-500"
                />
                <div>
                  <span className="font-semibold text-slate-200">
                    Chỉ các dòng đang lọc hiện tại ({currentFilteredRecords.length} bản ghi)
                  </span>
                  <p className="text-[11px] text-slate-500">Xuất đúng kết quả tìm kiếm và bộ lọc đang áp dụng trên bảng</p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={exportScope === 'all'}
                  onChange={() => setExportScope('all')}
                  className="text-sky-500"
                />
                <div>
                  <span className="font-semibold text-slate-200">
                    Toàn bộ lịch sử điểm danh ({allRecords.length} bản ghi)
                  </span>
                  <p className="text-[11px] text-slate-500">Xuất toàn bộ dữ liệu có trong collection diem_danh</p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={exportScope === 'custom_range'}
                  onChange={() => setExportScope('custom_range')}
                  className="text-sky-500"
                />
                <div>
                  <span className="font-semibold text-slate-200">Tùy chọn khoảng ngày cụ thể</span>
                  <p className="text-[11px] text-slate-500">Chọn khoảng thời gian từ ngày - đến ngày</p>
                </div>
              </label>
            </div>
          </div>

          {exportScope === 'custom_range' && (
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Từ ngày</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Đến ngày</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Lọc trạng thái</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'VÀO' | 'RA')}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none"
                >
                  <option value="all">Tất cả (VÀO & RA)</option>
                  <option value="VÀO">Chỉ VÀO</option>
                  <option value="RA">Chỉ RA</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" />
            <span>Tải file CSV (.csv)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
