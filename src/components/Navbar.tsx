import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  ShieldCheck, 
  Newspaper, 
  HardDrive, 
  LayoutDashboard, 
  Edit3, 
  LogOut, 
  Menu, 
  X, 
  ChevronDown,
  Phone,
  Sparkles,
  School,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Film,
  MapPin,
  ChevronRight,
  Inbox,
  Crown,
  FileText
} from 'lucide-react';
import { User, UserRole } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User | null;
  userRole: UserRole;
  onToggleRole?: (role?: UserRole) => void;
  isQuickEditMode: boolean;
  setIsQuickEditMode: (val: boolean) => void;
  onLogin: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
  unreadInboxCount?: number;
  onOpenInbox?: () => void;
  onOpenRoles?: () => void;
  isSuperAdmin?: boolean;
  enableVideoGallery?: boolean;
}

interface NavSingleItem {
  type: 'link';
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSubItem {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroupItem {
  type: 'group';
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: NavSubItem[];
}

type NavEntry = NavSingleItem | NavGroupItem;

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  userRole,
  onToggleRole,
  isQuickEditMode,
  setIsQuickEditMode,
  onLogin,
  onLogout,
  isLoggingIn,
  unreadInboxCount = 0,
  onOpenInbox,
  onOpenRoles,
  isSuperAdmin = false,
  enableVideoGallery = true
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [openDesktopDropdown, setOpenDesktopDropdown] = useState<string | null>(null);
  const [expandedMobileGroups, setExpandedMobileGroups] = useState<Record<string, boolean>>({
    'about-group': true,
    'news-group': true
  });

  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (groupId: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setOpenDesktopDropdown(groupId);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDesktopDropdown(null);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  // Grouped Navigation Items (Clean & Organized - 5 top-level entries instead of 8)
  const navEntries: NavEntry[] = [
    { 
      type: 'link', 
      id: 'home', 
      label: 'หน้าหลัก', 
      icon: School 
    },
    {
      type: 'group',
      id: 'about-group',
      label: 'เกี่ยวกับโรงเรียน',
      icon: Building2,
      children: [
        { 
          id: 'about', 
          label: 'ข้อมูลและประวัติสถานศึกษา', 
          sublabel: 'วิสัยทัศน์ พันธกิจ ปรัชญา และข้อมูลพื้นฐาน', 
          icon: Building2 
        },
        { 
          id: 'staff', 
          label: 'ทำเนียบครูและบุคลากร', 
          sublabel: 'คณะผู้บริหาร ครูผู้สอน และบุคลากรทางการศึกษา', 
          icon: Users 
        },
        { 
          id: 'boards', 
          label: 'คณะกรรมการสถานศึกษา', 
          sublabel: 'คณะกรรมการสถานศึกษาขั้นพื้นฐาน & ภาคีเครือข่าย', 
          icon: ShieldCheck 
        },
      ]
    },
    {
      type: 'group',
      id: 'news-group',
      label: 'ข่าวและกิจกรรม',
      icon: Newspaper,
      children: [
        { 
          id: 'news', 
          label: 'ข่าวประชาสัมพันธ์ & ประกาศ', 
          sublabel: 'ข่าวสาร ประกาศทางการ และจัดซื้อจัดจ้าง', 
          icon: Newspaper 
        },
        { 
          id: 'gallery', 
          label: 'คลังภาพกิจกรรมโรงเรียน', 
          sublabel: 'อัลบั้มภาพกิจกรรม และภาพเชื่อมโยง Google Drive', 
          icon: ImageIcon 
        },
        ...(enableVideoGallery !== false ? [{ 
          id: 'videos', 
          label: 'คลังวิดีโอกิจกรรมโรงเรียน', 
          sublabel: 'วิดีโอกิจกรรม สื่อมัลติมีเดีย และวิดีโอประชาสัมพันธ์', 
          icon: Film 
        }] : []),
      ]
    },
    { 
      type: 'link', 
      id: 'documents', 
      label: 'เอกสารเผยแพร่', 
      icon: FileText 
    },
    { 
      type: 'link', 
      id: 'contact', 
      label: 'ติดต่อเรา', 
      icon: MapPin 
    },
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setOpenDesktopDropdown(null);
    setMobileMenuOpen(false);
  };

  const toggleMobileGroup = (groupId: string) => {
    setExpandedMobileGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
      {/* Top Institutional Identity Strip */}
      <div className="bg-[#0B1528] text-slate-300 text-xs py-2 px-4 sm:px-6 lg:px-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Official Affiliation & Motto */}
          <div className="flex items-center gap-2.5 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="text-white/80 font-medium hidden md:inline">
              สำนักงานเขตพื้นที่การศึกษาประถมศึกษา ชัยภูมิ เขต 1
            </span>
            <span className="hidden md:inline text-white/30" aria-hidden="true">·</span>
            <span className="text-amber-400 font-medium flex items-center gap-1.5 truncate">
              <span className="text-amber-400 font-semibold">สุวิชาโน ภวํ โหติ</span>
              <span className="text-amber-300/80 text-2xs font-normal hidden sm:inline">(ผู้รู้ดี เป็นผู้เจริญ)</span>
            </span>
          </div>

          {/* Right: Phone Hotline */}
          <div className="flex items-center justify-end gap-3 shrink-0 ml-auto">
            <div className="flex items-center gap-1.5 text-2xs text-slate-300">
              <Phone className="w-3 h-3 text-amber-400" />
              <span>โทร. 043-221-589</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Left: Brand Identity Lockup */}
          <div 
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            {/* School Crest / Emblem */}
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#0F224A] via-[#1E3A8A] to-[#1E293B] p-0.5 shadow-md shadow-blue-950/15 ring-1 ring-amber-400/30 group-hover:ring-amber-400/60 transition-all flex items-center justify-center">
              <div className="w-full h-full rounded-[14px] bg-[#0A1938] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-radial from-amber-400/20 to-transparent"></div>
                <svg viewBox="0 0 40 40" className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400 relative z-10 fill-current drop-shadow-xs">
                  <path d="M20 3L3 11v4h34v-4L20 3zm-13 14v13h4.5V17H7zm8 0v13h4.5V17H15zm8 0v13h4.5V17H23zm8 0v13h4.5V17H31zM3 33v4h34v-4H3z" />
                </svg>
              </div>
            </div>

            {/* School Names & Hierarchy */}
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none group-hover:text-blue-900 transition-colors">
                  โรงเรียนบ้านนารี
                </h1>
                <span className="hidden sm:inline-block text-3xs font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200/80">
                  สพป.ชย.1
                </span>
              </div>
              <p className="text-2xs sm:text-xs text-slate-500 font-medium mt-1 leading-none tracking-tight">
                Ban Naree School <span className="text-slate-300 font-normal">·</span> สพฐ.
              </p>
            </div>
          </div>

          {/* Center-Left: Grouped Desktop Navigation (Clean & Uncrowded) */}
          <nav className="hidden lg:flex items-center gap-1 ml-1 xl:ml-3">
            {navEntries.map((entry) => {
              if (entry.type === 'link') {
                const isActive = activeTab === entry.id;
                const Icon = entry.icon;
                return (
                  <button
                    key={entry.id}
                    onClick={() => handleNavClick(entry.id)}
                    className={`px-3 py-2 rounded-xl text-xs xl:text-sm font-semibold flex items-center gap-1.5 transition-all relative whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 text-blue-900 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-700' : 'text-slate-400'}`} />
                    <span>{entry.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-2.5 right-2.5 h-0.5 bg-blue-700 rounded-full" />
                    )}
                  </button>
                );
              }

              // Group with Dropdown
              const isChildActive = entry.children.some(child => child.id === activeTab);
              const isOpen = openDesktopDropdown === entry.id;
              const GroupIcon = entry.icon;

              return (
                <div
                  key={entry.id}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(entry.id)}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    type="button"
                    onClick={() => setOpenDesktopDropdown(isOpen ? null : entry.id)}
                    className={`px-3 py-2 rounded-xl text-xs xl:text-sm font-semibold flex items-center gap-1.5 transition-all relative whitespace-nowrap cursor-pointer ${
                      isChildActive
                        ? 'bg-blue-50 text-blue-900 shadow-2xs font-bold'
                        : isOpen
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <GroupIcon className={`w-4 h-4 ${isChildActive ? 'text-blue-700' : 'text-slate-400'}`} />
                    <span>{entry.label}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-700' : 'text-slate-400'}`} />
                    {isChildActive && (
                      <span className="absolute bottom-0 left-2.5 right-2.5 h-0.5 bg-blue-700 rounded-full" />
                    )}
                  </button>

                  {/* Dropdown Menu Panel */}
                  {isOpen && (
                    <div 
                      className="absolute left-0 mt-1 w-72 bg-white rounded-2xl shadow-xl border border-slate-150 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                      onMouseEnter={() => handleMouseEnter(entry.id)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                        <span className="text-3xs font-bold text-slate-400 uppercase tracking-wider">
                          {entry.label}
                        </span>
                      </div>
                      {entry.children.map((child) => {
                        const isSubActive = activeTab === child.id;
                        const ChildIcon = child.icon;
                        return (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => handleNavClick(child.id)}
                            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs flex items-start gap-3 transition-colors cursor-pointer ${
                              isSubActive
                                ? 'bg-blue-50/90 text-blue-900 font-bold'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                              isSubActive ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                            }`}>
                              <ChildIcon className="w-4 h-4" />
                            </div>
                            <div className="leading-tight">
                              <p className={`text-xs ${isSubActive ? 'font-bold text-blue-900' : 'font-semibold text-slate-800'}`}>
                                {child.label}
                              </p>
                              <p className="text-2xs text-slate-400 font-normal mt-0.5 leading-snug">
                                {child.sublabel}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right Action Zone: Buttons Strictly Aligned to the Right (จัดตำแหน่งปุ่มชิดขวา) */}
          <div className="ml-auto flex items-center justify-end gap-2 sm:gap-2.5 shrink-0">
            {/* Dashboard Link (Only for Staff / Admin) */}
            {userRole !== 'guest' && (
              <button
                type="button"
                onClick={() => handleNavClick('dashboard')}
                className={`px-3.5 py-1.5 sm:py-2 rounded-xl text-2xs sm:text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-900 border-blue-900 text-white shadow-xs'
                    : 'bg-slate-100/80 border-slate-200 text-slate-700 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
                title="เปิดแดชบอร์ดบริหารจัดการโรงเรียน"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-blue-600" />
                <span>แดชบอร์ด</span>
              </button>
            )}

            {/* User Auth Profile Button (Compact Avatar Button) */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 p-1 pr-2 rounded-full border border-slate-200 bg-white hover:bg-slate-100/80 transition-colors shadow-2xs cursor-pointer"
                  title={`${user.displayName || 'ผู้ใช้งาน'} (${userRole === 'admin' ? 'ผู้ดูแลระบบ' : userRole === 'teacher' ? 'ครูผู้สอน' : 'ผู้เยี่ยมชม'})`}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-2xs">
                      {user.displayName?.[0] || 'U'}
                    </div>
                  )}
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </button>

                {userDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.displayName}</p>
                      <p className="text-2xs text-slate-500 truncate">{user.email}</p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className={`text-2xs font-semibold px-2 py-0.5 rounded-md ${
                          isSuperAdmin || userRole === 'superadmin'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                            : userRole === 'admin'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {isSuperAdmin || userRole === 'superadmin'
                            ? 'ผู้อำนวยการ (Super Admin)'
                            : userRole === 'admin'
                            ? 'ผู้ดูแลระบบ (Admin)'
                            : 'ครูผู้สอน (Teacher)'}
                        </span>
                      </div>
                    </div>

                    {/* Super Admin Exclusive Menu Options */}
                    {isSuperAdmin && onOpenInbox && (
                      <button
                        type="button"
                        onClick={() => { onOpenInbox(); setUserDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-blue-900 hover:bg-blue-50 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Inbox className="w-3.5 h-3.5 text-blue-700" />
                          <span>กล่องข้อความ (Director Inbox)</span>
                        </div>
                        {unreadInboxCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-3xs font-extrabold bg-rose-500 text-white animate-pulse">
                            {unreadInboxCount} ใหม่
                          </span>
                        )}
                      </button>
                    )}

                    {isSuperAdmin && onOpenRoles && (
                      <button
                        type="button"
                        onClick={() => { onOpenRoles(); setUserDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-xs text-amber-800 hover:bg-amber-50 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Crown className="w-3.5 h-3.5 text-amber-600" />
                        <span>จัดการสิทธิ์ Super Admin & Admins</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => { handleNavClick('dashboard'); setUserDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                      <span>แดชบอร์ด</span>
                    </button>

                    {(userRole === 'admin' || userRole === 'superadmin' || isSuperAdmin) && (
                      <button
                        type="button"
                        onClick={() => { handleNavClick('drive'); setUserDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                        <span>คลัง Google Drive โรงเรียน</span>
                      </button>
                    )}

                    <div className="border-t border-slate-100 my-1"></div>

                    {/* Prominent Logout Button */}
                    <button
                      type="button"
                      onClick={() => { onLogout(); setUserDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-bold transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>ออกจากระบบ (Logout)</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={onLogin}
                  disabled={isLoggingIn}
                  className="gsi-material-button text-xs"
                >
                  <div className="gsi-material-button-state"></div>
                  <div className="gsi-material-button-content-wrapper">
                    <div className="gsi-material-button-icon">
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                      </svg>
                    </div>
                    <span className="gsi-material-button-contents">
                      {isLoggingIn ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่ระบบ'}
                    </span>
                  </div>
                </button>
              </div>
            )}

            {/* Mobile Menu Hamburger */}
            <div className="flex lg:hidden items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="เมนู"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer (Grouped & Tidy) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-2 shadow-xl animate-in slide-in-from-top-2 max-h-[80vh] overflow-y-auto">
          {navEntries.map((entry) => {
            if (entry.type === 'link') {
              const isActive = activeTab === entry.id;
              const Icon = entry.icon;
              return (
                <button
                  key={entry.id}
                  onClick={() => handleNavClick(entry.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 text-blue-900 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-700' : 'text-slate-400'}`} />
                  <span>{entry.label}</span>
                </button>
              );
            }

            // Mobile Accordion Group
            const isChildActive = entry.children.some(child => child.id === activeTab);
            const isExpanded = expandedMobileGroups[entry.id];
            const GroupIcon = entry.icon;

            return (
              <div key={entry.id} className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => toggleMobileGroup(entry.id)}
                  className={`w-full text-left px-3.5 py-2.5 text-sm font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    isChildActive ? 'bg-blue-50/70 text-blue-900 font-bold' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <GroupIcon className={`w-4 h-4 ${isChildActive ? 'text-blue-700' : 'text-slate-500'}`} />
                    <span>{entry.label}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isExpanded && (
                  <div className="p-1 space-y-1 bg-white border-t border-slate-100">
                    {entry.children.map((child) => {
                      const isSubActive = activeTab === child.id;
                      const ChildIcon = child.icon;
                      return (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => handleNavClick(child.id)}
                          className={`w-full text-left pl-7 pr-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                            isSubActive
                              ? 'bg-blue-50 text-blue-900 font-bold'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <ChildIcon className={`w-3.5 h-3.5 ${isSubActive ? 'text-blue-700' : 'text-slate-400'}`} />
                          <span>{child.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-3 border-t border-slate-100 space-y-2">
            {userRole !== 'guest' && (
              <>
                {/* Super Admin Inbox Mobile Button */}
                {isSuperAdmin && onOpenInbox && (
                  <button
                    type="button"
                    onClick={() => { onOpenInbox(); setMobileMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-extrabold bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between shadow-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Inbox className="w-4 h-4 text-amber-300" />
                      <span>กล่องข้อความ (Director Inbox)</span>
                    </div>
                    {unreadInboxCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-2xs font-extrabold bg-rose-500 text-white animate-pulse">
                        {unreadInboxCount} ใหม่
                      </span>
                    )}
                  </button>
                )}

                {/* Super Admin Roles Mobile Button */}
                {isSuperAdmin && onOpenRoles && (
                  <button
                    type="button"
                    onClick={() => { onOpenRoles(); setMobileMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-50 text-amber-950 border border-amber-300 flex items-center gap-2 cursor-pointer"
                  >
                    <Crown className="w-4 h-4 text-amber-600" />
                    <span>จัดการสิทธิ์ Super Admin & Admins</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleNavClick('dashboard')}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-900 text-white flex items-center gap-2 cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4 text-amber-300" />
                  <span>แดชบอร์ดบริหาร & AI สตูดิโอ</span>
                </button>

                {(userRole === 'admin' || userRole === 'superadmin' || isSuperAdmin) && (
                  <button
                    type="button"
                    onClick={() => setIsQuickEditMode(!isQuickEditMode)}
                    className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold border border-amber-300 bg-amber-50 text-amber-900 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-amber-600" />
                      <span>{isQuickEditMode ? 'โหมดแก้ไขด่วน: เปิดอยู่' : 'โหมดแก้ไขด่วนบนหน้าเว็บ'}</span>
                    </div>
                    <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900">
                      {isQuickEditMode ? 'ON' : 'OFF'}
                    </span>
                  </button>
                )}
              </>
            )}


            {user ? (
              <button
                type="button"
                onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>ออกจากระบบ ({user.displayName})</span>
              </button>
            ) : (
              <div className="pt-2">
                <button 
                  type="button"
                  onClick={onLogin}
                  disabled={isLoggingIn}
                  className="gsi-material-button w-full justify-center"
                >
                  <div className="gsi-material-button-state"></div>
                  <div className="gsi-material-button-content-wrapper">
                    <div className="gsi-material-button-icon">
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                      </svg>
                    </div>
                    <span className="gsi-material-button-contents">เข้าสู่ระบบด้วย Google</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
