import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  HardDrive, 
  Link as LinkIcon, 
  Check, 
  Search, 
  Trash2, 
  Sparkles, 
  AlertCircle,
  RefreshCw,
  FolderOpen,
  ArrowRight
} from 'lucide-react';
import { MediaItem, DriveSettings } from '../types';
import { fetchDriveFolderImages, extractFolderId, validateDriveFolder, uploadDriveFile } from '../services/driveService';
import { MediaLibraryView } from './MediaLibraryView';

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selectedUrls: string[], items?: MediaItem[]) => void;
  mediaList: MediaItem[];
  onAddMediaItem?: (item: MediaItem) => void;
  multiple?: boolean;
  title?: string;
  initialSelectedUrl?: string;
  driveSettings?: DriveSettings;
  targetFolderId?: string;
}

export const MediaUploadModal: React.FC<MediaUploadModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  mediaList,
  onAddMediaItem,
  multiple = false,
  title = 'เลือกรูปภาพหรืออัปโหลดสื่อ',
  initialSelectedUrl = '',
  driveSettings,
  targetFolderId
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'library' | 'drive_folder' | 'url'>('library');
  const [selectedUrls, setSelectedUrls] = useState<string[]>(initialSelectedUrl ? [initialSelectedUrl] : []);
  const [searchQuery, setSearchQuery] = useState('');
  
  // URL Tab
  const [customUrl, setCustomUrl] = useState('');
  
  // Drive Folder Tab
  const [driveFolderInput, setDriveFolderInput] = useState('');
  const [isFetchingDrive, setIsFetchingDrive] = useState(false);
  const [driveFolderError, setDriveFolderError] = useState<string | null>(null);
  const [driveFetchedImages, setDriveFetchedImages] = useState<{ id: string; name: string; url: string; thumbnailUrl: string }[]>([]);
  
  // Upload processing state
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Toggle selection
  const handleToggleSelect = (url: string) => {
    if (multiple) {
      if (selectedUrls.includes(url)) {
        setSelectedUrls(selectedUrls.filter(u => u !== url));
      } else {
        setSelectedUrls([...selectedUrls, url]);
      }
    } else {
      setSelectedUrls([url]);
    }
  };

  // Handle local file uploads (FileReader -> Base64 dataURL / MediaItem)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingUpload(true);
    const newItems: MediaItem[] = [];
    const newUrls: string[] = [];

    const folderToUpload = targetFolderId || driveSettings?.centralFolderId;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      try {
        let finalUrl: string;
        let driveId: string | undefined;

        if (folderToUpload) {
          // Upload to Drive
          const uploaded = await uploadDriveFile(folderToUpload, file);
          finalUrl = 'https://lh3.googleusercontent.com/d/' + uploaded.id + '=w1600';
          driveId = uploaded.id;
        } else {
          // Local preview fallback
          finalUrl = await readFileAsDataURL(file);
        }

        const mediaItem: MediaItem = {
          id: driveId ? 'drive-img-' + driveId : 'media-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          name: file.name,
          url: finalUrl,
          thumbnailUrl: driveId ? 'https://drive.google.com/thumbnail?id=' + driveId + '&sz=w400' : finalUrl,
          size: formatBytes(file.size),
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
          source: driveId ? 'drive' : 'upload',
          driveFileId: driveId,
          driveFolderId: folderToUpload || undefined
        };

        newItems.push(mediaItem);
        newUrls.push(finalUrl);

        if (onAddMediaItem) {
          onAddMediaItem(mediaItem);
        }
      } catch (err) {
        console.error('Error uploading file:', err);
      }
    }

    setIsProcessingUpload(false);
    if (newUrls.length > 0) {
      if (multiple) {
        setSelectedUrls(prev => [...prev, ...newUrls]);
      } else {
        setSelectedUrls([newUrls[0]]);
      }
      setActiveTab('library');
    }
  };

  // Helper to read file as base64 data url
  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Fetch images from Google Drive folder
  const handleFetchDriveFolder = async () => {
    if (!driveFolderInput.trim()) return;

    setIsFetchingDrive(true);
    setDriveFolderError(null);
    try {
      const images = await fetchDriveFolderImages(driveFolderInput.trim());
      if (images.length === 0) {
        setDriveFolderError('ไม่พบไฟล์รูปภาพในโฟลเดอร์ Google Drive นี้ หรือโฟลเดอร์ยังไม่ได้ตั้งค่าสิทธิ์ให้เข้าถึง');
      } else {
        const cleanId = extractFolderId(driveFolderInput);
        const details = await validateDriveFolder(cleanId);
        const folderName = details.valid && details.name ? details.name : `โฟลเดอร์ Google Drive (${cleanId.slice(0, 8)})`;

        setDriveFetchedImages(images);
        // Add to media library items
        images.forEach(img => {
          const item: MediaItem = {
            id: `drive-img-${img.id}`,
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

          if (onAddMediaItem) {
            onAddMediaItem(item);
          }
        });
      }
    } catch (err: any) {
      setDriveFolderError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Google Drive');
    } finally {
      setIsFetchingDrive(false);
    }
  };

  // Add all fetched Drive images to selection
  const handleSelectAllDriveImages = () => {
    const urls = driveFetchedImages.map(img => img.url);
    if (multiple) {
      setSelectedUrls(Array.from(new Set([...selectedUrls, ...urls])));
    } else if (urls.length > 0) {
      setSelectedUrls([urls[0]]);
    }
  };

  // Confirm Selection
  const handleConfirm = () => {
    if (activeTab === 'url' && customUrl.trim()) {
      onSelect([customUrl.trim()]);
      onClose();
      return;
    }

    if (selectedUrls.length > 0) {
      onSelect(selectedUrls);
      onClose();
    }
  };

  const filteredMedia = mediaList.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[88vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* WordPress-style Top Header */}
        <div className="px-6 py-4 bg-[#1d2327] text-white flex items-center justify-between border-b border-[#3c434a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-none">
                {title}
              </h3>
              <p className="text-2xs text-slate-400 mt-1">
                {multiple ? 'สามารถเลือกได้หลายรูปภาพพร้อมกัน' : 'เลือกรูปภาพ 1 รูปสำหรับใช้งาน'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (WordPress Media Uploader Style) */}
        <div className="flex items-center justify-between px-6 bg-slate-100 border-b border-slate-200">
          <div className="flex items-center gap-1 sm:gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('library')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors border-t border-x cursor-pointer ${
                activeTab === 'library'
                  ? 'bg-white text-blue-900 border-slate-200 -mb-px'
                  : 'text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>คลังสื่อ ({mediaList.length})</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors border-t border-x cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-white text-blue-900 border-slate-200 -mb-px'
                  : 'text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>อัปโหลดไฟล์</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('drive_folder')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors border-t border-x cursor-pointer ${
                activeTab === 'drive_folder'
                  ? 'bg-white text-blue-900 border-slate-200 -mb-px'
                  : 'text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                <span>ดึงจาก Google Drive Folder</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors border-t border-x cursor-pointer ${
                activeTab === 'url'
                  ? 'bg-white text-blue-900 border-slate-200 -mb-px'
                  : 'text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5" />
                <span>ระบุลิงก์ URL</span>
              </div>
            </button>
          </div>

          {activeTab === 'library' && (
            <div className="relative pb-2 hidden sm:block">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="ค้นหารูปภาพ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs w-44 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: MEDIA LIBRARY (With Folder Hierarchy) */}
          {activeTab === 'library' && (
            <MediaLibraryView
              mediaList={mediaList}
              onAddMediaItem={onAddMediaItem || (() => {})}
              isSelectable={true}
              multiple={multiple}
              selectedUrls={selectedUrls}
              onToggleSelect={handleToggleSelect}
              driveSettings={driveSettings}
              targetFolderId={targetFolderId}
            />
          )}

          {/* TAB 2: UPLOAD LOCAL FILES */}
          {activeTab === 'upload' && (
            <div className="h-full flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple={multiple}
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4 shadow-xs">
                <Upload className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-800">
                ลากไฟล์รูปภาพมาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">
                รองรับไฟล์ JPG, PNG, WEBP, GIF จากเครื่องคอมพิวเตอร์หรือโทรศัพท์ของคุณ รูปภาพจะถูกบันทึกลงในคลังสื่อทันที
              </p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingUpload}
                className="mt-6 px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                {isProcessingUpload ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>กำลังประมวลผลรูปภาพ...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>เลือกไฟล์จากเครื่อง</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 3: GOOGLE DRIVE FOLDER IMPORT */}
          {activeTab === 'drive_folder' && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                  <HardDrive className="w-4 h-4 text-blue-700" />
                  <span>ดึงภาพกิจกรรมอัตโนมัติจากโฟลเดอร์ Google Drive</span>
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  นำลิงก์โฟลเดอร์ Google Drive หรือรหัสโฟลเดอร์ (Folder ID) ที่เก็บรูปภาพกิจกรรมมาวาง ระบบจะสแกนและดึงรูปภาพทั้งหมดเข้ามาในระบบอัตโนมัติ
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  วางลิงก์โฟลเดอร์ Google Drive (Folder URL หรือ Folder ID)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FolderOpen className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={driveFolderInput}
                      onChange={(e) => setDriveFolderInput(e.target.value)}
                      placeholder="เช่น https://drive.google.com/drive/folders/1aBcDeFgHiJk..."
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden font-medium"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleFetchDriveFolder}
                    disabled={isFetchingDrive || !driveFolderInput.trim()}
                    className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 shadow-xs"
                  >
                    {isFetchingDrive ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>กำลังสแกนโฟลเดอร์...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>สแกนดึงรูปภาพ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {driveFolderError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{driveFolderError}</span>
                </div>
              )}

              {/* Fetched Images Display */}
              {driveFetchedImages.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800">
                      ✓ พบรูปภาพทั้งหมด {driveFetchedImages.length} รูปในโฟลเดอร์ Google Drive
                    </span>
                    <button
                      type="button"
                      onClick={handleSelectAllDriveImages}
                      className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
                    >
                      เลือกรูปภาพทั้งหมด ({driveFetchedImages.length})
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-60 overflow-y-auto p-1">
                    {driveFetchedImages.map((img) => {
                      const isSelected = selectedUrls.includes(img.url);
                      return (
                        <div
                          key={img.id}
                          onClick={() => handleToggleSelect(img.url)}
                          className={`group relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all bg-slate-100 ${
                            isSelected 
                              ? 'border-blue-600 ring-2 ring-blue-500/30' 
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <img
                            src={img.thumbnailUrl}
                            alt={img.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 p-1 text-white text-2xs truncate">
                            {img.name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EXTERNAL URL */}
          {activeTab === 'url' && (
            <div className="space-y-4 max-w-lg mx-auto py-8">
              <label className="block text-xs font-semibold text-slate-700">
                ระบุลิงก์รูปภาพโดยตรง (Direct Image URL)
              </label>
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
              />

              {customUrl && (
                <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img
                    src={customUrl}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {selectedUrls.length > 0 ? (
              <span>เลือกแล้ว {selectedUrls.length} รายการ</span>
            ) : (
              <span>ยังไม่ได้เลือกรูปภาพ</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedUrls.length === 0 && !(activeTab === 'url' && customUrl.trim())}
              className="px-5 py-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>ยืนยันเลือกรูปภาพ ({selectedUrls.length || 1})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
