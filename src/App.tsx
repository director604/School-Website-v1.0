/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  initAuth,
  googleSignIn,
  logout
} from './services/googleAuth';
import {
  fetchSchoolInfo,
  saveSchoolInfo,
  fetchStaffList,
  saveStaffMember,
  deleteStaffMember,
  fetchBoardMembers,
  saveBoardMember,
  deleteBoardMember,
  fetchNewsList,
  saveNewsPost,
  deleteNewsPost,
  fetchGalleryList,
  saveGalleryAlbum,
  deleteGalleryAlbum,
  fetchVideoList,
  saveVideoItem,
  deleteVideoItem,
  fetchDocumentList,
  saveDocumentItem,
  deleteDocumentItem,
  fetchCategories,
  saveCategory,
  deleteCategory,
  fetchMediaList,
  saveMediaItem,
  deleteMediaItem,
  fetchDriveSettings,
  saveDriveSettings,
  fetchSiteStats,
  recordPageHit,
  resetPageHitCounter,
  fetchUsersList,
  updateUserRole,
  updateUserStatus,
  addUserProfile,
  updateUserProfile,
  deleteUserProfile,
  seedInitialD1DataIfNeeded
} from './services/d1Service';

type User = UserProfile;
import {
  SchoolInfo,
  StaffMember,
  BoardMember,
  NewsPost,
  GalleryAlbum,
  VideoItem,
  UserProfile,
  UserRole,
  UserStatus,
  BoardType,
  DriveSettings,
  PostCategory,
  MediaItem,
  SiteStats,
  SystemRolesConfig,
  PublicDocumentItem
} from './types';
import {
  initialSchoolInfo,
  initialStaff,
  initialBoardMembers,
  initialNews,
  initialGallery,
  initialDriveSettings,
  initialCategories,
  initialMediaItems,
  initialVideos,
  initialPublicDocuments
} from './data/initialData';
import { extractFolderId, extractDriveFileId } from './services/driveService';
import { 
  listenSystemRolesConfig, 
  checkIsSuperAdmin, 
  listenInboxMessages,
  DEFAULT_SUPER_ADMIN_EMAIL 
} from './services/inboxService';
import { Eye, X } from 'lucide-react';

// Components
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { WPAdminBar } from './components/WPAdminBar';
import { ConfirmationModal } from './components/ConfirmationModal';
import { SchoolInfoEditModal } from './components/SchoolInfoEditModal';
import { StaffEditModal } from './components/StaffEditModal';
import { BoardEditModal } from './components/BoardEditModal';
import { NewsEditModal } from './components/NewsEditModal';
import { GalleryEditModal } from './components/GalleryEditModal';
import { VideoGalleryView } from './components/VideoGalleryView';
import { VideoEditModal } from './components/VideoEditModal';
import { PublicDocEditModal } from './components/PublicDocEditModal';
import { DriveSettingsModal } from './components/DriveSettingsModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { AuthModal } from './components/AuthModal';
import { SchoolInboxModal } from './components/SchoolInboxModal';
import { AdminRoleManagementModal } from './components/AdminRoleManagementModal';
import { showWarning, showError, showSuccess } from './utils/sweetalert';

// Views
import { HomeView, HomepageTabKey } from './views/HomeView';
import { AboutView } from './views/AboutView';
import { StaffView } from './views/StaffView';
import { BoardView } from './views/BoardView';
import { NewsView } from './views/NewsView';
import { PublicDocumentsView } from './views/PublicDocumentsView';
import { DriveView } from './views/DriveView';
import { ContactView } from './views/ContactView';
import { AdminDashboardView } from './views/AdminDashboardView';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isQuickEditMode, setIsQuickEditMode] = useState<boolean>(false);
  const [guestNotice, setGuestNotice] = useState<string | null>(null);

  // Data States
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(() => {
    try {
      const cached = localStorage.getItem('bannaree_school_info');
      if (cached) return JSON.parse(cached);
    } catch {}
    return initialSchoolInfo;
  });
  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    try {
      const cached = localStorage.getItem('bannaree_staff_list');
      if (cached) return JSON.parse(cached);
    } catch {}
    return initialStaff;
  });
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>(() => {
    try {
      const cached = localStorage.getItem('bannaree_board_members');
      if (cached) return JSON.parse(cached);
    } catch {}
    return initialBoardMembers;
  });
  const [newsList, setNewsList] = useState<NewsPost[]>(() => {
    try {
      const cached = localStorage.getItem('bannaree_news_list');
      if (cached) return JSON.parse(cached);
    } catch {}
    return initialNews;
  });
  const [galleryList, setGalleryList] = useState<GalleryAlbum[]>(() => {
    try {
      const cached = localStorage.getItem('bannaree_gallery_list');
      if (cached) return JSON.parse(cached);
    } catch {}
    return initialGallery;
  });
  const [driveSettings, setDriveSettings] = useState<DriveSettings>(() => {
    try {
      const cached = localStorage.getItem('bannaree_drive_settings');
      if (cached) return JSON.parse(cached);
    } catch {}
    return initialDriveSettings;
  });
  const [categories, setCategories] = useState<PostCategory[]>(() => {
    try {
      const cached = localStorage.getItem('bannaree_categories');
      if (cached) return JSON.parse(cached);
    } catch {}
    return initialCategories;
  });
  const [mediaList, setMediaList] = useState<MediaItem[]>(() => {
    try {
      const cached = localStorage.getItem('bannaree_media_list');
      if (cached) return JSON.parse(cached);
    } catch {}
    return initialMediaItems;
  });
  const [videoList, setVideoList] = useState<VideoItem[]>(() => {
    try {
      const cached = localStorage.getItem('bannaree_video_gallery');
      if (cached) return JSON.parse(cached);
    } catch {}
    return initialVideos;
  });
  const [documentList, setDocumentList] = useState<PublicDocumentItem[]>(() => {
    try {
      const cached = localStorage.getItem('bannaree_public_documents');
      if (cached) return JSON.parse(cached);
    } catch {}
    return initialPublicDocuments;
  });
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [siteStats, setSiteStats] = useState<SiteStats>(() => {
    try {
      const cached = localStorage.getItem('bannaree_site_stats');
      if (cached) return JSON.parse(cached);
    } catch {}
    return { totalVisits: 0, todayVisits: 0 };
  });

  // Modals & Popups
  const [isSchoolInfoModalOpen, setIsSchoolInfoModalOpen] = useState(false);
  const [schoolInfoModalTab, setSchoolInfoModalTab] = useState<HomepageTabKey>('homepage');

  const handleOpenSchoolInfoEdit = (tab: HomepageTabKey = 'homepage') => {
    setSchoolInfoModalTab(tab);
    setIsSchoolInfoModalOpen(true);
  };

  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<BoardMember | null>(null);
  const [defaultBoardType, setDefaultBoardType] = useState<BoardType>('basic_education');
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsPost | null>(null);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState<GalleryAlbum | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [videoToDelete, setVideoToDelete] = useState<VideoItem | null>(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<PublicDocumentItem | null>(null);
  const [docToDelete, setDocToDelete] = useState<PublicDocumentItem | null>(null);
  const [isDriveSettingsModalOpen, setIsDriveSettingsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isInboxModalOpen, setIsInboxModalOpen] = useState(false);
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
  const [unreadInboxCount, setUnreadInboxCount] = useState(0);

  // System Roles Configuration
  const [rolesConfig, setRolesConfig] = useState<SystemRolesConfig>({
    superAdminEmail: DEFAULT_SUPER_ADMIN_EMAIL,
    adminEmails: []
  });

  const isSuperAdmin = checkIsSuperAdmin(user?.email, rolesConfig);

  // Detail Readers
  const [selectedNewsDetail, setSelectedNewsDetail] = useState<NewsPost | null>(null);
  const [selectedAlbumDetail, setSelectedAlbumDetail] = useState<GalleryAlbum | null>(null);

  // Check URL query parameters on mount or when newsList loads to support direct news link / Facebook post links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetNewsId = params.get('newsId');
    const targetTab = params.get('tab');

    if (targetTab && ['home', 'about', 'staff', 'boards', 'news', 'gallery', 'drive', 'contact', 'dashboard'].includes(targetTab)) {
      if (targetTab === 'drive' && userRole === 'guest') {
        setActiveTab('home');
      } else {
        setActiveTab(targetTab);
      }
    }

    if (targetNewsId && newsList.length > 0) {
      const matched = newsList.find(n => n.id === targetNewsId);
      if (matched) {
        setSelectedNewsDetail(matched);
        setActiveTab('news');
      }
    }
  }, [newsList, userRole]);

  // Guard Google Drive access against guest mode
  useEffect(() => {
    if (activeTab === 'drive' && userRole === 'guest') {
      setActiveTab('home');
      showWarning(
        'จำกัดสิทธิ์การเข้าถึง',
        'คลังเอกสาร Google Drive สงวนสิทธิ์สำหรับคณะครูและบุคลากรโรงเรียนบ้านนารีเท่านั้น กรุณาเข้าสู่ระบบก่อนใช้งาน'
      );
    }
  }, [activeTab, userRole]);

  // Synchronize URL search params and dynamic OpenGraph meta tags when a news item is viewed
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedNewsDetail) {
      url.searchParams.set('tab', 'news');
      url.searchParams.set('newsId', selectedNewsDetail.id);
      window.history.replaceState({}, '', url.toString());

      // Update page title
      document.title = `${selectedNewsDetail.title} - โรงเรียนบ้านนารี`;

      // Update OpenGraph metadata for Link Previews
      const updateMeta = (prop: string, val: string) => {
        let el = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement | null;
        if (!el) {
          el = document.createElement('meta');
          el.setAttribute('property', prop);
          document.head.appendChild(el);
        }
        el.setAttribute('content', val);
      };

      updateMeta('og:title', selectedNewsDetail.title);
      updateMeta('og:description', selectedNewsDetail.summary || selectedNewsDetail.title);
      updateMeta('og:url', url.toString());
      if (selectedNewsDetail.coverImage) {
        updateMeta('og:image', selectedNewsDetail.coverImage);
      }
    } else {
      if (url.searchParams.has('newsId')) {
        url.searchParams.delete('newsId');
        window.history.replaceState({}, '', url.toString());
      }
      document.title = 'โรงเรียนบ้านนารี - Ban Naree School';
    }
  }, [selectedNewsDetail]);

  // Delete Confirmations
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  const [boardToDelete, setBoardToDelete] = useState<BoardMember | null>(null);
  const [newsToDelete, setNewsToDelete] = useState<NewsPost | null>(null);
  const [albumToDelete, setAlbumToDelete] = useState<GalleryAlbum | null>(null);

  const handleToggleRole = (forcedRole?: UserRole) => {
    if (forcedRole) {
      setUserRole(forcedRole);
      if (forcedRole === 'guest') {
        setIsQuickEditMode(false);
      } else {
        setIsQuickEditMode(true);
      }
      return;
    }
    setUserRole(prev => {
      if (prev === 'admin') {
        return 'teacher';
      }
      if (prev === 'teacher') {
        setIsQuickEditMode(false);
        return 'guest';
      }
      setIsQuickEditMode(true);
      return 'admin';
    });
  };

  // 1. Initialize Auth
  useEffect(() => {
    initAuth(
      (currentUser, _token, role) => {
        setUser(currentUser);
        const resolvedRole = role || 'admin';
        setUserRole(resolvedRole);
        setIsQuickEditMode(resolvedRole === 'admin' || resolvedRole === 'superadmin');
      },
      () => {
        setUser(null);
        setUserRole('guest');
        setIsQuickEditMode(false);
      }
    );
  }, []);

  // 1.1 Listen to System Roles Configuration
  useEffect(() => {
    const unsubRoles = listenSystemRolesConfig((cfg) => {
      setRolesConfig(cfg);
    });
    return () => unsubRoles();
  }, []);

  // 1.2 Listen to School Inbox Messages (for Super Admin only)
  useEffect(() => {
    if (!user || !isSuperAdmin) {
      setUnreadInboxCount(0);
      return;
    }
    const unsubInbox = listenInboxMessages(
      (msgs) => {
        const unread = msgs.filter(m => m.status === 'new').length;
        setUnreadInboxCount(unread);
      },
      (err) => {
        console.warn('Cannot listen to inbox in App:', err);
      }
    );
    return () => unsubInbox();
  }, [user, isSuperAdmin]);

  // 2. Load Data from Cloudflare D1
  const loadAllSchoolData = async () => {
    try {
      const [
        info,
        drive,
        staff,
        board,
        news,
        gallery,
        videos,
        docs,
        cats,
        media,
        stats
      ] = await Promise.all([
        fetchSchoolInfo(),
        fetchDriveSettings(),
        fetchStaffList(),
        fetchBoardMembers(),
        fetchNewsList(),
        fetchGalleryList(),
        fetchVideoList(),
        fetchDocumentList(),
        fetchCategories(),
        fetchMediaList(),
        fetchSiteStats()
      ]);

      if (info) setSchoolInfo(info);
      if (drive) setDriveSettings(drive);
      if (staff?.length) setStaffList(staff);
      if (board?.length) setBoardMembers(board);
      if (news?.length) setNewsList(news);
      if (gallery?.length) setGalleryList(gallery);
      if (videos?.length) setVideoList(videos);
      if (docs?.length) setDocumentList(docs);
      if (cats?.length) setCategories(cats);
      if (media?.length) setMediaList(media);
      if (stats) setSiteStats(stats);
    } catch (err) {
      console.warn('Error fetching school data from D1:', err);
    }
  };

  useEffect(() => {
    // Check initial seed in Cloudflare D1
    seedInitialD1DataIfNeeded();

    // Record page hit
    recordPageHit();

    // Load data from D1
    loadAllSchoolData();

    // Background refresh every 60s
    const refreshTimer = setInterval(loadAllSchoolData, 60000);
    return () => clearInterval(refreshTimer);
  }, []);

  // 3. Load Users List if Admin or SuperAdmin
  useEffect(() => {
    if (user && (userRole === 'admin' || userRole === 'superadmin' || isSuperAdmin)) {
      loadUsers();
    }
  }, [user, userRole, isSuperAdmin]);

  const loadUsers = async () => {
    try {
      const list = await fetchUsersList();
      setUsersList(list);
    } catch (err: any) {
      console.log('Users list load note:', err?.message || err);
    }
  };

  // Auth Handlers
  const handleLogin = () => {
    setIsAuthModalOpen(true);
  };

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setGuestNotice(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        const resolvedRole = res.role || 'admin';
        setUserRole(resolvedRole);
        setIsQuickEditMode(resolvedRole === 'admin' || resolvedRole === 'superadmin');
        setActiveTab('dashboard');
        setIsAuthModalOpen(false);
        showSuccess('เข้าสู่ระบบสำเร็จ', `ยินดีต้อนรับ ${res.user.displayName || res.user.email}`);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      showError(
        'ไม่สามารถเข้าสู่ระบบได้',
        err?.message || 'อีเมลของคุณยังไม่มีในระบบโรงเรียนบ้านนารี กรุณาติดต่อผู้ดูแลระบบเพื่อเปิดใช้งานบัญชีก่อน'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleMockSignIn = (role: UserRole, email: string, name: string) => {
    const emailLower = (email || '').toLowerCase().trim();
    const isSuperAdminEmail = 
      emailLower === 'engine@bnr.ac.th' || 
      emailLower === 'sirasit@bnr.ac.th' || 
      emailLower === 'sirasit.p@gmail.com' || 
      emailLower === (rolesConfig?.superAdminEmail || '').toLowerCase();
    const isConfiguredAdmin = (rolesConfig?.adminEmails || []).map(e => e.toLowerCase()).includes(emailLower);
    const isInUsersList = usersList.some(u => (u.email || '').toLowerCase() === emailLower);

    // If system has registered users and this email is not registered anywhere, block sign in
    if (usersList.length > 0 && !isSuperAdminEmail && !isConfiguredAdmin && !isInUsersList) {
      showError('เข้าสู่ระบบไม่สำเร็จ', `อีเมล "${email}" ยังไม่อยู่ในระบบโรงเรียนบ้านนารี กรุณาติดต่อผู้ดูแลระบบเพื่อเพิ่มบัญชีเข้าสู่ระบบก่อน`);
      return;
    }

    const mockUser: any = {
      uid: 'user_' + Date.now(),
      email,
      displayName: name,
      photoURL: ''
    };
    setUser(mockUser);
    setUserRole(role);
    setIsQuickEditMode(role === 'admin' || role === 'superadmin');
    setActiveTab('dashboard');
    setGuestNotice(null);
    setIsAuthModalOpen(false);
    showSuccess('เข้าสู่ระบบสำเร็จ', `เข้าสู่ระบบสำเร็จในฐานะ ${name}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.warn('Logout error:', err);
    }
    setUser(null);
    setUserRole('guest');
    setIsQuickEditMode(false);
    if (activeTab === 'dashboard') {
      setActiveTab('home');
    }
    setGuestNotice('ออกจากระบบเรียบร้อยแล้ว — ขณะนี้กำลังแสดงผลใน "โหมดผู้เยี่ยมชม" สำหรับบุคคลทั่วไปและผู้ปกครอง');
  };

  // CRUD Handlers
  const handleSaveSchoolInfo = async (updated: SchoolInfo) => {
    try {
      await saveSchoolInfo(updated);
      setSchoolInfo(updated);
      showSuccess('บันทึกข้อมูลสำเร็จ', 'อัปเดตข้อมูลสถานศึกษาเรียบร้อยแล้ว');
    } catch (error: any) {
      console.error('Save school info error:', error);
      showError('บันทึกไม่สำเร็จ', error?.message || 'ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  const handleSaveDriveSettings = async (updated: DriveSettings) => {
    const cleanId = extractFolderId(updated.centralFolderId || '');
    const payload: DriveSettings = {
      ...updated,
      centralFolderId: cleanId,
      centralFolderUrl: cleanId ? `https://drive.google.com/drive/folders/${cleanId}` : updated.centralFolderUrl,
      updatedAt: new Date().toISOString()
    };

    setDriveSettings(payload);
    try {
      localStorage.setItem('bannaree_drive_settings', JSON.stringify(payload));
    } catch (e) {
      console.warn('localStorage save warning:', e);
    }

    try {
      await saveDriveSettings(payload);
      showSuccess('บันทึกสำเร็จ', 'อัปเดตการตั้งค่า Google Drive เรียบร้อยแล้ว');
    } catch (error: any) {
      console.error('Save drive settings error:', error);
    }
  };

  const handleSaveStaff = async (staff: StaffMember) => {
    try {
      await saveStaffMember(staff);
      setStaffList(prev => {
        const idx = prev.findIndex(s => s.id === staff.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = staff;
          return next;
        }
        return [...prev, staff].sort((a, b) => a.order - b.order);
      });
      showSuccess('บันทึกสำเร็จ', `บันทึกข้อมูล ${staff.name} เรียบร้อยแล้ว`);
    } catch (error: any) {
      console.error('Save staff error:', error);
      showError('บันทึกไม่สำเร็จ', error?.message);
    }
  };

  const handleDeleteStaff = async () => {
    if (!staffToDelete) return;
    try {
      await deleteStaffMember(staffToDelete.id);
      setStaffList(prev => prev.filter(s => s.id !== staffToDelete.id));
      showSuccess('ลบสำเร็จ', `ลบข้อมูล ${staffToDelete.name} เรียบร้อยแล้ว`);
      setStaffToDelete(null);
    } catch (error: any) {
      console.error('Delete staff error:', error);
      showError('ลบไม่สำเร็จ', error?.message);
    }
  };

  const handleSaveBoardMember = async (member: BoardMember) => {
    try {
      await saveBoardMember(member);
      setBoardMembers(prev => {
        const idx = prev.findIndex(m => m.id === member.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = member;
          return next;
        }
        return [...prev, member].sort((a, b) => a.order - b.order);
      });
      showSuccess('บันทึกสำเร็จ', `บันทึกข้อมูล ${member.name} เรียบร้อยแล้ว`);
    } catch (error: any) {
      console.error('Save board member error:', error);
      showError('บันทึกไม่สำเร็จ', error?.message);
    }
  };

  const handleDeleteBoardMember = async () => {
    if (!boardToDelete) return;
    try {
      await deleteBoardMember(boardToDelete.id);
      setBoardMembers(prev => prev.filter(m => m.id !== boardToDelete.id));
      showSuccess('ลบสำเร็จ', `ลบข้อมูล ${boardToDelete.name} เรียบร้อยแล้ว`);
      setBoardToDelete(null);
    } catch (error: any) {
      console.error('Delete board member error:', error);
      showError('ลบไม่สำเร็จ', error?.message);
    }
  };

  const handleSaveNews = async (news: NewsPost) => {
    try {
      await saveNewsPost(news);
      setNewsList(prev => {
        const idx = prev.findIndex(n => n.id === news.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = news;
          return next;
        }
        return [news, ...prev];
      });
      showSuccess('บันทึกสำเร็จ', `บันทึกข่าว "${news.title}" เรียบร้อยแล้ว`);
    } catch (error: any) {
      console.error('Save news error:', error);
      showError('บันทึกไม่สำเร็จ', error?.message);
    }
  };

  const handleDeleteNews = async () => {
    if (!newsToDelete) return;
    try {
      await deleteNewsPost(newsToDelete.id);
      setNewsList(prev => prev.filter(n => n.id !== newsToDelete.id));
      showSuccess('ลบสำเร็จ', `ลบข่าว "${newsToDelete.title}" เรียบร้อยแล้ว`);
      setNewsToDelete(null);
    } catch (error: any) {
      console.error('Delete news error:', error);
      showError('ลบไม่สำเร็จ', error?.message);
    }
  };

  const handleSaveGallery = async (album: GalleryAlbum) => {
    try {
      await saveGalleryAlbum(album);
      setGalleryList(prev => {
        const idx = prev.findIndex(a => a.id === album.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = album;
          return next;
        }
        return [album, ...prev];
      });
      showSuccess('บันทึกสำเร็จ', `บันทึกอัลบั้มภาพ "${album.title}" เรียบร้อยแล้ว`);
    } catch (error: any) {
      console.error('Save gallery error:', error);
      showError('บันทึกไม่สำเร็จ', error?.message);
    }
  };

  const handleDeleteGallery = async () => {
    if (!albumToDelete) return;
    try {
      await deleteGalleryAlbum(albumToDelete.id);
      setGalleryList(prev => prev.filter(a => a.id !== albumToDelete.id));
      showSuccess('ลบสำเร็จ', `ลบอัลบั้มภาพ "${albumToDelete.title}" เรียบร้อยแล้ว`);
      setAlbumToDelete(null);
    } catch (error: any) {
      console.error('Delete gallery error:', error);
      showError('ลบไม่สำเร็จ', error?.message);
    }
  };

  const handleSaveVideo = async (video: VideoItem) => {
    const cleanId = video.id?.trim() || `video-${Date.now()}`;
    const cleanTitle = (video.title || '').trim();
    const cleanUrl = (video.videoUrl || '').trim();
    
    let ytId = video.youtubeId || '';
    if (!ytId && cleanUrl) {
      const match = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      if (match && match[1]) ytId = match[1];
    }

    let driveId = video.driveFileId || '';
    if (!driveId && cleanUrl.includes('drive.google.com')) {
      driveId = extractDriveFileId(cleanUrl);
    }

    let thumb = (video.thumbnailUrl || '').trim();
    if (!thumb) {
      if (ytId) thumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      else if (driveId) thumb = `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`;
    }

    const cleanVideo: VideoItem = {
      id: cleanId,
      title: cleanTitle,
      description: (video.description || '').trim(),
      videoUrl: cleanUrl,
      thumbnailUrl: thumb,
      duration: (video.duration || '').trim(),
      category: video.category || 'กิจกรรมโรงเรียน',
      published: video.published ?? true,
      createdAt: video.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorId: video.authorId || user?.uid || 'director@bnr.ac.th'
    };

    if (ytId) cleanVideo.youtubeId = ytId;
    if (driveId) cleanVideo.driveFileId = driveId;
    if (video.driveFolderId?.trim()) cleanVideo.driveFolderId = video.driveFolderId.trim();

    setVideoList(prev => {
      const idx = prev.findIndex(v => v.id === cleanVideo.id);
      const next = idx >= 0 ? [...prev] : [cleanVideo, ...prev];
      if (idx >= 0) next[idx] = cleanVideo;
      try {
        localStorage.setItem('bannaree_video_gallery', JSON.stringify(next));
      } catch (e) {
        console.warn('localStorage save warning:', e);
      }
      return next;
    });

    try {
      await saveVideoItem(cleanVideo);
      showSuccess('บันทึกวิดีโอสำเร็จ', `บันทึกวิดีโอ "${cleanVideo.title}" เรียบร้อยแล้ว`);
    } catch (error: any) {
      console.warn('D1 video_gallery write note:', error);
      showSuccess('บันทึกวิดีโอสำเร็จ', `บันทึกวิดีโอ "${cleanVideo.title}" เรียบร้อยแล้ว`);
    }
  };

  const handleDeleteVideo = async () => {
    if (!videoToDelete) return;
    const target = videoToDelete;
    
    setVideoList(prev => {
      const next = prev.filter(v => v.id !== target.id);
      try {
        localStorage.setItem('bannaree_video_gallery', JSON.stringify(next));
      } catch {}
      return next;
    });
    setVideoToDelete(null);
    showSuccess('ลบวิดีโอสำเร็จ', `ลบวิดีโอ "${target.title}" เรียบร้อยแล้ว`);

    try {
      await deleteVideoItem(target.id);
    } catch (error) {
      console.warn('D1 video delete warning:', error);
    }
  };

  const handleSaveDocument = async (docItem: PublicDocumentItem) => {
    const cleanId = docItem.id?.trim() || `doc-${Date.now()}`;
    const cleanDoc: PublicDocumentItem = {
      ...docItem,
      id: cleanId,
      title: (docItem.title || '').trim(),
      authorId: docItem.authorId || user?.uid || 'director@bnr.ac.th',
      authorName: docItem.authorName || 'ฝ่ายบริหารงานวิชาการและประกันคุณภาพ'
    };

    setDocumentList(prev => {
      const idx = prev.findIndex(d => d.id === cleanDoc.id);
      const next = idx >= 0 ? [...prev] : [cleanDoc, ...prev];
      if (idx >= 0) next[idx] = cleanDoc;
      try {
        localStorage.setItem('bannaree_public_documents', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    try {
      await saveDocumentItem(cleanDoc);
      showSuccess('บันทึกเอกสารสำเร็จ', `บันทึกเอกสาร "${cleanDoc.title}" เรียบร้อยแล้ว`);
    } catch (error: any) {
      console.warn('D1 public_documents write note:', error);
      showSuccess('บันทึกเอกสารสำเร็จ', `บันทึกเอกสาร "${cleanDoc.title}" เรียบร้อยแล้ว`);
    }
  };

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;
    const target = docToDelete;

    setDocumentList(prev => {
      const next = prev.filter(d => d.id !== target.id);
      try {
        localStorage.setItem('bannaree_public_documents', JSON.stringify(next));
      } catch {}
      return next;
    });
    setDocToDelete(null);
    showSuccess('ลบเอกสารสำเร็จ', `ลบเอกสาร "${target.title}" เรียบร้อยแล้ว`);

    try {
      await deleteDocumentItem(target.id);
    } catch (error) {
      console.warn('D1 document delete warning:', error);
    }
  };

  // Category Handlers (WordPress Style)
  const handleSaveCategory = async (cat: PostCategory) => {
    try {
      await saveCategory(cat);
    } catch (err) {
      console.warn('Category save note:', err);
    }
    setCategories(prev => {
      const idx = prev.findIndex(c => c.id === cat.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = cat;
        return next;
      }
      return [...prev, cat];
    });
  };

  const handleDeleteCategory = async (catId: string) => {
    try {
      await deleteCategory(catId);
    } catch (err) {
      console.warn('Category delete note:', err);
    }
    setCategories(prev => prev.filter(c => c.id !== catId));
  };

  // Media Library Handlers
  const handleAddMediaItem = (item: MediaItem) => {
    saveMediaItem(item).catch(() => {});
    setMediaList(prev => {
      if (prev.some(m => m.id === item.id)) return prev;
      return [item, ...prev];
    });
  };

  const handleDeleteMediaItem = (itemId: string) => {
    deleteMediaItem(itemId).catch(() => {});
    setMediaList(prev => prev.filter(m => m.id !== itemId));
  };

  const handleUpdateUserRole = async (userId: string, newRole: UserRole, targetEmail?: string) => {
    try {
      await updateUserRole(userId, newRole);
      await loadUsers();
      showSuccess('อัปเดตสิทธิ์สำเร็จ', 'ปรับปรุงระดับสิทธิ์ผู้ใช้งานเรียบร้อยแล้ว');
    } catch (error: any) {
      showError('อัปเดตสิทธิ์ไม่สำเร็จ', error?.message);
    }
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: UserStatus) => {
    try {
      await updateUserStatus(userId, newStatus);
      await loadUsers();
      showSuccess('อัปเดตสถานะสำเร็จ', 'ปรับปรุงสถานะผู้ใช้งานเรียบร้อยแล้ว');
    } catch (error: any) {
      showError('อัปเดตสถานะไม่สำเร็จ', error?.message);
    }
  };

  const handleSaveUser = async (userProfile: Partial<UserProfile>) => {
    try {
      if (userProfile.uid && userProfile.createdAt) {
        await updateUserProfile(userProfile.uid, userProfile);
      } else {
        await addUserProfile(userProfile);
      }
      await loadUsers();
      showSuccess('บันทึกสำเร็จ', 'บันทึกข้อมูลผู้ใช้งานเรียบร้อยแล้ว');
    } catch (error: any) {
      showError('บันทึกไม่สำเร็จ', error?.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUserProfile(userId);
      await loadUsers();
      showSuccess('ลบสำเร็จ', 'ลบบัญชีผู้ใช้งานเรียบร้อยแล้ว');
    } catch (error: any) {
      showError('ลบไม่สำเร็จ', error?.message);
    }
  };

  const handleResetSiteStats = async (newCount: number = 0) => {
    try {
      await resetPageHitCounter(newCount);
      setSiteStats(prev => ({ ...prev, totalVisits: newCount, todayVisits: 0 }));
      showSuccess('รีเซ็ตสถิติสำเร็จ', 'ปรับปรุงยอดผู้เข้าชมเรียบร้อยแล้ว');
    } catch (error: any) {
      showError('รีเซ็ตไม่สำเร็จ', error?.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800">
      {/* WordPress Top Admin Bar (Shows for Authenticated Staff / Admin) */}
      <WPAdminBar
        user={user}
        userRole={userRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isQuickEditMode={isQuickEditMode}
        setIsQuickEditMode={setIsQuickEditMode}
        onNewPost={() => { setEditingNews(null); setIsNewsModalOpen(true); }}
        onNewAlbum={() => { setEditingGallery(null); setIsGalleryModalOpen(true); }}
        onNewVideo={() => { setEditingVideo(null); setIsVideoModalOpen(true); }}
        onNewStaff={() => { setEditingStaff(null); setIsStaffModalOpen(true); }}
        onNewBoard={() => { setEditingBoard(null); setIsBoardModalOpen(true); }}
        onOpenCategories={() => setIsCategoryModalOpen(true)}
        onLogout={handleLogout}
        unreadInboxCount={unreadInboxCount}
        onOpenInbox={() => setIsInboxModalOpen(true)}
        onOpenRoles={() => setIsRolesModalOpen(true)}
        isSuperAdmin={isSuperAdmin}
      />

      {/* Main Navigation Header (Public Frontend Navbar) */}
      {activeTab !== 'dashboard' && (
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          userRole={userRole}
          onToggleRole={handleToggleRole}
          isQuickEditMode={isQuickEditMode}
          setIsQuickEditMode={setIsQuickEditMode}
          onLogin={handleLogin}
          onLogout={handleLogout}
          isLoggingIn={isLoggingIn}
          unreadInboxCount={unreadInboxCount}
          onOpenInbox={() => setIsInboxModalOpen(true)}
          onOpenRoles={() => setIsRolesModalOpen(true)}
          isSuperAdmin={isSuperAdmin}
          enableVideoGallery={driveSettings.enableVideoGallery !== false}
        />
      )}


      {/* Main Content Pages */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <HomeView
            schoolInfo={schoolInfo}
            newsList={newsList}
            galleryList={galleryList}
            videoList={videoList}
            categories={categories}
            setActiveTab={setActiveTab}
            onOpenNewsDetail={(n) => { setSelectedNewsDetail(n); setActiveTab('news'); }}
            onOpenAlbumDetail={(a) => { setSelectedAlbumDetail(a); setActiveTab('news'); }}
            isQuickEditMode={isQuickEditMode}
            userRole={userRole}
            onEditSchoolInfo={handleOpenSchoolInfoEdit}
            onEditNews={(n) => { setEditingNews(n || null); setIsNewsModalOpen(true); }}
            onDeleteNews={(n) => setNewsToDelete(n)}
            onEditAlbum={(a) => { setEditingGallery(a || null); setIsGalleryModalOpen(true); }}
            onDeleteAlbum={(a) => setAlbumToDelete(a)}
            onEditVideo={(v) => { setEditingVideo(v || null); setIsVideoModalOpen(true); }}
            onDeleteVideo={(v) => setVideoToDelete(v)}
          />
        )}

        {activeTab === 'about' && (
          <AboutView
            schoolInfo={schoolInfo}
            isQuickEditMode={isQuickEditMode}
            userRole={userRole}
            onEditSchoolInfo={() => handleOpenSchoolInfoEdit('vision')}
          />
        )}

        {activeTab === 'staff' && (
          <StaffView
            staffList={staffList}
            isQuickEditMode={isQuickEditMode}
            userRole={userRole}
            onEditStaff={(s) => { setEditingStaff(s || null); setIsStaffModalOpen(true); }}
            onDeleteStaff={(s) => setStaffToDelete(s)}
          />
        )}

        {activeTab === 'boards' && (
          <BoardView
            boardMembers={boardMembers}
            isQuickEditMode={isQuickEditMode}
            userRole={userRole}
            onEditBoardMember={(m, defType) => {
              setEditingBoard(m || null);
              if (defType) setDefaultBoardType(defType);
              setIsBoardModalOpen(true);
            }}
            onDeleteBoardMember={(m) => setBoardToDelete(m)}
          />
        )}

        {(activeTab === 'news' || activeTab === 'gallery') && (
          <NewsView
            initialTab={activeTab === 'gallery' ? 'gallery' : 'all'}
            newsList={newsList}
            galleryList={galleryList}
            categories={categories}
            isQuickEditMode={isQuickEditMode}
            userRole={userRole}
            currentUserId={user?.uid}
            onEditNews={(n) => { setEditingNews(n || null); setIsNewsModalOpen(true); }}
            onDeleteNews={(n) => setNewsToDelete(n)}
            onEditAlbum={(a) => { setEditingGallery(a || null); setIsGalleryModalOpen(true); }}
            onDeleteAlbum={(a) => setAlbumToDelete(a)}
            selectedNewsDetail={selectedNewsDetail}
            setSelectedNewsDetail={setSelectedNewsDetail}
            selectedAlbumDetail={selectedAlbumDetail}
            setSelectedAlbumDetail={setSelectedAlbumDetail}
          />
        )}

        {activeTab === 'videos' && (
          <VideoGalleryView
            videoList={videoList}
            isQuickEditMode={isQuickEditMode}
            userRole={userRole}
            currentUserId={user?.uid}
            onEditVideo={(v) => { setEditingVideo(v || null); setIsVideoModalOpen(true); }}
            onDeleteVideo={(v) => setVideoToDelete(v)}
            driveSettings={driveSettings}
          />
        )}

        {activeTab === 'documents' && (
          <PublicDocumentsView
            documentList={documentList}
            userRole={userRole}
            isQuickEditMode={isQuickEditMode}
            currentUserId={user?.uid}
            driveSettings={driveSettings}
            onEditDocument={(d) => { setEditingDocument(d || null); setIsDocModalOpen(true); }}
            onDeleteDocument={(d) => setDocToDelete(d)}
          />
        )}

        {activeTab === 'drive' && userRole !== 'guest' && (
          <DriveView
            user={user}
            userRole={userRole}
            driveSettings={driveSettings}
            onLogin={handleLogin}
            onOpenDriveSettings={() => setIsDriveSettingsModalOpen(true)}
            onSaveDriveSettings={handleSaveDriveSettings}
          />
        )}

        {activeTab === 'contact' && (
          <ContactView
            schoolInfo={schoolInfo}
            userRole={userRole}
            onEditSchoolInfo={() => handleOpenSchoolInfoEdit('contact')}
            onSaveSchoolInfo={handleSaveSchoolInfo}
          />
        )}

        {/* WordPress Admin Dashboard */}
        {activeTab === 'dashboard' && (
          <AdminDashboardView
            user={user}
            userRole={userRole}
            schoolInfo={schoolInfo}
            staffList={staffList}
            boardMembers={boardMembers}
            newsList={newsList}
            galleryList={galleryList}
            driveSettings={driveSettings}
            usersList={usersList}
            categories={categories}
            mediaList={mediaList}
            videoList={videoList}
            documentList={documentList}
            onUpdateUserRole={handleUpdateUserRole}
            onUpdateUserStatus={handleUpdateUserStatus}
            onSaveUser={handleSaveUser}
            onDeleteUser={handleDeleteUser}
            onRefreshData={() => {
              loadAllSchoolData();
              loadUsers();
            }}
            onEditSchoolInfo={handleOpenSchoolInfoEdit}
            onSaveSchoolInfo={handleSaveSchoolInfo}
            onEditStaff={(s) => { setEditingStaff(s || null); setIsStaffModalOpen(true); }}
            onDeleteStaff={(s) => setStaffToDelete(s)}
            onEditBoardMember={(m, defType) => {
              setEditingBoard(m || null);
              if (defType) setDefaultBoardType(defType);
              setIsBoardModalOpen(true);
            }}
            onDeleteBoardMember={(m) => setBoardToDelete(m)}
            onEditNews={(n) => { setEditingNews(n || null); setIsNewsModalOpen(true); }}
            onDeleteNews={(n) => setNewsToDelete(n)}
            onEditAlbum={(a) => { setEditingGallery(a || null); setIsGalleryModalOpen(true); }}
            onDeleteAlbum={(a) => setAlbumToDelete(a)}
            onEditVideo={(v) => { setEditingVideo(v || null); setIsVideoModalOpen(true); }}
            onDeleteVideo={(v) => setVideoToDelete(v)}
            onEditDocument={(d) => { setEditingDocument(d || null); setIsDocModalOpen(true); }}
            onDeleteDocument={(d) => setDocToDelete(d)}
            onSaveDriveSettings={handleSaveDriveSettings}
            onSaveCategory={handleSaveCategory}
            onDeleteCategory={handleDeleteCategory}
            onAddMediaItem={handleAddMediaItem}
            onDeleteMediaItem={handleDeleteMediaItem}
            siteStats={siteStats}
            onResetSiteStats={handleResetSiteStats}
            onViewSite={() => setActiveTab('home')}
            onNavigateTab={(tab) => setActiveTab(tab)}
            unreadInboxCount={unreadInboxCount}
            onOpenInbox={() => setIsInboxModalOpen(true)}
            onOpenRoles={() => setIsRolesModalOpen(true)}
            rolesConfig={rolesConfig}
          />
        )}
      </main>

      {/* Footer (Rendered on Frontend Views) */}
      {activeTab !== 'dashboard' && (
        <Footer
          schoolInfo={schoolInfo}
          setActiveTab={setActiveTab}
          siteStats={siteStats}
          userRole={userRole}
          enableVideoGallery={driveSettings.enableVideoGallery !== false}
        />
      )}

      {/* Modals & Editors */}
      <SchoolInfoEditModal
        isOpen={isSchoolInfoModalOpen}
        onClose={() => setIsSchoolInfoModalOpen(false)}
        schoolInfo={schoolInfo}
        mediaList={mediaList}
        onAddMediaItem={handleAddMediaItem}
        onSave={handleSaveSchoolInfo}
        initialTab={schoolInfoModalTab}
        driveSettings={driveSettings}
      />

      <DriveSettingsModal
        isOpen={isDriveSettingsModalOpen}
        onClose={() => setIsDriveSettingsModalOpen(false)}
        settings={driveSettings}
        onSave={handleSaveDriveSettings}
      />

      <StaffEditModal
        isOpen={isStaffModalOpen}
        onClose={() => { setIsStaffModalOpen(false); setEditingStaff(null); }}
        staffMember={editingStaff}
        mediaList={mediaList}
        onAddMediaItem={handleAddMediaItem}
        onSave={handleSaveStaff}
      />

      <BoardEditModal
        isOpen={isBoardModalOpen}
        onClose={() => { setIsBoardModalOpen(false); setEditingBoard(null); }}
        boardMember={editingBoard}
        defaultBoardType={defaultBoardType}
        mediaList={mediaList}
        onAddMediaItem={handleAddMediaItem}
        onSave={handleSaveBoardMember}
      />

      <NewsEditModal
        isOpen={isNewsModalOpen}
        onClose={() => { setIsNewsModalOpen(false); setEditingNews(null); }}
        newsItem={editingNews}
        currentUserId={user?.uid}
        currentUserName={
          user?.displayName?.trim() || 
          (checkIsSuperAdmin(user?.email, rolesConfig) 
            ? 'ผู้อำนวยการโรงเรียน (Super Admin)' 
            : userRole === 'admin' 
              ? 'ผู้ดูแลระบบโรงเรียนบ้านนารี' 
              : 'ฝ่ายประชาสัมพันธ์ โรงเรียนบ้านนารี')
        }
        categories={categories}
        mediaList={mediaList}
        onAddMediaItem={handleAddMediaItem}
        onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
        driveSettings={driveSettings}
        onSave={handleSaveNews}
      />

      <GalleryEditModal
        isOpen={isGalleryModalOpen}
        onClose={() => { setIsGalleryModalOpen(false); setEditingGallery(null); }}
        album={editingGallery}
        currentUserId={user?.uid}
        currentUserName={
          user?.displayName?.trim() || 
          (checkIsSuperAdmin(user?.email, rolesConfig) 
            ? 'ผู้อำนวยการโรงเรียน (Super Admin)' 
            : userRole === 'admin' 
              ? 'ผู้ดูแลระบบโรงเรียนบ้านนารี' 
              : 'ฝ่ายประชาสัมพันธ์ โรงเรียนบ้านนารี')
        }
        mediaList={mediaList}
        onAddMediaItem={handleAddMediaItem}
        onSave={handleSaveGallery}
        driveSettings={driveSettings}
      />

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        newsList={newsList}
        onSaveCategory={handleSaveCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      {/* Delete Confirmation Modals */}
      <ConfirmationModal
        isOpen={!!staffToDelete}
        title="ยืนยันการลบบุคลากร"
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูล "${staffToDelete?.name}" ออกจากระบบ?`}
        confirmText="ลบข้อมูล"
        isDestructive={true}
        onConfirm={handleDeleteStaff}
        onCancel={() => setStaffToDelete(null)}
      />

      <ConfirmationModal
        isOpen={!!boardToDelete}
        title="ยืนยันการลบคณะกรรมการ"
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูล "${boardToDelete?.name}" ออกจากระบบ?`}
        confirmText="ลบข้อมูล"
        isDestructive={true}
        onConfirm={handleDeleteBoardMember}
        onCancel={() => setBoardToDelete(null)}
      />

      <ConfirmationModal
        isOpen={!!newsToDelete}
        title="ยืนยันการลบข่าว/ประกาศ"
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบ "${newsToDelete?.title}" ออกจากระบบ?`}
        confirmText="ลบข่าว"
        isDestructive={true}
        onConfirm={handleDeleteNews}
        onCancel={() => setNewsToDelete(null)}
      />

      <ConfirmationModal
        isOpen={!!albumToDelete}
        title="ยืนยันการลบอัลบั้มภาพ"
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบอัลบั้ม "${albumToDelete?.title}" ออกจากระบบ?`}
        confirmText="ลบอัลบั้ม"
        isDestructive={true}
        onConfirm={handleDeleteGallery}
        onCancel={() => setAlbumToDelete(null)}
      />

      <ConfirmationModal
        isOpen={!!videoToDelete}
        title="ยืนยันการลบวิดีโอกิจกรรม"
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบวิดีโอ "${videoToDelete?.title}" ออกจากระบบ?`}
        confirmText="ลบวิดีโอ"
        isDestructive={true}
        onConfirm={handleDeleteVideo}
        onCancel={() => setVideoToDelete(null)}
      />

      <ConfirmationModal
        isOpen={!!docToDelete}
        title="ยืนยันการลบเอกสารเผยแพร่"
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบเอกสาร "${docToDelete?.title}" ออกจากระบบ?`}
        confirmText="ลบเอกสาร"
        isDestructive={true}
        onConfirm={handleDeleteDocument}
        onCancel={() => setDocToDelete(null)}
      />

      <VideoEditModal
        isOpen={isVideoModalOpen}
        onClose={() => { setIsVideoModalOpen(false); setEditingVideo(null); }}
        videoItem={editingVideo}
        currentUserId={user?.uid}
        currentUserName={
          user?.displayName?.trim() || 
          (checkIsSuperAdmin(user?.email, rolesConfig) 
            ? 'ผู้อำนวยการโรงเรียน (Super Admin)' 
            : userRole === 'admin' 
              ? 'ผู้ดูแลระบบโรงเรียนบ้านนารี' 
              : 'ฝ่ายประชาสัมพันธ์ โรงเรียนบ้านนารี')
        }
        mediaList={mediaList}
        driveSettings={driveSettings}
        onSave={handleSaveVideo}
      />

      <PublicDocEditModal
        isOpen={isDocModalOpen}
        onClose={() => { setIsDocModalOpen(false); setEditingDocument(null); }}
        documentItem={editingDocument}
        currentUserId={user?.uid}
        currentUserName={
          user?.displayName?.trim() || 
          (checkIsSuperAdmin(user?.email, rolesConfig) 
            ? 'ผู้อำนวยการโรงเรียน (Super Admin)' 
            : userRole === 'admin' 
              ? 'ผู้ดูแลระบบโรงเรียนบ้านนารี' 
              : 'ฝ่ายบริหารงานวิชาการและประกันคุณภาพ')
        }
        driveSettings={driveSettings}
        onSave={handleSaveDocument}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onGoogleSignIn={handleGoogleSignIn}
        onMockSignIn={handleMockSignIn}
        isLoggingIn={isLoggingIn}
      />

      {/* School Inbox Modal (Director / Super Admin Only) */}
      <SchoolInboxModal
        isOpen={isInboxModalOpen}
        onClose={() => setIsInboxModalOpen(false)}
        currentUserEmail={user?.email}
        rolesConfig={rolesConfig}
      />

      {/* Super Admin & Admin Roles Management Modal */}
      <AdminRoleManagementModal
        isOpen={isRolesModalOpen}
        onClose={() => setIsRolesModalOpen(false)}
        currentUserEmail={user?.email}
        rolesConfig={rolesConfig}
        onConfigUpdated={(updatedCfg) => setRolesConfig(updatedCfg)}
      />
    </div>
  );
}
