import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Save, 
  Newspaper, 
  HardDrive, 
  FileText, 
  Trash2, 
  Upload, 
  Image as ImageIcon,
  Tag,
  Plus,
  Building2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  FolderTree,
  Eye,
  Edit3,
  RotateCcw,
  Share2,
  Calendar,
  UserCheck
} from 'lucide-react';
import { 
  NewsPost, 
  NewsCategory, 
  DriveFileItem, 
  PostCategory, 
  MediaItem, 
  DriveSettings, 
  SCHOOL_DEPARTMENTS, 
  SchoolDepartment 
} from '../types';
import { uploadDriveFile, findDepartmentFolder, getCurrentAcademicYearBE } from '../services/driveService';
import { GoogleDrivePickerModal } from './GoogleDrivePickerModal';
import { MediaUploadModal } from './MediaUploadModal';
import { RichTextEditor } from './RichTextEditor';
import { showConfirm, showWarning } from '../utils/sweetalert';

interface NewsEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  newsItem?: NewsPost | null;
  currentUserId?: string;
  currentUserName?: string;
  categories?: PostCategory[];
  mediaList?: MediaItem[];
  driveSettings?: DriveSettings;
  onAddMediaItem?: (item: MediaItem) => void;
  onOpenCategoryManager?: () => void;
  onSave: (news: NewsPost) => Promise<void>;
}

export const NewsEditModal: React.FC<NewsEditModalProps> = ({
  isOpen,
  onClose,
  newsItem,
  currentUserId = 'system',
  currentUserName = 'ฝ่ายประชาสัมพันธ์ โรงเรียนบ้านนารี',
  categories = [],
  mediaList = [],
  driveSettings,
  onAddMediaItem,
  onOpenCategoryManager,
  onSave
}) => {
  const getDefaultNews = (): NewsPost => ({
    id: `news-${Date.now()}`,
    title: '',
    category: categories[0]?.slug || 'news',
    department: 'academic',
    summary: '',
    content: '',
    coverImage: '',
    authorName: currentUserName,
    authorId: currentUserId,
    driveFileId: '',
    driveFileName: '',
    driveFileUrl: '',
    published: true,
    pinned: false,
    createdAt: new Date().toISOString(),
    views: 0
  });

  const [formData, setFormData] = useState<NewsPost>(newsItem || getDefaultNews());
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [saving, setSaving] = useState(false);
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  // Department Folder State
  const currentYearBE = driveSettings?.currentAcademicYear || getCurrentAcademicYearBE();
  const currentDeptInfo = SCHOOL_DEPARTMENTS.find(d => d.id === (formData.department || 'academic'));
  const fallbackDeptFolderName = currentDeptInfo 
    ? `${currentDeptInfo.code}_${currentDeptInfo.label}_${currentYearBE}`
    : `01_งานบริหารวิชาการ_${currentYearBE}`;

  const [resolvedDeptFolder, setResolvedDeptFolder] = useState<{ id: string; name: string } | null>(null);

  // Upload States for Document and Cover Image
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docUploadNotice, setDocUploadNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const docFileInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);

  // Reset form completely when modal opens or when newsItem changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab('edit');
      setDocUploadNotice(null);
      if (newsItem) {
        setFormData({ 
          ...newsItem, 
          department: newsItem.department || 'academic',
          authorName: newsItem.authorName || currentUserName
        });
      } else {
        // Clear all fields cleanly for Add New Post
        setFormData({
          ...getDefaultNews(),
          authorName: currentUserName,
          authorId: currentUserId
        });
      }
    }
  }, [isOpen, newsItem, currentUserName, currentUserId]);

  // Resolve target Google Drive department folder dynamically
  useEffect(() => {
    if (isOpen) {
      const dept = formData.department || 'academic';
      findDepartmentFolder(
        driveSettings?.centralFolderId || '',
        dept,
        currentYearBE,
        driveSettings?.departmentFolders
      ).then(res => {
        if (res) setResolvedDeptFolder(res);
      }).catch(err => {
        console.warn('Error resolving department folder:', err);
      });
    }
  }, [isOpen, formData.department, driveSettings, currentYearBE]);

  const targetFolder = {
    folderId: resolvedDeptFolder?.id || driveSettings?.centralFolderId || '',
    folderName: resolvedDeptFolder?.name || fallbackDeptFolderName
  };

  const handleClearForm = async () => {
    const confirmed = await showConfirm(
      'ยืนยันการล้างข้อมูล',
      'คุณต้องการล้างข้อมูลในแบบฟอร์มทั้งหมดเพื่อเริ่มเขียนใหม่ใช่หรือไม่?',
      'ล้างแบบฟอร์ม',
      'ยกเลิก',
      true
    );
    if (confirmed) {
      setFormData(getDefaultNews());
      setDocUploadNotice(null);
      if (docFileInputRef.current) docFileInputRef.current.value = '';
      if (coverImageInputRef.current) coverImageInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;

    setSaving(true);
    try {
      const finalAuthorName = (formData.authorName || '').trim() || currentUserName;
      await onSave({
        ...formData,
        authorId: newsItem ? (newsItem.authorId || currentUserId) : currentUserId,
        authorName: finalAuthorName,
        updatedAt: new Date().toISOString()
      });
      onClose();
    } catch (err) {
      console.error('Error saving news:', err);
    } finally {
      setSaving(false);
    }
  };

  // Direct Local Document Upload to Google Drive
  const handleDocFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!targetFolder.folderId) {
      showWarning('ยังไม่ได้ระบุโฟลเดอร์', 'ยังไม่ได้ระบุโฟลเดอร์ Google Drive ปลายทาง กรุณาตั้งค่าโฟลเดอร์ในระบบก่อน');
      return;
    }

    setIsUploadingDoc(true);
    setDocUploadNotice(null);

    try {
      const uploaded = await uploadDriveFile(targetFolder.folderId, file);
      setFormData(prev => ({
        ...prev,
        driveFileId: uploaded.id,
        driveFileName: uploaded.name,
        driveFileUrl: uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.id}/view`
      }));
      setDocUploadNotice({
        type: 'success',
        message: `อัปโหลด "${uploaded.name}" ขึ้น Google Drive (${targetFolder.folderName}) เรียบร้อยแล้ว`
      });
    } catch (err: any) {
      setDocUploadNotice({
        type: 'error',
        message: err.message || 'ไม่สามารถอัปโหลดไฟล์ขึ้น Google Drive ได้ กรุณาตรวจสอบการเข้าสู่ระบบ Drive'
      });
    } finally {
      setIsUploadingDoc(false);
      if (docFileInputRef.current) docFileInputRef.current.value = '';
    }
  };

  // Direct Local Image Upload for Cover Image (Featured Image)
  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showWarning('รูปแบบไฟล์ไม่ถูกต้อง', 'กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setFormData(prev => ({ ...prev, coverImage: dataUrl }));

      if (onAddMediaItem) {
        onAddMediaItem({
          id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
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
    reader.readAsDataURL(file);
    if (coverImageInputRef.current) coverImageInputRef.current.value = '';
  };

  const handleSelectDriveFile = (file: DriveFileItem) => {
    setFormData(prev => ({
      ...prev,
      driveFileId: file.id,
      driveFileName: file.name,
      driveFileUrl: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`
    }));
  };

  const removeDriveAttachment = () => {
    setFormData(prev => ({
      ...prev,
      driveFileId: '',
      driveFileName: '',
      driveFileUrl: ''
    }));
    setDocUploadNotice(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-[#0F224A] via-[#1E3A8A] to-[#1E293B] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3c434a]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/20 text-amber-300 rounded-2xl ring-1 ring-amber-400/30 shrink-0">
                <Newspaper className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-none">
                  {newsItem ? 'แก้ไขเรื่อง / ข่าวประชาสัมพันธ์' : 'เขียนเรื่องใหม่ (Add New Post)'}
                </h3>
                <p className="text-2xs text-blue-200 mt-1">ระบบจัดการเนื้อหาและเอกสารแนบสถานศึกษา โรงเรียนบ้านนารี</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {/* Tab Switcher: Edit vs Preview */}
              <div className="flex items-center bg-black/25 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'edit'
                      ? 'bg-white text-blue-900 shadow-sm'
                      : 'text-blue-100 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>แก้ไขเนื้อหา</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'preview'
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-blue-100 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>แสดงตัวอย่าง (Preview)</span>
                </button>
              </div>

              {/* Reset Form Button */}
              <button
                type="button"
                onClick={handleClearForm}
                className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 hover:text-white border border-rose-400/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="ล้างข้อมูลในฟอร์มเพื่อเขียนใหม่"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">ล้างฟอร์ม</span>
              </button>

              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Active Tab Content: Edit Form vs Live Preview */}
          {activeTab === 'edit' ? (
            /* Form Body */
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-700">
            {/* Title Input */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                หัวข้อเรื่อง / ข่าวประชาสัมพันธ์ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="ระบุชื่อเรื่องที่ต้องการประกาศ..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-base font-bold text-slate-900 bg-white"
                required
              />
            </div>

            {/* 2-Column: Category & School Department Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category Selector */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-blue-600" />
                    <span>หมวดหมู่เนื้อหา (Category)</span>
                  </label>
                  {onOpenCategoryManager && (
                    <button
                      type="button"
                      onClick={onOpenCategoryManager}
                      className="text-2xs text-blue-700 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>จัดการหมวดหมู่</span>
                    </button>
                  )}
                </div>

                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as NewsCategory })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-xs font-medium bg-white"
                >
                  {categories.length > 0 ? (
                    categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="news">ข่าวประชาสัมพันธ์</option>
                      <option value="announcement">ประกาศทางการ</option>
                      <option value="procurement">จัดซื้อจัดจ้าง & พัสดุ</option>
                      <option value="academic">งานวิชาการ</option>
                    </>
                  )}
                </select>
                <p className="text-2xs text-slate-400">กำหนดหมวดหมู่เพื่อใช้แยกประเภทการแสดงผลบนหน้าเว็บไซต์</p>
              </div>

              {/* Department Selector (ตรงตามกลุ่มงาน 4 ฝ่าย) */}
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>กลุ่มงานบริหารที่รับผิดชอบ</span>
                  </label>
                  <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 line-clamp-1 max-w-[150px]">
                    Drive: {targetFolder.folderName}
                  </span>
                </div>

                <select
                  value={formData.department || 'academic'}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value as SchoolDepartment })}
                  className="w-full px-3 py-2 rounded-xl border border-blue-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-xs font-bold text-slate-800 bg-white"
                >
                  {SCHOOL_DEPARTMENTS.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.code}. {dept.label}
                    </option>
                  ))}
                </select>
                <p className="text-2xs text-slate-600 leading-relaxed">
                  เมื่ออัปโหลดเอกสารแนบ ระบบจะนำไฟล์เข้าสู่โฟลเดอร์ Google Drive ของกลุ่มงานนี้อัตโนมัติ
                </p>
              </div>
            </div>

            {/* Author / Publisher Name Field */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/90 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>ชื่อผู้เขียน / ผู้เผยแพร่ข่าว (Author / Publisher)</span>
                  <span className="text-rose-500">*</span>
                </label>
                <span className="text-3xs font-semibold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md">
                  บันทึกและแสดงบนเว็บไซต์
                </span>
              </div>
              <input
                type="text"
                value={formData.authorName || ''}
                onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                placeholder="เช่น ฝ่ายประชาสัมพันธ์ โรงเรียนบ้านนารี, ดร.ศิรสิทธิ์ พูลเพิ่ม หรือ ชื่อผู้เขียน"
                className="w-full px-3.5 py-2 rounded-xl border border-amber-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 text-xs font-bold text-slate-900 bg-white"
                required
              />
              <p className="text-2xs text-slate-600">
                ระบบจะบันทึกชื่อนี้เป็นผู้เผยแพร่ข่าว โดยจะปรากฏบนการ์ดข่าวหน้าหลัก หน้ารวมข่าว และหน้ารายละเอียดข่าว
              </p>
            </div>

            {/* Summary */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                สรุปเนื้อหาย่อ (Summary / Excerpt)
              </label>
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                rows={2}
                placeholder="สรุปเนื้อหาสั้นๆ 1-2 ประโยคสำหรับแสดงบนการ์ดข่าวหน้าแรก..."
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-800 bg-white"
              />
            </div>

            {/* Main Content (RichText Editor) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                เนื้อหาฉบับเต็ม <span className="text-rose-500">*</span>
              </label>
              <RichTextEditor
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder="เขียนรายละเอียดเนื้อหาข่าว ประกาศ หรือผลการดำเนินกิจกรรม..."
              />
            </div>

            {/* Featured Image (รูปภาพประจำเรื่อง / ภาพหน้าปก) */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-amber-500" />
                  <span>รูปภาพประจำเรื่อง (Featured Image / ภาพหน้าปก)</span>
                </span>
                {formData.coverImage && (
                  <span className="text-2xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>มีภาพหน้าปกแล้ว</span>
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {formData.coverImage ? (
                  <div className="w-36 h-24 rounded-2xl overflow-hidden border border-slate-300 bg-slate-100 shrink-0 shadow-xs relative group">
                    <img
                      src={formData.coverImage}
                      alt="Cover Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-36 h-24 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center bg-white text-slate-400 shrink-0 gap-1">
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-3xs">ยังไม่มีภาพหน้าปก</span>
                  </div>
                )}

                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Hidden Local Image File Input */}
                    <input
                      ref={coverImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageUpload}
                      className="hidden"
                    />

                    {/* Local Image Upload Button */}
                    <button
                      type="button"
                      onClick={() => coverImageInputRef.current?.click()}
                      className="px-3.5 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>อัปโหลดภาพจากเครื่อง (Local)</span>
                    </button>

                    {/* Media Library Button */}
                    <button
                      type="button"
                      onClick={() => setIsMediaModalOpen(true)}
                      className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>เลือกจากคลังสื่อ</span>
                    </button>

                    {formData.coverImage && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, coverImage: '' })}
                        className="px-3 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        ลบภาพออก
                      </button>
                    )}
                  </div>
                  <p className="text-2xs text-slate-500">
                    รองรับไฟล์ JPG, PNG, WebP แนะนำขนาดอัตราส่วน 16:9 เพื่อการแสดงผลที่สวยงามบนหน้าแรก
                  </p>
                </div>
              </div>
            </div>

            {/* Google Drive Document Attachment with Direct Local Upload */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-blue-700" />
                    <span>เอกสารแนบจาก Google Drive (PDF, Word, ใบประกาศ, ตารางคำนวณ)</span>
                  </span>
                  <p className="text-2xs text-slate-500 mt-0.5">
                    จัดเก็บในโฟลเดอร์ Google Drive: <strong className="text-blue-900">{targetFolder.folderName}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Hidden Document File Input */}
                  <input
                    ref={docFileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    onChange={handleDocFileUpload}
                    className="hidden"
                  />

                  {/* Direct Local-to-Drive Upload Button */}
                  <button
                    type="button"
                    onClick={() => docFileInputRef.current?.click()}
                    disabled={isUploadingDoc}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                    title="เลือกไฟล์จากคอมพิวเตอร์เพื่ออัปโหลดเข้าสู่ Google Drive ของกลุ่มงานนี้ทันที"
                  >
                    {isUploadingDoc ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>กำลังอัปโหลดขึ้น Drive...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>อัปโหลดไฟล์จากเครื่องขึ้น Drive</span>
                      </>
                    )}
                  </button>

                  {/* Pick Existing from Google Drive */}
                  <button
                    type="button"
                    onClick={() => setIsDrivePickerOpen(true)}
                    className="px-3 py-2 bg-white border border-slate-300 hover:border-blue-500 text-blue-900 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  >
                    <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                    <span>เลือกไฟล์เดิมใน Drive</span>
                  </button>
                </div>
              </div>

              {/* Upload Notification Banner */}
              {docUploadNotice && (
                <div className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                  docUploadNotice.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <div className="flex items-center gap-2">
                    {docUploadNotice.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{docUploadNotice.message}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setDocUploadNotice(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Current Attached Document Card */}
              {formData.driveFileName ? (
                <div className="p-3.5 bg-white border border-blue-200 rounded-2xl flex items-center justify-between text-xs shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{formData.driveFileName}</p>
                      {formData.driveFileUrl && (
                        <a
                          href={formData.driveFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-2xs text-blue-600 hover:underline inline-flex items-center gap-1 mt-0.5"
                        >
                          <span>เปิดดูบน Google Drive</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={removeDriveAttachment}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="ลบเอกสารแนบนี้ออก"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <p className="text-2xs text-slate-500 italic">
                  ยังไม่มีเอกสารแนบ (คุณสามารถกด "อัปโหลดไฟล์จากเครื่องขึ้น Drive" เพื่อนำไฟล์ PDF/Word ขึ้นคลัง Google Drive ของกลุ่มงานได้ทันที)
                </p>
              )}
            </div>

            {/* Publish & Pin Options */}
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.pinned}
                  onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-semibold text-slate-700">ปักหมุดเรื่องสำคัญไว้ด้านบนสุด (Sticky Post)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-semibold text-slate-700">เผยแพร่ทันที (Publish)</span>
              </label>
            </div>

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Eye className="w-4 h-4" />
                <span>ดูตัวอย่างก่อนบันทึก (Preview)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving || isUploadingDoc}
                  className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'กำลังบันทึก...' : 'เผยแพร่ / บันทึกเรื่อง'}</span>
                </button>
              </div>
            </div>
          </form>
          ) : (
            /* Live Preview Mode */
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-700 bg-slate-50/50">
              {/* Preview Banner */}
              <div className="p-3.5 bg-gradient-to-r from-amber-500/15 via-blue-500/10 to-indigo-500/10 border border-amber-300/60 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs text-amber-900 font-bold">
                  <Eye className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>โหมดแสดงตัวอย่าง (Live Preview) — มุมมองจริงที่นักเรียน ผู้ปกครอง และผู้เข้าชมจะเห็น</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className="px-3 py-1 bg-white border border-amber-300 text-amber-900 hover:bg-amber-50 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>กลับไปแก้ไข</span>
                </button>
              </div>

              {/* Main Article Preview Container */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
                {/* Category & Department Header */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-2xs font-bold text-blue-700 uppercase tracking-wider bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">
                      {categories.find(c => c.slug === formData.category)?.name || (
                        formData.category === 'announcement' ? 'ประกาศทางการ' :
                        formData.category === 'procurement' ? 'จัดซื้อจัดจ้าง' :
                        formData.category === 'academic' ? 'วิชาการ/กิจกรรม' : 'ข่าวประชาสัมพันธ์'
                      )}
                    </span>

                    <span className="text-2xs font-bold text-amber-900 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-amber-600" />
                      <span>{SCHOOL_DEPARTMENTS.find(d => d.id === formData.department)?.label || formData.department}</span>
                    </span>

                    {formData.pinned && (
                      <span className="text-2xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                        📌 ปักหมุดเรื่องสำคัญ
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                    {formData.title || <span className="text-slate-300 italic">หัวข้อเรื่องจะปรากฏที่นี่...</span>}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1 border-b border-slate-100 pb-4">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>ผู้เผยแพร่: <strong>{formData.authorName || currentUserName}</strong></span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </span>
                  </div>
                </div>

                {/* Cover Image in Article */}
                {formData.coverImage ? (
                  <div className="rounded-2xl overflow-hidden max-h-96 w-full bg-slate-100 shadow-sm border border-slate-200">
                    <img
                      src={formData.coverImage}
                      alt={formData.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center text-xs text-slate-400">
                    <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <span>ยังไม่มีภาพหน้าปกสำหรับเรื่องนี้</span>
                  </div>
                )}

                {/* Excerpt / Summary */}
                {formData.summary && (
                  <div className="p-4 bg-slate-50 border-l-4 border-blue-600 rounded-r-2xl text-slate-700 text-sm font-medium italic">
                    {formData.summary}
                  </div>
                )}

                {/* Full Article Content */}
                <div 
                  className="text-sm leading-relaxed text-slate-800 space-y-4 rich-content prose prose-slate max-w-none min-h-[100px]"
                  dangerouslySetInnerHTML={{ 
                    __html: formData.content || '<p class="text-slate-400 italic">ยังไม่ได้กรอกเนื้อหาข่าว...</p>' 
                  }}
                />

                {/* Google Drive Document Box Preview */}
                {formData.driveFileName && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-200 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 bg-blue-600 text-white rounded-xl shrink-0 shadow-xs">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-2xs text-blue-900 font-bold uppercase tracking-wider">
                          เอกสารแนบจาก Google Drive ({targetFolder.folderName})
                        </p>
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {formData.driveFileName}
                        </p>
                      </div>
                    </div>

                    {formData.driveFileUrl && (
                      <a
                        href={formData.driveFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs"
                      >
                        <HardDrive className="w-3.5 h-3.5" />
                        <span>เปิดดูเอกสาร</span>
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Social Media Link Preview Card (Facebook Link Preview) */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1877F2]">
                  <Share2 className="w-4 h-4" />
                  <span>ตัวอย่างเมื่อนำลิงก์ไปแชร์บนเพจ Facebook (Facebook Link Preview)</span>
                </div>
                <p className="text-2xs text-slate-500">
                  ระบบจะสร้าง OpenGraph Metadata ให้โดยอัตโนมัติ เมื่อนำ URL ข่าวนี้ไปโพสต์บนเพจ Facebook หรือส่งในไลน์ จะแสดงตัวอย่างการ์ดดังนี้:
                </p>

                {/* Simulated Facebook Post Link Card */}
                <div className="max-w-md mx-auto rounded-xl border border-slate-300 overflow-hidden bg-slate-50 shadow-sm">
                  <div className="aspect-[1.91/1] w-full bg-slate-200 overflow-hidden relative">
                    {formData.coverImage ? (
                      <img
                        src={formData.coverImage}
                        alt="Facebook Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                        <span>ภาพสัญลักษณ์โรงเรียนบ้านนารี</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-[#F0F2F5] border-t border-slate-200 text-left">
                    <p className="text-3xs uppercase font-semibold text-slate-500 tracking-wider">
                      www.bnr.ac.th
                    </p>
                    <p className="text-xs font-bold text-slate-900 line-clamp-1 mt-0.5">
                      {formData.title || 'หัวข้อเรื่อง / ข่าวประชาสัมพันธ์ โรงเรียนบ้านนารี'}
                    </p>
                    <p className="text-3xs text-slate-500 line-clamp-1 mt-0.5">
                      {formData.summary || 'ติดตามข้อมูลข่าวสาร ความเคลื่อนไหว และผลงานของโรงเรียนบ้านนารี'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview Mode Actions */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>กลับไปแก้ไขเนื้อหา</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={saving || isUploadingDoc || !formData.title.trim() || !formData.content.trim()}
                    className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'กำลังบันทึก...' : 'เผยแพร่ / บันทึกเรื่อง'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Google Drive Picker Modal */}
      {isDrivePickerOpen && (
        <GoogleDrivePickerModal
          isOpen={isDrivePickerOpen}
          onClose={() => setIsDrivePickerOpen(false)}
          onSelectFile={handleSelectDriveFile}
          targetFolderId={targetFolder.folderId}
          targetFolderName={targetFolder.folderName}
          isPathLocked={true}
          departmentLabel={currentDeptInfo?.label || 'งานบริหารวิชาการ'}
          yearBE={currentYearBE}
        />
      )}

      {/* Media Upload Modal for Library picking */}
      {isMediaModalOpen && (
        <MediaUploadModal
          isOpen={isMediaModalOpen}
          onClose={() => setIsMediaModalOpen(false)}
          onSelect={(urls) => {
            if (urls.length > 0) {
              setFormData(prev => ({ ...prev, coverImage: urls[0] }));
            }
          }}
          mediaList={mediaList}
          onAddMediaItem={onAddMediaItem}
          multiple={false}
          title="เลือกภาพหน้าปกเรื่อง / ข่าวสาร"
          initialSelectedUrl={formData.coverImage}
          driveSettings={driveSettings}
        />
      )}
    </>
  );
};
