import React, { useState } from 'react';
import { FolderPlus, X, RefreshCw, CheckCircle2, AlertCircle, Folder } from 'lucide-react';
import { createDriveFolder } from '../services/driveService';
import { connectGoogleDrive, clearAccessToken } from '../firebase';
import { DriveFileItem } from '../types';

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentFolderId: string;
  parentFolderName?: string;
  onFolderCreated: (newFolder: DriveFileItem) => void;
}

export const NewFolderModal: React.FC<NewFolderModalProps> = ({
  isOpen,
  onClose,
  parentFolderId,
  parentFolderName = 'โฟลเดอร์ปัจจุบัน',
  onFolderCreated
}) => {
  const [folderName, setFolderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickPresets = [
    'เอกสารคำสั่งโรงเรียน',
    'แผนการจัดการเรียนรู้',
    'ภาพกิจกรรมและประชาสัมพันธ์',
    'เอกสารจัดซื้อจัดจ้าง',
    'แบบฟอร์มคำร้อง'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      let created: any = null;
      try {
        created = await createDriveFolder(parentFolderId, folderName.trim());
      } catch (createErr: any) {
        const errStr = (createErr.message || '').toLowerCase();
        if (errStr.includes('insufficient') || errStr.includes('scope') || errStr.includes('สิทธิ์') || errStr.includes('โทเคน')) {
          clearAccessToken();
          const newToken = await connectGoogleDrive();
          if (newToken) {
            created = await createDriveFolder(parentFolderId, folderName.trim());
          } else {
            throw createErr;
          }
        } else {
          throw createErr;
        }
      }

      onFolderCreated(created);
      setFolderName('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถสร้างโฟลเดอร์ใน Google Drive ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-200 rounded-xl">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">สร้างโฟลเดอร์ย่อยใน Google Drive</h3>
              <p className="text-2xs text-blue-200 line-clamp-1">
                สร้างไว้ใน: {parentFolderName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-amber-500" />
              <span>ชื่อโฟลเดอร์ใหม่</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="เช่น ภาพกิจกรรมค่ายคุณธรรม, 01_งานวิชาการ"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
            />
          </div>

          {/* Quick preset suggestions */}
          <div className="space-y-1.5">
            <span className="text-2xs font-semibold text-slate-400">คำแนะนำชื่อโฟลเดอร์ยอดนิยม:</span>
            <div className="flex flex-wrap gap-1.5">
              {quickPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setFolderName(preset)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-2xs text-slate-600 transition-colors border border-slate-200/60"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading || !folderName.trim()}
              className="px-4 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>กำลังสร้างใน Drive...</span>
                </>
              ) : (
                <>
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>สร้างโฟลเดอร์ทันที</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
