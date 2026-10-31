import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  Filter, 
  ArrowUpDown, 
  Download, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  GraduationCap,
  User,
  Hash
} from 'lucide-react';
import type { DiemDanhRecord, SinhVien } from '../types';
import { parseFirebaseTimestamp, formatDateTime, extractDateString } from '../firebase/config';

interface AttendanceTableProps {
  records: DiemDanhRecord[];
  students: SinhVien[];
  isLoading: boolean;
  selectedClassFilter?: string;
  onClearClassFilter?: () => void;
  onExportCSV: (filtered: DiemDanhRecord[]) => void;
}

export function AttendanceTable({
  records,
  students,
  isLoading,
  selectedClassFilter = 'all',
  onClearClassFilter,
  onExportCSV
}: AttendanceTableProps) {
  // Bộ lọc
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'custom'>('all');
  const [customDate, setCustomDate] = useState('');
  const [classFilter, setClassFilter] = useState(selectedClassFilter);
  const [statusFilter, setStatusFilter] = useState<'all' | 'VÀO' | 'RA'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // Mới nhất / Cũ nhất

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  // Cập nhật khi prop selectedClassFilter thay đổi
  React.useEffect(() => {
    if (selectedClassFilter && selectedClassFilter !== 'all') {
      setClassFilter(selectedClassFilter);
    }
  }, [selectedClassFilter]);

  // Trích xuất danh sách các lớp học có trong dữ liệu điểm danh và sinh viên
  const availableClasses = useMemo(() => {
    const classSet = new Set<string>();
    records.forEach((r) => {
      if (r.lop && r.lop.trim()) classSet.add(r.lop.trim());
    });
    students.forEach((s) => {
      if (s.lop && s.lop.trim()) classSet.add(s.lop.trim());
    });
    return Array.from(classSet).sort();
  }, [records, students]);

  // Hôm nay string: YYYY-MM-DD
  const todayStr = useMemo(() => {
    const n = new Date();
    return `${n.getFullYear()}-${(n.getMonth() + 1).toString().padStart(2, '0')}-${n.getDate().toString().padStart(2, '0')}`;
  }, []);

  // Lọc dữ liệu
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // 1. Tìm kiếm theo Mã SV hoặc Họ tên
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchName = (r.ho_ten || '').toLowerCase().includes(query);
        const matchCode = (r.ma_sinh_vien || '').toLowerCase().includes(query);
        if (!matchName && !matchCode) return false;
      }

      // 2. Lọc theo lớp
      if (classFilter !== 'all') {
        if ((r.lop || '').trim().toLowerCase() !== classFilter.trim().toLowerCase()) {
          return false;
        }
      }

      // 3. Lọc theo trạng thái VÀO/RA
      if (statusFilter !== 'all') {
        const rawStatus = (r.trang_thai || '').toString().toUpperCase();
        if (statusFilter === 'VÀO') {
          const isVao = rawStatus.includes('VÀO') || rawStatus.includes('VAO') || rawStatus.includes('IN');
          if (!isVao) return false;
        } else if (statusFilter === 'RA') {
          const isRa = rawStatus.includes('RA') || rawStatus.includes('OUT');
          if (!isRa) return false;
        }
      }

      // 4. Lọc theo ngày
      if (dateFilter === 'today') {
        const rDate = extractDateString(r.ngay_gio || r.thoi_gian, typeof r.ngay === 'string' ? r.ngay : undefined);
        if (rDate !== todayStr) return false;
      } else if (dateFilter === 'custom' && customDate) {
        const rDate = extractDateString(r.ngay_gio || r.thoi_gian, typeof r.ngay === 'string' ? r.ngay : undefined);
        if (rDate !== customDate) return false;
      }

      return true;
    });
  }, [records, searchQuery, classFilter, statusFilter, dateFilter, customDate, todayStr]);

  // Sắp xếp
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      const timeA = parseFirebaseTimestamp(a.ngay_gio || a.thoi_gian)?.getTime() || 0;
      const timeB = parseFirebaseTimestamp(b.ngay_gio || b.thoi_gian)?.getTime() || 0;
      if (sortOrder === 'desc') {
        return timeB - timeA;
      } else {
        return timeA - timeB;
      }
    });
  }, [filteredRecords, sortOrder]);

  // Phân trang tính toán
  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / rowsPerPage));
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedRecords.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedRecords, currentPage, rowsPerPage]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
    setCustomDate('');
    setClassFilter('all');
    setStatusFilter('all');
    setSortOrder('desc');
    setCurrentPage(1);
    if (onClearClassFilter) onClearClassFilter();
  };

  return (
    <div className="space-y-4">
      {/* Control Bar: Filters & Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-sm">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo Mã sinh viên hoặc Họ và tên..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition"
            />
          </div>

          {/* Date Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
              <button
                onClick={() => {
                  setDateFilter('all');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                  dateFilter === 'all' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tất cả ngày
              </button>
              <button
                onClick={() => {
                  setDateFilter('today');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                  dateFilter === 'today' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Hôm nay
              </button>
              <button
                onClick={() => {
                  setDateFilter('custom');
                  if (!customDate) setCustomDate(todayStr);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                  dateFilter === 'custom' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Chọn ngày
              </button>
            </div>

            {dateFilter === 'custom' && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            )}
          </div>
        </div>

        {/* Second Row Filters: Class, Status, Sort, Export */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            {/* Lọc theo lớp */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Lớp:</span>
              <select
                value={classFilter}
                onChange={(e) => {
                  setClassFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="all">Tất cả lớp ({availableClasses.length})</option>
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Lọc theo trạng thái */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as 'all' | 'VÀO' | 'RA');
                  setCurrentPage(1);
                }}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="all">Tất cả (VÀO & RA)</option>
                <option value="VÀO">Chỉ VÀO (Check-in)</option>
                <option value="RA">Chỉ RA (Check-out)</option>
              </select>
            </div>

            {/* Sắp xếp */}
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
              title="Đổi chiều sắp xếp thời gian"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-sky-400" />
              <span>{sortOrder === 'desc' ? 'Mới nhất trước' : 'Cũ nhất trước'}</span>
            </button>

            {/* Reset Filter Button */}
            {(searchQuery || dateFilter !== 'all' || classFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2 py-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Đặt lại lọc</span>
              </button>
            )}
          </div>

          {/* Export & Count */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              Kết quả: <strong className="text-white">{sortedRecords.length}</strong> / {records.length} bản ghi
            </span>

            <button
              onClick={() => onExportCSV(sortedRecords)}
              disabled={sortedRecords.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600/90 hover:bg-emerald-500 text-white transition cursor-pointer disabled:opacity-40"
              title="Xuất các dòng đang lọc ra file CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Xuất {sortedRecords.length} dòng</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] bg-slate-950/60">
                <th className="py-3 px-3 sm:px-4">#</th>
                <th className="py-3 px-3 sm:px-4">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    Họ và tên
                  </span>
                </th>
                <th className="py-3 px-3 sm:px-4">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5" />
                    Mã SV
                  </span>
                </th>
                <th className="py-3 px-3 sm:px-4">
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" />
                    Lớp
                  </span>
                </th>
                <th className="py-3 px-3 sm:px-4 text-center">Trạng thái</th>
                <th className="py-3 px-3 sm:px-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Thời điểm ghi nhận
                  </span>
                </th>
                <th className="py-3 px-3 sm:px-4 text-right">Chi tiết thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                // Loading Skeleton Rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 w-6 bg-slate-800 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-32 bg-slate-800 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-20 bg-slate-800 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-16 bg-slate-800 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-14 bg-slate-800 rounded mx-auto" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-28 bg-slate-800 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-20 bg-slate-800 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 px-4 text-slate-400">
                    <div className="max-w-md mx-auto space-y-2">
                      <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
                      <p className="font-medium text-slate-300">Không tìm thấy bản ghi điểm danh nào</p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {records.length === 0
                          ? 'Collection "diem_danh" trên Firestore nhan-dien-a2471 hiện chưa có dữ liệu, hoặc chương trình Python chưa ghi bản ghi nào. Bạn có thể nhấn nút "Điểm danh bổ sung" ở góc phải để thêm thử một bản ghi mẫu.'
                          : 'Không có bản ghi nào khớp với điều kiện lọc hiện tại. Thử nhấn "Đặt lại lọc".'}
                      </p>
                      {records.length > 0 && (
                        <button
                          onClick={handleResetFilters}
                          className="mt-2 text-xs text-sky-400 hover:underline cursor-pointer"
                        >
                          Xóa bộ lọc
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r, index) => {
                  const globalIndex = (currentPage - 1) * rowsPerPage + index + 1;
                  const isVao = (r.trang_thai || '').toUpperCase().includes('VÀO') || (r.trang_thai || '').toUpperCase().includes('VAO') || (r.trang_thai || '').toUpperCase().includes('IN');
                  const formattedFull = formatDateTime(
                    r.ngay_gio || r.thoi_gian,
                    typeof r.ngay === 'string' ? r.ngay : undefined,
                    typeof r.gio === 'string' ? r.gio : undefined
                  );

                  return (
                    <tr
                      key={r.id || `${r.ma_sinh_vien}_${index}`}
                      className="hover:bg-slate-800/40 transition group"
                    >
                      <td className="py-3 px-3 sm:px-4 text-slate-500 text-xs font-mono">
                        {globalIndex}
                      </td>
                      <td className="py-3 px-3 sm:px-4 font-semibold text-slate-100">
                        {r.ho_ten}
                      </td>
                      <td className="py-3 px-3 sm:px-4 font-mono font-medium text-sky-400">
                        {r.ma_sinh_vien}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-xs border border-slate-700/60">
                          {r.lop || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                            isVao
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {r.trang_thai || (isVao ? 'VÀO' : 'RA')}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-slate-300 font-mono text-xs">
                        {formattedFull}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-right text-xs text-slate-400">
                        {r.gio && r.ngay ? (
                          <span>
                            Ngày: <strong className="text-slate-300">{String(r.ngay)}</strong> | Giờ: <strong className="text-slate-300">{String(r.gio)}</strong>
                          </span>
                        ) : (
                          <span className="text-slate-500">Tự động đồng bộ</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {sortedRecords.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span>Hiển thị:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none"
              >
                <option value={10}>10 dòng</option>
                <option value={15}>15 dòng</option>
                <option value={25}>25 dòng</option>
                <option value={50}>50 dòng</option>
                <option value={100}>100 dòng</option>
              </select>
              <span>
                (Đang hiển thị {Math.min(sortedRecords.length, (currentPage - 1) * rowsPerPage + 1)} - {Math.min(sortedRecords.length, currentPage * rowsPerPage)} / {sortedRecords.length})
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-medium text-slate-200">
                Trang {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
