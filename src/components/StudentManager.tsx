import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Search, 
  GraduationCap, 
  Download, 
  AlertTriangle, 
  Check, 
  X, 
  Mail, 
  Phone, 
  BookOpen,
  RefreshCw,
  FileJson
} from 'lucide-react';
import type { SinhVien } from '../types';
import { addStudent, updateStudent, deleteStudent, checkStudentCodeExists } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';

interface StudentManagerProps {
  students: SinhVien[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function StudentManager({ students, isLoading, onRefresh }: StudentManagerProps) {
  const { currentUser } = useAuth();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  // Form State (Thêm/Sửa)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<SinhVien | null>(null);
  const [formData, setFormData] = useState({
    ma_sinh_vien: '',
    ho_ten: '',
    lop: '',
    khoa: '',
    email: '',
    so_dien_thoai: '',
    gioi_tinh: 'Nam',
    trang_thai_hoc: 'Đang học',
    ghi_chu: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation State
  const [deletingStudent, setDeletingStudent] = useState<SinhVien | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Danh sách các lớp học
  const classList = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.lop && s.lop.trim()) set.add(s.lop.trim());
    });
    return Array.from(set).sort();
  }, [students]);

  // Lọc sinh viên
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedClass !== 'all' && s.lop !== selectedClass) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (s.ho_ten || '').toLowerCase().includes(q);
        const matchCode = (s.ma_sinh_vien || '').toLowerCase().includes(q);
        const matchClass = (s.lop || '').toLowerCase().includes(q);
        return matchName || matchCode || matchClass;
      }
      return true;
    });
  }, [students, selectedClass, searchQuery]);

  // Mở modal Thêm mới
  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setFormData({
      ma_sinh_vien: '',
      ho_ten: '',
      lop: classList[0] || 'CNTT-K15',
      khoa: 'Công nghệ thông tin',
      email: '',
      so_dien_thoai: '',
      gioi_tinh: 'Nam',
      trang_thai_hoc: 'Đang học',
      ghi_chu: ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Mở modal Chỉnh sửa
  const handleOpenEditModal = (student: SinhVien) => {
    setEditingStudent(student);
    setFormData({
      ma_sinh_vien: student.ma_sinh_vien,
      ho_ten: student.ho_ten,
      lop: student.lop,
      khoa: student.khoa || '',
      email: student.email || '',
      so_dien_thoai: student.so_dien_thoai || '',
      gioi_tinh: student.gioi_tinh || 'Nam',
      trang_thai_hoc: student.trang_thai_hoc || 'Đang học',
      ghi_chu: student.ghi_chu || ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Xử lý Lưu form (Thêm hoặc Sửa)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const code = formData.ma_sinh_vien.trim().toUpperCase();
    const name = formData.ho_ten.trim();
    const lop = formData.lop.trim();

    if (!code) {
      setFormError('Vui lòng nhập Mã sinh viên.');
      return;
    }
    if (!name) {
      setFormError('Vui lòng nhập Họ và tên sinh viên.');
      return;
    }
    if (!lop) {
      setFormError('Vui lòng nhập Lớp học.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingStudent) {
        // Cập nhật sinh viên hiện tại - chỉ sửa document tương ứng
        await updateStudent(editingStudent.id, {
          ho_ten: name,
          lop,
          khoa: formData.khoa.trim(),
          email: formData.email.trim(),
          so_dien_thoai: formData.so_dien_thoai.trim(),
          gioi_tinh: formData.gioi_tinh,
          trang_thai_hoc: formData.trang_thai_hoc,
          ghi_chu: formData.ghi_chu.trim()
        });
      } else {
        // Thêm sinh viên mới (kiểm tra trùng mã)
        const exists = await checkStudentCodeExists(code);
        if (exists) {
          setFormError(`Mã sinh viên "${code}" đã tồn tại! Vui lòng chọn mã khác.`);
          setIsSubmitting(false);
          return;
        }

        await addStudent({
          ma_sinh_vien: code,
          ho_ten: name,
          lop,
          khoa: formData.khoa.trim(),
          email: formData.email.trim(),
          so_dien_thoai: formData.so_dien_thoai.trim(),
          gioi_tinh: formData.gioi_tinh,
          trang_thai_hoc: formData.trang_thai_hoc,
          ghi_chu: formData.ghi_chu.trim()
        });
      }

      setIsModalOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu sinh viên vào Firebase.';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý Xóa sinh viên
  const handleConfirmDelete = async () => {
    if (!deletingStudent) return;
    setIsDeleting(true);
    try {
      await deleteStudent(deletingStudent.id);
      setDeletingStudent(null);
    } catch (err) {
      console.error('Lỗi khi xóa sinh viên:', err);
      alert('Không thể xóa sinh viên. Kiểm tra lại quyền truy cập Firestore!');
    } finally {
      setIsDeleting(false);
    }
  };

  // Xuất file `students.json` cho chương trình Python
  const handleExportStudentsJson = () => {
    const exportData = students.map((s) => ({
      ma_sinh_vien: s.ma_sinh_vien,
      ho_ten: s.ho_ten,
      lop: s.lop,
      khoa: s.khoa || '',
      email: s.email || '',
      so_dien_thoai: s.so_dien_thoai || ''
    }));

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'students.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-400" />
              <h2 className="text-base sm:text-lg font-bold text-white">
                Quản lý Sinh viên & Lớp học (Cloud Firestore)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Dữ liệu lưu tại collection <code className="text-amber-300 font-mono">sinh_vien</code> trong dự án{' '}
              <strong className="text-slate-200">nhan-dien-a2471</strong>. Chương trình Python và Web cùng đồng bộ một nguồn duy nhất.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportStudentsJson}
              disabled={students.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer disabled:opacity-40"
              title="Xuất file students.json để chạy với code Python cũ nếu chưa chuyển sang đọc Firestore"
            >
              <FileJson className="w-4 h-4 text-amber-400" />
              <span>Xuất file students.json</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white transition shadow shadow-sky-600/30 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Thêm sinh viên mới</span>
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800/80">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo Mã sinh viên, Họ tên hoặc Lớp..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="all">Tất cả lớp ({classList.length} lớp)</option>
              {classList.map((cls) => (
                <option key={cls} value={cls}>
                  Lớp: {cls}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] bg-slate-950/60">
                <th className="py-3 px-4">Mã sinh viên</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Lớp học</th>
                <th className="py-3 px-4">Khoa / Ngành</th>
                <th className="py-3 px-4">Liên hệ</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-4"><div className="h-4 w-20 bg-slate-800 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-32 bg-slate-800 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-16 bg-slate-800 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-24 bg-slate-800 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-28 bg-slate-800 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-14 bg-slate-800 rounded mx-auto" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-12 bg-slate-800 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 px-4 text-slate-400">
                    <Users className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="font-medium text-slate-300">Chưa có sinh viên nào trong danh sách</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Dữ liệu được lưu trực tiếp trên Firestore <code className="text-amber-300 font-mono">sinh_vien</code>. Hãy nhấn nút <strong>"Thêm sinh viên mới"</strong> để tạo hồ sơ đầu tiên.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-sky-400">
                      {s.ma_sinh_vien}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-100">
                      {s.ho_ten}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-slate-200 text-xs">
                        {s.lop}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-xs">
                      {s.khoa || 'Chưa cập nhật'}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">
                      {s.email && (
                        <div className="flex items-center gap-1 text-slate-300">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{s.email}</span>
                        </div>
                      )}
                      {s.so_dien_thoai && (
                        <div className="flex items-center gap-1 text-slate-400 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{s.so_dien_thoai}</span>
                        </div>
                      )}
                      {!s.email && !s.so_dien_thoai && '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {s.trang_thai_hoc || 'Đang học'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(s)}
                          className="p-1.5 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition cursor-pointer"
                          title="Sửa thông tin sinh viên"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingStudent(s)}
                          className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer"
                          title="Xóa sinh viên khỏi cơ sở dữ liệu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>
            Tổng cộng: <strong className="text-white">{filteredStudents.length}</strong> sinh viên
          </span>
          <span className="text-[11px] text-slate-500">
            Dữ liệu đồng bộ trực tiếp hai chiều với Cloud Firestore
          </span>
        </div>
      </div>

      {/* Modal: Thêm / Sửa Sinh Viên */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-400" />
                {editingStudent ? 'Chỉnh sửa thông tin sinh viên' : 'Thêm sinh viên mới vào Firestore'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Mã sinh viên <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingStudent}
                    value={formData.ma_sinh_vien}
                    onChange={(e) => setFormData({ ...formData, ma_sinh_vien: e.target.value.toUpperCase() })}
                    placeholder="VD: B21DCCN001"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500 disabled:opacity-50 font-mono"
                  />
                  {editingStudent && (
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Mã sinh viên là khóa chính document (không thể sửa)
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Họ và tên <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.ho_ten}
                    onChange={(e) => setFormData({ ...formData, ho_ten: e.target.value })}
                    placeholder="VD: Nguyễn Văn An"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Lớp sinh hoạt <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lop}
                    onChange={(e) => setFormData({ ...formData, lop: e.target.value })}
                    placeholder="VD: CNTT-K15A"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Khoa / Viện đào tạo
                  </label>
                  <input
                    type="text"
                    value={formData.khoa}
                    onChange={(e) => setFormData({ ...formData, khoa: e.target.value })}
                    placeholder="VD: Công nghệ thông tin"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="student@example.edu.vn"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    value={formData.so_dien_thoai}
                    onChange={(e) => setFormData({ ...formData, so_dien_thoai: e.target.value })}
                    placeholder="0912345678"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Giới tính</label>
                  <select
                    value={formData.gioi_tinh}
                    onChange={(e) => setFormData({ ...formData, gioi_tinh: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Trạng thái học tập</label>
                  <select
                    value={formData.trang_thai_hoc}
                    onChange={(e) => setFormData({ ...formData, trang_thai_hoc: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="Đang học">Đang học</option>
                    <option value="Bảo lưu">Bảo lưu</option>
                    <option value="Đã tốt nghiệp">Đã tốt nghiệp</option>
                    <option value="Nghỉ học">Nghỉ học</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Ghi chú (Tùy chọn)</label>
                <textarea
                  rows={2}
                  value={formData.ghi_chu}
                  onChange={(e) => setFormData({ ...formData, ghi_chu: e.target.value })}
                  placeholder="Ghi chú thêm về sinh viên, ảnh train khuôn mặt..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingStudent ? 'Lưu thay đổi' : 'Thêm vào Firestore'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Xác nhận Xóa Sinh Viên */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-900/60 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Xác nhận xóa sinh viên</h3>
                <p className="text-xs text-rose-300/80">Hành động này sẽ xóa vĩnh viễn trên Firestore</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa sinh viên{' '}
              <strong className="text-white">{deletingStudent.ho_ten}</strong> (Mã SV:{' '}
              <span className="font-mono text-sky-400">{deletingStudent.ma_sinh_vien}</span> - Lớp:{' '}
              <span className="text-slate-200">{deletingStudent.lop}</span>) khỏi hệ thống không?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Xóa vĩnh viễn</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
