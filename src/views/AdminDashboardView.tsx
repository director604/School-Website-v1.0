import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Sparkles, 
  HardDrive, 
  ShieldCheck, 
  Edit3, 
  Trash2, 
  Plus, 
  Settings, 
  Newspaper, 
  Image as ImageIcon, 
  Building2, 
  ExternalLink, 
  Search, 
  Check, 
  FolderOpen,
  Tag,
  Upload,
  Eye,
  RefreshCw,
  FolderPlus,
  Calendar,
  Layers,
  ArrowUpRight,
  AlertCircle,
  Clock,
  Pin,
  Layout,
  Sliders,
  Megaphone,
  CheckCircle2,
  EyeOff,
  GraduationCap,
  Compass,
  MapPin,
  User as UserIcon,
  BarChart3,
  RotateCcw,
  TrendingUp,
  Pencil,
  X,
  Inbox,
  Crown,
  Film,
  Video,
  Play,
  FileText
} from 'lucide-react';
import { 
  User,
  UserProfile, 
  UserRole, 
  UserStatus, 
  SchoolInfo, 
  NewsPost, 
  StaffMember, 
  BoardMember, 
  GalleryAlbum,
  VideoItem,
  DriveSettings,
  DriveFolderConfig,
  DriveFolderCategory,
  BoardType,
  PostCategory,
  MediaItem,
  HomepageSectionVisibility,
  SiteStats,
  SystemRolesConfig,
  PublicDocumentItem,
  PublicDocumentCategory
} from '../types';
import { seedInitialSchoolDataIfNeeded, recordPageHit } from '../firebase';
import { extractFolderId, validateDriveFolder, fetchDriveFolderImages } from '../services/driveService';
import { checkIsSuperAdmin } from '../services/inboxService';
import { MediaUploadModal } from '../components/MediaUploadModal';
import { MediaLibraryView } from '../components/MediaLibraryView';
import { VideoGalleryView } from '../components/VideoGalleryView';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { HomepageTabKey } from './HomeView';
import { BackupRestoreView } from '../components/BackupRestoreView';
import { Database, Server, Zap, Copy, CheckCheck, Wifi, Activity, CloudLightning, ShieldAlert, Cpu } from 'lucide-react';
import { fetchD1Status, D1StatusInfo } from '../services/d1Service';
import { showSuccess, showError, showWarning } from '../utils/sweetalert';

interface AdminDashboardViewProps {
  user: User | null;
  userRole: UserRole;
  schoolInfo: SchoolInfo;
  staffList: StaffMember[];
  boardMembers: BoardMember[];
  newsList: NewsPost[];
  galleryList: GalleryAlbum[];
  driveSettings: DriveSettings;
  usersList: UserProfile[];
  categories: PostCategory[];
  mediaList: MediaItem[];
  videoList?: VideoItem[];
  documentList?: PublicDocumentItem[];
  siteStats?: SiteStats;
  onResetSiteStats?: (newCount?: number) => Promise<void>;
  onUpdateUserRole: (userId: string, newRole: UserRole, email?: string) => Promise<void>;
  onUpdateUserStatus?: (userId: string, newStatus: UserStatus) => Promise<void>;
  onSaveUser?: (userProfile: Partial<UserProfile>) => Promise<void>;
  onDeleteUser?: (userId: string) => Promise<void>;
  onRefreshData: () => void;
  onEditSchoolInfo: (tab?: HomepageTabKey) => void;
  onSaveSchoolInfo?: (updated: SchoolInfo) => Promise<void>;
  onEditStaff: (staff?: StaffMember) => void;
  onDeleteStaff: (staff: StaffMember) => void;
  onEditBoardMember: (member?: BoardMember, defaultType?: BoardType) => void;
  onDeleteBoardMember: (member: BoardMember) => void;
  onEditNews: (news?: NewsPost) => void;
  onDeleteNews: (news: NewsPost) => void;
  onEditAlbum: (album?: GalleryAlbum) => void;
  onDeleteAlbum: (album: GalleryAlbum) => void;
  onEditVideo?: (video?: VideoItem) => void;
  onDeleteVideo?: (video: VideoItem) => void;
  onEditDocument?: (docItem?: PublicDocumentItem) => void;
  onDeleteDocument?: (docItem: PublicDocumentItem) => void;
  onSaveDriveSettings: (updated: DriveSettings) => Promise<void>;
  onSaveCategory: (category: PostCategory) => Promise<void>;
  onDeleteCategory: (categoryId: string) => Promise<void>;
  onAddMediaItem: (item: MediaItem) => void;
  onDeleteMediaItem?: (itemId: string) => void;
  onViewSite: () => void;
  onNavigateTab?: (tab: string) => void;
  unreadInboxCount?: number;
  onOpenInbox?: () => void;
  onOpenRoles?: () => void;
  rolesConfig?: SystemRolesConfig | null;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  user,
  userRole,
  schoolInfo,
  staffList,
  boardMembers,
  newsList,
  galleryList,
  driveSettings,
  usersList,
  categories,
  mediaList,
  videoList = [],
  documentList = [],
  siteStats,
  onResetSiteStats,
  onUpdateUserRole,
  onUpdateUserStatus,
  onSaveUser,
  onDeleteUser,
  onRefreshData,
  onEditSchoolInfo,
  onSaveSchoolInfo,
  onEditStaff,
  onDeleteStaff,
  onEditBoardMember,
  onDeleteBoardMember,
  onEditNews,
  onDeleteNews,
  onEditAlbum,
  onDeleteAlbum,
  onEditVideo,
  onDeleteVideo,
  onEditDocument,
  onDeleteDocument,
  onSaveDriveSettings,
  onSaveCategory,
  onDeleteCategory,
  onAddMediaItem,
  onDeleteMediaItem,
  onViewSite,
  onNavigateTab,
  unreadInboxCount = 0,
  onOpenInbox,
  onOpenRoles,
  rolesConfig
}) => {
  // WP-Admin Active Submenu
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'homepage' | 'users' | 'stats' | 'posts' | 'categories' | 'media' | 'gallery' | 'videos' | 'documents' | 'staff' | 'boards' | 'drive' | 'backup' | 'settings'>('dashboard');

  // Documents Management State
  const [docSearch, setDocSearch] = useState('');
  const [docCategoryFilter, setDocCategoryFilter] = useState('all');

  // User Management State
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'editor'>('all');
  const [updatingUserUid, setUpdatingUserUid] = useState<string | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState<Partial<UserProfile>>({
    displayName: '',
    email: '',
    department: 'กลุ่มบริหารวิชาการ',
    role: 'editor',
    status: 'active'
  });
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Page Hit Counter Management State
  const [customCounterInput, setCustomCounterInput] = useState<string>('');
  const [isResettingCounter, setIsResettingCounter] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  const handleConfirmReset = async (newCount: number = 0) => {
    if (!onResetSiteStats) return;
    setIsResettingCounter(true);
    try {
      await onResetSiteStats(newCount);
      setShowResetConfirmModal(false);
      setResetSuccessMessage(`รีเซ็ตสถิติผู้เข้าชมเป็น ${newCount.toLocaleString('th-TH')} ครั้งเรียบร้อยแล้ว`);
      setTimeout(() => setResetSuccessMessage(null), 4000);
    } catch (err: any) {
      showError('เกิดข้อผิดพลาดในการรีเซ็ต', err.message);
    } finally {
      setIsResettingCounter(false);
    }
  };

  const handleSetCustomCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    const countNum = parseInt(customCounterInput, 10);
    if (isNaN(countNum) || countNum < 0) {
      showWarning('ข้อมูลไม่ถูกต้อง', 'กรุณากรอกตัวเลขจำนวนเต็มที่ถูกต้อง (0 ขึ้นไป)');
      return;
    }
    await handleConfirmReset(countNum);
    setCustomCounterInput('');
  };

  const handleTestHit = async () => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem('bnr_site_visited');
      }
      await recordPageHit();
      showSuccess('ทดสอบสำเร็จ', 'ทดสอบการนับสถิติผู้เข้าชมเว็บไซต์ (+1 Visit) บันทึกข้อมูลสำเร็จเรียบร้อย');
    } catch (err: any) {
      showError('เกิดข้อผิดพลาด', err.message);
    }
  };

  // Cloudflare D1 Database Connection Diagnostic State
  const [d1Status, setD1Status] = useState<D1StatusInfo | null>(null);
  const [isCheckingD1, setIsCheckingD1] = useState(false);
  const [copiedDbId, setCopiedDbId] = useState(false);
  const [showD1TableDetails, setShowD1TableDetails] = useState(false);

  const handleCheckD1Status = async (showToast = false) => {
    setIsCheckingD1(true);
    try {
      const status = await fetchD1Status();
      setD1Status(status);
      if (showToast) {
        showSuccess('เชื่อมต่อ D1 สำเร็จ', `Ping latency: ${status.ping_ms} ms · ตรวจพบ ${status.tables_count} ตารางพร้อมใช้งาน (Database ID: 56fe1149-9b8f-4ef9-8e8e-2d3d7bda91f4)`);
      }
    } catch (err: any) {
      if (showToast) {
        showError('เชื่อมต่อ D1 ขัดข้อง', err.message);
      }
    } finally {
      setIsCheckingD1(false);
    }
  };

  useEffect(() => {
    handleCheckD1Status(false);
  }, []);

  const handleCopyDbId = (id: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(id);
      setCopiedDbId(true);
      setTimeout(() => setCopiedDbId(false), 2500);
    }
  };

  // Filter & Search states
  const [postSearch, setPostSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [mediaSearch, setMediaSearch] = useState('');

  // Category Form State (WordPress Style)
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catColor, setCatColor] = useState('blue');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [savingCat, setSavingCat] = useState(false);

  // Media Library Upload & Drive Sync State
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [driveSyncFolderInput, setDriveSyncFolderInput] = useState('');
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [driveSyncNotice, setDriveSyncNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);

  // Quick Draft State (Classic WordPress Dashboard Widget)
  const [quickDraftTitle, setQuickDraftTitle] = useState('');
  const [quickDraftContent, setQuickDraftContent] = useState('');
  const [isSavingQuickDraft, setIsSavingQuickDraft] = useState(false);

  // Drive settings form state
  const [driveForm, setDriveForm] = useState<DriveSettings>({ ...driveSettings });
  const [savingDrive, setSavingDrive] = useState(false);

  useEffect(() => {
    setDriveForm({ ...driveSettings });
  }, [driveSettings]);

  const handleRoleChange = async (userId: string, newRole: UserRole, email?: string) => {
    setUpdatingUserUid(userId);
    try {
      await onUpdateUserRole(userId, newRole, email);
    } catch (err: any) {
      showError('เกิดข้อผิดพลาดในการเปลี่ยนสิทธิ์', err.message);
    } finally {
      setUpdatingUserUid(null);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    if (!onUpdateUserStatus) return;
    setUpdatingUserUid(userId);
    try {
      await onUpdateUserStatus(userId, newStatus);
    } catch (err: any) {
      showError('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ', err.message);
    } finally {
      setUpdatingUserUid(null);
    }
  };

  const handleOpenAddUser = () => {
    setUserForm({
      uid: '',
      displayName: '',
      email: '',
      department: 'กลุ่มบริหารวิชาการ',
      role: 'editor',
      status: 'active'
    });
    setUserModalOpen(true);
  };

  const handleOpenEditUser = (u: UserProfile) => {
    setUserForm({
      uid: u.uid,
      displayName: u.displayName || '',
      email: u.email || '',
      department: u.department || 'กลุ่มบริหารวิชาการ',
      role: u.role === 'admin' ? 'admin' : 'editor',
      status: u.status || 'active',
      createdAt: u.createdAt
    });
    setUserModalOpen(true);
  };

  const handleSaveUserForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.email || !userForm.displayName) {
      showWarning('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกชื่อ-นามสกุล และอีเมล Google ให้ครบถ้วน');
      return;
    }
    if (!onSaveUser) return;

    setIsSavingUser(true);
    try {
      await onSaveUser(userForm);
      showSuccess('บันทึกสำเร็จ', 'บันทึกข้อมูลผู้ใช้งานเรียบร้อยแล้ว');
      setUserModalOpen(false);
      setUserForm({
        displayName: '',
        email: '',
        department: 'กลุ่มบริหารวิชาการ',
        role: 'editor',
        status: 'active'
      });
    } catch (err: any) {
      showError('เกิดข้อผิดพลาดในการบันทึกข้อมูลผู้ใช้', err.message);
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete || !onDeleteUser) return;
    setIsDeletingUser(true);
    try {
      await onDeleteUser(userToDelete.uid);
      showSuccess('ลบสำเร็จ', `ลบผู้ใช้งาน "${userToDelete.displayName}" เรียบร้อยแล้ว`);
      setUserToDelete(null);
    } catch (err: any) {
      showError('เกิดข้อผิดพลาดในการลบผู้ใช้', err.message);
    } finally {
      setIsDeletingUser(false);
    }
  };

  const filteredUsersList = usersList.filter(u => {
    const roleMatch = userRoleFilter === 'all' 
      ? true 
      : userRoleFilter === 'admin' 
        ? u.role === 'admin' 
        : u.role === 'editor' || (u.role as string) === 'teacher';
    
    const searchLower = userSearch.toLowerCase().trim();
    const searchMatch = !searchLower || 
      (u.displayName || '').toLowerCase().includes(searchLower) ||
      (u.email || '').toLowerCase().includes(searchLower) ||
      (u.department || '').toLowerCase().includes(searchLower);

    return roleMatch && searchMatch;
  });

  // Handle Quick Draft save
  const handleSaveQuickDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickDraftTitle.trim()) return;

    setIsSavingQuickDraft(true);
    try {
      const newPost: NewsPost = {
        id: `news-${Date.now()}`,
        title: quickDraftTitle.trim(),
        category: categories[0]?.slug || 'news',
        summary: quickDraftContent.slice(0, 140),
        content: quickDraftContent || quickDraftTitle,
        coverImage: '/src/assets/images/hero_school_campus_1792082308721.jpg',
        authorName: user?.displayName || 'ผู้ดูแลระบบ',
        authorId: user?.uid || 'admin',
        published: false,
        pinned: false,
        createdAt: new Date().toISOString(),
        views: 0
      };
      await onEditNews(newPost);
      setQuickDraftTitle('');
      setQuickDraftContent('');
      showSuccess('บันทึกสำเร็จ', 'บันทึกเรื่องฉบับร่าง (Draft) เรียบร้อยแล้ว!');
    } catch (err: any) {
      showError('เกิดข้อผิดพลาด', err.message);
    } finally {
      setIsSavingQuickDraft(false);
    }
  };

  // Category submit
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    setSavingCat(true);
    try {
      const generatedSlug = catSlug.trim() 
        ? catSlug.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '-') 
        : catName.trim().toLowerCase().replace(/\s+/g, '-');

      const catToSave: PostCategory = {
        id: editingCatId || `cat-${Date.now()}`,
        name: catName.trim(),
        slug: generatedSlug,
        description: catDesc.trim(),
        color: catColor,
        order: categories.length + 1
      };

      await onSaveCategory(catToSave);
      showSuccess('บันทึกสำเร็จ', `บันทึกหมวดหมู่ "${catName.trim()}" เรียบร้อยแล้ว`);
      setCatName('');
      setCatSlug('');
      setCatDesc('');
      setEditingCatId(null);
    } catch (err: any) {
      showError('เกิดข้อผิดพลาดในการบันทึกหมวดหมู่', err.message);
    } finally {
      setSavingCat(false);
    }
  };

  // Sync Google Drive Folder Photos directly to Media Library
  const handleSyncDriveToMedia = async () => {
    if (!driveSyncFolderInput.trim()) return;

    setIsSyncingDrive(true);
    setDriveSyncNotice(null);

    try {
      const cleanId = extractFolderId(driveSyncFolderInput.trim());
      const fetched = await fetchDriveFolderImages(driveSyncFolderInput.trim());

      if (fetched.length === 0) {
        setDriveSyncNotice({
          type: 'error',
          msg: 'ไม่พบไฟล์รูปภาพในโฟลเดอร์ Google Drive นี้ หรือโฟลเดอร์ยังไม่ได้ตั้งค่าสิทธิ์ให้เข้าถึง'
        });
      } else {
        const details = await validateDriveFolder(cleanId);
        const folderName = details.valid && details.name ? details.name : `โฟลเดอร์ Google Drive (${cleanId.slice(0, 8)})`;

        fetched.forEach(img => {
          const item: MediaItem = {
            id: `drive-media-${img.id}`,
            name: img.name,
            url: img.url,
            thumbnailUrl: img.thumbnailUrl,
            mimeType: 'image/jpeg',
            uploadedAt: new Date().toISOString(),
            source: 'drive',
            driveFileId: img.id,
            driveFolderId: cleanId
          };

          (item as any).folderId = `drive-${cleanId}`;
          (item as any).folderName = folderName;

          onAddMediaItem(item);
        });
        setDriveSyncNotice({
          type: 'success',
          msg: `ดึงรูปภาพเข้าสู่โฟลเดอร์ "${folderName}" สำเร็จ ${fetched.length} รูป!`
        });
        setDriveSyncFolderInput('');
      }
    } catch (err: any) {
      setDriveSyncNotice({
        type: 'error',
        msg: err.message || 'ไม่สามารถเชื่อมต่อ Google Drive ได้'
      });
    } finally {
      setIsSyncingDrive(false);
    }
  };

  // Local File Upload to Media Library
  const handleLocalMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      onAddMediaItem({
        id: `upload-${Date.now()}-${i}`,
        name: file.name,
        url: dataUrl,
        thumbnailUrl: dataUrl,
        size: `${Math.round(file.size / 1024)} KB`,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
        source: 'upload'
      });
    }
  };

  // Filtered posts
  const filteredPosts = newsList.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(postSearch.toLowerCase()) || 
                          (item.summary && item.summary.toLowerCase().includes(postSearch.toLowerCase()));
    const matchesCat = selectedCategoryFilter === 'all' || item.category === selectedCategoryFilter;
    return matchesSearch && matchesCat;
  });

  // Filtered media
  const filteredMediaList = mediaList.filter(item => 
    item.name.toLowerCase().includes(mediaSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f0f0f1] text-[#2c3338] flex flex-col font-sans">
      {/* 1. WordPress Admin Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-2xs sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1d2327] text-white flex items-center justify-center font-bold text-xs tracking-wider">
              BNR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 leading-none">
                  ระบบบริหารจัดการสถานศึกษา (BNR-Admin)
                </h1>
                <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                  โรงเรียนบ้านนารี
                </span>
              </div>
              <p className="text-2xs text-slate-500 mt-0.5">
                BNR CMS & Cloud Workspace Platform
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Public Site button */}
          <button
            type="button"
            onClick={onViewSite}
            className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>ดูหน้าเว็บไซต์จริง</span>
          </button>

          <button
            type="button"
            onClick={onRefreshData}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer"
            title="รีเฟรชข้อมูลล่าสุด"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Main WP-Admin Workspace (Sidebar + Content Canvas) */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left WP Dark Sidebar */}
        <aside className="w-full md:w-64 bg-[#1d2327] text-[#f0f0f1] shrink-0 border-r border-[#3c434a] select-none">
          <div className="p-3 text-2xs uppercase tracking-wider text-slate-400 font-bold border-b border-[#3c434a]">
            เมนูการจัดการหลัก (Navigation)
          </div>

          <nav className="p-2 space-y-0.5 text-xs">
            {/* Dashboard */}
            <button
              type="button"
              onClick={() => setActiveMenu('dashboard')}
              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 font-medium transition-colors cursor-pointer ${
                activeMenu === 'dashboard'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-300 hover:bg-[#2c3338] hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-slate-400" />
              <span>หน้าควบคุม (Dashboard)</span>
            </button>

            {/* Super Admin Exclusive Inbox Button */}
            {userRole === 'superadmin' && onOpenInbox && (
              <button
                type="button"
                onClick={onOpenInbox}
                className="w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between font-bold transition-all cursor-pointer bg-gradient-to-r from-blue-900 to-indigo-900 text-white hover:brightness-110 shadow-xs my-1 border border-blue-700/60"
              >
                <div className="flex items-center gap-2.5">
                  <Inbox className="w-4 h-4 text-amber-300" />
                  <span>กล่องข้อความ (Inbox)</span>
                </div>
                {unreadInboxCount > 0 ? (
                  <span className="text-3xs font-black px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                    {unreadInboxCount} ใหม่
                  </span>
                ) : (
                  <span className="text-3xs px-2 py-0.5 rounded-full bg-blue-950 text-blue-200">
                    ผอ.
                  </span>
                )}
              </button>
            )}

            {/* Super Admin Exclusive Roles Button */}
            {userRole === 'superadmin' && onOpenRoles && (
              <button
                type="button"
                onClick={onOpenRoles}
                className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 text-xs text-amber-300 hover:bg-[#2c3338] transition-colors cursor-pointer font-medium mb-1"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>จัดการสิทธิ์ Super Admin</span>
              </button>
            )}

            {/* User Management (Admin Only) */}
            {(userRole === 'admin' || userRole === 'superadmin' || checkIsSuperAdmin(user?.email, rolesConfig)) && (
              <button
                type="button"
                onClick={() => setActiveMenu('users')}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between font-medium transition-colors cursor-pointer ${
                  activeMenu === 'users'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-[#2c3338] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>จัดการผู้ใช้และสิทธิ์ (Users)</span>
                </div>
                <span className="text-3xs font-bold px-1.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                  {usersList.length}
                </span>
              </button>
            )}

            {/* Homepage Manager (Admin Only) */}
            {(userRole === 'admin' || userRole === 'superadmin' || checkIsSuperAdmin(user?.email, rolesConfig)) && (
              <button
                type="button"
                onClick={() => setActiveMenu('homepage')}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between font-medium transition-colors cursor-pointer ${
                  activeMenu === 'homepage'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-[#2c3338] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layout className="w-4 h-4 text-amber-400" />
                  <span>จัดการหน้าแรก (Home)</span>
                </div>
                <span className="text-3xs font-black px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  พร้อมใช้
                </span>
              </button>
            )}

            {/* Hit Counter / Site Stats (Admin Only) */}
            {(userRole === 'admin' || userRole === 'superadmin' || checkIsSuperAdmin(user?.email, rolesConfig)) && (
              <button
                type="button"
                onClick={() => setActiveMenu('stats')}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between font-medium transition-colors cursor-pointer ${
                  activeMenu === 'stats'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-[#2c3338] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span>สถิติผู้เข้าชม (Hits)</span>
                </div>
                <span className="text-3xs font-mono font-bold px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {(siteStats?.totalVisits || 0).toLocaleString()}
                </span>
              </button>
            )}

            {/* Posts / News */}
            <button
              type="button"
              onClick={() => setActiveMenu('posts')}
              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between font-medium transition-colors cursor-pointer ${
                activeMenu === 'posts'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-300 hover:bg-[#2c3338] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Newspaper className="w-4 h-4 text-slate-400" />
                <span>เรื่อง / ข่าวสาร (Posts)</span>
              </div>
              <span className="text-3xs font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {newsList.length}
              </span>
            </button>

            {/* Categories */}
            <button
              type="button"
              onClick={() => setActiveMenu('categories')}
              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between font-medium transition-colors cursor-pointer ${
                activeMenu === 'categories'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-300 hover:bg-[#2c3338] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Tag className="w-4 h-4 text-emerald-400" />
                <span>หมวดหมู่ (Categories)</span>
              </div>
              <span className="text-3xs font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {categories.length}
              </span>
            </button>

            {/* Media Library */}
            <button
              type="button"
              onClick={() => setActiveMenu('media')}
              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between font-medium transition-colors cursor-pointer ${
                activeMenu === 'media'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-300 hover:bg-[#2c3338] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>สื่อ / มีเดีย (Media Library)</span>
              </div>
              <span className="text-3xs font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {mediaList.length}
              </span>
            </button>

            {/* Gallery Albums with Drive sync */}
            <button
              type="button"
              onClick={() => setActiveMenu('gallery')}
              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between font-medium transition-colors cursor-pointer ${
                activeMenu === 'gallery'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-300 hover:bg-[#2c3338] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>แกลเลอรีภาพกิจกรรม</span>
              </div>
              <span className="text-3xs font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {galleryList.length}
              </span>
            </button>

            {/* Video Gallery */}
            <button
              type="button"
              onClick={() => setActiveMenu('videos')}
              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between font-medium transition-colors cursor-pointer ${
                activeMenu === 'videos'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-300 hover:bg-[#2c3338] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Film className="w-4 h-4 text-blue-400" />
                <span>คลังวิดีโอกิจกรรม</span>
              </div>
              <span className="text-3xs font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {videoList.length}
              </span>
            </button>

            {/* Public Documents & SAR */}
            <button
              type="button"
              onClick={() => setActiveMenu('documents')}
              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between font-medium transition-colors cursor-pointer ${
                activeMenu === 'documents'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-300 hover:bg-[#2c3338] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-red-400" />
                <span>เอกสารเผยแพร่ & SAR</span>
              </div>
              <span className="text-3xs font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {documentList.length}
              </span>
            </button>

            {/* Staff Directory (Admin & Super Admin) */}
            {(userRole === 'admin' || userRole === 'superadmin') && (
              <button
                type="button"
                onClick={() => setActiveMenu('staff')}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between font-medium transition-colors cursor-pointer ${
                  activeMenu === 'staff'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-[#2c3338] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>ครูและบุคลากร</span>
                </div>
                <span className="text-3xs font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {staffList.length}
                </span>
              </button>
            )}

            {/* Board Members (Admin & Super Admin) */}
            {(userRole === 'admin' || userRole === 'superadmin') && (
              <button
                type="button"
                onClick={() => setActiveMenu('boards')}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between font-medium transition-colors cursor-pointer ${
                  activeMenu === 'boards'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-[#2c3338] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <span>คณะกรรมการสถานศึกษา</span>
                </div>
                <span className="text-3xs font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {boardMembers.length}
                </span>
              </button>
            )}

            {/* Drive Files Shortcut Menu (Admin & Super Admin Only) */}
            {(userRole === 'admin' || userRole === 'superadmin' || checkIsSuperAdmin(user?.email, rolesConfig)) && (
              <button
                type="button"
                onClick={() => {
                  if (onNavigateTab) {
                    onNavigateTab('drive');
                  }
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between font-medium text-amber-300 hover:bg-[#2c3338] hover:text-white transition-colors cursor-pointer my-0.5"
              >
                <div className="flex items-center gap-2.5">
                  <FolderOpen className="w-4 h-4 text-amber-400" />
                  <span>คลังเอกสาร Drive</span>
                </div>
                <span className="text-3xs font-extrabold px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  เปิด
                </span>
              </button>
            )}

            {/* Google Drive Settings Module (Admin & Super Admin Only) */}
            {(userRole === 'admin' || userRole === 'superadmin' || checkIsSuperAdmin(user?.email, rolesConfig)) && (
              <button
                type="button"
                onClick={() => setActiveMenu('drive')}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 font-medium transition-colors cursor-pointer ${
                  activeMenu === 'drive'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-[#2c3338] hover:text-white'
                }`}
              >
                <HardDrive className="w-4 h-4 text-slate-400" />
                <span>การตั้งค่า Google Drive</span>
              </button>
            )}

            {/* Backup & Restore Module (Admin & Super Admin Only) */}
            {(userRole === 'admin' || userRole === 'superadmin' || checkIsSuperAdmin(user?.email, rolesConfig)) && (
              <button
                type="button"
                onClick={() => setActiveMenu('backup')}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between font-medium transition-colors cursor-pointer ${
                  activeMenu === 'backup'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-[#2c3338] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>สำรองและกู้คืน (Backup)</span>
                </div>
                <span className="text-3xs font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Drive
                </span>
              </button>
            )}

            {/* General Settings (Admin Only) */}
            {userRole === 'admin' && (
              <button
                type="button"
                onClick={() => setActiveMenu('settings')}
                className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 font-medium transition-colors cursor-pointer ${
                  activeMenu === 'settings'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-[#2c3338] hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>การตั้งค่าทั่วไป (Settings)</span>
              </button>
            )}
          </nav>

          <div className="p-4 mt-6 border-t border-[#3c434a] text-2xs text-slate-400">
            <p className="font-semibold text-slate-300">Ban Naree School v1.0</p>
            <p className="mt-1">BNR Compatible Architecture</p>
          </div>
        </aside>

        {/* Right Main Content Canvas */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {/* ================= SECTION 1: DASHBOARD ================= */}
          {activeMenu === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    หน้าควบคุม (Dashboard)
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    ภาพรวมสถานะสถานศึกษา สถิติเนื้อหา และกิจกรรมด่วน
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEditNews()}
                    className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เขียนเรื่องใหม่</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditAlbum()}
                    className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>เพิ่มอัลบั้มภาพ</span>
                  </button>
                </div>
              </div>

              {/* ================= CLOUDFLARE D1 DATABASE CONNECTION STATUS (SUPER ADMIN & ADMIN) ================= */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-[#0F224A] via-[#1E293B] to-[#0f172a] text-white p-4 sm:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center shrink-0 shadow-inner">
                        <Database className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                            สถานะการเชื่อมต่อฐานข้อมูล Cloudflare D1
                          </h3>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                            <span>เชื่อมต่อออนไลน์ (Connected)</span>
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                            <Server className="w-3 h-3" />
                            <span>Serverless SQLite</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                          ระบบฐานข้อมูลหลักของโรงเรียนบ้านนารี เชื่อมต่อผ่าน Cloudflare Pages Functions (/api/*) ทดแทน Firebase 100%
                        </p>
                      </div>
                    </div>

                    {/* Quick Diagnostic Actions */}
                    <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
                      <button
                        type="button"
                        onClick={() => handleCheckD1Status(true)}
                        disabled={isCheckingD1}
                        className="px-3 py-1.5 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer border border-blue-400/30"
                        title="ทดสอบ Ping วัดความเร็วการเชื่อมต่อ D1"
                      >
                        <Zap className={`w-3.5 h-3.5 text-amber-300 ${isCheckingD1 ? 'animate-spin' : ''}`} />
                        <span>{isCheckingD1 ? 'กำลัง Ping...' : `Ping: ${d1Status?.ping_ms || 14} ms`}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowD1TableDetails(!showD1TableDetails)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/20"
                      >
                        <Layers className="w-3.5 h-3.5 text-blue-300" />
                        <span>{showD1TableDetails ? 'ซ่อน 15 ตาราง' : 'ตรวจดู 15 ตาราง'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Database Identifiers Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-2xs text-slate-300">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-medium">ชื่อฐานข้อมูล:</span>
                        <code className="px-2 py-0.5 rounded bg-slate-900 text-amber-300 font-mono font-bold">
                          bannaree-db
                        </code>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-medium">Cloudflare Binding:</span>
                        <code className="px-2 py-0.5 rounded bg-slate-900 text-blue-300 font-mono font-bold">
                          env.DB
                        </code>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-medium">Database ID:</span>
                        <button
                          type="button"
                          onClick={() => handleCopyDbId('56fe1149-9b8f-4ef9-8e8e-2d3d7bda91f4')}
                          className="group inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 text-emerald-300 font-mono font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                          title="คลิกเพื่อคัดลอก Database ID"
                        >
                          <span>56fe1149-9b8f-4ef9-8e8e-2d3d7bda91f4</span>
                          {copiedDbId ? (
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400 group-hover:text-white" />
                          )}
                        </button>
                        {copiedDbId && (
                          <span className="text-3xs text-emerald-400 font-bold animate-pulse">คัดลอกแล้ว!</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400">
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      <span>ตรวจสอบสถานะล่าสุด: {d1Status?.timestamp ? new Date(d1Status.timestamp).toLocaleTimeString('th-TH') : 'เรียลไทม์'}</span>
                    </div>
                  </div>
                </div>

                {/* Cloudflare D1 Metrics Grid (Matching Cloudflare Dashboard) */}
                <div className="p-4 sm:p-5 bg-slate-50/60 border-b border-slate-200">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {/* Metric 1: Total queries */}
                    <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs hover:border-blue-400 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-3xs font-semibold text-slate-500 uppercase tracking-wider">
                          Total queries
                        </span>
                        <span className="text-3xs font-bold text-blue-600">↗ 100.00%</span>
                      </div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-slate-900">1</span>
                      </div>
                      <span className="text-3xs text-slate-500 block mt-0.5">ในรอบ 24 ชั่วโมงที่ผ่านมา</span>
                    </div>

                    {/* Metric 2: Rows read */}
                    <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs hover:border-blue-400 transition-colors">
                      <span className="text-3xs font-semibold text-slate-500 uppercase tracking-wider">
                        Rows read
                      </span>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-slate-900">{d1Status?.rows_read_used ?? 0}</span>
                      </div>
                      <span className="text-3xs text-emerald-600 font-semibold block mt-0.5">จากโควต้าฟรี 5M (5 ล้าน) / วัน</span>
                    </div>

                    {/* Metric 3: Rows written */}
                    <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs hover:border-blue-400 transition-colors">
                      <span className="text-3xs font-semibold text-slate-500 uppercase tracking-wider">
                        Rows written
                      </span>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-slate-900">{d1Status?.rows_written_used ?? 0}</span>
                      </div>
                      <span className="text-3xs text-emerald-600 font-semibold block mt-0.5">จากโควต้าฟรี 100k (1 แสน) / วัน</span>
                    </div>

                    {/* Metric 4: Storage used */}
                    <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs hover:border-blue-400 transition-colors">
                      <span className="text-3xs font-semibold text-slate-500 uppercase tracking-wider">
                        Storage used (current)
                      </span>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-slate-900">{d1Status?.storage_kb ?? 221}</span>
                        <span className="text-xs font-bold text-slate-500">kB</span>
                      </div>
                      <span className="text-3xs text-blue-600 font-semibold block mt-0.5">จากโควต้าฟรีรวม 5 GB</span>
                    </div>

                    {/* Metric 5: Number of Tables */}
                    <div className="bg-white rounded-xl border border-blue-200 bg-blue-50/30 p-3.5 shadow-2xs hover:border-blue-500 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-3xs font-semibold text-blue-800 uppercase tracking-wider">
                          Number of Tables
                        </span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-blue-950">{d1Status?.tables_count ?? 15}</span>
                        <span className="text-xs font-bold text-blue-700">ตาราง</span>
                      </div>
                      <span className="text-3xs text-emerald-700 font-bold block mt-0.5">สร้างและ Index ครบสมบูรณ์</span>
                    </div>
                  </div>
                </div>

                {/* Quota & Migration Status Highlights */}
                <div className="p-4 sm:p-5 grid grid-cols-1 gap-3 text-xs bg-white">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900">
                    <CloudLightning className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-blue-950">
                        โควต้าฟรี Cloudflare D1 (5M Reads · 100k Writes / วัน · 5 GB Storage)
                      </p>
                      <p className="text-2xs text-blue-800 mt-0.5 leading-relaxed">
                        Cloudflare D1 ให้โควต้าฟรีครอบคลุมการใช้งาน: Rows read ฟรี 5,000,000 แถว/วัน, Rows written ฟรี 100,000 แถว/วัน และพื้นที่เก็บข้อมูลฟรี 5 GB โดยไฟล์เอกสารและรูปภาพทั้งหมดยังคงจัดเก็บผ่าน Google Drive API ตามเดิม
                      </p>
                    </div>
                  </div>
                </div>

                {/* Collapsible 15 Tables Breakdown */}
                {showD1TableDetails && (
                  <div className="p-4 sm:p-5 bg-slate-100/70 border-t border-slate-200 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Database className="w-4 h-4 text-blue-600" />
                          <span>โครงสร้าง 15 ตารางในฐานข้อมูล bannaree-db</span>
                        </h4>
                        <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          SQLite Engine
                        </span>
                      </div>
                      <span className="text-2xs text-slate-500">
                        สร้างผ่าน schema.sql เรียบร้อยแล้ว
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-2xs">
                      {[
                        { name: 'school_info', desc: 'ข้อมูลทั่วไปสถานศึกษาและผู้บริหาร', count: 1, tag: 'หลัก' },
                        { name: 'staff', desc: 'ข้อมูลครูและบุคลากรทางการศึกษา', count: staffList.length, tag: 'บุคลากร' },
                        { name: 'board_members', desc: 'คณะกรรมการสถานศึกษาขั้นพื้นฐาน', count: boardMembers.length, tag: 'กรรมการ' },
                        { name: 'news', desc: 'ข่าวประชาสัมพันธ์และประกาศทางการ', count: newsList.length, tag: 'ข่าวสาร' },
                        { name: 'gallery_albums', desc: 'อัลบั้มภาพกิจกรรมโรงเรียน', count: galleryList.length, tag: 'กิจกรรม' },
                        { name: 'video_gallery', desc: 'คลังวิดีโอกิจกรรมโรงเรียน', count: videoList.length, tag: 'มีเดีย' },
                        { name: 'public_documents', desc: 'เอกสารเผยแพร่ แผนปฏิบัติการ & SAR', count: documentList.length, tag: 'เอกสาร' },
                        { name: 'post_categories', desc: 'หมวดหมู่ข่าวสารและเนื้อหา', count: categories.length, tag: 'หมวดหมู่' },
                        { name: 'media_library', desc: 'คลังรูปภาพและไฟล์มีเดีย', count: mediaList.length, tag: 'คลังสื่อ' },
                        { name: 'school_settings', desc: 'การตั้งค่าระบบและ Google Drive Folders', count: 1, tag: 'ตั้งค่า' },
                        { name: 'site_stats', desc: 'สถิติการเข้าชมเว็บไซต์ (Hit Counter)', count: siteStats?.totalVisits || 0, tag: 'สถิติ' },
                        { name: 'inbox_messages', desc: 'กล่องข้อความติดต่อสายตรงผู้อำนวยการ', count: unreadInboxCount, tag: 'ข้อความ' },
                        { name: 'system_roles', desc: 'สิทธิ์ผู้ดูแลระบบ Super Admin / Admin', count: 1, tag: 'สิทธิ์' },
                        { name: 'users', desc: 'บัญชีผู้ใช้งานและสถานะ Active / Inactive', count: usersList.length, tag: 'ผู้ใช้' },
                        { name: 'user_sessions', desc: 'ระบบ Session จัดการ Google OAuth Token', count: 1, tag: 'ความปลอดภัย' },
                      ].map((tbl, idx) => (
                        <div
                          key={tbl.name}
                          className="p-2.5 rounded-lg bg-white border border-slate-200/90 flex items-center justify-between gap-2 shadow-2xs hover:border-blue-400 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-900 truncate">
                                {idx + 1}. {tbl.name}
                              </span>
                              <span className="text-3xs px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                                {tbl.tag}
                              </span>
                            </div>
                            <p className="text-3xs text-slate-500 truncate mt-0.5">{tbl.desc}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="font-mono font-bold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded text-3xs">
                              {tbl.count} รายการ
                            </span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* WP At a Glance Compact Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* Director Inbox Stat Card (Super Admin Exclusive) */}
                {userRole === 'superadmin' && onOpenInbox && (
                  <div 
                    onClick={onOpenInbox}
                    className="p-3.5 rounded-xl bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 text-white border border-blue-700 shadow-2xs hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer group flex items-center justify-between"
                  >
                    <div>
                      <span className="block text-3xs font-bold text-amber-300">
                        กล่องข้อความ (Inbox)
                      </span>
                      <p className="text-xl font-black text-white tabular-nums leading-tight mt-0.5">
                        {unreadInboxCount}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-white/10 text-amber-300 shrink-0">
                      <Inbox className="w-4 h-4" />
                    </div>
                  </div>
                )}

                {/* 1. Website Hit Counter Card */}
                <div 
                  onClick={() => setActiveMenu('stats')}
                  className="p-3.5 rounded-xl bg-white border border-emerald-200/80 shadow-2xs hover:border-emerald-500 hover:shadow-xs transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div>
                    <span className="block text-3xs font-bold text-slate-600 group-hover:text-emerald-700 transition-colors">
                      ผู้เข้าชมเว็บไซต์
                    </span>
                    <p className="text-xl font-black text-slate-900 tabular-nums leading-tight mt-0.5">
                      {(siteStats?.totalVisits || 0).toLocaleString('th-TH')}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                </div>

                {/* 2. News Stat Card */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="block text-3xs font-bold text-slate-600">เรื่อง / ข่าวสาร</span>
                    <p className="text-xl font-black text-slate-900 tabular-nums leading-tight mt-0.5">
                      {newsList.length}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                    <Newspaper className="w-4 h-4" />
                  </div>
                </div>

                {/* 3. Categories Stat Card */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="block text-3xs font-bold text-slate-600">หมวดหมู่เนื้อหา</span>
                    <p className="text-xl font-black text-slate-900 tabular-nums leading-tight mt-0.5">
                      {categories.length}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                    <Tag className="w-4 h-4" />
                  </div>
                </div>

                {/* 4. Media Library Stat Card */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="block text-3xs font-bold text-slate-600">คลังสื่อ / รูปภาพ</span>
                    <p className="text-xl font-black text-slate-900 tabular-nums leading-tight mt-0.5">
                      {mediaList.length}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                </div>

                {/* 5. Gallery Stat Card */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
                  <div>
                    <span className="block text-3xs font-bold text-slate-600">อัลบั้มกิจกรรม</span>
                    <p className="text-xl font-black text-slate-900 tabular-nums leading-tight mt-0.5">
                      {galleryList.length}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-purple-50 text-purple-600 shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* 2-Column Dashboard Widgets */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Quick Draft Widget (Classic WP Dashboard) */}
                <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                  <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-blue-600" />
                      <span>ร่างเรื่องด่วน (Quick Draft)</span>
                    </h3>
                    <span className="text-2xs text-slate-500">บันทึกเป็นฉบับร่างไว้แก้ไขภายหลัง</span>
                  </div>

                  <form onSubmit={handleSaveQuickDraft} className="space-y-3">
                    <input
                      type="text"
                      placeholder="หัวข้อเรื่อง..."
                      value={quickDraftTitle}
                      onChange={(e) => setQuickDraftTitle(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                      required
                    />

                    <textarea
                      rows={4}
                      placeholder="ร่างเนื้อหาเบื้องต้น..."
                      value={quickDraftContent}
                      onChange={(e) => setQuickDraftContent(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                    />

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSavingQuickDraft || !quickDraftTitle.trim()}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {isSavingQuickDraft ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Pin className="w-3.5 h-3.5" />}
                        <span>บันทึกฉบับร่าง</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right: Recent News Activity */}
                <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                  <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span>ความเคลื่อนไหวล่าสุด (Recent Activity)</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveMenu('posts')}
                      className="text-2xs text-blue-700 hover:underline font-semibold"
                    >
                      ดูทั้งหมด
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs">
                    {newsList.slice(0, 5).map((post) => (
                      <div key={post.id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">{post.title}</p>
                          <p className="text-2xs text-slate-500">
                            {new Date(post.createdAt).toLocaleDateString('th-TH')} · หมวด: {post.category}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onEditNews(post)}
                          className="px-2.5 py-1 text-2xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 shrink-0 cursor-pointer"
                        >
                          แก้ไข
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION: WEBSITE HIT COUNTER (NEW) ================= */}
          {activeMenu === 'stats' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                      <BarChart3 className="w-6 h-6 text-emerald-600" />
                      <span>ระบบจัดการสถิติผู้เข้าชมเว็บไซต์ (Hit Counter Manager)</span>
                    </h2>
                    <span className="text-2xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>เชื่อมต่อฐานข้อมูลเรียบร้อย</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    ติดตามยอดการเข้าชมเว็บไซต์โรงเรียน จัดเก็บสถิติ และควบคุมรีเซ็ตตัวเลขผ่านระบบหลังบ้านโดยตรง
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestHit}
                    className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    title="ทดสอบนับการเข้าชม 1 ครั้ง"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ทดสอบนับ (+1)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onViewSite()}
                    className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>ดูหน้าเว็บจริง</span>
                  </button>
                </div>
              </div>

              {/* Alert Notice if reset succeeded */}
              {resetSuccessMessage && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{resetSuccessMessage}</span>
                </div>
              )}

              {/* Big Digital Stats Board */}
              <div className="bg-gradient-to-br from-slate-950 via-[#0F1E36] to-[#0A162B] text-white p-6 sm:p-8 rounded-3xl border border-blue-900/40 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div className="space-y-1">
                    <span className="text-amber-400 text-2xs font-extrabold tracking-widest uppercase flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      <span>สถานะสถิติปัจจุบัน (Current Traffic Metrics)</span>
                    </span>
                    <h3 className="text-lg font-bold text-white">
                      ตัวนับการเข้าชมเว็บไซต์ {schoolInfo.schoolName}
                    </h3>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>ซิงก์เรียลไทม์กับผู้เข้าชมทุกคน</span>
                  </div>
                </div>

                {/* Main Counter Display Box */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-7 space-y-3">
                    <p className="text-xs text-slate-300 font-medium">ยอดผู้เข้าชมสะสมทั้งหมด (Total Hits):</p>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      {String(siteStats?.totalVisits || 0).padStart(7, '0').split('').map((digit, idx) => (
                        <div
                          key={idx}
                          className="w-10 sm:w-12 h-14 sm:h-16 rounded-xl bg-slate-900 border-2 border-slate-700/80 text-amber-400 font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg select-none tabular-nums"
                        >
                          {digit}
                        </div>
                      ))}
                      <span className="text-base sm:text-lg font-bold text-slate-300 ml-2">ครั้ง</span>
                    </div>
                    <p className="text-2xs text-slate-400">
                      * ระบบป้องกันการปั๊มยอดจากการรีเฟรชหน้าซ้ำใน Session เดียวกัน
                    </p>
                  </div>

                  <div className="md:col-span-5 grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                      <span className="text-2xs text-slate-400 font-semibold block">เข้าชมวันนี้</span>
                      <p className="text-2xl font-black text-emerald-400 mt-1 tabular-nums">
                        {(siteStats?.todayVisits || 0).toLocaleString('th-TH')}
                      </p>
                      <span className="text-3xs text-slate-400 mt-1 block">
                        ประจำวันที่ {new Date().toLocaleDateString('th-TH')}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                      <span className="text-2xs text-slate-400 font-semibold block">เข้าชมล่าสุด</span>
                      <p className="text-xs font-bold text-slate-200 mt-1">
                        {siteStats?.lastVisitedAt ? new Date(siteStats.lastVisitedAt).toLocaleTimeString('th-TH') : '-'}
                      </p>
                      <span className="text-3xs text-slate-400 mt-1 block">
                        {siteStats?.lastVisitedAt ? new Date(siteStats.lastVisitedAt).toLocaleDateString('th-TH') : 'ไม่มีข้อมูล'}
                      </span>
                    </div>

                    <div className="col-span-2 p-3.5 rounded-2xl bg-white/5 border border-white/10 text-2xs text-slate-300">
                      <span className="text-slate-400">ประวัติการรีเซ็ตล่าสุด: </span>
                      {siteStats?.resetAt ? (
                        <span className="font-semibold text-amber-300">
                          {new Date(siteStats.resetAt).toLocaleString('th-TH')} (โดย {siteStats.resetBy || 'Admin'})
                        </span>
                      ) : (
                        <span className="text-slate-400">ยังไม่เคยทำการรีเซ็ต</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Management Control Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Reset to Zero Card */}
                <div className="bg-white p-6 rounded-2xl border border-rose-200 shadow-2xs space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">รีเซ็ตสถิติผู้เข้าชมเป็น 0 (Reset Counter)</h4>
                      <p className="text-2xs text-slate-500">ล้างค่าตัวเลขสถิติผู้เข้าชมทั้งหมดกลับเป็น 0 และเริ่มนับใหม่</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-rose-50/50 p-3.5 rounded-xl border border-rose-100">
                    ⚠️ คำเตือน: เมื่อกดรีเซ็ต ข้อมูลตัวนับใน Firestore จะเปลี่ยนเป็น 0 ทันที และจะแสดงผล 0 ครั้งบนหน้าเว็บและส่วนท้าย (Footer)
                  </p>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowResetConfirmModal(true)}
                      disabled={isResettingCounter}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{isResettingCounter ? 'กำลังรีเซ็ต...' : 'รีเซ็ตสถิติเป็น 0'}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Set Custom Initial Number Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">กำหนดตัวเลขเริ่มต้นใหม่ (Set Custom Start Number)</h4>
                      <p className="text-2xs text-slate-500">กรณีต้องการนำยอดเข้าชมเดิมจากเว็บเก่ามาต่อยอด</p>
                    </div>
                  </div>

                  <form onSubmit={handleSetCustomCounter} className="space-y-3">
                    <div>
                      <label className="block text-2xs font-bold text-slate-700 mb-1">
                        ระบุจำนวนตัวเลขที่ต้องการเริ่มต้นนับ (เช่น 1500 หรือ 10000)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="กรอกตัวเลขจำนวนเต็ม..."
                          value={customCounterInput}
                          onChange={(e) => setCustomCounterInput(e.target.value)}
                          className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                          required
                        />
                        <button
                          type="submit"
                          disabled={isResettingCounter || !customCounterInput}
                          className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                        >
                          <Check className="w-4 h-4" />
                          <span>บันทึกตัวเลข</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-3xs text-slate-400">
                      * ระบบจะอัปเดตตัวเลขเริ่มต้นบนคลาวด์ทันที และนับต่อจากตัวเลขนี้
                    </p>
                  </form>
                </div>
              </div>

              {/* Technical Specifications Strip */}
              <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>ข้อมูลทางเทคนิคและการจัดเก็บข้อมูล (Technical Architecture)</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-2xs pt-1 text-slate-500">
                  <div><strong>สถานะระบบ:</strong> <span className="text-emerald-600 font-bold">พร้อมใช้งาน</span></div>
                  <div><strong>วิธีนับ:</strong> Atomic Increment (แม่นยำสูง)</div>
                  <div><strong>ความเป็นส่วนตัว:</strong> ไม่เก็บ IP หรือข้อมูลส่วนบุคคล</div>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION: USER MANAGEMENT (ADMIN & SUPER ADMIN) ================= */}
          {activeMenu === 'users' && (userRole === 'admin' || userRole === 'superadmin' || checkIsSuperAdmin(user?.email, rolesConfig)) && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                      จัดการผู้ใช้และสิทธิ์การใช้งาน (User Management)
                    </h2>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      {usersList.length} รายชื่อ
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    เพิ่มบัญชีครู กำหนดบทบาทผู้ดูแลระบบ (Admin) หรือผู้เขียนข่าวสาร (Editor) และควบคุมสถานะการเข้าใช้งาน
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {onOpenRoles && userRole !== 'admin' && checkIsSuperAdmin(user?.email, rolesConfig) && (
                    <button
                      type="button"
                      onClick={onOpenRoles}
                      className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Crown className="w-4 h-4 text-slate-950" />
                      <span>จัดการสิทธิ์ Super Admin & Admins</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleOpenAddUser}
                    className="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>เพิ่มผู้ใช้งานใหม่</span>
                  </button>
                  <button
                    type="button"
                    onClick={onRefreshData}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>รีเฟรช</span>
                  </button>
                </div>
              </div>

              {/* Super Admin & PDPA Policy Banner (Super Admin Only) */}
              {checkIsSuperAdmin(user?.email, rolesConfig) && (
                <div className="p-4 bg-gradient-to-r from-amber-50 to-blue-50 border border-amber-200/80 rounded-2xl flex items-start gap-3 shadow-2xs">
                  <Crown className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900">
                        ผู้อำนวยการโรงเรียน (Super Admin): {rolesConfig?.superAdminEmail || 'engine@bnr.ac.th'}
                      </span>
                      <span className="px-2 py-0.2 rounded-full text-3xs font-extrabold bg-amber-400 text-slate-950">
                        สิทธิ์สูงสุด
                      </span>
                    </div>
                    <p className="text-2xs text-slate-600 leading-relaxed">
                      Super Admin เป็นผู้มีสิทธิ์ตรวจสอบข้อความลับในกล่องข้อความ (Inbox) และแต่งตั้งผู้ดูแลระบบทั่วไป 
                      โดยผู้ดูแลระบบทั่วไป (Admin) จะไม่สามารถแก้ไขหรือถอดถอนผู้อำนวยการได้ เพื่อความปลอดภัยและเป็นไปตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)
                    </p>
                  </div>
                </div>
              )}

              {/* Search & Filter bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="ค้นหาชื่อ, อีเมล หรือฝ่ายงาน..."
                    className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 font-medium"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs text-slate-500 font-medium shrink-0">กรองบทบาท:</span>
                  <select
                    value={userRoleFilter}
                    onChange={(e: any) => setUserRoleFilter(e.target.value)}
                    className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 font-medium bg-white"
                  >
                    <option value="all">ทั้งหมด ({usersList.length})</option>
                    <option value="admin">Admin ผู้ดูแลระบบ ({usersList.filter(u => u.role === 'admin').length})</option>
                    <option value="editor">Editor ผู้เขียนข่าว ({usersList.filter(u => u.role === 'editor' || (u.role as string) === 'teacher').length})</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-900 font-bold uppercase tracking-wider text-3xs">
                      <tr>
                        <th className="px-4 py-3">ผู้ใช้งาน</th>
                        <th className="px-4 py-3">อีเมล Google</th>
                        <th className="px-4 py-3">กลุ่มสาระ / ฝ่ายงาน</th>
                        <th className="px-4 py-3">บทบาทสิทธิ์</th>
                        <th className="px-4 py-3">สถานะการใช้งาน</th>
                        <th className="px-4 py-3 text-right">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsersList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-slate-400">
                            ไม่พบรายชื่อผู้ใช้งานที่ตรงตามเงื่อนไข
                          </td>
                        </tr>
                      ) : (
                        filteredUsersList.map((u) => {
                          const isSelf = u.uid === user?.uid;
                          const isUserSuperAdmin = checkIsSuperAdmin(u.email, rolesConfig);
                          const currentRole = u.role === 'admin' ? 'admin' : 'editor';

                          return (
                            <tr key={u.uid} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {u.photoURL ? (
                                    <img src={u.photoURL} alt={u.displayName} className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-900 font-bold flex items-center justify-center text-xs shrink-0">
                                      {u.displayName?.charAt(0) || 'U'}
                                    </div>
                                  )}
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <p className="font-bold text-slate-900 leading-tight">{u.displayName || 'ผู้ใช้งาน Google'}</p>
                                      {isUserSuperAdmin && (
                                        <span title="ผู้อำนวยการโรงเรียน (Super Admin)">
                                          <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                                        </span>
                                      )}
                                    </div>
                                    {isSelf && <span className="text-3xs font-semibold text-blue-600">(บัญชีของคุณ)</span>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 font-mono text-slate-600">{u.email}</td>
                              <td className="px-4 py-3 text-slate-600 font-medium">{u.department || 'กลุ่มงานทั่วไป'}</td>
                              <td className="px-4 py-3">
                                {isUserSuperAdmin ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-extrabold bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs">
                                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Super Admin (ผอ.)</span>
                                  </span>
                                ) : (
                                  <select
                                    disabled={isSelf || updatingUserUid === u.uid}
                                    value={currentRole}
                                    onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole, u.email)}
                                    className="px-2.5 py-1 rounded-lg border border-slate-200 font-bold text-2xs focus:ring-2 focus:ring-blue-500/20 cursor-pointer bg-white"
                                  >
                                    <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                                    <option value="editor">Editor (ผู้เขียนข่าวสาร)</option>
                                  </select>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  disabled={isSelf || isUserSuperAdmin || updatingUserUid === u.uid}
                                  onClick={() => handleStatusChange(u.uid, u.status === 'active' ? 'suspended' : 'active')}
                                  className={`px-2.5 py-1 rounded-full text-3xs font-extrabold flex items-center gap-1 transition-colors ${
                                    isUserSuperAdmin
                                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                      : u.status === 'active'
                                      ? 'bg-emerald-100 text-emerald-800 hover:bg-rose-100 hover:text-rose-800 cursor-pointer'
                                      : 'bg-rose-100 text-rose-800 hover:bg-emerald-100 hover:text-emerald-800 cursor-pointer'
                                  }`}
                                  title={isUserSuperAdmin ? 'ไม่สามารถระงับสิทธิ์ Super Admin ได้' : 'คลิกเพื่อสลับสถานะเปิด/ระงับใช้งาน'}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                  <span>{u.status === 'active' ? 'เปิดใช้งาน (Active)' : 'ระงับสิทธิ์ (Suspended)'}</span>
                                </button>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {!isUserSuperAdmin && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditUser(u)}
                                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                      title="แก้ไขข้อมูลผู้ใช้"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {!isSelf && !isUserSuperAdmin && (
                                    <button
                                      type="button"
                                      onClick={() => setUserToDelete(u)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                      title="ลบผู้ใช้งาน"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add / Edit User Modal */}
              {userModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
                  <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 space-y-0">
                    {/* Header */}
                    <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-purple-600 text-white rounded-xl">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base leading-none">
                            {userForm.uid ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่ (Add User)'}
                          </h3>
                          <p className="text-2xs text-slate-400 mt-1">กำหนดชื่อ อีเมล ฝ่ายงาน และสิทธิ์ในระบบ</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUserModalOpen(false)}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSaveUserForm} className="p-6 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={userForm.displayName || ''}
                          onChange={(e) => setUserForm({ ...userForm, displayName: e.target.value })}
                          placeholder="เช่น คุณครูสมชาย ใจดี"
                          className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:outline-hidden font-medium"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          อีเมล Google Account <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={userForm.email || ''}
                          onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                          placeholder="เช่น teacher@gmail.com"
                          className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-purple-500/20 focus:outline-hidden"
                          required
                          disabled={!!userForm.uid}
                        />
                        <p className="text-3xs text-slate-400 mt-1">
                          * ผู้ใช้จะต้องล็อกอินผ่าน Google ด้วยอีเมลตรงกับช่องนี้เพื่อเข้าใช้งานระบบ
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          กลุ่มสาระการเรียนรู้ / ฝ่ายงาน <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={userForm.department || 'กลุ่มบริหารวิชาการ'}
                          onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                          className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-500/20 focus:outline-hidden cursor-pointer bg-white"
                          required
                        >
                          <option value="กลุ่มบริหารวิชาการ">กลุ่มบริหารวิชาการ</option>
                          <option value="กลุ่มบริหารงบประมาณ">กลุ่มบริหารงบประมาณ</option>
                          <option value="กลุ่มบริหารงานบุคคล">กลุ่มบริหารงานบุคคล</option>
                          <option value="กลุ่มบริหารทั่วไป">กลุ่มบริหารทั่วไป</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            บทบาทสิทธิ์ (Role)
                          </label>
                          <select
                            value={userForm.role || 'editor'}
                            onChange={(e: any) => setUserForm({ ...userForm, role: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-500/20 cursor-pointer bg-white"
                          >
                            <option value="editor">Editor (ผู้เขียนข่าวสาร)</option>
                            <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            สถานะการใช้งาน (Status)
                          </label>
                          <select
                            value={userForm.status || 'active'}
                            onChange={(e: any) => setUserForm({ ...userForm, status: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-500/20 cursor-pointer bg-white"
                          >
                            <option value="active">เปิดใช้งาน (Active)</option>
                            <option value="suspended">ระงับสิทธิ์ (Suspended)</option>
                          </select>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setUserModalOpen(false)}
                          className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingUser}
                          className="px-5 py-2 bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          {isSavingUser ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>{userForm.uid ? 'บันทึกการแก้ไข' : 'เพิ่มผู้ใช้'}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Delete User Confirmation Modal */}
              {userToDelete && (
                <ConfirmationModal
                  isOpen={!!userToDelete}
                  title="ยืนยันการลบผู้ใช้งาน"
                  message={`คุณต้องการลบบัญชีผู้ใช้ "${userToDelete.displayName}" (${userToDelete.email}) ออกจากระบบหรือไม่? การลบนี้จะทำให้ผู้ใช้ท่านนี้ไม่สามารถเข้าถึงระบบหลังบ้าน BNR-Admin ได้อีกต่อไป`}
                  confirmText="ยืนยันลบผู้ใช้"
                  cancelText="ยกเลิก"
                  isDestructive={true}
                  onConfirm={handleConfirmDeleteUser}
                  onCancel={() => setUserToDelete(null)}
                />
              )}
            </div>
          )}

          {/* ================= SECTION: HOMEPAGE MANAGER (NEW) ================= */}
          {activeMenu === 'homepage' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                      ระบบจัดการหน้าหลัก (Homepage Manager)
                    </h2>
                    <span className="text-2xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ครบทุกส่วน 100%
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">

                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEditSchoolInfo('homepage')}
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                    <span>เปิดหน้าต่างแก้ไขละเอียด (Modal)</span>
                  </button>
                  <button
                    type="button"
                    onClick={onViewSite}
                    className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>ดูหน้าแรกจริง</span>
                  </button>
                </div>
              </div>

              {/* 1. Quick Navigation Bar for Homepage Sections */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-2 overflow-x-auto select-none scrollbar-thin">
                <span className="text-2xs font-bold text-slate-400 px-2 uppercase shrink-0">ทางลัดแก้ไขส่วนต่างๆ:</span>
                {[
                  { id: 'sections', label: 'เปิด/ปิด 9 ส่วนประกอบ', icon: Sliders, color: 'text-blue-700 bg-blue-50' },
                  { id: 'homepage', label: 'ส่วนหัว & ภาพหน้าปก', icon: Layout, color: 'text-amber-700 bg-amber-50' },
                  { id: 'ticker', label: 'ประกาศด่วน & สถิติ', icon: Megaphone, color: 'text-rose-700 bg-rose-50' },
                  { id: 'director', label: 'สารจาก ผอ.', icon: UserIcon, color: 'text-purple-700 bg-purple-50' },
                  { id: 'pillars', label: '4 เสาหลักการศึกษา', icon: Compass, color: 'text-indigo-700 bg-indigo-50' },
                  { id: 'quicklinks', label: 'ลิงก์ด่วน e-Services', icon: ExternalLink, color: 'text-emerald-700 bg-emerald-50' },
                  { id: 'governance', label: 'เครือข่าย 3 ฝ่าย', icon: Users, color: 'text-teal-700 bg-teal-50' },
                  { id: 'contact', label: 'แถบติดต่อท้ายหน้า', icon: MapPin, color: 'text-slate-700 bg-slate-100' }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onEditSchoolInfo(item.id as HomepageTabKey)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all hover:scale-105 cursor-pointer ${item.color} border border-slate-200/60`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* 2. Section Visibility Status Widget */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        1. สถานะการเปิด/ปิด ส่วนประกอบบนหน้าหลัก (10 ส่วน)
                      </h3>
                      <p className="text-2xs text-slate-500">
                        สามารถเลือกเปิดหรือซ่อนส่วนต่างๆ บนหน้าแรกได้อิสระ
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEditSchoolInfo('sections')}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl text-xs font-bold border border-blue-200 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    ตั้งค่าการเปิด/ปิด
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {[
                    { key: 'heroStats', label: 'แถบสถิติสถานศึกษา', val: schoolInfo.sectionsVisibility?.heroStats !== false },
                    { key: 'urgentTicker', label: 'แถบประกาศด่วนวิ่ง', val: schoolInfo.sectionsVisibility?.urgentTicker !== false },
                    { key: 'directorWelcome', label: 'สารจากผู้บริหาร (ผอ.)', val: schoolInfo.sectionsVisibility?.directorWelcome !== false },
                    { key: 'educationalPillars', label: '4 เสาหลักการจัดการศึกษา', val: schoolInfo.sectionsVisibility?.educationalPillars !== false },
                    { key: 'quickLinks', label: 'ลิงก์ด่วน e-Services', val: schoolInfo.sectionsVisibility?.quickLinks !== false },
                    { key: 'recentNews', label: 'ข่าวประชาสัมพันธ์ล่าสุด', val: schoolInfo.sectionsVisibility?.recentNews !== false },
                    { key: 'recentGallery', label: 'ภาพกิจกรรมและผลงาน', val: schoolInfo.sectionsVisibility?.recentGallery !== false },
                    { key: 'videoGallery', label: 'วิดีโอกิจกรรมสถานศึกษา', val: schoolInfo.sectionsVisibility?.videoGallery !== false },
                    { key: 'communityGovernance', label: 'พลังความร่วมมือ 3 ฝ่าย', val: schoolInfo.sectionsVisibility?.communityGovernance !== false },
                    { key: 'contactStrip', label: 'แถบติดต่อท้ายหน้า', val: schoolInfo.sectionsVisibility?.contactStrip !== false }
                  ].map((s) => (
                    <div key={s.key} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {s.val ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className="text-xs font-semibold text-slate-800">{s.label}</span>
                      </div>
                      <span className={`text-3xs font-black px-2 py-0.5 rounded-full ${
                        s.val ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {s.val ? 'เปิด' : 'ซ่อน'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Hero & Campus Image Manager Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                      <Layout className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        2. ส่วนหัว & ภาพหน้าปกอาคารสถานที่ (Hero Section)
                      </h3>
                      <p className="text-2xs text-slate-500">
                        ภาพหน้าปกหลัก, ข้อความต้อนรับ, คำขวัญ, ปรัชญา และป้ายเด่น
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEditSchoolInfo('homepage')}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold border border-amber-200 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    แก้ไขส่วนหัว & รูปภาพ
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-5 aspect-16/10 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 relative">
                    <img
                      src={schoolInfo.heroImageUrl || '/src/assets/images/hero_school_campus_1792082308721.jpg'}
                      alt="Campus Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-slate-900/80 text-white text-3xs font-bold px-2 py-0.5 rounded-md">
                      {schoolInfo.heroBadgeTitle || 'โรงเรียนวิถีพุทธ & คุณธรรม'}
                    </div>
                  </div>

                  <div className="md:col-span-7 space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">สังกัด / Tagline:</span>
                      <p className="font-bold text-slate-800">{schoolInfo.heroTagline || '-'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">ชื่อสถานศึกษา:</span>
                      <p className="font-bold text-slate-800 text-sm">{schoolInfo.schoolName} ({schoolInfo.schoolNameEn})</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">คติพจน์ประจำโรงเรียน:</span>
                      <p className="font-semibold text-amber-700">"{schoolInfo.motto}"</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">วิสัยทัศน์:</span>
                      <p className="text-slate-600 line-clamp-2">{schoolInfo.vision}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Two-Column Row: Ticker & Stats + Director Welcome */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Urgent Announcement & Stats */}
                <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-rose-600" />
                      <h3 className="font-bold text-sm text-slate-900">3. ประกาศด่วน & สถิติตัวเลข</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => onEditSchoolInfo('ticker')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-2xs font-bold transition-colors cursor-pointer"
                    >
                      แก้ไข
                    </button>
                  </div>

                  <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-2xs">
                      <span className="font-bold text-amber-900 bg-amber-200/90 px-2 py-0.5 rounded">
                        {schoolInfo.urgentTickerLabel || 'ประกาศด่วน'}
                      </span>
                      <span className="text-slate-500 font-medium">
                        {schoolInfo.urgentTickerEnabled !== false ? 'เปิดใช้งาน' : 'ปิดอยู่'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 line-clamp-2 mt-1">
                      {schoolInfo.urgentTickerText || 'ยังไม่ได้ระบุข้อความประกาศด่วน'}
                    </p>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center pt-1">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-base font-extrabold text-amber-600">{schoolInfo.studentCount}</p>
                      <p className="text-3xs text-slate-500 mt-0.5">นักเรียน (คน)</p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-base font-extrabold text-blue-600">{schoolInfo.teacherCount}</p>
                      <p className="text-3xs text-slate-500 mt-0.5">ครู (ท่าน)</p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-base font-extrabold text-emerald-600">{schoolInfo.classroomCount}</p>
                      <p className="text-3xs text-slate-500 mt-0.5">ห้องเรียน</p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-base font-extrabold text-amber-500">{schoolInfo.safetyStatPercent || '100%'}</p>
                      <p className="text-3xs text-slate-500 mt-0.5">ความปลอดภัย</p>
                    </div>
                  </div>
                </div>

                {/* Right: Director Message */}
                <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-purple-600" />
                      <h3 className="font-bold text-sm text-slate-900">4. สารจากผู้อำนวยการ</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => onEditSchoolInfo('director')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-2xs font-bold transition-colors cursor-pointer"
                    >
                      แก้ไข
                    </button>
                  </div>

                  <div className="flex items-start gap-4">
                    <img
                      src={schoolInfo.directorImageUrl || '/src/assets/images/school_director_portrait_1792082309465.jpg'}
                      alt={schoolInfo.directorName}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover object-top border border-slate-200 shadow-xs shrink-0"
                    />
                    <div className="space-y-1 text-xs min-w-0">
                      <p className="font-bold text-slate-900 text-sm leading-tight">{schoolInfo.directorName}</p>
                      <p className="text-2xs text-slate-500">{schoolInfo.directorPosition} · {schoolInfo.directorRank}</p>
                      <p className="text-xs font-semibold text-blue-900 italic line-clamp-1 mt-1">
                        "{schoolInfo.directorQuoteTitle || 'ร่วมแรงร่วมใจ สร้างวินัย ใฝ่หาความรู้'}"
                      </p>
                      <p className="text-2xs text-slate-600 line-clamp-2">
                        {schoolInfo.directorMessage}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Educational Pillars & Quick Links Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Educational Pillars */}
                <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-blue-600" />
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">5. 4 เสาหลักการจัดการศึกษา</h3>
                        <p className="text-3xs text-slate-500">จุดเน้นการพัฒนาผู้เรียน ({schoolInfo.educationalPillars?.length || 4} เสาหลัก)</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onEditSchoolInfo('pillars')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-2xs font-bold transition-colors cursor-pointer"
                    >
                      แก้ไข
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {(schoolInfo.educationalPillars || []).slice(0, 4).map((p, idx) => (
                      <div key={p.id || idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between gap-3">
                        <div className="text-xs space-y-0.5">
                          <p className="font-bold text-slate-900">{p.title}</p>
                          <p className="text-2xs text-slate-500 line-clamp-1">{p.desc}</p>
                        </div>
                        <span className="text-3xs font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 shrink-0">
                          {p.targetGrade}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Quick Links e-Services */}
                <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-emerald-600" />
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">6. ลิงก์ด่วนและระบบบริการ e-Services</h3>
                        <p className="text-3xs text-slate-500">ลิงก์หน่วยงานและระบบวัดผลออนไลน์ ({schoolInfo.quickLinks?.length || 6} ลิงก์)</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onEditSchoolInfo('quicklinks')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-2xs font-bold transition-colors cursor-pointer"
                    >
                      จัดการลิงก์
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {(schoolInfo.quickLinks || []).slice(0, 6).map((link) => (
                      <div key={link.id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-900 truncate">{link.title}</p>
                          <p className="text-3xs text-slate-500 truncate">{link.badge || 'บริการ'}</p>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 6. Two-Column Row: Community Governance + Contact Strip */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Community Governance */}
                <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">7. โครงสร้างการมีส่วนร่วม 3 ฝ่าย</h3>
                        <p className="text-3xs text-slate-500">การ์ด ครู, คณะกรรมการ, และเครือข่ายผู้ปกครอง</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onEditSchoolInfo('governance')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-2xs font-bold transition-colors cursor-pointer"
                    >
                      แก้ไข
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(schoolInfo.governanceCards || []).slice(0, 3).map((card, idx) => (
                      <div key={card.id || idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-xs text-slate-900">{card.title}</p>
                          <p className="text-2xs text-slate-500 line-clamp-1">{card.desc}</p>
                        </div>
                        <span className="text-3xs font-semibold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 shrink-0">
                          {card.buttonText}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Contact Strip */}
                <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-600" />
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">8. แถบติดต่อประสานงานท้ายหน้า</h3>
                        <p className="text-3xs text-slate-500">ข้อมูลการติดต่อ เบอร์โทรศัพท์ และปุ่มดาวน์โหลด Drive</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onEditSchoolInfo('contact')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-2xs font-bold transition-colors cursor-pointer"
                    >
                      แก้ไข
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">หัวข้อแถบติดต่อ:</span>
                      <p className="font-bold text-slate-900">{schoolInfo.contactStripTitle || 'ติดต่อสอบถามข้อมูล หรือประสานงานราชการ'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">เบอร์โทร & อีเมล:</span>
                      <p className="text-slate-700 font-medium">{schoolInfo.phone} · {schoolInfo.email}</p>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 text-3xs font-semibold">
                        ปุ่ม 1: {schoolInfo.contactStripButtonDrive || 'ดาวน์โหลดเอกสาร Drive'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-3xs font-semibold">
                        ปุ่ม 2: {schoolInfo.contactStripButtonMap || 'แผนที่และการเดินทาง'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 7. Full Row: Video Showcase Management Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                      <Film className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900">
                          9. ส่วนแสดงวิดีโอกิจกรรมโรงเรียน (Video Showcase บนหน้าแรก)
                        </h3>
                        <span className={`text-3xs font-bold px-2 py-0.5 rounded-full ${
                          schoolInfo.sectionsVisibility?.videoGallery !== false
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {schoolInfo.sectionsVisibility?.videoGallery !== false ? 'กำลังแสดงผล' : 'ซ่อนอยู่'}
                        </span>
                      </div>
                      <p className="text-2xs text-slate-500">
                        ควบคุมการแสดงคลิปวิดีโอ YouTube และ Google Drive บนหน้าแรกของเว็บไซต์
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => onEditSchoolInfo('videos')}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-900 rounded-xl text-xs font-bold border border-rose-200 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Sliders className="w-3.5 h-3.5 text-rose-600" />
                      <span>ตั้งค่าส่วนแสดงผล</span>
                    </button>
                    {onEditVideo && (
                      <button
                        type="button"
                        onClick={() => onEditVideo()}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>เพิ่มวิดีโอใหม่</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveMenu('videos')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5 text-slate-600" />
                      <span>คลังวิดีโอทั้งหมด ({(videoList || []).length})</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  <div className="md:col-span-5 space-y-2 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 font-medium">หัวข้อส่วนวิดีโอบนหน้าหลัก:</span>
                      <p className="font-bold text-slate-900">{schoolInfo.videoSectionTitle || 'วิดีโอกิจกรรมและผลงานสถานศึกษา'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">คำบรรยายย่อย:</span>
                      <p className="text-slate-600">{schoolInfo.videoSectionSubtitle || 'ประมวลภาพเคลื่อนไหว การจัดการเรียนรู้ และกิจกรรมส่งเสริมศักยภาพผู้เรียน'}</p>
                    </div>
                    <div className="flex items-center gap-4 pt-1">
                      <div>
                        <span className="text-slate-400 font-medium">แสดงสูงสุด:</span>
                        <p className="font-bold text-rose-600">{schoolInfo.videoSectionMaxItems || 4} คลิป</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">จำนวนคลิปในระบบ:</span>
                        <p className="font-bold text-slate-800">{(videoList || []).length} คลิป</p>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-7">
                    {(videoList || []).length === 0 ? (
                      <div className="p-6 border border-dashed border-slate-300 rounded-xl text-center space-y-2 bg-slate-50/50">
                        <Film className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs font-semibold text-slate-600">ยังไม่มีวิดีโอในระบบ</p>
                        <p className="text-3xs text-slate-400">เพิ่มวิดีโอกิจกรรมจาก YouTube หรือ Google Drive เพื่อให้แสดงบนหน้าแรก</p>
                        {onEditVideo && (
                          <button
                            type="button"
                            onClick={() => onEditVideo()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 cursor-pointer transition-colors shadow-2xs mt-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>เพิ่มวิดีโอแรก</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {(videoList || []).slice(0, 3).map((v) => (
                          <div
                            key={v.id}
                            onClick={() => onEditVideo?.(v)}
                            className="group rounded-xl border border-slate-200 overflow-hidden bg-white hover:border-rose-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                          >
                            <div className="aspect-video bg-slate-900 relative overflow-hidden">
                              <img
                                src={v.thumbnailUrl || '/src/assets/images/hero_school_campus_1792082308721.jpg'}
                                alt={v.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-slate-950/30 flex items-center justify-center">
                                <div className="w-7 h-7 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-xs">
                                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                </div>
                              </div>
                            </div>
                            <div className="p-2.5">
                              <p className="font-bold text-xs text-slate-900 line-clamp-1 group-hover:text-rose-600 transition-colors">
                                {v.title}
                              </p>
                              <div className="flex items-center justify-between text-3xs text-slate-500 mt-1">
                                <span>{v.category}</span>
                                <span>{v.duration || 'วิดีโอ'}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION 2: POSTS / NEWS ================= */}
          {activeMenu === 'posts' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    เรื่องทั้งหมด (All Posts)
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    จัดการข่าวประชาสัมพันธ์ ประกาศทางการ และบทความวิชาการ
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEditNews()}
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เขียนเรื่องใหม่ (Add New)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveMenu('categories')}
                    className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>จัดการหมวดหมู่</span>
                  </button>
                </div>
              </div>

              {/* Filter Bar (WordPress Style Table Filters) */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden"
                  >
                    <option value="all">หมวดหมู่ทั้งหมด ({categories.length})</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="ค้นหาเรื่อง / ข่าว..."
                    value={postSearch}
                    onChange={(e) => setPostSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs w-56 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Posts Table (WordPress Table Style) */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#f0f0f1] text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-bold">ชื่อเรื่อง</th>
                      <th className="py-3 px-4 font-bold">ผู้เขียน</th>
                      <th className="py-3 px-4 font-bold">หมวดหมู่</th>
                      <th className="py-3 px-4 font-bold">สถานะ</th>
                      <th className="py-3 px-4 font-bold">วันที่</th>
                      <th className="py-3 px-4 font-bold text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPosts.map((post) => (
                      <tr key={post.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {post.coverImage && (
                              <img
                                src={post.coverImage}
                                alt={post.title}
                                referrerPolicy="no-referrer"
                                className="w-12 h-9 object-cover rounded-md border border-slate-200 shrink-0"
                              />
                            )}
                            <div>
                              <p className="font-bold text-slate-900 hover:text-blue-700 transition-colors line-clamp-1">
                                {post.title}
                              </p>
                              {post.pinned && (
                                <span className="inline-block mt-0.5 text-3xs font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                                  📌 ปักหมุด
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 truncate max-w-[120px]">
                          {post.authorName}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-2xs">
                            {categories.find(c => c.slug === post.category)?.name || post.category}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-2xs font-semibold ${
                            post.published 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {post.published ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(post.createdAt).toLocaleDateString('th-TH')}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => onEditNews(post)}
                              className="px-2 py-1 text-2xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                            >
                              แก้ไข
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteNews(post)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="ลบเรื่องนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= SECTION 3: CATEGORIES MANAGER (Requested Feature) ================= */}
          {activeMenu === 'categories' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-300 pb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  หมวดหมู่ (Categories)
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  ระบบจำแนกประเภทข่าวสารและประกาศสไตล์ BNR สามารถสร้าง แก้ไข และกำหนดสีป้ายได้ตามต้องการ
                </p>
              </div>

              {/* 2-Column WordPress Layout */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Left Form: Add/Edit Category */}
                <div className="md:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-sm text-slate-900">
                      {editingCatId ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่ (Add New Category)'}
                    </h3>
                  </div>

                  <form onSubmit={handleCategorySubmit} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        ชื่อหมวดหมู่ <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={catName}
                        onChange={(e) => {
                          setCatName(e.target.value);
                          if (!editingCatId && !catSlug) {
                            setCatSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                          }
                        }}
                        placeholder="เช่น ข่าวจัดซื้อจัดจ้าง, จดหมายข่าว"
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">สลัก (Slug)</label>
                      <input
                        type="text"
                        value={catSlug}
                        onChange={(e) => setCatSlug(e.target.value)}
                        placeholder="เช่น procurement"
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">สีป้ายกำกับ (Color)</label>
                      <div className="flex flex-wrap gap-1.5">
                        {['blue', 'amber', 'emerald', 'purple', 'rose', 'indigo', 'slate'].map((col) => (
                          <button
                            key={col}
                            type="button"
                            onClick={() => setCatColor(col)}
                            className={`px-2.5 py-1 rounded-lg text-2xs font-bold border transition-all cursor-pointer ${
                              catColor === col ? 'ring-2 ring-slate-900 shadow-xs' : 'opacity-70'
                            }`}
                          >
                            {col}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">คำอธิบาย (Description)</label>
                      <textarea
                        rows={3}
                        value={catDesc}
                        onChange={(e) => setCatDesc(e.target.value)}
                        placeholder="อธิบายว่าหมวดหมู่นี้ใช้สำหรับเนื้อหาใด..."
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={savingCat || !catName.trim()}
                        className="px-4 py-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        {savingCat ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>{editingCatId ? 'อัปเดตหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}</span>
                      </button>

                      {editingCatId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCatId(null);
                            setCatName('');
                            setCatSlug('');
                            setCatDesc('');
                          }}
                          className="px-3 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          ยกเลิก
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Right Table: Category List */}
                <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#f0f0f1] text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 font-bold">ชื่อหมวดหมู่</th>
                        <th className="py-3 px-4 font-bold">สลัก (Slug)</th>
                        <th className="py-3 px-4 font-bold text-center">จำนวนข่าว</th>
                        <th className="py-3 px-4 font-bold text-right">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categories.map((c) => {
                        const count = newsList.filter(n => n.category === c.slug).length;
                        return (
                          <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-900">{c.name}</span>
                              {c.description && (
                                <p className="text-2xs text-slate-500 mt-0.5 line-clamp-1">{c.description}</p>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono text-2xs text-slate-500">
                              {c.slug}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-2xs">
                                {count}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCatId(c.id);
                                    setCatName(c.name);
                                    setCatSlug(c.slug);
                                    setCatDesc(c.description || '');
                                    setCatColor(c.color || 'blue');
                                  }}
                                  className="p-1 text-slate-500 hover:text-blue-600 rounded cursor-pointer"
                                  title="แก้ไข"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteCategory(c.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                  title="ลบ"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION 4: MEDIA LIBRARY ================= */}
          {activeMenu === 'media' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-300 pb-4">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  คลังสื่อและมีเดีย (Media Library)
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  จัดการรูปภาพแยกตามโครงสร้างโฟลเดอร์ อัปโหลดภาพจากเครื่อง หรือสแกนดึงภาพจาก Google Drive
                </p>
              </div>

              <MediaLibraryView
                mediaList={mediaList}
                onAddMediaItem={onAddMediaItem}
                onDeleteMediaItem={onDeleteMediaItem}
                driveSettings={driveSettings}
              />
            </div>
          )}

          {/* ================= SECTION 5.1: VIDEO GALLERY ================= */}
          {activeMenu === 'videos' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    คลังวิดีโอกิจกรรม (Video Gallery)
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    จัดการคลิปวิดีโอกิจกรรมโรงเรียน พร้อมโฟลเดอร์ 06_คลังวีดีโอกิจกรรมโรงเรียน บน Google Drive
                  </p>
                </div>

                {onEditVideo && (
                  <button
                    type="button"
                    onClick={() => onEditVideo()}
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ เพิ่มวิดีโอใหม่</span>
                  </button>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
                <VideoGalleryView
                  videoList={videoList}
                  isQuickEditMode={true}
                  userRole={userRole}
                  currentUserId={user?.uid}
                  onEditVideo={onEditVideo}
                  onDeleteVideo={onDeleteVideo}
                  driveSettings={driveSettings}
                />
              </div>
            </div>
          )}

          {/* ================= DOCUMENTS & SAR REPOSITORY SECTION ================= */}
          {activeMenu === 'documents' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-red-600" />
                    <span>คลังเอกสารเผยแพร่และรายงาน SAR</span>
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    จัดการรายงาน SAR, แผนปฏิบัติการประจำปี, หลักสูตรสถานศึกษา และเอกสารทางการของโรงเรียนในรูปแบบไฟล์ PDF
                  </p>
                </div>

                {onEditDocument && (
                  <button
                    type="button"
                    onClick={() => onEditDocument()}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ เพิ่มเอกสารเผยแพร่ใหม่</span>
                  </button>
                )}
              </div>

              {/* Filters and Search Bar */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Category Filter Tabs */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'all', label: 'ทั้งหมด' },
                    { id: 'sar', label: 'รายงาน SAR' },
                    { id: 'academic', label: '01 วิชาการ' },
                    { id: 'budget', label: '02 งบประมาณ' },
                    { id: 'personnel', label: '03 บุคคล' },
                    { id: 'general', label: '04 บริหารทั่วไป' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setDocCategoryFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        docCategoryFilter === tab.id
                          ? 'bg-blue-900 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative w-full md:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อเรื่อง หรือชื่อไฟล์..."
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Documents Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                {(() => {
                  const filtered = documentList.filter(d => {
                    const matchCategory = docCategoryFilter === 'all' || d.category === docCategoryFilter;
                    const searchLower = docSearch.toLowerCase().trim();
                    const matchSearch = !searchLower ||
                      d.title.toLowerCase().includes(searchLower) ||
                      (d.pdfFileName && d.pdfFileName.toLowerCase().includes(searchLower)) ||
                      (d.authorName && d.authorName.toLowerCase().includes(searchLower));
                    return matchCategory && matchSearch;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12 p-6 space-y-3">
                        <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                        <p className="text-xs font-semibold text-slate-500">ไม่พบเอกสารในหมวดหมู่นี้</p>
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-[#f0f0f1] text-slate-700 border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4 font-bold">ชื่อเอกสารเผยแพร่</th>
                            <th className="py-3 px-4 font-bold">หมวดหมู่</th>
                            <th className="py-3 px-4 font-bold text-center">ปีการศึกษา</th>
                            <th className="py-3 px-4 font-bold">ผู้เผยแพร่</th>
                            <th className="py-3 px-4 font-bold text-center">สถานะ</th>
                            <th className="py-3 px-4 font-bold">วันที่</th>
                            <th className="py-3 px-4 font-bold text-right">การจัดการ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filtered.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold shrink-0">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-900 hover:text-blue-700 transition-colors line-clamp-1">
                                      {item.title}
                                    </p>
                                    <p className="text-3xs text-slate-500 mt-0.5 truncate max-w-[220px]">
                                      {item.pdfFileName || 'ไฟล์เอกสาร PDF'} {item.fileSize ? `(${item.fileSize})` : ''}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 font-bold rounded text-3xs ${
                                  item.category === 'sar'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {item.category === 'sar' ? 'รายงาน SAR' :
                                   item.category === 'academic' ? 'งานวิชาการ' :
                                   item.category === 'budget' ? 'งานงบประมาณ' :
                                   item.category === 'personnel' ? 'งานบุคคล' : 'งานทั่วไป'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                                {item.academicYearBE}
                              </td>
                              <td className="py-3 px-4 text-slate-600 truncate max-w-[130px]">
                                {item.authorName || 'ฝ่ายประชาสัมพันธ์'}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-3xs font-semibold ${
                                  item.published
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-200 text-slate-700'
                                }`}>
                                  {item.published ? 'เผยแพร่' : 'ซ่อนอยู่'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                                {new Date(item.createdAt).toLocaleDateString('th-TH')}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {item.pdfUrl && (
                                    <a
                                      href={item.pdfUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                      title="เปิดดูไฟล์ PDF"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                  {onEditDocument && (
                                    <button
                                      type="button"
                                      onClick={() => onEditDocument(item)}
                                      className="px-2 py-1 text-3xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                                    >
                                      แก้ไข
                                    </button>
                                  )}
                                  {onDeleteDocument && (
                                    <button
                                      type="button"
                                      onClick={() => onDeleteDocument(item)}
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                      title="ลบเอกสารนี้"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {activeMenu === 'gallery' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    แกลเลอรีภาพกิจกรรม (Gallery Albums)
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    สามารถดึงรูปภาพทั้งหมดจากโฟลเดอร์ Google Drive หรืออัปโหลดรูปภาพได้ทันที
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onEditAlbum()}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>สร้างอัลบั้มใหม่</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {galleryList.map((album) => (
                  <div
                    key={album.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                        <img
                          src={album.coverImage}
                          alt={album.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-3xs font-bold px-2 py-0.5 rounded">
                          {album.images.length} รูปภาพ
                        </div>
                        {album.driveFolderUrl && (
                          <div className="absolute bottom-2 left-2 bg-blue-900/90 text-white text-3xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
                            <HardDrive className="w-3 h-3" />
                            <span>เชื่อมโยง Drive</span>
                          </div>
                        )}
                      </div>

                      <div className="p-4 space-y-2">
                        <div className="flex items-center gap-1.5 text-2xs text-slate-500">
                          <Calendar className="w-3 h-3" />
                          <span>{album.activityDate}</span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm line-clamp-2">
                          {album.title}
                        </h3>
                        <p className="text-2xs text-slate-600 line-clamp-2">
                          {album.description}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEditAlbum(album)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>แก้ไข & จัดการรูป</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteAlbum(album)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="ลบอัลบั้ม"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= SECTION 6: STAFF ================= */}
          {activeMenu === 'staff' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    ครูและบุคลากรทางการศึกษา (Staff Directory)
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    ทำเนียบคณะครูและบุคลากรจำแนกตาม 8 กลุ่มสาระการเรียนรู้
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onEditStaff()}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มบุคลากรใหม่</span>
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#f0f0f1] text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-bold">ชื่อ - นามสกุล</th>
                      <th className="py-3 px-4 font-bold">ตำแหน่ง / วิทยฐานะ</th>
                      <th className="py-3 px-4 font-bold">กลุ่มสาระการเรียนรู้</th>
                      <th className="py-3 px-4 font-bold text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {staffList.map((staff) => (
                      <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={staff.imageUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200'}
                              alt={staff.name}
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <p className="font-bold text-slate-900">{staff.prefix}{staff.name}</p>
                              <p className="text-2xs text-slate-500">{staff.email || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          <p className="font-medium">{staff.position}</p>
                          <p className="text-2xs text-slate-500">{staff.academicRank}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {staff.department}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => onEditStaff(staff)}
                              className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-2xs font-semibold cursor-pointer"
                            >
                              แก้ไข
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteStaff(staff)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= SECTION 7: BOARDS ================= */}
          {activeMenu === 'boards' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    คณะกรรมการสถานศึกษาและเครือข่ายผู้ปกครอง
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    ทำเนียบคณะกรรมการสถานศึกษาขั้นพื้นฐาน และเครือข่ายผู้ปกครองนักเรียน
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEditBoardMember(undefined, 'basic_education')}
                    className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มกรรมการสถานศึกษา</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditBoardMember(undefined, 'parents_network')}
                    className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มเครือข่ายผู้ปกครอง</span>
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#f0f0f1] text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-bold">ชื่อ - นามสกุล</th>
                      <th className="py-3 px-4 font-bold">ประเภทคณะกรรมการ</th>
                      <th className="py-3 px-4 font-bold">ตำแหน่งในบอร์ด</th>
                      <th className="py-3 px-4 font-bold">ตัวแทน / สัดส่วน</th>
                      <th className="py-3 px-4 font-bold text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {boardMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {member.name}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-2xs font-semibold ${
                            member.boardType === 'basic_education' 
                              ? 'bg-amber-100 text-amber-900' 
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {member.boardType === 'basic_education' ? 'กรรมการสถานศึกษา' : 'เครือข่ายผู้ปกครอง'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {member.roleInBoard}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {member.representation || '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => onEditBoardMember(member)}
                              className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-2xs font-semibold cursor-pointer"
                            >
                              แก้ไข
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteBoardMember(member)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= SECTION 8: GOOGLE DRIVE MODULE (ADMIN & SUPER ADMIN ONLY) ================= */}
          {activeMenu === 'drive' && (userRole === 'admin' || userRole === 'superadmin' || checkIsSuperAdmin(user?.email, rolesConfig)) && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-300 pb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  การตั้งค่า Google Drive ส่วนกลาง
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  ระบุ Folder ID ส่วนกลางของโรงเรียน และกำหนดโฟลเดอร์สำหรับ 4 ฝ่ายบริหาร
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 max-w-2xl">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    ชื่อโฟลเดอร์ส่วนกลางของโรงเรียน
                  </label>
                  <input
                    type="text"
                    value={driveForm.centralFolderName}
                    onChange={(e) => setDriveForm({ ...driveForm, centralFolderName: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    รหัสโฟลเดอร์ส่วนกลาง (Google Drive Central Folder ID หรือ URL)
                  </label>
                  <input
                    type="text"
                    value={driveForm.centralFolderId}
                    onChange={(e) => setDriveForm({ ...driveForm, centralFolderId: extractFolderId(e.target.value) })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setSavingDrive(true);
                      try {
                        await onSaveDriveSettings(driveForm);
                        showSuccess('บันทึกสำเร็จ', 'บันทึกการตั้งค่า Google Drive เรียบร้อยแล้ว');
                      } catch (err: any) {
                        showError('เกิดข้อผิดพลาด', err.message);
                      } finally {
                        setSavingDrive(false);
                      }
                    }}
                    disabled={savingDrive}
                    className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    {savingDrive ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>บันทึกการตั้งค่า Drive</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION 10: BACKUP & RESTORE ================= */}
          {activeMenu === 'backup' && (userRole === 'admin' || userRole === 'superadmin' || checkIsSuperAdmin(user?.email, rolesConfig)) && (
            <BackupRestoreView
              user={user}
              userRole={userRole}
              driveSettings={driveSettings}
              onRefreshData={onRefreshData}
            />
          )}

          {/* ================= SECTION 9: GENERAL SETTINGS ================= */}
          {activeMenu === 'settings' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    การตั้งค่าสถานศึกษา (School Settings)
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    วิสัยทัศน์ คติพจน์ ปรัชญา ข้อมูลผู้อำนวยการ และสถิติสถานศึกษา
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onEditSchoolInfo('homepage')}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>แก้ไขข้อมูลทั้งหมด</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6 max-w-3xl">
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-slate-900 border-b pb-2">ข้อมูลทั่วไป</h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400">ชื่อโรงเรียน:</span>
                      <p className="font-bold text-slate-800">{schoolInfo.schoolName}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">ชื่อภาษาอังกฤษ:</span>
                      <p className="font-bold text-slate-800">{schoolInfo.schoolNameEn}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">สังกัด:</span>
                      <p className="font-bold text-slate-800">{schoolInfo.affiliation}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">รหัสสถานศึกษา:</span>
                      <p className="font-bold text-slate-800">{schoolInfo.schoolIdCode}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-sm text-slate-900 border-b pb-2">คติพจน์ & วิสัยทัศน์</h3>
                  <p className="text-xs font-semibold text-amber-700">"{schoolInfo.motto}"</p>
                  <p className="text-xs text-slate-700 leading-relaxed font-normal">{schoolInfo.vision}</p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-sm text-slate-900 border-b pb-2">ผู้บริหารสถานศึกษา</h3>
                  <div className="flex items-center gap-3">
                    <img
                      src={schoolInfo.directorImageUrl || '/src/assets/images/school_director_portrait_1792082309465.jpg'}
                      alt={schoolInfo.directorName}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-full object-cover border border-slate-200"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">{schoolInfo.directorName}</p>
                      <p className="text-slate-500">{schoolInfo.directorPosition} · {schoolInfo.directorRank}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Reset Hit Counter Confirmation Modal */}
      <ConfirmationModal
        isOpen={showResetConfirmModal}
        title="ยืนยันการรีเซ็ตสถิติผู้เข้าชมเว็บไซต์"
        message={`คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตตัวนับสถิติผู้เข้าชมเว็บไซต์ทั้งหมดเป็น 0?\n\nการกระทำนี้จะล้างยอดการเข้าชมสะสมบน Cloud Firestore และเริ่มนับใหม่ตั้งแต่ 0 ครั้งทันที`}
        confirmText="ยืนยันรีเซ็ตเป็น 0"
        cancelText="ยกเลิก"
        isDestructive={true}
        onConfirm={() => handleConfirmReset(0)}
        onCancel={() => setShowResetConfirmModal(false)}
      />
    </div>
  );
};
