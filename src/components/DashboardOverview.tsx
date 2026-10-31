import { useMemo, useState } from 'react';
import { 
  Users, 
  LogIn, 
  LogOut, 
  Scan, 
  Calendar, 
  TrendingUp, 
  Clock, 
  GraduationCap, 
  CheckCircle2,
  Activity,
  Layers,
  ArrowRight
} from 'lucide-react';
import type { DiemDanhRecord, SinhVien } from '../types';
import { parseFirebaseTimestamp, formatDateTime, extractDateString } from '../firebase/config';

interface DashboardOverviewProps {
  records: DiemDanhRecord[];
  students: SinhVien[];
  onViewAllRecords: () => void;
  onFilterByClass: (lop: string) => void;
}

export function DashboardOverview({
  records,
  students,
  onViewAllRecords,
  onFilterByClass
}: DashboardOverviewProps) {
  // Khoảng thời gian thống kê: 'today' | '7days' | '30days' | 'all'
  const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days' | 'all'>('today');

  // Lọc bản ghi theo khoảng thời gian đã chọn
  const filteredRecords = useMemo(() => {
    if (timeRange === 'all') return records;

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

    if (timeRange === 'today') {
      return records.filter((r) => {
        const dStr = extractDateString(r.ngay_gio || r.thoi_gian, typeof r.ngay === 'string' ? r.ngay : undefined);
        return dStr === todayStr;
      });
    }

    const daysBack = timeRange === '7days' ? 7 : 30;
    const pastLimit = new Date();
    pastLimit.setDate(pastLimit.getDate() - daysBack);
    pastLimit.setHours(0, 0, 0, 0);

    return records.filter((r) => {
      const parsedDate = parseFirebaseTimestamp(r.ngay_gio || r.thoi_gian);
      if (parsedDate) {
        return parsedDate >= pastLimit;
      }
      return true;
    });
  }, [records, timeRange]);

  // Tính toán các chỉ số thống kê CHÍNH XÁC (Phân biệt rõ: Lượt sự kiện vs Sinh viên duy nhất)
  const stats = useMemo(() => {
    const totalEvents = filteredRecords.length;

    // Sinh viên duy nhất (Distinct Set of Student ID)
    const uniqueStudentIds = new Set<string>();
    let vaoCount = 0;
    let raCount = 0;

    filteredRecords.forEach((r) => {
      if (r.ma_sinh_vien) {
        uniqueStudentIds.add(r.ma_sinh_vien.trim().toUpperCase());
      }
      const stt = (r.trang_thai || '').toString().toUpperCase();
      if (stt === 'VÀO' || stt === 'VAO' || stt === 'IN') {
        vaoCount++;
      } else if (stt === 'RA' || stt === 'OUT') {
        raCount++;
      } else {
        // Mặc định tính là vào nếu không rõ
        vaoCount++;
      }
    });

    const uniqueStudents = uniqueStudentIds.size;
    const totalRegisteredStudents = students.length;

    // Thống kê theo lớp
    const classMap: Record<string, { totalEvents: number; uniqueStudents: Set<string>; vao: number; ra: number }> = {};
    filteredRecords.forEach((r) => {
      const lop = (r.lop || 'Chưa xếp lớp').trim();
      if (!classMap[lop]) {
        classMap[lop] = { totalEvents: 0, uniqueStudents: new Set<string>(), vao: 0, ra: 0 };
      }
      classMap[lop].totalEvents++;
      if (r.ma_sinh_vien) {
        classMap[lop].uniqueStudents.add(r.ma_sinh_vien.trim().toUpperCase());
      }
      const stt = (r.trang_thai || '').toString().toUpperCase();
      if (stt === 'RA' || stt === 'OUT') {
        classMap[lop].ra++;
      } else {
        classMap[lop].vao++;
      }
    });

    const classStats = Object.entries(classMap).map(([lop, data]) => ({
      lop,
      totalEvents: data.totalEvents,
      uniqueStudentsCount: data.uniqueStudents.size,
      vaoCount: data.vao,
      raCount: data.ra
    })).sort((a, b) => b.totalEvents - a.totalEvents);

    // Thống kê theo khung giờ (0h -> 23h)
    const hoursCount: number[] = Array(24).fill(0);
    filteredRecords.forEach((r) => {
      const dt = parseFirebaseTimestamp(r.ngay_gio || r.thoi_gian);
      if (dt) {
        hoursCount[dt.getHours()]++;
      } else if (typeof r.gio === 'string' && r.gio.includes(':')) {
        const hour = parseInt(r.gio.split(':')[0], 10);
        if (!isNaN(hour) && hour >= 0 && hour < 24) {
          hoursCount[hour]++;
        }
      }
    });

    const maxHourCount = Math.max(...hoursCount, 1);

    return {
      totalEvents,
      uniqueStudents,
      totalRegisteredStudents,
      vaoCount,
      raCount,
      classStats,
      hoursCount,
      maxHourCount
    };
  }, [filteredRecords, students]);

  // 6 lượt điểm danh mới nhất
  const recentRecords = useMemo(() => {
    return [...records]
      .sort((a, b) => {
        const dateA = parseFirebaseTimestamp(a.ngay_gio || a.thoi_gian)?.getTime() || 0;
        const dateB = parseFirebaseTimestamp(b.ngay_gio || b.thoi_gian)?.getTime() || 0;
        return dateB - dateA;
      })
      .slice(0, 6);
  }, [records]);

  return (
    <div className="space-y-6">
      {/* Time Range Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-3 sm:p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-sky-400" />
          <span className="text-sm font-semibold text-slate-200">Khoảng thời gian báo cáo:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setTimeRange('today')}
            className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
              timeRange === 'today'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hôm nay
          </button>
          <button
            onClick={() => setTimeRange('7days')}
            className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
              timeRange === '7days'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            7 ngày gần nhất
          </button>
          <button
            onClick={() => setTimeRange('30days')}
            className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
              timeRange === '30days'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            30 ngày gần nhất
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
              timeRange === 'all'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Toàn bộ lịch sử
          </button>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Tổng số lượt điểm danh (Scans) */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Tổng số lượt điểm danh
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Scan className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {stats.totalEvents.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs text-slate-400">lượt quét</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Bao gồm tất cả sự kiện nhận diện khuôn mặt
          </p>
        </div>

        {/* KPI 2: Số sinh viên duy nhất (Unique Students) */}
        <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-4 shadow-sm hover:border-indigo-500/50 transition bg-gradient-to-b from-indigo-950/20 to-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-indigo-300 uppercase tracking-wider">
              Sinh viên có mặt (Duy nhất)
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-indigo-300 tracking-tight">
              {stats.uniqueStudents.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs text-slate-400">
              / {stats.totalRegisteredStudents > 0 ? `${stats.totalRegisteredStudents} sv` : '0 sv trong DB'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-indigo-300/80">
            Phân biệt riêng từng cá nhân (không tính lặp lượt quét)
          </p>
        </div>

        {/* KPI 3: Lượt VÀO */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
              Lượt VÀO (Check-in)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <LogIn className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-400 tracking-tight">
              {stats.vaoCount.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs text-slate-400">
              ({stats.totalEvents > 0 ? Math.round((stats.vaoCount / stats.totalEvents) * 100) : 0}%)
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Số lần nhận diện ghi nhận trạng thái VÀO
          </p>
        </div>

        {/* KPI 4: Lượt RA */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">
              Lượt RA (Check-out)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <LogOut className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-amber-400 tracking-tight">
              {stats.raCount.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs text-slate-400">
              ({stats.totalEvents > 0 ? Math.round((stats.raCount / stats.totalEvents) * 100) : 0}%)
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Số lần nhận diện ghi nhận trạng thái RA
          </p>
        </div>
      </div>

      {/* Charts & Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Distribution Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <h3 className="font-semibold text-slate-200 text-sm">
                Phân bố lượt điểm danh theo giờ trong ngày
              </h3>
            </div>
            <span className="text-xs text-slate-400">Khung giờ 00:00 - 23:00</span>
          </div>

          <div className="h-44 flex items-end gap-1.5 pt-4 pb-2 px-1 border-b border-slate-800">
            {stats.hoursCount.map((count, hour) => {
              const heightPercent = stats.maxHourCount > 0 ? (count / stats.maxHourCount) * 100 : 0;
              const isPeak = count === stats.maxHourCount && count > 0;
              return (
                <div
                  key={hour}
                  className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
                >
                  {/* Tooltip */}
                  <div className="absolute -top-8 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10 border border-slate-700">
                    {hour}h: {count} lượt
                  </div>

                  <div
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    className={`w-full rounded-t transition-all ${
                      count === 0
                        ? 'bg-slate-800/40'
                        : isPeak
                        ? 'bg-gradient-to-t from-sky-600 to-indigo-400 shadow-sm shadow-sky-500/30'
                        : 'bg-sky-500/70 hover:bg-sky-400'
                    }`}
                  />
                  <span className="text-[9px] text-slate-500 group-hover:text-slate-300">
                    {hour % 3 === 0 ? `${hour}h` : ''}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-sky-500"></span>
                Giờ thông thường
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-400"></span>
                Giờ cao điểm
              </span>
            </div>
            <span>Dữ liệu thực tế từ collection <code className="text-amber-300">diem_danh</code></span>
          </div>
        </div>

        {/* Live Feed: Lượt quét gần nhất */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <h3 className="font-semibold text-slate-200 text-sm">Điểm danh mới nhất</h3>
            </div>
            <button
              onClick={onViewAllRecords}
              className="text-xs text-sky-400 hover:text-sky-300 inline-flex items-center gap-1 cursor-pointer"
            >
              Xem tất cả <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-56">
            {recentRecords.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500 text-xs">
                <Scan className="w-8 h-8 mb-2 opacity-30" />
                <p>Chưa có lượt điểm danh nào được ghi nhận</p>
                <p className="text-[11px] mt-1 text-slate-600">
                  Khi chương trình Python nhận diện được sinh viên, dữ liệu sẽ hiển thị tại đây.
                </p>
              </div>
            ) : (
              recentRecords.map((r) => {
                const isVao = (r.trang_thai || '').toUpperCase().includes('VÀO') || (r.trang_thai || '').toUpperCase().includes('VAO') || (r.trang_thai || '').toUpperCase().includes('IN');
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isVao ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">
                          {r.ho_ten}
                        </p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                          <span className="font-mono text-slate-300">{r.ma_sinh_vien}</span>
                          <span>•</span>
                          <span>{r.lop}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isVao
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {r.trang_thai || (isVao ? 'VÀO' : 'RA')}
                      </span>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {r.gio ? String(r.gio) : formatDateTime(r.ngay_gio || r.thoi_gian).split(' ')[1] || ''}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Class Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <h3 className="font-semibold text-slate-200 text-sm">
              Báo cáo chi tiết theo từng Lớp học
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Tổng cộng: <strong className="text-slate-200">{stats.classStats.length}</strong> lớp có dữ liệu
          </span>
        </div>

        {stats.classStats.length === 0 ? (
          <p className="text-center py-6 text-slate-500 text-xs">
            Chưa có dữ liệu phân lớp cho khoảng thời gian này
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] bg-slate-950/40">
                  <th className="py-2.5 px-3">Lớp học</th>
                  <th className="py-2.5 px-3 text-center">Sinh viên duy nhất</th>
                  <th className="py-2.5 px-3 text-center">Tổng lượt quét</th>
                  <th className="py-2.5 px-3 text-center">Lượt VÀO</th>
                  <th className="py-2.5 px-3 text-center">Lượt RA</th>
                  <th className="py-2.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stats.classStats.map((item) => (
                  <tr key={item.lop} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-medium text-slate-200 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>{item.lop}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {item.uniqueStudentsCount} sinh viên
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-slate-200">
                      {item.totalEvents}
                    </td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-medium">
                      {item.vaoCount}
                    </td>
                    <td className="py-2.5 px-3 text-center text-amber-400 font-medium">
                      {item.raCount}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onFilterByClass(item.lop)}
                        className="text-xs text-sky-400 hover:text-sky-300 underline cursor-pointer"
                      >
                        Lọc lớp này
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
