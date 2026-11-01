import React, { useState, useEffect } from 'react';
import { X, Save, UserCheck, RefreshCw, Upload } from 'lucide-react';
import { StaffMember, StaffRoleCategory, MediaItem } from '../types';
import { MediaUploadModal } from './MediaUploadModal';

interface StaffEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffMember?: StaffMember | null;
  mediaList?: MediaItem[];
  onAddMediaItem?: (item: MediaItem) => void;
  onSave: (staff: StaffMember) => Promise<void>;
}

export const StaffEditModal: React.FC<StaffEditModalProps> = ({
  isOpen,
  onClose,
  staffMember,
  mediaList = [],
  onAddMediaItem,
  onSave
}) => {
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const getDefaultStaff = (): StaffMember => ({
    id: `staff-${Date.now()}`,
    prefix: 'นาย',
    name: '',
    position: 'ครูผู้สอน',
    academicRank: 'วิทยฐานะ ชำนาญการ',
    department: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี',
    roleCategory: 'teacher',
    education: 'ศษ.บ.',
    email: '',
    phone: '',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
    order: 10
  });

  const [formData, setFormData] = useState<StaffMember>(staffMember || getDefaultStaff());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(staffMember ? { ...staffMember } : getDefaultStaff());
    }
  }, [isOpen, staffMember]);

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
      console.error('Error saving staff:', err);
    } finally {
      setSaving(false);
    }
  };

  const departments = [
    'ฝ่ายบริหารสถานศึกษา',
    'กลุ่มสาระการเรียนรู้ภาษาไทย',
    'กลุ่มสาระการเรียนรู้คณิตศาสตร์',
    'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี',
    'กลุ่มสาระการเรียนรู้สังคมศึกษา ศาสนาและวัฒนธรรม',
    'กลุ่มสาระการเรียนรู้สุขศึกษาและพลศึกษา',
    'กลุ่มสาระการเรียนรู้ศิลปะ',
    'กลุ่มสาระการเรียนรู้การงานอาชีพ',
    'กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ',
    'กิจกรรมพัฒนาผู้เรียน / แนะแนว',
    'ฝ่ายสนับสนุนการศึกษาและธุรการ'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {staffMember ? 'แก้ไขข้อมูลครู/บุคลากร' : 'เพิ่มครู/บุคลากรใหม่'}
              </h3>
              <p className="text-xs text-slate-300">ระบุรายละเอียด ประวัติ และกลุ่มสาระการเรียนรู้</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-sm text-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-600 mb-1">คำนำหน้า</label>
              <select
                value={formData.prefix}
                onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-sm bg-white"
              >
                <option value="นาย">นาย</option>
                <option value="นาง">นาง</option>
                <option value="นางสาว">นางสาว</option>
                <option value="ดร.">ดร.</option>
                <option value="ว่าที่ ร.ต.">ว่าที่ ร.ต.</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                ชื่อ - นามสกุล <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="เช่น สมพร ชัยชนะ"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ตำแหน่ง</label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="เช่น ครู, ผู้อำนวยการ, เจ้าหน้าที่ธุรการ"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">วิทยฐานะ</label>
              <input
                type="text"
                value={formData.academicRank || ''}
                onChange={(e) => setFormData({ ...formData, academicRank: e.target.value })}
                placeholder="เช่น ชำนาญการ, ชำนาญการพิเศษ, เชี่ยวชาญ"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">กลุ่มงาน / สาระการเรียนรู้</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-sm bg-white"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">หมวดหมู่บทบาท</label>
              <select
                value={formData.roleCategory}
                onChange={(e) => setFormData({ ...formData, roleCategory: e.target.value as StaffRoleCategory })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-sm bg-white"
              >
                <option value="executive">ผู้บริหารสถานศึกษา</option>
                <option value="teacher">ครูผู้สอน</option>
                <option value="support">บุคลากรทางการศึกษา/สนับสนุน</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">วุฒิการศึกษา</label>
            <input
              type="text"
              value={formData.education || ''}
              onChange={(e) => setFormData({ ...formData, education: e.target.value })}
              placeholder="เช่น กศ.บ. ภาษาไทย มหาวิทยาลัยขอนแก่น"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-sm"
            />
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <label className="block text-xs font-bold text-slate-800">รูปภาพประจำตัว (Profile Photo)</label>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">อีเมลติดต่อ</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="teacher@bnr.ac.th"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">เบอร์โทรศัพท์</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="08X-XXX-XXXX"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>บันทึกข้อมูล</span>
            </button>
          </div>
        </form>
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
          title="เลือกภาพถ่ายครู/บุคลากร"
          initialSelectedUrl={formData.imageUrl}
        />
      )}
    </div>
  );
};
