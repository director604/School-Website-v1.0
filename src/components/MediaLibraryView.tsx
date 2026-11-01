import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderOpen, 
  FolderPlus, 
  Image as ImageIcon, 
  Upload, 
  HardDrive, 
  Search, 
  Trash2, 
  Check, 
  ArrowLeft, 
  Sparkles, 
  RefreshCw, 
  Folder,
  Lock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { MediaItem, DriveSettings } from '../types';
import { 
  extractFolderId, 
  fetchDriveFolderImages, 
  fetchDriveSubfolders,
  validateDriveFolder, 
  createDriveFolder, 
  uploadDriveFile, 
  findYearGalleryFolder, 
  getCurrentAcademicYearBE 
} from '../services/driveService';
import { getAccessToken, connectGoogleDrive } from '../firebase';
import { showSuccess, showError } from '../utils/sweetalert';
import { ConfirmationModal } from './ConfirmationModal';

export interface MediaFolder {
  id: string;
  name: string;
  category?: 'drive';
  description?: string;
  createdAt?: string;
  driveFolderId: string;
}

interface MediaLibraryViewProps {
  mediaList: MediaItem[];
  onAddMediaItem: (item: MediaItem) => void;
  onDeleteMediaItem?: (itemId: string) => void;
  isSelectable?: boolean;
  multiple?: boolean;
  selectedUrls?: string[];
  onToggleSelect?: (url: string) => void;
  driveSettings?: DriveSettings;
  targetFolderId?: string;
}

export const MediaLibraryView: React.FC<MediaLibraryViewProps> = ({
  mediaList,
  onAddMediaItem,
  onDeleteMediaItem,
  isSelectable = false,
  multiple = false,
  selectedUrls = [],
  onToggleSelect,
  driveSettings,
  targetFolderId
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [driveFolders, setDriveFolders] = useState<MediaFolder[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [parentFolderInfo, setParentFolderInfo] = useState<{ id: string; name: string } | null>(null);

  const [folderImagesMap, setFolderImagesMap] = useState<Record<string, MediaItem[]>>({});
  const [isLoadingFolderImages, setIsLoadingFolderImages] = useState(false);

  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [driveSyncInput, setDriveSyncInput] = useState('');
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [showDriveImportBox, setShowDriveImportBox] = useState(false);
  
  useEffect(() => {
    loadRealDriveFolders();
  }, [targetFolderId, driveSettings?.centralFolderId]);

  const loadRealDriveFolders = async () => {
    setIsLoadingFolders(true);
    try {
      let parentId = targetFolderId ? extractFolderId(targetFolderId) : '';
      let parentName = '05_คลังภาพกิจกรรมโรงเรียน_' + getCurrentAcademicYearBE();

      if (!parentId && driveSettings?.centralFolderId) {
        const centralClean = extractFolderId(driveSettings.centralFolderId);
        const galleryFolder = await findYearGalleryFolder(centralClean, getCurrentAcademicYearBE());
        if (galleryFolder?.id) {
          parentId = galleryFolder.id;
          parentName = galleryFolder.name;
        } else {
          parentId = centralClean;
        }
      }

      if (!parentId) {
        const galleryFolder = await findYearGalleryFolder('', getCurrentAcademicYearBE());
        if (galleryFolder?.id) {
          parentId = galleryFolder.id;
          parentName = galleryFolder.name;
        }
      }

      if (!parentId) {
        setDriveFolders([]);
        setIsLoadingFolders(false);
        return;
      }

      setParentFolderInfo({ id: parentId, name: parentName });

      const subs = await fetchDriveSubfolders(parentId);
      const mappedFolders: MediaFolder[] = subs.map(sub => ({
        id: `drive-${sub.id}`,
        name: sub.name,
        category: 'drive',
        driveFolderId: sub.id,
        description: `โฟลเดอร์ Google Drive (${sub.name})`
      }));

      setDriveFolders(mappedFolders);
    } catch (err) {
      console.warn('Error loading drive subfolders:', err);
    } finally {
      setIsLoadingFolders(false);
    }
  };

  useEffect(() => {
    if (!selectedFolderId || selectedFolderId === 'folder-all') return;

    const folderObj = driveFolders.find(f => f.id === selectedFolderId);
    const driveFolderId = folderObj?.driveFolderId || (selectedFolderId.startsWith('drive-') ? selectedFolderId.replace('drive-', '') : null);

    if (driveFolderId) {
      loadImagesForDriveFolder(driveFolderId, selectedFolderId);
    }
  }, [selectedFolderId, driveFolders]);

  const loadImagesForDriveFolder = async (cleanDriveFolderId: string, folderKey: string) => {
    setIsLoadingFolderImages(true);
    try {
      const images = await fetchDriveFolderImages(cleanDriveFolderId);
      const mediaItems: MediaItem[] = images.map(img => ({
        id: `drive-media-${img.id}`,
        name: img.name,
        url: img.url,
        thumbnailUrl: img.thumbnailUrl,
        mimeType: 'image/jpeg',
        uploadedAt: new Date().toISOString(),
        source: 'drive',
        driveFileId: img.id,
        driveFolderId: cleanDriveFolderId
      }));

      setFolderImagesMap(prev => ({
        ...prev,
        [folderKey]: mediaItems
      }));
    } catch (err) {
      console.warn(`Error loading images for folder ${cleanDriveFolderId}:`, err);
    } finally {
      setIsLoadingFolderImages(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setIsCreatingFolder(true);
    try {
      let parentDriveId = parentFolderInfo?.id;

      if (!parentDriveId) {
        let parentId = targetFolderId ? extractFolderId(targetFolderId) : '';
        if (!parentId && driveSettings?.centralFolderId) {
          const centralClean = extractFolderId(driveSettings.centralFolderId);
          const galleryFolder = await findYearGalleryFolder(centralClean, getCurrentAcademicYearBE());
          if (galleryFolder?.id) parentId = galleryFolder.id;
        }
        if (!parentId) {
          const galleryFolder = await findYearGalleryFolder('', getCurrentAcademicYearBE());
          if (galleryFolder?.id) parentId = galleryFolder.id;
        }
        parentDriveId = parentId || 'root';
      }

      const token = await getAccessToken();
      if (!token) {
        try {
          await connectGoogleDrive();
        } catch (err: any) {
          showError('ต้องการสิทธิ์ Google Drive', err.message || 'กรุณายืนยันสิทธิ์เข้าถึง Google Drive ก่อนสร้างโฟลเดอร์');
          setIsCreatingFolder(false);
          return;
        }
      }

      const createdDriveFolder = await createDriveFolder(parentDriveId, newFolderName.trim());
      const newFolderId = `drive-${createdDriveFolder.id}`;

      const newFolderObj: MediaFolder = {
        id: newFolderId,
        name: createdDriveFolder.name,
        category: 'drive',
        driveFolderId: createdDriveFolder.id,
        description: newFolderDesc.trim() || `โฟลเดอร์ใน Google Drive (${createdDriveFolder.name})`,
        createdAt: new Date().toISOString()
      };

      setDriveFolders(prev => [newFolderObj, ...prev]);
      setSelectedFolderId(newFolderId);
      setNewFolderName('');
      setNewFolderDesc('');
      setShowNewFolderModal(false);

      showSuccess(
        'สร้างโฟลเดอร์ใน Google Drive สำเร็จ!',
        `สร้างโฟลเดอร์ "${createdDriveFolder.name}" ใน Google Drive เรียบร้อยแล้ว`
      );

      loadRealDriveFolders();
    } catch (err: any) {
      showError('ไม่สามารถสร้างโฟลเดอร์ได้', err.message || 'เกิดข้อผิดพลาดในการสร้างโฟลเดอร์ใน Google Drive');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const getFolderMediaItems = (folderId: string): MediaItem[] => {
    if (folderId === 'folder-all') {
      const mapImages = Object.values(folderImagesMap).flat();
      const combined = [...mediaList];
      mapImages.forEach(img => {
        if (!combined.some(m => m.id === img.id || m.url === img.url)) {
          combined.push(img);
        }
      });
      return combined;
    }

    const fetchedItems = folderImagesMap[folderId] || [];
    const propsItems = mediaList.filter(item => {
      const cleanItemFolderId = item.driveFolderId ? extractFolderId(item.driveFolderId) : null;
      const targetFolderObj = driveFolders.find(f => f.id === folderId);
      return cleanItemFolderId && targetFolderObj?.driveFolderId === cleanItemFolderId;
    });

    const combined = [...fetchedItems];
    propsItems.forEach(item => {
      if (!combined.some(m => m.id === item.id || m.url === item.url)) {
        combined.push(item);
      }
    });

    return combined;
  };

  const getFolderMediaCount = (folderId: string): number => {
    return getFolderMediaItems(folderId).length;
  };

  const getFolderPreviewImage = (folderId: string): string => {
    const items = getFolderMediaItems(folderId);
    return items[0]?.thumbnailUrl || items[0]?.url || '/src/assets/images/school_stem_learning_1792082310522.jpg';
  };

  const handleLocalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const targetFolder = driveFolders.find(f => f.id === selectedFolderId);

    let driveFolderId = targetFolder?.driveFolderId;
    if (!driveFolderId && selectedFolderId && selectedFolderId.startsWith('drive-')) {
      driveFolderId = selectedFolderId.replace('drive-', '');
    }
    if (!driveFolderId && parentFolderInfo?.id) {
      driveFolderId = parentFolderInfo.id;
    }
    if (!driveFolderId && targetFolderId) {
      driveFolderId = extractFolderId(targetFolderId);
    }
    if (!driveFolderId && driveSettings?.centralFolderId) {
      driveFolderId = extractFolderId(driveSettings.centralFolderId);
    }

    if (!driveFolderId) {
      showError('ไม่พบโฟลเดอร์ปลายทาง', 'ยังไม่มีโฟลเดอร์ย่อยใน Google Drive ท่านสามารถวางลิงก์โฟลเดอร์ Google Drive หรือกดปุ่มสร้างโฟลเดอร์ใหม่ผ่านระบบ Drive ได้ทันทีครับ');
      setIsUploading(false);
      return;
    }

    setPendingFiles(files);
    setShowConfirmModal(true);
    setIsUploading(false);
  };

  const executeUpload = async () => {
    if (!pendingFiles) return;
    setIsUploading(true);
    setShowConfirmModal(false);
    
    const targetFolder = driveFolders.find(f => f.id === selectedFolderId);

    let driveFolderId = targetFolder?.driveFolderId;
    if (!driveFolderId && selectedFolderId && selectedFolderId.startsWith('drive-')) {
      driveFolderId = selectedFolderId.replace('drive-', '');
    }
    if (!driveFolderId && parentFolderInfo?.id) {
      driveFolderId = parentFolderInfo.id;
    }
    if (!driveFolderId && targetFolderId) {
      driveFolderId = extractFolderId(targetFolderId);
    }
    if (!driveFolderId && driveSettings?.centralFolderId) {
      driveFolderId = extractFolderId(driveSettings.centralFolderId);
    }

    let successCount = 0;
    for (let i = 0; i < pendingFiles.length; i++) {
      const file = pendingFiles[i];
      if (!file.type.startsWith('image/')) continue;
      try {
        const token = await getAccessToken();
        if (!token) await connectGoogleDrive();
        const uploaded = await uploadDriveFile(driveFolderId!, file);
        const imgUrl = uploaded.webViewLink || `https://lh3.googleusercontent.com/d/${uploaded.id}=w1600`;
        const thumbUrl = uploaded.thumbnailLink || `https://drive.google.com/thumbnail?id=${uploaded.id}&sz=w400`;
        const mediaItem: MediaItem = {
          id: `drive-media-${uploaded.id}`,
          name: uploaded.name,
          url: imgUrl,
          thumbnailUrl: thumbUrl,
          size: uploaded.size || `${Math.round(file.size / 1024)} KB`,
          mimeType: uploaded.mimeType || file.type,
          uploadedAt: new Date().toISOString(),
          source: 'drive',
          driveFileId: uploaded.id,
          driveFolderId: driveFolderId!
        };
        onAddMediaItem(mediaItem);
        successCount++;
      } catch (err: any) {
        showError('ไม่สามารถอัปโหลดไฟล์ได้', err.message || `อัปโหลดไฟล์ ${file.name} ไม่สำเร็จ`);
      }
    }
    setIsUploading(false);
    setPendingFiles(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (successCount > 0 && selectedFolderId) {
      loadImagesForDriveFolder(driveFolderId!, selectedFolderId);
      showSuccess(
        'อัปโหลดขึ้น Google Drive สำเร็จ!',
        `อัปโหลด ${successCount} รูปเข้าสู่โฟลเดอร์ "${targetFolder?.name || parentFolderInfo?.name || 'Google Drive'}" เรียบร้อยแล้ว`
      );
    }
  };

  const handleImportDriveToFolder = async () => {
    if (!driveSyncInput.trim()) return;

    setIsSyncingDrive(true);
    try {
      const cleanId = extractFolderId(driveSyncInput.trim());
      const fetched = await fetchDriveFolderImages(driveSyncInput.trim());

      if (fetched.length === 0) {
        showError('ไม่พบรูปภาพ', 'ไม่พบไฟล์รูปภาพในโฟลเดอร์ Google Drive นี้ หรือโฟลเดอร์ยังไม่ได้เปิดสิทธิ์แชร์');
      } else {
        const details = await validateDriveFolder(cleanId);
        const driveFolderName = details.valid && details.name 
          ? details.name 
          : `โฟลเดอร์ Google Drive (${cleanId.slice(0, 8)})`;

        const newDriveFolder: MediaFolder = {
          id: `drive-${cleanId}`,
          name: driveFolderName,
          category: 'drive',
          driveFolderId: cleanId,
          description: `รูปภาพดึงมาจาก Google Drive (${driveFolderName})`,
          createdAt: new Date().toISOString()
        };

        setDriveFolders(prev => {
          if (!prev.some(f => f.id === newDriveFolder.id || f.driveFolderId === cleanId)) {
            return [newDriveFolder, ...prev];
          }
          return prev;
        });

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

          onAddMediaItem(item);
        });

        setSelectedFolderId(`drive-${cleanId}`);
        showSuccess('ดึงภาพสำเร็จ', `ดึงรูปภาพ ${fetched.length} รูปเรียบร้อยแล้ว`);
        setDriveSyncInput('');
        setShowDriveImportBox(false);
      }
    } catch (err: any) {
      showError('เกิดข้อผิดพลาดในการดึงภาพ', err.message || 'ไม่สามารถเชื่อมต่อ Google Drive ได้');
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const selectedFolderObj = driveFolders.find(f => f.id === selectedFolderId);
  const currentFolderMediaList = selectedFolderId ? getFolderMediaItems(selectedFolderId) : [];
  const filteredFolderMedia = currentFolderMediaList.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleLocalFileUpload}
        className="hidden"
      />

      {parentFolderInfo && (
        <div className="p-3.5 bg-[#FFFBEB] border border-[#FCD34D] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#92400E] shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-200/90 rounded-xl text-amber-900 shrink-0">
              <Lock className="w-4 h-4 text-amber-900" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-3xs uppercase tracking-wide">
                ตำแหน่งโฟลเดอร์หลักปีการศึกษา พ.ศ. {getCurrentAcademicYearBE()} (ล็อกมาตรฐาน)
              </p>
              <p className="font-extrabold text-blue-900 text-sm mt-0.5">
                {parentFolderInfo.name}
              </p>
            </div>
          </div>
          <span className="text-3xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-xl border border-amber-300 shrink-0 self-end sm:self-auto">
            (เปลี่ยน Path ไม่ได้)
          </span>
        </div>
      )}

      {!selectedFolderId ? (
        <div className="space-y-4">
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 text-blue-900 rounded-xl font-bold">
                <FolderOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  โครงสร้างโฟลเดอร์สื่อ (Media Folders จาก Google Drive)
                </h3>
                <p className="text-2xs text-slate-500">
                  แสดงเฉพาะโฟลเดอร์ย่อยที่มีอยู่จริงบน Google Drive ในคลังภาพกิจกรรมโรงเรียน
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
              <button
                type="button"
                onClick={loadRealDriveFolders}
                disabled={isLoadingFolders}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="รีเฟรชโฟลเดอร์จาก Google Drive"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isLoadingFolders ? 'animate-spin' : ''}`} />
                <span>รีเฟรชโฟลเดอร์</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFolderId('folder-all')}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>ดูภาพทั้งหมดในคลัง</span>
              </button>

              <button
                type="button"
                onClick={() => setShowNewFolderModal(true)}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <FolderPlus className="w-4 h-4 text-amber-300" />
                <span>+ สร้างโฟลเดอร์สื่อใหม่</span>
              </button>
            </div>
          </div>

          {isLoadingFolders ? (
            <div className="py-20 text-center bg-white border border-slate-200 rounded-2xl p-8 space-y-3 shadow-2xs">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-700">กำลังสแกนโครงสร้างโฟลเดอร์จริงใน Google Drive...</p>
            </div>
          ) : driveFolders.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8 space-y-4 shadow-2xs">
              <FolderOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  ยังไม่มีโฟลเดอร์ย่อยใน {parentFolderInfo?.name || 'Google Drive'}
                </h4>
                <p className="text-2xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                  ท่านสามารถวางลิงก์โฟลเดอร์ Google Drive หรือกดปุ่มสร้างโฟลเดอร์ใหม่ผ่านระบบ Drive ได้ทันทีครับ
                </p>
              </div>
              
              <div className="w-full max-w-md mx-auto space-y-2 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="วางลิงก์โฟลเดอร์ Google Drive หรือ ID..."
                    value={driveSyncInput}
                    onChange={(e) => setDriveSyncInput(e.target.value)}
                    className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!driveSyncInput.trim()) return;
                      const cleanId = extractFolderId(driveSyncInput.trim());
                      if (cleanId) {
                        setParentFolderInfo({ id: cleanId, name: 'โฟลเดอร์ Google Drive ที่กำหนด' });
                        showSuccess('บันทึกสำเร็จ', 'ตั้งค่าโฟลเดอร์ Google Drive เรียบร้อยแล้ว สามารถอัปโหลดไฟล์หรือสร้างโฟลเดอร์ย่อยได้ทันที');
                        setDriveSyncInput('');
                        loadRealDriveFolders();
                      } else {
                        showError('ลิงก์ไม่ถูกต้อง', 'กรุณาระบุลิงก์หรือ Folder ID ของ Google Drive ให้ถูกต้อง');
                      }
                    }}
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0"
                  >
                    ตั้งค่าโฟลเดอร์
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDriveImportBox(true)}
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <HardDrive className="w-4 h-4 text-blue-600" />
                  <span>ดึงรูปจาก Google Drive</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(true)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>+ สร้างโฟลเดอร์สื่อใหม่</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {driveFolders.map((folder) => {
                const count = getFolderMediaCount(folder.id);
                const previewImg = getFolderPreviewImage(folder.id);

                return (
                  <div
                    key={folder.id}
                    onClick={() => setSelectedFolderId(folder.id)}
                    className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-500 hover:ring-2 hover:ring-blue-500/20 shadow-2xs hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col justify-between"
                  >
                    <div className="relative aspect-16/9 bg-slate-100 overflow-hidden border-b border-slate-100">
                      <img
                        src={previewImg}
                        alt={folder.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex items-end p-3">
                        <span className="text-3xs font-extrabold text-white bg-blue-600/90 backdrop-blur-xs px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                          <ImageIcon className="w-3 h-3" />
                          <span>{count} รูปภาพ</span>
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 shrink-0 text-blue-600" />
                        <h4 className="font-bold text-xs text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                          {folder.name}
                        </h4>
                      </div>
                      <p className="text-2xs text-slate-500 line-clamp-1 leading-relaxed">
                        {folder.description || 'โฟลเดอร์สื่อ Google Drive'}
                      </p>
                    </div>

                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-3xs font-bold text-blue-800 group-hover:bg-blue-50 transition-colors">
                      <span>เปิดดูไฟล์ในโฟลเดอร์ ({count})</span>
                      <span>→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setSelectedFolderId(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-2xs font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>ย้อนกลับไปโฟลเดอร์หลัก</span>
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
                  <h3 className="font-bold text-sm text-slate-900 truncate">
                    {selectedFolderId === 'folder-all' ? 'ภาพสื่อทั้งหมดในคลัง (All Media)' : (selectedFolderObj?.name || 'โฟลเดอร์ Google Drive')}
                  </h3>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-900 text-3xs font-extrabold rounded-full shrink-0">
                    {filteredFolderMedia.length} รูป
                  </span>
                </div>
                {selectedFolderObj?.description && (
                  <p className="text-2xs text-slate-500 mt-0.5 truncate">{selectedFolderObj.description}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="ค้นหารูปในโฟลเดอร์..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-2xs focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>อัปโหลดเข้าโฟลเดอร์นี้</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDriveImportBox(!showDriveImportBox)}
                className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                <span>ดึงจาก Drive</span>
              </button>
            </div>
          </div>

          {showDriveImportBox && (
            <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-2 animate-in fade-in duration-150">
              <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-blue-600" />
                <span>ดึงรูปภาพจาก Google Drive เข้าสู่โฟลเดอร์นี้</span>
              </span>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={driveSyncInput}
                  onChange={(e) => setDriveSyncInput(e.target.value)}
                  placeholder="วาง URL หรือ Folder ID ของ Google Drive..."
                  className="flex-1 px-3.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={handleImportDriveToFolder}
                  disabled={isSyncingDrive || !driveSyncInput.trim()}
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  {isSyncingDrive ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                  <span>สแกนดึงภาพ</span>
                </button>
              </div>
            </div>
          )}

          {isLoadingFolderImages ? (
            <div className="py-20 text-center bg-white border border-slate-200 rounded-2xl p-8 space-y-3 shadow-2xs">
              <Loader2 className="w-7 h-7 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-700">กำลังดึงรูปภาพจาก Google Drive...</p>
            </div>
          ) : filteredFolderMedia.length === 0 ? (
            <div className="text-center py-16 bg-white border-2 border-dashed border-slate-200 rounded-2xl space-y-3">
              <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
              <div>
                <p className="text-xs font-bold text-slate-700">ยังไม่มีรูปภาพในโฟลเดอร์นี้</p>
                <p className="text-2xs text-slate-400 mt-0.5">
                  กดปุ่ม "อัปโหลดเข้าโฟลเดอร์นี้" หรือ "ดึงจาก Drive" ด้านบนเพื่อเพิ่มรูปภาพ
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredFolderMedia.map((m) => {
                const isSelected = selectedUrls.includes(m.url);

                return (
                  <div
                    key={m.id}
                    onClick={() => isSelectable && onToggleSelect && onToggleSelect(m.url)}
                    className={`group relative aspect-square rounded-2xl overflow-hidden border-2 transition-all bg-slate-100 ${
                      isSelectable ? 'cursor-pointer' : ''
                    } ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-500/30'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <img
                      src={m.thumbnailUrl || m.url}
                      alt={m.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-slate-950/70 p-2 text-white text-3xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between">
                      <p className="truncate font-semibold leading-tight">{m.name}</p>

                      <div className="flex justify-between items-center text-slate-300 pt-1">
                        <span className="text-4xs uppercase px-1.5 py-0.5 bg-white/20 rounded font-bold">
                          {m.source}
                        </span>
                        {onDeleteMediaItem && !isSelectable && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteMediaItem(m.id);
                            }}
                            className="p-1 hover:text-rose-400 bg-rose-600/80 rounded transition-colors cursor-pointer"
                            title="ลบรูปภาพนี้"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 text-white rounded-xl">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-none">สร้างโฟลเดอร์สื่อใหม่ใน Google Drive</h3>
                  <p className="text-2xs text-slate-400 mt-1">
                    โฟลเดอร์จะถูกสร้างลงบน Google Drive โดยตรงในตำแหน่ง {parentFolderInfo?.name || 'คลังภาพ'}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateFolder} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  ชื่อโฟลเดอร์ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="เช่น ตราสัญลักษณ์และโลโก้โรงเรียน, ภาพอาคารสถานที่..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">คำอธิบายโฟลเดอร์</label>
                <textarea
                  rows={2}
                  value={newFolderDesc}
                  onChange={(e) => setNewFolderDesc(e.target.value)}
                  placeholder="รายละเอียดเกี่ยวกับรูปภาพที่จะจัดเก็บในโฟลเดอร์นี้..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  disabled={isCreatingFolder}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isCreatingFolder || !newFolderName.trim()}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  {isCreatingFolder ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>กำลังสร้างใน Google Drive...</span>
                    </>
                  ) : (
                    <span>สร้างโฟลเดอร์ใน Google Drive</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={showConfirmModal}
        title="ยืนยันการอัปโหลดไฟล์"
        message={'คุณต้องการอัปโหลดไฟล์จำนวน ' + (pendingFiles?.length || 0) + ' ไฟล์ ไปยังโฟลเดอร์ "' + (selectedFolderObj?.name || parentFolderInfo?.name || 'Google Drive') + '" ใช่หรือไม่?'}
        onConfirm={executeUpload}
        onCancel={() => {
          setShowConfirmModal(false);
          setPendingFiles(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
      />
    </div>
  );
};