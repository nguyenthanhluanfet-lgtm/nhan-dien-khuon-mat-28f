export interface DiemDanhRecord {
  id: string;
  ho_ten: string;
  ma_sinh_vien: string;
  lop: string;
  ngay?: string | unknown;
  gio?: string | unknown;
  ngay_gio?: unknown;
  trang_thai: string; // 'VÀO' | 'RA' | etc.
  thoi_gian?: unknown;
  // Raw additional fields if present in Python script
  [key: string]: unknown;
}

export interface SinhVien {
  id: string; // Document ID (usually same as ma_sinh_vien or auto-id)
  ma_sinh_vien: string;
  ho_ten: string;
  lop: string;
  khoa?: string;
  email?: string;
  so_dien_thoai?: string;
  ngay_sinh?: string;
  gioi_tinh?: 'Nam' | 'Nữ' | 'Khác' | string;
  trang_thai_hoc?: 'Đang học' | 'Bảo lưu' | 'Đã tốt nghiệp' | 'Nghỉ học' | string;
  anh_dai_dien?: string;
  ghi_chu?: string;
  ngay_tao?: unknown;
  ngay_cap_nhat?: unknown;
}

export interface LopHoc {
  id: string;
  ma_lop: string;
  ten_lop: string;
  khoa?: string;
  nien_khoa?: string;
  so_sinh_vien?: number;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'error';

export interface ConnectionInfo {
  status: ConnectionStatus;
  lastSynced: Date | null;
  attendanceCount: number;
  studentCount: number;
  errorMessage: string | null;
  errorType: 'permission' | 'network' | 'auth' | 'config' | 'unknown' | null;
}

export interface AttendanceFilter {
  searchQuery: string; // name or code
  dateFilter: string; // 'all' | 'today' | specific date 'YYYY-MM-DD'
  customDateStart?: string;
  customDateEnd?: string;
  classFilter: string; // 'all' | specific class
  statusFilter: string; // 'all' | 'VÀO' | 'RA'
  sortBy: 'ngay_gio_desc' | 'ngay_gio_asc';
}

export interface DashboardStatsData {
  totalRecords: number;
  uniqueStudentsToday: number;
  uniqueStudentsTotal: number;
  totalVao: number;
  totalRa: number;
  totalStudentsInDb: number;
  todayVao: number;
  todayRa: number;
  classBreakdown: Array<{
    lop: string;
    totalEvents: number;
    uniqueStudents: number;
    vaoCount: number;
    raCount: number;
  }>;
  hourlyBreakdown: Array<{
    hour: number;
    label: string;
    count: number;
  }>;
}
