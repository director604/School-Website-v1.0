import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  UserCheck, 
  UserPlus, 
  Trash2, 
  X, 
  Save, 
  AlertCircle, 
  Crown, 
  Mail, 
  Lock, 
  RefreshCw,
  Info
} from 'lucide-react';
import { SystemRolesConfig } from '../types';
import { 
  DEFAULT_SUPER_ADMIN_EMAIL, 
  checkIsSuperAdmin, 
  saveSystemRolesConfig 
} from '../services/inboxService';
import { showSuccess, showError, showConfirm } from '../utils/sweetalert';

interface AdminRoleManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string | null;
  rolesConfig?: SystemRolesConfig | null;
  onConfigUpdated?: (newConfig: SystemRolesConfig) => void;
}

export const AdminRoleManagementModal: React.FC<AdminRoleManagementModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  rolesConfig,
  onConfigUpdated
}) => {
  const isSuper = checkIsSuperAdmin(currentUserEmail, rolesConfig);

  const [superAdminEmail, setSuperAdminEmail] = useState('');
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [newAdminInput, setNewAdminInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (rolesConfig) {
      setSuperAdminEmail(rolesConfig.superAdminEmail || DEFAULT_SUPER_ADMIN_EMAIL);
      setAdminEmails(Array.isArray(rolesConfig.adminEmails) ? [...rolesConfig.adminEmails] : []);
    } else {
      setSuperAdminEmail(DEFAULT_SUPER_ADMIN_EMAIL);
      setAdminEmails([]);
    }
  }, [rolesConfig, isOpen]);

  if (!isOpen) return null;

  if (!isSuper) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-rose-200 space-y-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900">จำกัดสิทธิ์เฉพาะ Super Admin</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            เฉพาะ <strong>ผู้อำนวยการโรงเรียน (Super Admin)</strong> เท่านั้นที่มีสิทธิ์แต่งตั้งหรือถอดถอนผู้ดูแลระบบทั่วไป
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            ปิดหน้าต่างนี้
          </button>
        </div>
      </div>
    );
  }

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const emailToAdd = newAdminInput.trim().toLowerCase();
    if (!emailToAdd) return;

    // Validate email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailToAdd)) {
      showError('รูปแบบอีเมลไม่ถูกต้อง', 'กรุณาระบุอีเมลที่ถูกต้อง เช่น teacher@gmail.com');
      return;
    }

    if (emailToAdd === superAdminEmail.toLowerCase()) {
      showError('ไม่จำเป็นต้องเพิ่ม', 'อีเมลนี้เป็น Super Admin (ผู้อำนวยการ) อยู่แล้ว');
      return;
    }

    if (adminEmails.includes(emailToAdd)) {
      showError('มีอีเมลนี้อยู่แล้ว', 'อีเมลนี้ได้รับการแต่งตั้งเป็น Admin อยู่แล้ว');
      return;
    }

    setAdminEmails([...adminEmails, emailToAdd]);
    setNewAdminInput('');
  };

  const handleRemoveAdmin = (targetEmail: string) => {
    setAdminEmails(adminEmails.filter(e => e !== targetEmail));
  };

  const handleSaveAll = async () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const trimmedSuper = superAdminEmail.trim().toLowerCase();

    if (!emailRegex.test(trimmedSuper)) {
      showError('รูปแบบอีเมล Super Admin ไม่ถูกต้อง', 'กรุณาระบุอีเมลที่ถูกต้อง');
      return;
    }

    // Check if transferring super admin
    const currentSuper = (rolesConfig?.superAdminEmail || DEFAULT_SUPER_ADMIN_EMAIL).toLowerCase();
    if (trimmedSuper !== currentSuper) {
      const confirmTransfer = await showConfirm(
        'ยืนยันการโอนย้ายสิทธิ์ Super Admin?',
        `ท่านกำลังจะโอนสิทธิ์ Super Admin ไปที่ "${trimmedSuper}" หลังจากนี้บัญชีใหม่นี้จะได้รับสิทธิ์สูงสุดแทน`,
        'ยืนยันโอนสิทธิ์',
        '#E11D48'
      );
      if (!confirmTransfer) return;
    }

    setIsSaving(true);
    try {
      await saveSystemRolesConfig(
        {
          superAdminEmail: trimmedSuper,
          adminEmails: adminEmails
        },
        currentUserEmail || trimmedSuper
      );

      showSuccess('บันทึกสิทธิ์สำเร็จ', 'อัปเดตรายชื่อ Super Admin และ Admin เรียบร้อยแล้ว');
      if (onConfigUpdated) {
        onConfigUpdated({
          superAdminEmail: trimmedSuper,
          adminEmails: adminEmails
        });
      }
      onClose();
    } catch (err: any) {
      showError('เกิดข้อผิดพลาดในการบันทึก', err?.message || err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400 text-slate-950 rounded-xl">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                จัดการสิทธิ์ผู้ดูแลระบบ (Super Admin & Admin Roles)
              </h3>
              <p className="text-2xs text-blue-200">
                ควบคุมสิทธิ์การบริหารระบบและแต่งตั้งผู้ดูแลระบบ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs text-slate-700">
          
          {/* Super Admin Section */}
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
                <Crown className="w-4 h-4 text-amber-600" />
                <span>ผู้อำนวยการโรงเรียน (Super Admin): {superAdminEmail || 'engine@bnr.ac.th'}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-2xs font-extrabold bg-amber-400 text-slate-950">
                สิทธิ์สูงสุด
              </span>
            </div>

            <p className="text-2xs text-amber-900 leading-relaxed">
              Super Admin เป็นผู้มีสิทธิ์ตรวจสอบข้อความลับในกล่องข้อความ (Inbox) และแต่งตั้งผู้ดูแลระบบทั่วไป โดยผู้ดูแลระบบทั่วไป (Admin) <strong>ไม่สามารถแก้ไขหรือถอดถอนผู้อำนวยการได้ เพื่อความปลอดภัยและเป็นไปตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)</strong>
            </p>

            <div>
              <label className="block text-2xs font-bold text-slate-700 mb-1">
                อีเมล Super Admin (Google Account):
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={superAdminEmail}
                  onChange={(e) => setSuperAdminEmail(e.target.value)}
                  placeholder="engine@bnr.ac.th"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Regular Admins Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  ผู้ดูแลระบบทั่วไป (Appointed Admins)
                </h4>
                <p className="text-2xs text-slate-500">
                  มีสิทธิ์แก้ไขข้อมูลเว็บไซต์ ข่าวสาร บุคลากร และ Google Drive (แต่ไม่สามารถเข้าถึง Inbox ได้)
                </p>
              </div>
              <span className="text-2xs font-bold text-slate-500">
                {adminEmails.length} ท่าน
              </span>
            </div>

            {/* Add New Admin Form */}
            <form onSubmit={handleAddAdmin} className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={newAdminInput}
                  onChange={(e) => setNewAdminInput(e.target.value)}
                  placeholder="เพิ่มอีเมล Google ของครูผู้ดูแลระบบ เช่น teacher@gmail.com"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden bg-white"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-300" />
                <span>เพิ่ม Admin</span>
              </button>
            </form>

            {/* Admin List */}
            <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 max-h-48 overflow-y-auto bg-slate-50/50">
              {adminEmails.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-2xs">
                  ยังไม่มีผู้ดูแลระบบเพิ่มเติม (สามารถเพิ่มอีเมลของครูผู้รับผิดชอบได้)
                </div>
              ) : (
                adminEmails.map((email, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-2xs shrink-0">
                        {idx + 1}
                      </div>
                      <span className="font-mono text-xs font-semibold text-slate-800 truncate">
                        {email}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAdmin(email)}
                      title="ลบสิทธิ์ Admin"
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveAll}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" /> : <Save className="w-3.5 h-3.5 text-amber-300" />}
            <span>บันทึกการตั้งค่าสิทธิ์</span>
          </button>
        </div>
      </div>
    </div>
  );
};
