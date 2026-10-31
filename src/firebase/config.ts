import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

/**
 * Cấu hình Firebase cho dự án hiện có: nhan-dien-a2471
 * Được cung cấp bởi người dùng, kết nối trực tiếp với Firestore và Authentication.
 */
export const firebaseConfig = {
  apiKey: "AIzaSyB8befNEZt76kSpCbJn9d64WSN7GGM2104",
  authDomain: "nhan-dien-a2471.firebaseapp.com",
  projectId: "nhan-dien-a2471",
  storageBucket: "nhan-dien-a2471.firebasestorage.app",
  messagingSenderId: "577788079639",
  appId: "1:577788079639:web:201f01895c8edcd941f652",
  measurementId: "G-QFYP54NG90"
};

// Khởi tạo Firebase App an toàn (tránh re-init khi HMR hoặc reload)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Khởi tạo Firestore Database
export const db = getFirestore(app);

// Khởi tạo Firebase Authentication
export const auth = getAuth(app);

/**
 * Hàm tiện ích xử lý đa định dạng thời gian từ Python và Firestore:
 * - Firestore Timestamp instance (.toDate(), .seconds)
 * - Object có seconds / nanoseconds
 * - Chuỗi ISO hoặc "YYYY-MM-DD HH:mm:ss"
 * - Số milliseconds
 */
export function parseFirebaseTimestamp(val: unknown): Date | null {
  if (!val) return null;

  try {
    // Firestore Timestamp
    if (val instanceof Timestamp) {
      return val.toDate();
    }

    // Object có method toDate
    if (typeof val === 'object' && val !== null && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
      return (val as { toDate: () => Date }).toDate();
    }

    // Object dạng { seconds, nanoseconds }
    if (typeof val === 'object' && val !== null && 'seconds' in val) {
      const s = Number((val as { seconds: number }).seconds);
      if (!isNaN(s)) {
        return new Date(s * 1000);
      }
    }

    // Date object
    if (val instanceof Date) {
      return isNaN(val.getTime()) ? null : val;
    }

    // Số timestamp (ms hoặc s)
    if (typeof val === 'number') {
      if (val > 1e11) {
        return new Date(val); // ms
      }
      return new Date(val * 1000); // s
    }

    // Chuỗi datetime
    if (typeof val === 'string') {
      const parsed = new Date(val);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
      // Định dạng VN/Python thường gặp "YYYY-MM-DD HH:mm:ss" hoặc "DD/MM/YYYY HH:mm:ss"
      const parts = val.trim().split(/[\sT]+/);
      if (parts.length >= 2) {
        const datePart = parts[0];
        const timePart = parts[1];
        if (datePart.includes('-')) {
          const d = new Date(`${datePart}T${timePart}`);
          if (!isNaN(d.getTime())) return d;
        } else if (datePart.includes('/')) {
          const [day, month, year] = datePart.split('/');
          const d = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}`);
          if (!isNaN(d.getTime())) return d;
        }
      }
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Định dạng hiển thị ngày giờ chuẩn Việt Nam (DD/MM/YYYY HH:mm:ss)
 */
export function formatDateTime(val: unknown, fallbackDate?: string, fallbackTime?: string): string {
  const parsed = parseFirebaseTimestamp(val);
  if (parsed) {
    const d = parsed.getDate().toString().padStart(2, '0');
    const m = (parsed.getMonth() + 1).toString().padStart(2, '0');
    const y = parsed.getFullYear();
    const h = parsed.getHours().toString().padStart(2, '0');
    const min = parsed.getMinutes().toString().padStart(2, '0');
    const sec = parsed.getSeconds().toString().padStart(2, '0');
    return `${d}/${m}/${y} ${h}:${min}:${sec}`;
  }

  if (fallbackDate && fallbackTime) {
    return `${fallbackDate} ${fallbackTime}`;
  }
  if (fallbackDate) return fallbackDate;
  if (fallbackTime) return fallbackTime;
  if (typeof val === 'string') return val;
  return '—';
}

/**
 * Trích xuất ngày định dạng YYYY-MM-DD để dễ lọc
 */
export function extractDateString(val: unknown, fallbackDate?: string): string {
  const parsed = parseFirebaseTimestamp(val);
  if (parsed) {
    const y = parsed.getFullYear();
    const m = (parsed.getMonth() + 1).toString().padStart(2, '0');
    const d = parsed.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (fallbackDate) {
    if (fallbackDate.includes('/')) {
      const parts = fallbackDate.split('/');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return fallbackDate;
  }
  return '';
}
