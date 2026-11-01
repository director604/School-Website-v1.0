import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Film, 
  Link2, 
  Image as ImageIcon, 
  HardDrive, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  FolderOpen,
  AlertCircle
} from 'lucide-react';
import { VideoItem, MediaItem, DriveSettings } from '../types';
import { extractFolderId, findYearVideoFolder, getCurrentAcademicYearBE, extractDriveFileId } from '../services/driveService';
import { GoogleDrivePickerModal } from './GoogleDrivePickerModal';

interface VideoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoItem: VideoItem | null;
  currentUserId?: string;
  currentUserName?: string;
  mediaList?: MediaItem[];
  driveSettings?: DriveSettings;
  onSave: (video: VideoItem) => Promise<void>;
}

export const VideoEditModal: React.FC<VideoEditModalProps> = ({
  isOpen,
  onClose,
  videoItem,
  currentUserId,
  currentUserName = 'ฝ่ายประชาสัมพันธ์ โรงเรียนบ้านนารี',
  mediaList = [],
  driveSettings,
  onSave
}) => {
  const [formData, setFormData] = useState<Partial<VideoItem>>({
    title: '',
    description: '',
    videoUrl: '',
    thumbnailUrl: '',
    category: 'กิจกรรมโรงเรียน',
    duration: '',
    published: true
  });

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [isResolvingDrive, setIsResolvingDrive] = useState(false);
  const [videoDriveFolderId, setVideoDriveFolderId] = useState<string>('');
  const [videoDriveFolderName, setVideoDriveFolderName] = useState<string>('');

  useEffect(() => {
    setFormError(null);
    if (videoItem) {
      setFormData({ ...videoItem });
    } else {
      setFormData({
        title: '',
        description: '',
        videoUrl: '',
        thumbnailUrl: '',
        category: 'กิจกรรมโรงเรียน',
        duration: '',
        published: true
      });
    }

    resolveTargetVideoFolder();
  }, [videoItem, isOpen, driveSettings]);

  const resolveTargetVideoFolder = async () => {
    const centralClean = driveSettings?.centralFolderId ? extractFolderId(driveSettings.centralFolderId) : '';
    const videoFolder = await findYearVideoFolder(centralClean, getCurrentAcademicYearBE());
    if (videoFolder?.id) {
      setVideoDriveFolderId(videoFolder.id);
      setVideoDriveFolderName(videoFolder.name);
    } else {
      setVideoDriveFolderId(centralClean);
      setVideoDriveFolderName(`06_คลังวีดีโอกิจกรรมโรงเรียน_${getCurrentAcademicYearBE()}`);
    }
  };

  const handleOpenDrivePicker = async () => {
    setIsResolvingDrive(true);
    try {
      const centralClean = driveSettings?.centralFolderId ? extractFolderId(driveSettings.centralFolderId) : '';
      const videoFolder = await findYearVideoFolder(centralClean, getCurrentAcademicYearBE());
      if (videoFolder?.id) {
        setVideoDriveFolderId(videoFolder.id);
        setVideoDriveFolderName(videoFolder.name);
      }
    } catch (e) {
      console.warn('Error resolving video folder on open:', e);
    } finally {
      setIsResolvingDrive(false);
      setShowDrivePicker(true);
    }
  };

  // Helper to detect YouTube ID or Google Drive File ID
  const handleVideoUrlChange = (url: string) => {
    const trimmed = (url || '').trim();
    let ytId = '';
    const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      ytId = ytMatch[1];
    }

    let driveId = '';
    if (trimmed.includes('drive.google.com')) {
      driveId = extractDriveFileId(trimmed);
    }

    setFormData(prev => {
      let thumb = prev.thumbnailUrl || '';
      if (!thumb) {
        if (ytId) {
          thumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
        } else if (driveId) {
          thumb = `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`;
        }
      }

      return {
        ...prev,
        videoUrl: url,
        youtubeId: ytId || undefined,
        driveFileId: driveId || undefined,
        thumbnailUrl: thumb
      };
    });
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const title = (formData.title || '').trim();
    const videoUrl = (formData.videoUrl || '').trim();

    if (!title) {
      setFormError('กรุณากรอกชื่อหัวข้อวิดีโอกิจกรรม');
      return;
    }
    if (!videoUrl) {
      setFormError('กรุณาระบุลิงก์วิดีโอ (YouTube หรือ Google Drive)');
      return;
    }

    setSaving(true);
    try {
      // Auto-detect IDs if not yet set
      let ytId = formData.youtubeId || '';
      if (!ytId && videoUrl) {
        const match = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
        if (match && match[1]) ytId = match[1];
      }

      let driveId = formData.driveFileId || '';
      if (!driveId && videoUrl.includes('drive.google.com')) {
        driveId = extractDriveFileId(videoUrl);
      }

      let thumb = (formData.thumbnailUrl || '').trim();
      if (!thumb) {
        if (ytId) thumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
        else if (driveId) thumb = `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`;
      }

      // STRICT CLEAN PAYLOAD: Never pass any `undefined` values to Firestore
      const payload: VideoItem = {
        id: videoItem?.id || `video-${Date.now()}`,
        title,
        description: (formData.description || '').trim(),
        videoUrl,
        thumbnailUrl: thumb,
        duration: (formData.duration || '').trim(),
        category: formData.category || 'กิจกรรมโรงเรียน',
        published: formData.published ?? true,
        createdAt: videoItem?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authorId: videoItem?.authorId || currentUserId || 'system',
        authorName: videoItem?.authorName || currentUserName
      };

      if (ytId) payload.youtubeId = ytId;
      if (driveId) payload.driveFileId = driveId;
      if (videoDriveFolderId?.trim()) payload.driveFolderId = videoDriveFolderId.trim();

      await onSave(payload);
      onClose();
    } catch (err: any) {
      console.error('Error saving video:', err);
      setFormError(err?.message || 'ไม่สามารถบันทึกวิดีโอได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-none">
                {videoItem ? 'แก้ไขวิดีโอกิจกรรม' : '+ เพิ่มวิดีโอกิจกรรมใหม่'}
              </h3>
              <p className="text-2xs text-blue-200 mt-1">
                คลังวิดีโอกิจกรรมโรงเรียนบ้านนารี (ปีการศึกษา {getCurrentAcademicYearBE()})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold text-xs leading-snug">{formError}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              ชื่อวิดีโอกิจกรรม <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="เช่น บันทึกการแสดงวันวิทยาศาสตร์ ประจำปีการศึกษา 2569..."
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              ลิงก์วิดีโอ (YouTube URL หรือ Google Drive Video URL) <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.videoUrl}
                  onChange={(e) => handleVideoUrlChange(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... หรือ Google Drive Link"
                  className="w-full pl-9 pr-3.5 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <button
                type="button"
                onClick={handleOpenDrivePicker}
                disabled={isResolvingDrive}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-60"
                title={`เลือกวิดีโอจากโฟลเดอร์: ${videoDriveFolderName || '06_คลังวีดีโอกิจกรรมโรงเรียน'}`}
              >
                <HardDrive className={`w-4 h-4 ${isResolvingDrive ? 'animate-pulse text-blue-500' : 'text-blue-600'}`} />
                <span>{isResolvingDrive ? 'กำลังค้นหาโฟลเดอร์...' : 'เลือกจาก Drive'}</span>
              </button>
            </div>
            <p className="text-3xs text-slate-500 mt-1">
              รองรับลิงก์วิดีโอจาก YouTube, ลิงก์ไฟล์วิดีโอใน Google Drive หรือลิงก์ไฟล์วิดีโอ direct MP4
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 mb-1">หมวดหมู่วิดีโอ</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                <option value="กิจกรรมโรงเรียน">กิจกรรมโรงเรียน</option>
                <option value="ผลงานนักเรียน">ผลงานนักเรียน</option>
                <option value="วิชาการและเทคโนโลยี">วิชาการและเทคโนโลยี</option>
                <option value="วิดีโอประชาสัมพันธ์">วิดีโอประชาสัมพันธ์</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">ความยาววิดีโอ (ระบุหรือไม่ก็ได้)</label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="เช่น 05:30 นาที"
                  className="w-full pl-9 pr-3.5 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              ภาพหน้าปกวิดีโอ (Thumbnail Image URL)
            </label>
            <div className="relative">
              <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.thumbnailUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                placeholder="https://... หรือปล่อยว่างเพื่อใช้หน้าปกอัตโนมัติจาก YouTube"
                className="w-full pl-9 pr-3.5 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">คำอธิบายรายละเอียดวิดีโอ</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="รายละเอียดสั้นๆ เกี่ยวกับวิดีโอกิจกรรมนี้..."
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 block">สถานะการเผยแพร่</span>
              <span className="text-3xs text-slate-500">เผยแพร่วิดีโอนี้ในคลังวิดีโอกิจกรรมหน้าเว็บหลัก</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.published}
                onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving || !formData.title?.trim() || !formData.videoUrl?.trim()}
              className="px-6 py-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'กำลังบันทึก...' : 'บันทึกวิดีโอ'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Drive Picker Modal for selecting video files from 06_คลังวีดีโอกิจกรรมโรงเรียน */}
      {showDrivePicker && (
        <GoogleDrivePickerModal
          isOpen={showDrivePicker}
          onClose={() => setShowDrivePicker(false)}
          targetFolderId={videoDriveFolderId}
          targetFolderName={videoDriveFolderName}
          onSelectFile={(file) => {
            const fileId = file.id;
            const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
            setFormData(prev => ({
              ...prev,
              title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
              videoUrl: previewUrl,
              driveFileId: fileId,
              thumbnailUrl: prev.thumbnailUrl || `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`
            }));
            setShowDrivePicker(false);
          }}
        />
      )}
    </div>
  );
};
