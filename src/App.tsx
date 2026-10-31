import { useState, useEffect, useCallback, useRef } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header, type TabType } from './components/Header';
import { ConnectionBanner } from './components/ConnectionBanner';
import { DashboardOverview } from './components/DashboardOverview';
import { AttendanceTable } from './components/AttendanceTable';
import { StudentManager } from './components/StudentManager';
import { PythonSyncGuide } from './components/PythonSyncGuide';
import { ExportModal } from './components/ExportModal';
import { ManualCheckInModal } from './components/ManualCheckInModal';
import { AdminLoginView } from './components/AdminLoginView';
import { 
  subscribeToAttendance, 
  subscribeToStudents, 
  classifyFirestoreError 
} from './services/firebaseService';
import type { DiemDanhRecord, SinhVien, ConnectionInfo } from './types';
import { RefreshCw, ScanFace } from 'lucide-react';

function AppContent() {
  const { currentUser, loading: isAuthLoading } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  // Firebase Realtime State (Chỉ kích hoạt khi đã đăng nhập Admin)
  const [records, setRecords] = useState<DiemDanhRecord[]>([]);
  const [students, setStudents] = useState<SinhVien[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState<boolean>(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(true);

  // Connection State
  const [connection, setConnection] = useState<ConnectionInfo>({
    status: 'connecting',
    lastSynced: null,
    attendanceCount: 0,
    studentCount: 0,
    errorMessage: null,
    errorType: null
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [datasetForExport, setDatasetForExport] = useState<DiemDanhRecord[]>([]);

  // Refs for Unsubscribes
  const unsubAttendanceRef = useRef<(() => void) | null>(null);
  const unsubStudentsRef = useRef<(() => void) | null>(null);

  // Khởi tạo và thiết lập kết nối Real-time với Firestore khi Admin đăng nhập
  const initFirebaseListeners = useCallback(() => {
    // Dọn dẹp listeners cũ nếu có
    if (unsubAttendanceRef.current) {
      unsubAttendanceRef.current();
      unsubAttendanceRef.current = null;
    }
    if (unsubStudentsRef.current) {
      unsubStudentsRef.current();
      unsubStudentsRef.current = null;
    }

    // Nếu chưa đăng nhập, không mở stream dữ liệu
    if (!currentUser) {
      setRecords([]);
      setStudents([]);
      return;
    }

    setConnection((prev) => ({
      ...prev,
      status: 'connecting',
      errorMessage: null,
      errorType: null
    }));
    setIsLoadingRecords(true);
    setIsLoadingStudents(true);

    // 1. Lắng nghe collection 'diem_danh'
    try {
      unsubAttendanceRef.current = subscribeToAttendance(
        (newRecords) => {
          setRecords(newRecords);
          setIsLoadingRecords(false);
          setConnection((prev) => ({
            ...prev,
            status: 'connected',
            lastSynced: new Date(),
            attendanceCount: newRecords.length,
            errorMessage: null,
            errorType: null
          }));
        },
        (error) => {
          setIsLoadingRecords(false);
          const classified = classifyFirestoreError(error);
          setConnection((prev) => ({
            ...prev,
            status: 'error',
            errorMessage: classified.message,
            errorType: classified.type
          }));
        }
      );
    } catch (err) {
      setIsLoadingRecords(false);
      const classified = classifyFirestoreError(err);
      setConnection((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: classified.message,
        errorType: classified.type
      }));
    }

    // 2. Lắng nghe collection 'sinh_vien'
    try {
      unsubStudentsRef.current = subscribeToStudents(
        (newStudents) => {
          setStudents(newStudents);
          setIsLoadingStudents(false);
          setConnection((prev) => ({
            ...prev,
            studentCount: newStudents.length,
            lastSynced: new Date()
          }));
        },
        (error) => {
          setIsLoadingStudents(false);
          const classified = classifyFirestoreError(error);
          console.warn('[Firestore] Cảnh báo sinh_vien:', classified.message);
        }
      );
    } catch (err) {
      setIsLoadingStudents(false);
      console.warn('[Firestore] Không thể gắn listener sinh_vien:', err);
    }
  }, [currentUser]);

  // Gắn listener khi Admin đăng nhập hoặc thay đổi tài khoản
  useEffect(() => {
    if (currentUser) {
      initFirebaseListeners();
    } else {
      if (unsubAttendanceRef.current) unsubAttendanceRef.current();
      if (unsubStudentsRef.current) unsubStudentsRef.current();
      setRecords([]);
      setStudents([]);
    }

    return () => {
      if (unsubAttendanceRef.current) unsubAttendanceRef.current();
      if (unsubStudentsRef.current) unsubStudentsRef.current();
    };
  }, [currentUser, initFirebaseListeners]);

  // Nút Thử kết nối lại
  const handleReconnect = () => {
    setIsRefreshing(true);
    initFirebaseListeners();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  // Điều hướng từ Dashboard sang lọc lớp
  const handleFilterByClassFromDashboard = (lop: string) => {
    setSelectedClassFilter(lop);
    setActiveTab('attendance');
  };

  // Mở modal xuất CSV từ AttendanceTable
  const handleTriggerExport = (filteredRecords: DiemDanhRecord[]) => {
    setDatasetForExport(filteredRecords);
    setIsExportModalOpen(true);
  };

  // 1. Màn hình chờ xác thực phiên đăng nhập Firebase
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-600/20 text-sky-400 flex items-center justify-center border border-sky-500/30 animate-pulse">
            <ScanFace className="w-6 h-6" />
          </div>
          <div className="flex items-center gap-2 text-slate-300 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
            <span>Đang kiểm tra quyền Admin trên Firebase...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Nếu chưa đăng nhập Admin: Chặn toàn bộ và hiển thị màn hình đăng nhập Admin duy nhất
  // (Không có chức năng đăng ký, chỉ tài khoản admin thiết lập từ Firebase mới truy cập được)
  if (!currentUser) {
    return <AdminLoginView />;
  }

  // 3. Khi đã đăng nhập Admin thành công: Hiển thị đầy đủ Bảng điều khiển, Báo cáo & Thống kê
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* 1. Thanh trạng thái đồng bộ Firebase */}
      <ConnectionBanner
        connection={connection}
        onReconnect={handleReconnect}
        isRefreshing={isRefreshing}
      />

      {/* 2. Tiêu đề và thanh điều hướng */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenExportModal={() => {
          setDatasetForExport(records);
          setIsExportModalOpen(true);
        }}
        onOpenManualModal={() => setIsManualModalOpen(true)}
        totalRecords={records.length}
      />

      {/* 3. Nội dung chính theo tab */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <DashboardOverview
            records={records}
            students={students}
            onViewAllRecords={() => setActiveTab('attendance')}
            onFilterByClass={handleFilterByClassFromDashboard}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceTable
            records={records}
            students={students}
            isLoading={isLoadingRecords}
            selectedClassFilter={selectedClassFilter}
            onClearClassFilter={() => setSelectedClassFilter('all')}
            onExportCSV={handleTriggerExport}
          />
        )}

        {activeTab === 'students' && (
          <StudentManager
            students={students}
            isLoading={isLoadingStudents}
            onRefresh={handleReconnect}
          />
        )}

        {activeTab === 'python_sync' && (
          <PythonSyncGuide />
        )}
      </main>

      {/* 4. Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-900 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Hệ thống điểm danh nhận diện khuôn mặt kết nối trực tiếp Firebase Firestore Project:{' '}
            <strong className="text-amber-400 font-mono">nhan-dien-a2471</strong>
          </span>
          <span>
            Thời gian hệ thống: <span className="font-mono text-slate-400">2026</span>
          </span>
        </div>
      </footer>

      {/* 5. Modals */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        allRecords={records}
        currentFilteredRecords={datasetForExport.length > 0 ? datasetForExport : records}
      />

      <ManualCheckInModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        students={students}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
