import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Save, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  HardDrive, 
  Upload, 
  Sparkles, 
  AlertCircle, 
  RefreshCw,
  FolderOpen,
  CheckCircle,
  Eye,
  Search,
  Lock,
  FolderCheck,
  Check
} from 'lucide-react';
import { GalleryAlbum, MediaItem, DriveSettings } from '../types';
import { 
  fetchDriveFolderImages, 
  extractFolderId, 
  fetchDriveSubfolders, 
  findYearGalleryFolder, 
  getCurrentAcademicYearBE,
  createDriveFolder,
  uploadDriveFile,
  DriveFolderItem 
} from '../services/driveService';
import { MediaUploadModal } from './MediaUploadModal';

interface GalleryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  album?: GalleryAlbum | null;
  currentUserId?: string;
  currentUserName?: string;
  mediaList?: MediaItem[];
  onAddMediaItem?: (item: MediaItem) => void;
  onSave: (album: GalleryAlbum) => Promise<void>;
  driveSettings?: DriveSettings;
}

export const GalleryEditModal: React.FC<GalleryEditModalProps> = ({
  isOpen,
  onClose,
  album,
  currentUserId = 'system',
  currentUserName = 'ฝ่ายประชาสัมพันธ์ โรงเรียนบ้านนารี',
  mediaList = [],
  onAddMediaItem,
  onSave,
  driveSettings
}) => {
  const currentBE = getCurrentAcademicYearBE();

  const getDefaultAlbum = (): GalleryAlbum => ({
    id: `gallery-${Date.now()}`,
    title: '',
    description: '',
    activityDate: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
    coverImage: '/src/assets/images/school_stem_learning_1792082310522.jpg',
    images: [
      '/src/assets/images/school_stem_learning_1792082310522.jpg'
    ],
    driveFolderUrl: '',
    driveFolderId: '',
    authorId: currentUserId,
    createdAt: new Date().toISOString()
  });

  const [formData, setFormData] = useState<GalleryAlbum>(album || getDefaultAlbum());
  const [driveFolderInput, setDriveFolderInput] = useState(album?.driveFolderUrl || album?.driveFolderId || '');
  const [isFetchingDrive, setIsFetchingDrive] = useState(false);
  const [driveSyncSuccess, setDriveSyncSuccess] = useState<string | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaPickMode, setMediaPickMode] = useState<'cover' | 'album'>('album');

  // Interactive Drive Folder Browser States
  const [subfolders, setSubfolders] = useState<DriveFolderItem[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [subfolderSearch, setSubfolderSearch] = useState('');
  const [lockedYearFolderId, setLockedYearFolderId] = useState<string>('');
  const [lockedYearFolderName, setLockedYearFolderName] = useState<string>('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>(album?.driveFolderId || '');
  const [scanningFolderId, setScanningFolderId] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [customYearFolderInput, setCustomYearFolderInput] = useState<string>(() => {
    try {
      return localStorage.getItem('bannaree_year_gallery_folder_id') || '';
    } catch {
      return '';
    }
  });

  // Folder creation states
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load subfolders strictly under 05_คลังภาพกิจกรรมโรงเรียน_2569
  const loadDriveSubfolders = async (overrideFolderId?: string) => {
    setIsLoadingFolders(true);
    setDriveError(null);
    try {
      const targetInput = overrideFolderId || customYearFolderInput || driveSettings?.centralFolderId || '';
      if (overrideFolderId || customYearFolderInput) {
        try {
          const saveVal = extractFolderId(overrideFolderId || customYearFolderInput);
          if (saveVal) localStorage.setItem('bannaree_year_gallery_folder_id', saveVal);
        } catch {}
      }

      // Specifically resolve 05_คลังภาพกิจกรรมโรงเรียน_{currentBE}
      let yearFolder = await findYearGalleryFolder(targetInput, currentBE);

      if (!yearFolder && targetInput) {
        const cleanId = extractFolderId(targetInput);
        if (cleanId) {
          yearFolder = { id: cleanId, name: `05_คลังภาพกิจกรรมโรงเรียน_${currentBE}` };
        }
      }

      if (yearFolder) {
        setLockedYearFolderId(yearFolder.id);
        setLockedYearFolderName(yearFolder.name);

        let subs = await fetchDriveSubfolders(yearFolder.id);

        // Filter out non-activity / non-event subfolders if any
        if (subs.length > 0) {
          setSubfolders(subs);
        } else {
          // If yearFolder has no subfolders, check if yearFolder itself has images directly
          setSubfolders([]);
        }
      } else {
        setLockedYearFolderId('');
        setLockedYearFolderName(`05_คลังภาพกิจกรรมโรงเรียน_${currentBE}`);
        setSubfolders([]);
      }
    } catch (err: any) {
      console.warn('Error loading subfolders:', err);
      setSubfolders([]);
    } finally {
      setIsLoadingFolders(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const initial = album ? { ...album } : getDefaultAlbum();
      setFormData(initial);
      setDriveFolderInput(initial.driveFolderUrl || initial.driveFolderId || '');
      setSelectedFolderId(initial.driveFolderId || '');
      setDriveSyncSuccess(null);
      setDriveError(null);
      loadDriveSubfolders();
    }
  }, [isOpen, album]);

  const filteredSubfolders = subfolders.filter((f: DriveFolderItem) =>
    f.name.toLowerCase().includes(subfolderSearch.toLowerCase().trim())
  );

  const handleSelectActivityFolder = async (folder: DriveFolderItem) => {
    setSelectedFolderId(folder.id);
    setScanningFolderId(folder.id);
    setIsFetchingDrive(true);
    setDriveError(null);
    setDriveSyncSuccess(null);

    // Auto-set title if empty or default
    const cleanFolderName = folder.name.replace(/^[0-9]+[_\s.-]*/, '').trim();
    if (!formData.title || formData.title.includes('กิจกรรมใหม่')) {
      setFormData((prev: GalleryAlbum) => ({
        ...prev,
        title: cleanFolderName || folder.name
      }));
    }

    try {
      const fetched = await fetchDriveFolderImages(folder.id);
      if (fetched.length === 0) {
        setDriveError(`ไม่พบไฟล์รูปภาพในโฟลเดอร์ "${folder.name}"`);
        return;
      }

      const imageUrls = fetched.map(f => f.url);
      const newCover = imageUrls[0] || formData.coverImage;

      // Add to media library items as well
      fetched.forEach(img => {
        const item: MediaItem = {
          id: `drive-img-${img.id}`,
          name: img.name,
          url: img.url,
          thumbnailUrl: img.thumbnailUrl,
          mimeType: 'image/jpeg',
          uploadedAt: new Date().toISOString(),
          source: 'drive',
          driveFileId: img.id,
          driveFolderId: folder.id
        };
        if (onAddMediaItem) {
          onAddMediaItem(item);
        }
      });

      setFormData((prev: GalleryAlbum) => ({
        ...prev,
        coverImage: newCover,
        images: Array.from(new Set([...prev.images, ...imageUrls])),
        driveFolderId: folder.id,
        driveFolderUrl: `https://drive.google.com/drive/folders/${folder.id}`
      }));

      setDriveSyncSuccess(`ดึงรูปภาพสำเร็จ ${fetched.length} รูป จากโฟลเดอร์ "${folder.name}"!`);
    } catch (err: any) {
      setDriveError(err.message || 'เกิดข้อผิดพลาดในการดึงรูปภาพจาก Google Drive');
    } finally {
      setIsFetchingDrive(false);
      setScanningFolderId(null);
    }
  };

  if (!isOpen) return null;

  // 1. Fetch images directly from Google Drive Folder by URL or custom ID
  const handleSyncDriveFolder = async (customInput?: string) => {
    const targetInput = customInput || driveFolderInput;
    if (!targetInput.trim()) {
      setDriveError('กรุณากรอกลิงก์โฟลเดอร์ Google Drive หรือรหัสโฟลเดอร์');
      return;
    }

    setIsFetchingDrive(true);
    setDriveError(null);
    setDriveSyncSuccess(null);

    try {
      const cleanId = extractFolderId(targetInput.trim());
      const fetched = await fetchDriveFolderImages(targetInput.trim());

      if (fetched.length === 0) {
        setDriveError('ไม่พบไฟล์รูปภาพในโฟลเดอร์ Google Drive นี้ หรือโฟลเดอร์ยังไม่ได้เปิดสิทธิ์เข้าถึง');
        return;
      }

      const imageUrls = fetched.map(f => f.url);
      const newCover = imageUrls[0] || formData.coverImage;

      fetched.forEach(img => {
        const item: MediaItem = {
          id: 'drive-img-' + img.id,
          name: img.name,
          url: img.url,
          thumbnailUrl: img.thumbnailUrl,
          mimeType: 'image/jpeg',
          uploadedAt: new Date().toISOString(),
          source: 'drive',
          driveFileId: img.id,
          driveFolderId: cleanId
        };
        if (onAddMediaItem) {
          onAddMediaItem(item);
        }
      });

      setFormData(prev => ({
        ...prev,
        coverImage: newCover,
        images: Array.from(new Set([...prev.images, ...imageUrls])),
        driveFolderId: cleanId,
        driveFolderUrl: targetInput.trim()
      }));

      setDriveSyncSuccess('ดึงรูปภาพสำเร็จ ' + fetched.length + ' รูป จากโฟลเดอร์ Google Drive!');
    } catch (err: any) {
      setDriveError(err.message || 'เกิดข้อผิดพลาดในการดึงรูปภาพจาก Google Drive');
    } finally {
      setIsFetchingDrive(false);
    }
  };

  const handleCreateNewFolder = async () => {
    if (!newFolderName.trim() || !lockedYearFolderId) return;

    setIsCreatingFolder(true);
    setDriveError(null);
    try {
      const newFolder = await createDriveFolder(lockedYearFolderId, newFolderName.trim());
      // Refresh list
      await loadDriveSubfolders();
      // Select the new folder
      handleSelectActivityFolder({ id: newFolder.id, name: newFolder.name });
      setShowNewFolderInput(false);
      setNewFolderName('');
      setDriveSyncSuccess('สร้างโฟลเดอร์ "' + newFolder.name + '" สำเร็จ!');
    } catch (err: any) {
      setDriveError(err.message || 'ไม่สามารถสร้างโฟลเดอร์ใหม่ได้');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // 2. Multi-file upload from device
  const handleLocalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newUrls: string[] = [];
    setIsFetchingDrive(true);
    setDriveError(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      try {
        let finalUrl: string;
        let driveId: string | undefined;

        if (selectedFolderId) {
          // Upload to selected Drive folder
          const uploaded = await uploadDriveFile(selectedFolderId, file);
          finalUrl = 'https://lh3.googleusercontent.com/d/' + uploaded.id + '=w1600';
          driveId = uploaded.id;
        } else {
          // Fallback to local preview
          finalUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        }

        newUrls.push(finalUrl);

        const mediaItem: MediaItem = {
          id: driveId ? 'drive-img-' + driveId : 'media-upload-' + Date.now() + '-' + i,
          name: file.name,
          url: finalUrl,
          thumbnailUrl: driveId ? 'https://drive.google.com/thumbnail?id=' + driveId + '&sz=w400' : finalUrl,
          size: Math.round(file.size / 1024) + ' KB',
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
          source: driveId ? 'drive' : 'upload',
          driveFileId: driveId,
          driveFolderId: selectedFolderId || undefined
        };

        if (onAddMediaItem) {
          onAddMediaItem(mediaItem);
        }
      } catch (err: any) {
        setDriveError('ไม่สามารถอัปโหลดไฟล์ ' + file.name + ' ได้: ' + (err.message || 'เกิดข้อผิดพลาด'));
      }
    }

    if (newUrls.length > 0) {
      setFormData((prev: GalleryAlbum) => ({
        ...prev,
        coverImage: prev.coverImage || newUrls[0],
        images: [...prev.images, ...newUrls]
      }));
    }
    setIsFetchingDrive(false);
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev: GalleryAlbum) => ({
      ...prev,
      images: prev.images.filter((_: string, i: number) => i !== index)
    }));
  };

  const handleSetCover = (url: string) => {
    setFormData((prev: GalleryAlbum) => ({
      ...prev,
      coverImage: url
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setSaving(true);
    try {
      await onSave({
        ...formData,
        coverImage: formData.coverImage || formData.images[0] || '/src/assets/images/school_stem_learning_1792082310522.jpg',
        driveFolderUrl: driveFolderInput.trim(),
        driveFolderId: extractFolderId(driveFolderInput.trim()),
        authorId: album ? (album.authorId || currentUserId) : currentUserId,
        authorName: album?.authorName || currentUserName,
        updatedAt: new Date().toISOString()
      });
      onClose();
    } catch (err) {
      console.error('Error saving album:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-[#1d2327] text-white flex items-center justify-between border-b border-[#3c434a]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-none">
                  {album ? 'แก้ไขอัลบั้มภาพกิจกรรม' : 'สร้างอัลบั้มภาพกิจกรรมใหม่ (Add Gallery)'}
                </h3>
                <p className="text-2xs text-slate-400 mt-1">อัปโหลดภาพกิจกรรม หรือเชื่อมต่อดึงภาพจาก Google Drive Folder</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-sm text-slate-700">
            {/* Title & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  ชื่อกิจกรรม / อัลบั้ม <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="เช่น กิจกรรมค่ายสะเต็มศึกษา (STEM) ประจำปีการศึกษา 2569"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-sm font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">วันที่จัดกิจกรรม</label>
                <input
                  type="text"
                  value={formData.activityDate}
                  onChange={(e) => setFormData({ ...formData, activityDate: e.target.value })}
                  placeholder="เช่น 18 สิงหาคม 2568"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-xs"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">คำบรรยายกิจกรรม</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="รายละเอียดกิจกรรม ผลที่ได้รับ และความร่วมมือของนักเรียนและครู..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-xs"
              />
            </div>

            {/* ⚡ GOOGLE DRIVE AUTOMATIC FOLDER BROWSER SECTION */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-50 border border-blue-200/80 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold shadow-2xs shrink-0">
                    <HardDrive className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>ดึงภาพจากโฟลเดอร์ Google Drive อัตโนมัติ</span>
                      <span className="px-2 py-0.2 rounded-full text-3xs font-extrabold bg-blue-100 text-blue-800 border border-blue-300">
                        เลือกโฟลเดอร์ได้เลย
                      </span>
                    </h4>
                    <p className="text-2xs text-slate-600 mt-0.5">
                      คลิกเลือกโฟลเดอร์กิจกรรมจากคลังภาพโรงเรียน ระบบจะสแกนดึงรูปภาพและชื่อกิจกรรมเข้าสู่อัลบั้มทันที
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewFolderInput(!showNewFolderInput)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-2xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>สร้างโฟลเดอร์ใหม่</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => loadDriveSubfolders()}
                    disabled={isLoadingFolders}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-2xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer shrink-0 self-start sm:self-auto transition-colors"
                  >
                    <RefreshCw className={'w-3 h-3 text-blue-600 ' + (isLoadingFolders ? 'animate-spin' : '')} />
                    <span>รีเฟรชโฟลเดอร์</span>
                  </button>
                </div>
              </div>

              {/* Locked Path Info Banner */}
              <div className="p-2.5 bg-amber-500/10 border border-amber-300/80 rounded-xl flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-3xs font-extrabold text-amber-900 bg-amber-200/90 px-1.5 py-0.2 rounded mr-1.5">
                      ตำแหน่งโฟลเดอร์หลักปีการศึกษา พ.ศ. {currentBE} (ล็อกมาตรฐาน)
                    </span>
                    <p className="font-bold text-slate-800 truncate text-2xs mt-0.5 font-mono">
                      {lockedYearFolderName || '05_คลังภาพกิจกรรมโรงเรียน_' + currentBE}
                    </p>
                  </div>
                </div>
                <span className="text-3xs text-slate-500 shrink-0 font-medium hidden sm:inline">
                  (เปลี่ยน Path ไม่ได้)
                </span>
              </div>

              {/* New Folder Creation Input */}
              {showNewFolderInput && (
                <div className="p-3 bg-blue-900/5 border border-blue-200 rounded-xl space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-2xs font-bold text-blue-900">ระบุชื่อโฟลเดอร์กิจกรรมใหม่ที่ต้องการสร้าง:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="เช่น กิจกรรมวันไหว้ครู 2569"
                      className="flex-1 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                      type="button"
                      onClick={handleCreateNewFolder}
                      disabled={isCreatingFolder || !newFolderName.trim()}
                      className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                    >
                      {isCreatingFolder ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>สร้างและเลือก</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewFolderInput(false)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-all"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              )}

              {/* Subfolders Browser Grid / Cards */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-2xs font-bold text-slate-700">
                    เลือกโฟลเดอร์รูปภาพกิจกรรมใต้ปี {currentBE} ({filteredSubfolders.length} โฟลเดอร์):
                  </span>
                  
                  {/* Search subfolder */}
                  <div className="relative w-48 sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      value={subfolderSearch}
                      onChange={(e) => setSubfolderSearch(e.target.value)}
                      placeholder="ค้นชื่อกิจกรรม..."
                      className="w-full pl-8 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-2xs focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {isLoadingFolders ? (
                  <div className="text-center py-6 bg-white/70 rounded-xl border border-slate-200 text-xs text-slate-500 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                    <span>กำลังโหลดรายชื่อโฟลเดอร์กิจกรรมจาก Google Drive...</span>
                  </div>
                ) : filteredSubfolders.length === 0 ? (
                  <div className="text-center py-6 bg-white/70 rounded-xl border border-slate-200 text-xs text-slate-500 space-y-3 p-4">
                    <FolderOpen className="w-8 h-8 text-amber-500/80 mx-auto" />
                    <div>
                      <p className="font-bold text-slate-800 text-xs">
                        {subfolderSearch ? 'ไม่พบโฟลเดอร์กิจกรรมที่ตรงกับคำค้น' : 'ไม่พบโฟลเดอร์ย่อยใน 05_คลังภาพกิจกรรมโรงเรียน_' + currentBE}
                      </p>
                      <p className="text-2xs text-slate-500 mt-1 max-w-lg mx-auto leading-relaxed">
                        ท่านสามารถระบุ Folder ID หรือ URL ของโฟลเดอร์ <strong className="text-slate-700 text-xs">05_คลังภาพกิจกรรมโรงเรียน_{currentBE}</strong> หรือสร้างโฟลเดอร์ใหม่ด้านบนได้เลยครับ
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-xl mx-auto pt-1">
                      <input
                        type="text"
                        value={customYearFolderInput}
                        onChange={(e) => setCustomYearFolderInput(e.target.value)}
                        placeholder={'ระบุ Folder ID หรือ URL ของ 05_คลังภาพกิจกรรมโรงเรียน_' + currentBE + '...'}
                        className="w-full sm:flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-blue-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => loadDriveSubfolders(customYearFolderInput)}
                        disabled={isLoadingFolders || !customYearFolderInput.trim()}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        {isLoadingFolders ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FolderCheck className="w-3.5 h-3.5 text-amber-300" />}
                        <span>โหลดโฟลเดอร์กิจกรรม</span>
                      </button>
                    </div>

                    {lockedYearFolderId && (
                      <div className="pt-2 border-t border-slate-200/80">
                        <button
                          type="button"
                          onClick={() => handleSelectActivityFolder({ id: lockedYearFolderId, name: lockedYearFolderName || '05_คลังภาพกิจกรรมโรงเรียน_' + currentBE })}
                          disabled={isFetchingDrive}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>ดึงภาพทั้งหมดจากโฟลเดอร์หลักนี้โดยตรง ({lockedYearFolderName})</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 bg-white/80 rounded-xl border border-slate-200">
                    {filteredSubfolders.map((folder) => {
                      const isSelected = selectedFolderId === folder.id;
                      const isScanningThis = isFetchingDrive && scanningFolderId === folder.id;

                      return (
                        <div
                          key={folder.id}
                          onClick={() => handleSelectActivityFolder(folder)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 group ${
                            isSelected
                              ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-2xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-blue-600 text-white' : 'bg-amber-100 text-amber-700 group-hover:bg-amber-200'}`}>
                              <FolderOpen className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs font-bold truncate leading-tight ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                                {folder.name}
                              </p>
                              <p className="text-3xs text-slate-400 mt-0.5">
                                คลิกเพื่อดึงภาพเข้าสู่อัลบั้ม
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={isFetchingDrive}
                            className={`px-2.5 py-1 rounded-lg text-3xs font-extrabold shrink-0 flex items-center gap-1 transition-colors ${
                              isScanningThis
                                ? 'bg-blue-700 text-white'
                                : isSelected
                                ? 'bg-blue-900 text-white'
                                : 'bg-slate-100 text-slate-700 group-hover:bg-blue-600 group-hover:text-white'
                            }`}
                          >
                            {isScanningThis ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>กำลังสแกน...</span>
                              </>
                            ) : isSelected ? (
                              <>
                                <FolderCheck className="w-3 h-3 text-amber-300" />
                                <span>เลือกแล้ว</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3 text-amber-500" />
                                <span>เลือกโฟลเดอร์นี้</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Status Messages */}
              {driveSyncSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-150">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span className="font-semibold">{driveSyncSuccess}</span>
                </div>
              )}

              {driveError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{driveError}</span>
                </div>
              )}

              {/* Collapsible Manual Link input fallback */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowManualInput(!showManualInput)}
                  className="text-3xs text-slate-500 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>{showManualInput ? '▲ ซ่อนการระบุลิงก์แบบปรับเอง' : '▼ ระบุลิงก์ Google Drive แบบปรับเอง (กรณีโฟลเดอร์อยู่นอกโครงสร้างหลัก)'}</span>
                </button>

                {showManualInput && (
                  <div className="flex flex-col sm:flex-row gap-2 pt-2 animate-in fade-in duration-150">
                    <div className="relative flex-1">
                      <FolderOpen className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={driveFolderInput}
                        onChange={(e) => setDriveFolderInput(e.target.value)}
                        placeholder="วางลิงก์โฟลเดอร์ Google Drive แบบกำหนดเอง..."
                        className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 font-medium"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSyncDriveFolder(driveFolderInput)}
                      disabled={isFetchingDrive || !driveFolderInput.trim()}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-2xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                    >
                      {isFetchingDrive ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                      <span>ดึงจากลิงก์นี้</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Photo Action Bar: Upload Files, Media Library, Add URL */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  รูปภาพในอัลบั้ม ({formData.images.length} รูป)
                </span>
                <span className="text-2xs text-slate-500 hidden sm:inline">
                  (คลิกที่รูปเพื่อตั้งเป็นภาพหน้าปก)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Hidden Multi-file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleLocalFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <Upload className={'w-3.5 h-3.5 ' + (isFetchingDrive ? 'animate-bounce' : '')} />
                  <span>{isFetchingDrive ? 'กำลังอัปโหลด...' : (selectedFolderId ? 'อัปโหลดลง Drive' : 'อัปโหลดรูปจากเครื่อง')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMediaPickMode('album');
                    setIsMediaModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>เลือกจากคลังสื่อ</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMediaPickMode('cover');
                    setIsMediaModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                  <span>เปลี่ยนภาพหน้าปก</span>
                </button>
              </div>
            </div>

            {/* Photo Thumbnails Grid */}
            {formData.images.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">ยังไม่มีรูปภาพในอัลบั้ม</p>
                <p className="text-2xs text-slate-400 mt-0.5">
                  ใช้วิธีดึงภาพจาก Google Drive หรือกดปุ่ม "อัปโหลดรูปจากเครื่อง" ด้านบน
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-80 overflow-y-auto p-1 border border-slate-200 rounded-2xl bg-slate-50/50">
                {formData.images.map((imgUrl: string, idx: number) => {
                  const isCover = formData.coverImage === imgUrl;
                  return (
                    <div 
                      key={idx}
                      className={`group relative aspect-square rounded-xl overflow-hidden border-2 bg-white transition-all shadow-2xs ${
                        isCover ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Photo ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />

                      {/* Cover Badge */}
                      {isCover && (
                        <div className="absolute top-1.5 left-1.5 bg-amber-500 text-slate-950 font-extrabold text-3xs px-2 py-0.5 rounded-md shadow-xs">
                          หน้าปกอัลบั้ม
                        </div>
                      )}

                      {/* Hover Overlay Actions */}
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="p-1 rounded-md bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer"
                            title="ลบรูปนี้ออกจากอัลบั้ม"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {!isCover && (
                          <button
                            type="button"
                            onClick={() => handleSetCover(imgUrl)}
                            className="w-full py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-2xs rounded-md shadow-xs transition-colors cursor-pointer"
                          >
                            ตั้งเป็นหน้าปก
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={saving || formData.images.length === 0}
                className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'กำลังบันทึก...' : 'บันทึกอัลบั้มกิจกรรม'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Media Upload Modal */}
      {isMediaModalOpen && (
        <MediaUploadModal
          isOpen={isMediaModalOpen}
          onClose={() => setIsMediaModalOpen(false)}
          onSelect={(urls: string[]) => {
            if (mediaPickMode === 'cover') {
              if (urls.length > 0) {
                setFormData((prev: GalleryAlbum) => ({ ...prev, coverImage: urls[0] }));
              }
            } else {
              setFormData((prev: GalleryAlbum) => ({
                ...prev,
                images: Array.from(new Set([...prev.images, ...urls])),
                coverImage: prev.coverImage || urls[0]
              }));
            }
          }}
          mediaList={mediaList}
          onAddMediaItem={onAddMediaItem}
          multiple={mediaPickMode === 'album'}
          title={mediaPickMode === 'cover' ? 'เลือกภาพหน้าปกอัลบั้ม' : 'เลือกภาพกิจกรรมเข้าสู่อัลบั้ม'}
          initialSelectedUrl={mediaPickMode === 'cover' ? formData.coverImage : ''}
          driveSettings={driveSettings}
        />
      )}
    </>
  );
};
