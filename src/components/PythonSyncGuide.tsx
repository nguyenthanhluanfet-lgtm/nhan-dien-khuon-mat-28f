import { useState } from 'react';
import { 
  Terminal, 
  Code2, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  FileText, 
  Layers, 
  AlertCircle,
  HelpCircle,
  Play
} from 'lucide-react';

export function PythonSyncGuide() {
  const [activeSubTab, setActiveSubTab] = useState<'python_code' | 'security_rules' | 'test_checklist' | 'data_schema'>('python_code');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const pythonScript = `# ==============================================================================
# HỆ THỐNG ĐIỂM DANH NHẬN DIỆN KHUÔN MẶT - TÍCH HỢP CLOUD FIRESTORE
# Dự án Firebase: nhan-dien-a2471
# ==============================================================================
# Cài đặt thư viện Python:
# pip install firebase-admin opencv-python face_recognition
# ==============================================================================

import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import json
import os

# 1. KHỞI TẠO KẾT NỐI FIREBASE TỪ SERVICE ACCOUNT HOẶC APPLICATION DEFAULT CREDENTIALS
# Lưu ý: Tải file serviceAccountKey.json từ Firebase Console:
# Project Settings > Service accounts > Generate new private key
cred_path = "serviceAccountKey.json"

if os.path.exists(cred_path):
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred, {
        'projectId': 'nhan-dien-a2471'
    })
else:
    # Hoặc khởi tạo mặc định nếu chạy trên GCP / đã set GOOGLE_APPLICATION_CREDENTIALS
    firebase_admin.initialize_app()

db = firestore.client()

# ==============================================================================
# 2. HÀM ĐỌC DANH SÁCH SINH VIÊN TỪ FIRESTORE (THAY THẾ CHO students.json)
# Giữ nguyên quy trình nhận diện, chỉ thay đổi nguồn dữ liệu
# ==============================================================================
def load_students_from_firestore():
    """
    Đọc danh sách sinh viên từ collection 'sinh_vien' trên Firestore.
    Trả về dictionary dạng: {ma_sinh_vien: {ho_ten, lop, ...}}
    """
    students_ref = db.collection('sinh_vien')
    docs = students_ref.stream()
    students_dict = {}
    
    for doc in docs:
        data = doc.to_dict()
        ma_sv = data.get('ma_sinh_vien', doc.id)
        students_dict[ma_sv] = {
            'ma_sinh_vien': ma_sv,
            'ho_ten': data.get('ho_ten', ''),
            'lop': data.get('lop', ''),
            'khoa': data.get('khoa', '')
        }
    
    print(f"[Firebase] Đã tải {len(students_dict)} sinh viên từ Firestore 'sinh_vien'")
    return students_dict


# ==============================================================================
# 3. HÀM GHI ĐIỂM DANH LÊN FIRESTORE (COLLECTION: diem_danh)
# Đúng định dạng và các trường theo yêu cầu hệ thống
# ==============================================================================
def record_attendance(ma_sinh_vien, ho_ten, lop, trang_thai="VÀO"):
    """
    Ghi bản ghi điểm danh vào collection 'diem_danh'.
    Web Dashboard sẽ tự động hiển thị tức thì (Real-time listener).
    
    Các trường dữ liệu chuẩn:
    - ho_ten: Họ và tên sinh viên
    - ma_sinh_vien: Mã định danh sinh viên
    - lop: Lớp học
    - ngay: Chuỗi DD/MM/YYYY (hỗ trợ lọc ngày chuẩn)
    - gio: Chuỗi HH:MM:SS
    - ngay_gio: Chuỗi datetime chuẩn YYYY-MM-DD HH:MM:SS
    - trang_thai: 'VÀO' hoặc 'RA'
    - thoi_gian: Firestore ServerTimestamp
    """
    now = datetime.now()
    d_str = now.strftime("%d/%m/%Y")
    t_str = now.strftime("%H:%M:%S")
    dt_str = now.strftime("%Y-%m-%d %H:%M:%S")

    # Tạo Document ID duy nhất: YYYYMMDD_HHMMSS_MASV
    doc_id = f"{now.strftime('%Y%m%d_%H%M%S')}_{ma_sinh_vien}"
    
    doc_data = {
        'ho_ten': ho_ten,
        'ma_sinh_vien': ma_sinh_vien,
        'lop': lop,
        'ngay': d_str,
        'gio': t_str,
        'ngay_gio': dt_str,
        'trang_thai': trang_thai,
        'thoi_gian': firestore.SERVER_TIMESTAMP,
        'nguon': 'Python_Face_Recognition'
    }

    db.collection('diem_danh').document(doc_id).set(doc_data)
    print(f"[Firebase] Ghi điểm danh thành công: {ho_ten} ({ma_sinh_vien}) - Trạng thái: {trang_thai}")


# ==============================================================================
# 4. VÍ DỤ TÍCH HỢP VÀO VÒNG LẶP NHẬN DIỆN (OpenCV / face_recognition)
# ==============================================================================
if __name__ == "__main__":
    print("--- KIỂM TRA ĐỒNG BỘ VỚI CLOUD FIRESTORE (nhan-dien-a2471) ---")
    
    # Bước A: Tải danh sách sinh viên
    students = load_students_from_firestore()
    
    # Bước B: Thử ghi 1 bản ghi điểm danh mẫu từ Python
    if students:
        first_sv = next(iter(students.values()))
        test_ma = first_sv['ma_sinh_vien']
        test_ten = first_sv['ho_ten']
        test_lop = first_sv['lop']
    else:
        test_ma = "B21DCCN001"
        test_ten = "Nguyễn Văn Test"
        test_lop = "CNTT-K15"
        
    print(f"Thử nghiệm ghi nhận diện cho: {test_ten} ({test_ma})")
    record_attendance(test_ma, test_ten, test_lop, trang_thai="VÀO")
    print("Hãy mở Web Dashboard để kiểm tra bản ghi vừa xuất hiện tức thì!")
`;

  const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 1. Phân quyền cho collection 'diem_danh' (Lịch sử điểm danh & thống kê)
    match /diem_danh/{docId} {
      // CHỈ tài khoản Admin được thiết lập từ Firebase Authentication mới được xem thống kê
      allow read: if request.auth != null;
      
      // Cho phép ghi nhận điểm danh mới từ chương trình Python hoặc Admin
      allow create: if request.auth != null || (
        request.resource.data.ma_sinh_vien is string
        && request.resource.data.ho_ten is string
      );
                    
      // Chỉ Admin mới có quyền sửa hoặc xóa bản ghi điểm danh
      allow update, delete: if request.auth != null;
    }
    
    // 2. Phân quyền cho collection 'sinh_vien' (Quản lý danh sách sinh viên)
    match /sinh_vien/{studentId} {
      // Chỉ tài khoản Admin đăng nhập từ Firebase mới được đọc và chỉnh sửa
      allow read, write: if request.auth != null;
    }
  }
}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base sm:text-lg font-bold text-white">
                Hướng Dẫn Tích Hợp Python & Kiểm Thử 7 Tiêu Chí
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Đồng bộ dữ liệu hai chiều giữa chương trình nhận diện khuôn mặt Python hiện có và Cloud Firestore (Project ID:{' '}
              <span className="text-amber-300 font-mono font-semibold">nhan-dien-a2471</span>).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://console.firebase.google.com/project/nhan-dien-a2471/firestore/rules"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 transition cursor-pointer"
            >
              <span>Mở Firebase Console</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-800 text-xs">
          <button
            onClick={() => setActiveSubTab('python_code')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'python_code'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Mã nguồn Python tích hợp</span>
          </button>

          <button
            onClick={() => setActiveSubTab('test_checklist')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'test_checklist'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Kiểm thử 7 Tiêu chí bắt buộc</span>
          </button>

          <button
            onClick={() => setActiveSubTab('security_rules')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'security_rules'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Cấu hình Security Rules</span>
          </button>

          <button
            onClick={() => setActiveSubTab('data_schema')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'data_schema'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Cấu trúc Firestore Schema</span>
          </button>
        </div>
      </div>

      {/* Sub-tab 1: Python Code */}
      {activeSubTab === 'python_code' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Script Python mẫu: <code className="text-amber-300 font-mono">face_recognition_firestore.py</code>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Được thiết kế để can thiệp tối thiểu vào code Python sẵn có: giữ nguyên thuật toán nhận diện khuôn mặt và thay đổi nguồn dữ liệu từ JSON sang Firestore.
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(pythonScript, 'python')}
              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white transition cursor-pointer"
            >
              {copiedIndex === 'python' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedIndex === 'python' ? 'Đã sao chép code' : 'Sao chép toàn bộ script'}</span>
            </button>
          </div>

          <div className="relative rounded-lg overflow-hidden border border-slate-800">
            <pre className="bg-slate-950 p-4 font-mono text-xs text-emerald-300/90 overflow-x-auto leading-relaxed max-h-[500px]">
              {pythonScript}
            </pre>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs text-slate-300">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <strong className="text-sky-400 block mb-1">Bước 1: Cài đặt thư viện</strong>
              <code className="text-emerald-400 bg-slate-900 px-2 py-1 rounded block">
                pip install firebase-admin opencv-python
              </code>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <strong className="text-sky-400 block mb-1">Bước 2: Lấy file serviceAccountKey.json</strong>
              <span>
                Vào Firebase Console &gt; Project Settings &gt; Service accounts &gt; Nhấn "Generate new private key" và đặt vào cùng thư mục với script Python.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 2: 7 Mandatory Test Checklist */}
      {activeSubTab === 'test_checklist' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              Quy Trình Kiểm Thử 7 Tiêu Chí Bắt Buộc (Theo Yêu Cầu Đề Bài)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Thực hiện lần lượt các bước dưới đây để kiểm tra tính toàn vẹn của hệ thống:
            </p>
          </div>

          <div className="space-y-3">
            {/* Test 1 */}
            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800/80 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-sky-500/10 text-sky-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                1
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-slate-200">
                  Quản trị viên đăng nhập thành công
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Nhấn nút <strong>"Đăng nhập Admin"</strong> trên thanh tiêu đề, nhập Email/Mật khẩu hoặc sử dụng Google Sign-in. Khi đăng nhập thành công, hệ thống hiển thị tên tài khoản, avatar và mở quyền thực hiện thao tác quản trị.
                </p>
              </div>
            </div>

            {/* Test 2 */}
            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800/80 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-sky-500/10 text-sky-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                2
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-slate-200">
                  Ứng dụng đọc dữ liệu thực tế từ đúng Firebase project (nhan-dien-a2471)
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Thanh trạng thái hiển thị rõ <code className="text-amber-300 font-mono">Project: nhan-dien-a2471</code> kèm đèn trạng thái màu xanh lá <strong>"Firestore Trực Tuyến (Live)"</strong>. Số lượng bản ghi và sinh viên hiển thị chính xác theo dữ liệu trong Firestore.
                </p>
              </div>
            </div>

            {/* Test 3 */}
            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800/80 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-sky-500/10 text-sky-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                3
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-slate-200">
                  Khi chương trình Python ghi một bản ghi điểm danh mới, web hiển thị bản ghi đó tức thì
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Chạy hàm <code className="text-emerald-400">record_attendance(...)</code> trong Python hoặc nhấn nút "Điểm danh bổ sung" trên web. Do sử dụng Firestore <code className="text-sky-300">onSnapshot</code>, bản ghi mới sẽ ngay lập tức hiện lên đầu bảng mà không cần nhấn F5 hoặc tải lại trang.
                </p>
              </div>
            </div>

            {/* Test 4 */}
            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800/80 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-sky-500/10 text-sky-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                4
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-slate-200">
                  Khi web thêm hoặc sửa sinh viên, chương trình Python nhận được dữ liệu cập nhật
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Vào tab "Quản lý sinh viên", thêm một sinh viên mới. Sau đó trong Python gọi <code className="text-emerald-400">load_students_from_firestore()</code> hoặc tải file <code className="text-amber-300">students.json</code> xuất từ web. Sinh viên mới sẽ xuất hiện trong danh sách khuôn mặt nhận diện.
                </p>
              </div>
            </div>

            {/* Test 5 */}
            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800/80 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-sky-500/10 text-sky-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                5
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-slate-200">
                  Người chưa được cấp quyền không thể đọc hoặc sửa dữ liệu bị hạn chế
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Được kiểm soát bởi Firestore Security Rules. Nếu người dùng chưa đăng nhập, các hành vi xóa hoặc chỉnh sửa sinh viên sẽ bị từ chối với lỗi <code className="text-rose-400">permission-denied</code>.
                </p>
              </div>
            </div>

            {/* Test 6 */}
            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800/80 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-sky-500/10 text-sky-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                6
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-slate-200">
                  Khi mất mạng hoặc Firebase từ chối quyền truy cập, ứng dụng hiển thị lỗi rõ ràng
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Nếu ngắt kết nối mạng hoặc Firestore chặn quyền, thanh trạng thái chuyển sang màu đỏ, thông báo chi tiết lỗi tiếng Việt và có nút <strong>"Sửa lỗi Security Rules"</strong> & <strong>"Thử kết nối lại"</strong>.
                </p>
              </div>
            </div>

            {/* Test 7 */}
            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800/80 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-sky-500/10 text-sky-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                7
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-slate-200">
                  Không có dữ liệu giả (mock data) được sử dụng
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Toàn bộ bảng điểm danh và sinh viên kết nối 100% với Firestore của dự án <code className="text-amber-300 font-mono">nhan-dien-a2471</code>. Không có danh sách tĩnh nào bị hardcode trong ứng dụng.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 3: Security Rules */}
      {activeSubTab === 'security_rules' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Cấu hình Firestore Security Rules chuẩn
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Đảm bảo dữ liệu được bảo vệ an toàn, không để cơ sở dữ liệu ở chế độ công khai hoàn toàn.
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(firestoreRules, 'rules')}
              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition cursor-pointer"
            >
              {copiedIndex === 'rules' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedIndex === 'rules' ? 'Đã sao chép Rules' : 'Sao chép Rules'}</span>
            </button>
          </div>

          <div className="relative rounded-lg overflow-hidden border border-slate-800">
            <pre className="bg-slate-950 p-4 font-mono text-xs text-amber-300/90 overflow-x-auto leading-relaxed">
              {firestoreRules}
            </pre>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300">
            <p className="font-semibold text-slate-200 mb-1">Cách áp dụng cấu hình:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-400">
              <li>Mở <a href="https://console.firebase.google.com/project/nhan-dien-a2471/firestore/rules" target="_blank" rel="noreferrer" className="text-sky-400 underline">Firestore Database &gt; Rules</a> trên Firebase Console.</li>
              <li>Dán đoạn mã trên vào trình soạn thảo.</li>
              <li>Nhấn <strong>"Publish"</strong> để lưu thay đổi.</li>
            </ol>
          </div>
        </div>
      )}

      {/* Sub-tab 4: Data Schema */}
      {activeSubTab === 'data_schema' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            Cấu trúc Dữ liệu Chi tiết (Collection: diem_danh &amp; sinh_vien)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Collection diem_danh */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-amber-300 font-mono">collection("diem_danh")</span>
                <span className="text-[10px] text-slate-400">Lịch sử nhận diện</span>
              </div>
              <ul className="space-y-1.5 text-slate-300">
                <li><code className="text-sky-300 font-mono">ho_ten</code>: string (Tên sinh viên)</li>
                <li><code className="text-sky-300 font-mono">ma_sinh_vien</code>: string (Mã định danh)</li>
                <li><code className="text-sky-300 font-mono">lop</code>: string (Lớp sinh hoạt)</li>
                <li><code className="text-sky-300 font-mono">ngay</code>: string ("DD/MM/YYYY")</li>
                <li><code className="text-sky-300 font-mono">gio</code>: string ("HH:MM:SS")</li>
                <li><code className="text-sky-300 font-mono">ngay_gio</code>: string hoặc Timestamp</li>
                <li><code className="text-sky-300 font-mono">trang_thai</code>: string ("VÀO" | "RA")</li>
                <li><code className="text-sky-300 font-mono">thoi_gian</code>: Timestamp (Server Timestamp)</li>
              </ul>
            </div>

            {/* Collection sinh_vien */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-sky-300 font-mono">collection("sinh_vien")</span>
                <span className="text-[10px] text-slate-400">Danh mục sinh viên</span>
              </div>
              <ul className="space-y-1.5 text-slate-300">
                <li><code className="text-amber-300 font-mono">ma_sinh_vien</code>: string (Document ID)</li>
                <li><code className="text-amber-300 font-mono">ho_ten</code>: string (Họ và tên)</li>
                <li><code className="text-amber-300 font-mono">lop</code>: string (Lớp học)</li>
                <li><code className="text-amber-300 font-mono">khoa</code>: string (Khoa/Viện)</li>
                <li><code className="text-amber-300 font-mono">email</code>: string</li>
                <li><code className="text-amber-300 font-mono">so_dien_thoai</code>: string</li>
                <li><code className="text-amber-300 font-mono">trang_thai_hoc</code>: string ("Đang học")</li>
                <li><code className="text-amber-300 font-mono">ngay_tao</code>: Timestamp</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
