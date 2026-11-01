import React, { useState, useEffect } from 'react';
import { X, Save, Users, RefreshCw, Upload } from 'lucide-react';
import { BoardMember, BoardType, MediaItem } from '../types';
import { MediaUploadModal } from './MediaUploadModal';

interface BoardEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardMember?: BoardMember | null;
  mediaList?: MediaItem[];
  onAddMediaItem?: (item: MediaItem) => void;
  onSave: (member: BoardMember) => Promise<void>;
  defaultBoardType?: BoardType;
}

export const BoardEditModal: React.FC<BoardEditModalProps> = ({
  isOpen,
  onClose,
  boardMember,
  mediaList = [],
  onAddMediaItem,
  onSave,
  defaultBoardType = 'basic_education'
}) => {
  const getDefaultBoard = (): BoardMember => ({
    id: `board-${Date.now()}`,
    name: '',
    boardType: defaultBoardType,
    roleInBoard: 'กรรมการ',
    representation: 'ผู้ทรงคุณวุฒิ',
    occupation: '',
    phone: '',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    order: 5
  });

  const [formData, setFormData] = useState<BoardMember>(boardMember || getDefaultBoard());
  const [saving, setSaving] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(boardMember ? { ...boardMember } : getDefaultBoard());
    }
  }, [isOpen, boardMember, defaultBoardType]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      await onSave({
        ...formData,
        updatedAt: new Date().toISOString()
      });
      onClose();
    } catch (err) {
      console.error('Error saving board member:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">
                  {boardMember ? 'แก้ไขข้อมูลคณะกรรมการ' : 'เพิ่มคณะกรรมการใหม่'}
                </h3>
                <p className="text-xs text-slate-300">ระบุบทบาท ตัวแทน และสัดส่วนคณะกรรมการ</p>
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
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-sm text-slate-700">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ประเภทคณะกรรมการ</label>
              <select
                value={formData.boardType}
                onChange={(e) => setFormData({ ...formData, boardType: e.target.value as BoardType })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-sm bg-white"
              >
                <option value="basic_education">คณะกรรมการสถานศึกษาขั้นพื้นฐาน</option>
                <option value="parents_network">คณะกรรมการเครือข่ายผู้ปกครอง</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                ชื่อ - นามสกุล <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="เช่น นายบุญมี ศรีสวัสดิ์"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-sm font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ตำแหน่งในคณะกรรมการ</label>
                <input
                  type="text"
                  value={formData.roleInBoard}
                  onChange={(e) => setFormData({ ...formData, roleInBoard: e.target.value })}
                  placeholder="เช่น ประธานกรรมการ, กรรมการ, เหรัญญิก"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ตัวแทน / สัดส่วน</label>
                <input
                  type="text"
                  value={formData.representation || ''}
                  onChange={(e) => setFormData({ ...formData, representation: e.target.value })}
                  placeholder="เช่น ผู้แทนผู้ปกครอง, ผู้แทนองค์กรชุมชน, ผู้แทนศิษย์เก่า"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">อาชีพ / ตำแหน่งปัจจุบัน</label>
                <input
                  type="text"
                  value={formData.occupation || ''}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  placeholder="เช่น ข้าราชการบำนาญ, ธุรกิจส่วนตัว"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">เบอร์โทรศัพท์ (ถ้ามี)</label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="08X-XXX-XXXX"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-sm"
                />
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-slate-800">รูปภาพกรรมการ (Photo)</label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 shadow-2xs">
                  {formData.imageUrl ? (
                    <img
                      src={formData.imageUrl}
                      alt={formData.name || 'Preview'}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs bg-slate-100">
                      No Photo
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setIsMediaModalOpen(true)}
                    className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>อัปโหลดรูป / เลือกจากคลังสื่อ</span>
                  </button>
                  <p className="text-2xs text-slate-500">
                    อัปโหลดไฟล์จากเครื่อง หรือเลือกจากคลังสื่อภาพโรงเรียน
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>บันทึกข้อมูล</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {isMediaModalOpen && (
        <MediaUploadModal
          isOpen={isMediaModalOpen}
          onClose={() => setIsMediaModalOpen(false)}
          onSelect={(urls) => {
            if (urls.length > 0) {
              setFormData(prev => ({ ...prev, imageUrl: urls[0] }));
            }
          }}
          mediaList={mediaList}
          onAddMediaItem={onAddMediaItem}
          multiple={false}
          title="เลือกภาพถ่ายกรรมการ"
          initialSelectedUrl={formData.imageUrl}
        />
      )}
    </>
  );
};
