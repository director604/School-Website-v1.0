import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  AlertCircle,
  Crown
} from 'lucide-react';
import { UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleSignIn: () => Promise<void>;
  onMockSignIn?: (role: UserRole, email: string, name: string) => void;
  isLoggingIn: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onGoogleSignIn,
  onMockSignIn,
  isLoggingIn
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignInClick = async () => {
    setErrorMessage(null);
    try {
      await onGoogleSignIn();
      onClose();
    } catch (err: any) {
      console.error('Login error in AuthModal:', err);
      const code = err?.code || '';
      const msg = err?.message || '';

      if (code === 'auth/popup-blocked') {
        setErrorMessage('เบราว์เซอร์ของคุณบล็อกหน้าต่างป๊อปอัป (Popup Blocked) กรุณาอนุญาตป๊อปอัปสำหรับหน้านี้เพื่อเข้าสู่ระบบ');
      } else if (code === 'auth/unauthorized-domain') {
        setErrorMessage('โดเมนนี้ยังไม่ได้รับการอนุมัติใน Firebase Authorized Domains');
      } else if (code === 'auth/popup-closed-by-user') {
        setErrorMessage('หน้าต่างเข้าสู่ระบบถูกปิดก่อนเสร็จสิ้น กรุณาลองใหม่อีกครั้ง');
      } else {
        setErrorMessage(`เข้าสู่ระบบไม่สำเร็จ: ${msg || code || 'กรุณาลองใหม่อีกครั้ง'}`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with School Branding */}
        <div className="bg-gradient-to-br from-[#0F224A] via-[#1E3A8A] to-[#1E293B] text-white p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-amber-400/10 rounded-full blur-xl pointer-events-none"></div>
          
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="ปิด"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center ring-1 ring-amber-400/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xs font-semibold uppercase tracking-wider text-amber-300">
                ระบบยืนยันตัวตนสถานศึกษา
              </span>
              <h3 className="text-lg font-bold leading-tight">เข้าสู่ระบบ โรงเรียนบ้านนารี</h3>
            </div>
          </div>
          <p className="text-xs text-blue-100/80 leading-relaxed">
            สำหรับผู้บริหารสถานศึกษา ครูประจำชั้น และบุคลากรทางการศึกษา (สพป.ชัยภูมิ เขต 1)
          </p>
        </div>

        {/* Content Body: Clean Production Google Login */}
        <div className="p-6 space-y-4">
          {/* Error Message Display */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5 animate-in shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <p className="font-bold">เกิดข้อผิดพลาด</p>
                <p className="mt-0.5 text-rose-700">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Primary Action: Official Google Login */}
          <div className="pt-2 space-y-3">
            <button
              type="button"
              onClick={handleSignInClick}
              disabled={isLoggingIn}
              className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-2xl text-slate-700 font-bold text-sm shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
              <span>{isLoggingIn ? 'กำลังเชื่อมต่อ Google...' : 'เข้าสู่ระบบ Google Login'}</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-center">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              ยกเลิก / ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
