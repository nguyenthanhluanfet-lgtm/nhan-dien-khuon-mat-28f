import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  getDocs,
  where,
  serverTimestamp,
  type Unsubscribe,
  type FirestoreError
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { DiemDanhRecord, SinhVien, ConnectionInfo } from '../types';

/**
 * Phân loại lỗi Firestore sang dạng thông báo dễ hiểu tiếng Việt
 */
export function classifyFirestoreError(error: unknown): { message: string; type: ConnectionInfo['errorType'] } {
  if (!error) return { message: 'Lỗi không xác định', type: 'unknown' };
  
  const err = error as FirestoreError;
  const code = err.code || '';
  const rawMsg = err.message || String(error);

  if (code.includes('permission-denied') || rawMsg.toLowerCase().includes('permission')) {
    return {
      message: 'Lỗi quyền truy cập (permission-denied). Firestore Security Rules đang chặn đọc/ghi. Vui lòng đăng nhập hoặc cập nhật Security Rules trên Firebase Console.',
      type: 'permission'
    };
  }

  if (code.includes('unavailable') || code.includes('failed-precondition') || rawMsg.toLowerCase().includes('network') || rawMsg.toLowerCase().includes('offline')) {
    return {
      message: 'Mất kết nối mạng hoặc dịch vụ Firestore tạm thời không sẵn sàng. Vui lòng kiểm tra đường truyền Internet.',
      type: 'network'
    };
  }

  if (code.includes('unauthenticated')) {
    return {
      message: 'Yêu cầu xác thực tài khoản. Vui lòng đăng nhập quyền quản trị viên.',
      type: 'auth'
    };
  }

  if (code.includes('invalid-api-key') || code.includes('not-found') || rawMsg.toLowerCase().includes('project')) {
    return {
      message: `Lỗi cấu hình Firebase Project (${rawMsg}). Kiểm tra cấu hình dự án nhan-dien-a2471.`,
      type: 'config'
    };
  }

  return {
    message: `Lỗi kết nối Firestore: ${rawMsg}`,
    type: 'unknown'
  };
}

/**
 * Lắng nghe trực tiếp (Realtime listener) collection 'diem_danh'
 * Tự động đồng bộ ngay khi chương trình Python ghi bản ghi mới
 */
export function subscribeToAttendance(
  onData: (records: DiemDanhRecord[]) => void,
  onError: (error: FirestoreError) => void
): Unsubscribe {
  const colRef = collection(db, 'diem_danh');
  
  // Chúng ta lắng nghe toàn bộ collection và sắp xếp client-side để tránh lỗi thiếu Composite Index của Firestore
  return onSnapshot(
    colRef,
    (snapshot) => {
      const records: DiemDanhRecord[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        records.push({
          id: docSnap.id,
          ho_ten: data.ho_ten || 'Chưa có tên',
          ma_sinh_vien: data.ma_sinh_vien || 'N/A',
          lop: data.lop || 'Chưa phân lớp',
          ngay: data.ngay,
          gio: data.gio,
          ngay_gio: data.ngay_gio,
          trang_thai: (data.trang_thai || 'VÀO').toString().toUpperCase(),
          thoi_gian: data.thoi_gian,
          ...data
        });
      });
      onData(records);
    },
    (err) => {
      console.error('[Firestore] Lỗi lắng nghe diem_danh:', err);
      onError(err);
    }
  );
}

/**
 * Lắng nghe trực tiếp collection 'sinh_vien'
 * Đảm bảo web và Python dùng chung một nguồn dữ liệu trên Cloud
 */
export function subscribeToStudents(
  onData: (students: SinhVien[]) => void,
  onError: (error: FirestoreError) => void
): Unsubscribe {
  const colRef = collection(db, 'sinh_vien');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const students: SinhVien[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        students.push({
          id: docSnap.id,
          ma_sinh_vien: data.ma_sinh_vien || docSnap.id,
          ho_ten: data.ho_ten || '',
          lop: data.lop || '',
          khoa: data.khoa || '',
          email: data.email || '',
          so_dien_thoai: data.so_dien_thoai || '',
          ngay_sinh: data.ngay_sinh || '',
          gioi_tinh: data.gioi_tinh || 'Nam',
          trang_thai_hoc: data.trang_thai_hoc || 'Đang học',
          anh_dai_dien: data.anh_dai_dien || '',
          ghi_chu: data.ghi_chu || '',
          ngay_tao: data.ngay_tao,
          ngay_cap_nhat: data.ngay_cap_nhat
        });
      });
      onData(students);
    },
    (err) => {
      console.error('[Firestore] Lỗi lắng nghe sinh_vien:', err);
      onError(err);
    }
  );
}

/**
 * Kiểm tra mã sinh viên đã tồn tại chưa
 */
export async function checkStudentCodeExists(ma_sinh_vien: string, excludeId?: string): Promise<boolean> {
  const normalizedCode = ma_sinh_vien.trim().toUpperCase();
  const q = query(collection(db, 'sinh_vien'), where('ma_sinh_vien', '==', normalizedCode));
  const snap = await getDocs(q);
  
  if (snap.empty) {
    // Thử kiểm tra theo document ID
    const directDoc = doc(db, 'sinh_vien', normalizedCode);
    // Nếu trùng với chính sinh viên đang sửa thì hợp lệ
    return false;
  }

  if (excludeId) {
    const isOtherDoc = snap.docs.some(d => d.id !== excludeId);
    return isOtherDoc;
  }

  return !snap.empty;
}

/**
 * Thêm mới sinh viên vào Firestore (dùng mã sinh viên làm Document ID để tránh trùng lặp)
 */
export async function addStudent(studentData: Omit<SinhVien, 'id'>): Promise<string> {
  const normalizedCode = studentData.ma_sinh_vien.trim().toUpperCase();
  
  // Kiểm tra trùng mã
  const exists = await checkStudentCodeExists(normalizedCode);
  if (exists) {
    throw new Error(`Mã sinh viên "${normalizedCode}" đã tồn tại trong hệ thống!`);
  }

  const docRef = doc(db, 'sinh_vien', normalizedCode);
  const payload = {
    ...studentData,
    ma_sinh_vien: normalizedCode,
    ngay_tao: serverTimestamp(),
    ngay_cap_nhat: serverTimestamp()
  };

  await setDoc(docRef, payload);
  return normalizedCode;
}

/**
 * Cập nhật sinh viên - cập nhật đúng document, KHÔNG ghi đè toàn bộ collection
 */
export async function updateStudent(id: string, updateData: Partial<SinhVien>): Promise<void> {
  const docRef = doc(db, 'sinh_vien', id);
  const payload = {
    ...updateData,
    ngay_cap_nhat: serverTimestamp()
  };
  await updateDoc(docRef, payload);
}

/**
 * Xóa sinh viên khỏi Firestore
 */
export async function deleteStudent(id: string): Promise<void> {
  const docRef = doc(db, 'sinh_vien', id);
  await deleteDoc(docRef);
}

/**
 * Thêm bản ghi điểm danh thủ công (dành cho quản trị viên khi cần bổ sung)
 */
export async function addManualAttendance(record: {
  ho_ten: string;
  ma_sinh_vien: string;
  lop: string;
  trang_thai: 'VÀO' | 'RA';
  ghi_chu?: string;
}): Promise<string> {
  const now = new Date();
  const d = now.getDate().toString().padStart(2, '0');
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  const y = now.getFullYear();
  const h = now.getHours().toString().padStart(2, '0');
  const min = now.getMinutes().toString().padStart(2, '0');
  const sec = now.getSeconds().toString().padStart(2, '0');

  const ngay = `${d}/${m}/${y}`;
  const gio = `${h}:${min}:${sec}`;
  const ngay_gio = `${y}-${m}-${d} ${gio}`;

  // ID định dạng YYYYMMDD_HHMMSS_MASV
  const docId = `${y}${m}${d}_${h}${min}${sec}_${record.ma_sinh_vien}`;
  const docRef = doc(db, 'diem_danh', docId);

  await setDoc(docRef, {
    ho_ten: record.ho_ten,
    ma_sinh_vien: record.ma_sinh_vien,
    lop: record.lop,
    ngay,
    gio,
    ngay_gio,
    trang_thai: record.trang_thai,
    thoi_gian: serverTimestamp(),
    nguon: 'Web_Admin_Manual',
    ghi_chu: record.ghi_chu || ''
  });

  return docId;
}
