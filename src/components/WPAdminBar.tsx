import React, { useState } from 'react';
import { 
  Plus, 
  LayoutDashboard, 
  Newspaper, 
  Image as ImageIcon, 
  Users, 
  ShieldCheck, 
  Edit3, 
  LogOut, 
  Eye, 
  FolderOpen, 
  Tag, 
  Sparkles,
  ChevronDown,
  Inbox,
  Crown,
  Film
} from 'lucide-react';
import { User, UserRole } from '../types';

interface WPAdminBarProps {
  user: User | null;
  userRole: UserRole;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isQuickEditMode: boolean;
  setIsQuickEditMode: (val: boolean) => void;
  onNewPost: () => void;
  onNewAlbum: () => void;
  onNewVideo?: () => void;
  onNewStaff: () => void;
  onNewBoard: () => void;
  onOpenCategories: () => void;
  onLogout: () => void;
  unreadInboxCount?: number;
  onOpenInbox?: () => void;
  onOpenRoles?: () => void;
  isSuperAdmin?: boolean;
}

export const WPAdminBar: React.FC<WPAdminBarProps> = ({
  user,
  userRole,
  activeTab,
  setActiveTab,
  isQuickEditMode,
  setIsQuickEditMode,
  onNewPost,
  onNewAlbum,
  onNewVideo,
  onNewStaff,
  onNewBoard,
  onOpenCategories,
  onLogout,
  unreadInboxCount = 0,
  onOpenInbox,
  onOpenRoles,
  isSuperAdmin = false
}) => {
  const [newDropdownOpen, setNewDropdownOpen] = useState(false);
  const [siteDropdownOpen, setSiteDropdownOpen] = useState(false);

  // If user is not logged in or previewing in guest mode, we do not show the WP admin bar
  if (!user || userRole === 'guest') return null;

  const isBackend = activeTab === 'dashboard';

  return (
    <div className="bg-[#1d2327] text-[#f0f0f1] text-xs h-9 px-3 sm:px-6 flex items-center justify-between border-b border-[#3c434a] z-50 select-none relative font-sans">
      {/* Left Zone: WP / School Brand & Links */}
      <div className="flex items-center gap-1 sm:gap-3">
        {/* Site Switcher Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setSiteDropdownOpen(!siteDropdownOpen)}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#2c3338] hover:text-white transition-colors cursor-pointer"
          >
            <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xs font-black">
              W
            </div>
            <span className="font-bold hidden sm:inline">โรงเรียนบ้านนารี</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {siteDropdownOpen && (
            <div 
              className="absolute left-0 top-full mt-1 w-48 bg-[#2c3338] text-[#f0f0f1] rounded shadow-xl border border-[#3c434a] py-1 z-50"
              onMouseLeave={() => setSiteDropdownOpen(false)}
            >
              <button
                type="button"
                onClick={() => { setActiveTab('dashboard'); setSiteDropdownOpen(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2 text-xs"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>หน้าควบคุม (Dashboard)</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('home'); setSiteDropdownOpen(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2 text-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>เยี่ยมชมเว็บไซต์ (View Site)</span>
              </button>
              <div className="border-t border-[#3c434a] my-1"></div>
              <button
                type="button"
                onClick={() => { onOpenCategories(); setSiteDropdownOpen(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2 text-xs"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>จัดการหมวดหมู่ (Categories)</span>
              </button>
            </div>
          )}
        </div>

        {/* View Switcher: Frontend vs WP-Admin */}
        <button
          type="button"
          onClick={() => setActiveTab(isBackend ? 'home' : 'dashboard')}
          className={`px-2 py-1 rounded text-2xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            isBackend
              ? 'bg-amber-400 text-slate-950 font-bold hover:bg-amber-300'
              : 'bg-[#2c3338] text-slate-200 hover:bg-[#3c434a]'
          }`}
          title={isBackend ? 'สลับไปดูหน้าเว็บจริง' : 'สลับเข้าหลังบ้าน BNR Dashboard'}
        >
          {isBackend ? (
            <>
              <Eye className="w-3 h-3" />
              <span>ดูหน้าเว็บไซต์</span>
            </>
          ) : (
            <>
              <LayoutDashboard className="w-3 h-3 text-amber-400" />
              <span>เข้าหลังบ้าน BNR-Admin</span>
            </>
          )}
        </button>

        {/* + สร้างใหม่ (+ New) Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNewDropdownOpen(!newDropdownOpen)}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#2c3338] hover:text-white transition-colors cursor-pointer text-2xs font-medium"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">สร้างใหม่</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {newDropdownOpen && (
            <div 
              className="absolute left-0 top-full mt-1 w-44 bg-[#2c3338] text-[#f0f0f1] rounded shadow-xl border border-[#3c434a] py-1 z-50"
              onMouseLeave={() => setNewDropdownOpen(false)}
            >
              <button
                type="button"
                onClick={() => { onNewPost(); setNewDropdownOpen(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2 text-xs"
              >
                <Newspaper className="w-3.5 h-3.5 text-blue-400" />
                <span>เรื่อง / ข่าวสาร (Post)</span>
              </button>
              <button
                type="button"
                onClick={() => { onNewAlbum(); setNewDropdownOpen(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2 text-xs"
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>แกลเลอรีภาพกิจกรรม</span>
              </button>
              {onNewVideo && (
                <button
                  type="button"
                  onClick={() => { onNewVideo(); setNewDropdownOpen(false); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2 text-xs"
                >
                  <Film className="w-3.5 h-3.5 text-blue-400" />
                  <span>วิดีโอกิจกรรม (Video)</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => { onOpenCategories(); setNewDropdownOpen(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2 text-xs"
              >
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                <span>หมวดหมู่ (Category)</span>
              </button>
              {(userRole === 'admin' || userRole === 'superadmin' || isSuperAdmin) && (
                <>
                  <div className="border-t border-[#3c434a] my-1"></div>
                  <button
                    type="button"
                    onClick={() => { onNewStaff(); setNewDropdownOpen(false); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2 text-xs"
                  >
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    <span>บุคลากร (Staff)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { onNewBoard(); setNewDropdownOpen(false); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2 text-xs"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>คณะกรรมการ (Board)</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Quick Edit Mode Toggle */}
        <button
          type="button"
          onClick={() => setIsQuickEditMode(!isQuickEditMode)}
          className={`px-2 py-1 rounded text-2xs flex items-center gap-1 transition-colors cursor-pointer ${
            isQuickEditMode 
              ? 'text-amber-300 font-bold bg-[#2c3338]' 
              : 'text-slate-400 hover:text-white'
          }`}
          title="สลับโหมดแก้ไขด่วนบนหน้าเว็บ"
        >
          <Edit3 className="w-3 h-3" />
          <span className="hidden md:inline">แก้ไขหน้านี้: {isQuickEditMode ? 'เปิด' : 'ปิด'}</span>
        </button>

        {/* Super Admin Inbox Quick Access Button */}
        {isSuperAdmin && onOpenInbox && (
          <button
            type="button"
            onClick={onOpenInbox}
            className="px-2 py-1 rounded text-2xs flex items-center gap-1.5 transition-all cursor-pointer bg-blue-800 hover:bg-blue-700 text-white font-bold shadow-2xs"
            title="กล่องข้อความติดต่อโรงเรียน (สำหรับผู้อำนวยการ)"
          >
            <Inbox className="w-3.5 h-3.5 text-amber-300" />
            <span>กล่องข้อความ</span>
            {unreadInboxCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-3xs font-extrabold bg-rose-500 text-white animate-pulse">
                {unreadInboxCount}
              </span>
            )}
          </button>
        )}

        {/* Super Admin Manage Roles Button */}
        {isSuperAdmin && onOpenRoles && (
          <button
            type="button"
            onClick={onOpenRoles}
            className="hidden lg:flex items-center gap-1 px-2 py-1 rounded text-2xs text-amber-300 hover:bg-[#2c3338] transition-colors cursor-pointer"
            title="จัดการสิทธิ์ Super Admin & Admins"
          >
            <Crown className="w-3 h-3 text-amber-400" />
            <span>จัดการสิทธิ์ Admin</span>
          </button>
        )}
      </div>

      {/* Right Zone: User Greetings & Logout */}
      <div className="flex items-center gap-2 text-2xs">
        <span className="text-slate-400 hidden sm:inline">สวัสดี,</span>
        <span className="font-bold text-white truncate max-w-[120px]">
          {user?.displayName || 'ผู้ดูแลระบบ'}
        </span>
        <span className={`px-1.5 py-0.5 rounded font-semibold text-3xs ${
          isSuperAdmin || userRole === 'superadmin'
            ? 'bg-amber-400 text-slate-950 font-extrabold flex items-center gap-0.5'
            : userRole === 'admin'
            ? 'bg-blue-900 text-blue-200'
            : 'bg-slate-700 text-slate-200'
        }`}>
          {(isSuperAdmin || userRole === 'superadmin') && <Crown className="w-2.5 h-2.5" />}
          <span>{isSuperAdmin || userRole === 'superadmin' ? 'Super Admin (ผอ.)' : userRole === 'admin' ? 'Admin' : 'Teacher'}</span>
        </span>

        <button
          type="button"
          onClick={onLogout}
          className="ml-2 px-2 py-0.5 bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded flex items-center gap-1 transition-colors cursor-pointer"
          title="ออกจากระบบ"
        >
          <LogOut className="w-3 h-3" />
          <span className="hidden sm:inline">ออกจากระบบ</span>
        </button>
      </div>
    </div>
  );
};
