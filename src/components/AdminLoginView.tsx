import React, { useState } from 'react';
import { 
  ScanFace, 
  ShieldCheck, 
  Lock, 
  Mail, 
  LogIn, 
  AlertCircle, 
  RefreshCw, 
  Database,
  ExternalLink,
  Info
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function AdminLoginView() {
  const { loginWithEmail, loginWithGoogle, authError, clearAuthError } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFirebaseGuide, setShowFirebaseGuide] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();

    if (!email.trim() || !password) {
      setLocalError('Vui lòng nhập đầy đủ Email và Mật khẩu của tài khoản Admin.');
      return;
    }

    setIsSubmitting(true);
    try {
      await loginWithEmail(email, password);
    } catch {
      // Error message is stored in authError
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    clearAuthError();
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
    } catch {
      // Error is stored in authError
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-8 font-sans selection:bg-sky-500 selection:text-white">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 items-center justify-center shadow-lg shadow-sky-500/25 text-white mb-2">
            <ScanFace className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Điểm Danh Nhận Diện Khuôn Mặt
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Hệ thống quản trị &amp; giám sát kết nối Cloud Firestore
          </p>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 mt-1">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>Firebase Project:</span>
            <span className="text-amber-300 font-semibold">nhan-dien-a2471</span>
          </div>
        </div>

        {/* Security Access Notice */}
        <div className="bg-slate-900/90 border border-indigo-500/30 rounded-xl p-3.5 flex items-start gap-3 shadow-lg">
          <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 space-y-1">
            <p className="font-semibold text-white">Yêu cầu xác thực tài khoản Admin</p>
            <p className="text-slate-400 leading-relaxed">
              Theo quy định bảo mật, ứng dụng <strong>không cho phép đăng ký tự do</strong>. Chỉ có tài khoản Quản trị viên được thiết lập trước từ Firebase mới được xem dữ liệu và thống kê điểm danh.
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h2 className="font-bold text-base text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-sky-400" />
              <span>Đăng nhập Quản trị viên</span>
            </h2>
            <span className="text-[11px] text-slate-500">Firebase Auth</span>
          </div>

          {(localError || authError) && (
            <div className="p-3 bg-rose-950/70 border border-rose-800 rounded-lg text-rose-200 text-xs flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{localError || authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5 text-xs">
                Email tài khoản Admin
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@domain.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-sky-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5 text-xs">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-sky-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition shadow-lg shadow-sky-600/25 disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              <span>{isSubmitting ? 'Đang xác thực...' : 'Đăng nhập vào hệ thống'}</span>
            </button>
          </form>

          {/* Alternative login with Google */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-slate-900 px-2 text-slate-500">Hoặc</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full py-2 px-4 rounded-lg bg-slate-950 hover:bg-slate-800/80 text-slate-200 font-medium text-xs border border-slate-800 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Đăng nhập với Google Admin</span>
          </button>
        </div>

        {/* Firebase Console Guide Accordion */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowFirebaseGuide(!showFirebaseGuide)}
            className="text-xs text-slate-400 hover:text-sky-400 inline-flex items-center gap-1 cursor-pointer transition"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Chưa tạo tài khoản Admin trong Firebase? Bấm xem hướng dẫn</span>
          </button>

          {showFirebaseGuide && (
            <div className="mt-3 p-4 bg-slate-900 border border-slate-800 rounded-xl text-left text-xs text-slate-300 space-y-2">
              <p className="font-semibold text-white flex items-center justify-between">
                <span>Cách tạo tài khoản Admin trong Firebase:</span>
                <a
                  href="https://console.firebase.google.com/project/nhan-dien-a2471/authentication/users"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-400 hover:underline inline-flex items-center gap-1 text-[11px]"
                >
                  Mở Firebase Console <ExternalLink className="w-3 h-3" />
                </a>
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-400 leading-relaxed">
                <li>Truy cập <strong className="text-slate-200">Firebase Console &gt; Authentication &gt; Users</strong>.</li>
                <li>Bấm nút <strong className="text-slate-200">"Add user"</strong> (Thêm người dùng).</li>
                <li>Nhập Email và Mật khẩu bạn muốn đặt cho quản trị viên.</li>
                <li>Bấm <strong className="text-slate-200">"Add user"</strong> để hoàn tất tạo tài khoản.</li>
                <li>Quay lại giao diện này và đăng nhập bằng email vừa tạo.</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
