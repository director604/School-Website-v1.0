import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Save, 
  FileText, 
  HardDrive, 
  Upload, 
  Trash2, 
  ExternalLink, 
  Calendar, 
  Building2, 
  UserCheck, 
  Eye, 
  AlertCircle,
  FileCheck2,
  CheckCircle2,
  KeyRound,
  RefreshCw
} from 'lucide-react';
import { 
  PublicDocumentItem, 
  PublicDocumentCategory, 
  DriveSettings, 
  SCHOOL_DEPARTMENTS, 
  SchoolDepartment 
} from '../types';
import { 
  getCurrentAcademicYearBE, 
  extractDriveFileId, 
  uploadDriveFile, 
  findDepartmentFolder, 
  extractFolderId 
} from '../services/driveService';
import { GoogleDrivePickerModal } from './GoogleDrivePickerModal';
import { showWarning } from '../utils/sweetalert';
import { connectGoogleDrive } from '../firebase';

interface PublicDocEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentItem?: PublicDocumentItem | null;
  currentUserId?: string;
  currentUserName?: string;
  driveSettings?: DriveSettings;
  onSave: (docItem: PublicDocumentItem) => Promise<void>;
}

export const PublicDocEditModal: React.FC<PublicDocEditModalProps> = ({
  isOpen,
  onClose,
  documentItem,
  currentUserId = 'system',
  currentUserName = 'ฝ่ายบริหารงานวิชาการและประกันคุณภาพ',
  driveSettings,
  onSave
}) => {
  const currentYearBE = driveSettings?.currentAcademicYear || getCurrentAcademicYearBE();

  const getDefaultDocument = (): PublicDocumentItem => ({
    id: `doc-${Date.now()}`,
    title: '',
    category: 'sar',
    academicYearBE: currentYearBE,
    pdfUrl: '',
    pdfFileName: '',
    fileSize: '',
    source: 'upload',
    published: true,
    downloads: 0,
    authorId: currentUserId,
    authorName: currentUserName,
    createdAt: new Date().toISOString()
  });

  const [formData, setFormData] = useState<PublicDocumentItem>(documentItem || getDefaultDocument());
  const [saving, setSaving] = useState(false);
  const [uploadingDrive, setUploadingDrive] = useState(false);
  const [connectingDrive, setConnectingDrive] = useState(false);
  const [targetFolderInfo, setTargetFolderInfo] = useState<{ id: string; name: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadNotice, setUploadNotice] = useState<{ type: 'success' | 'error' | 'warning'; message: string; showConnectButton?: boolean } | null>(null);
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setUploadNotice(null);
      if (documentItem) {
        setFormData({
          ...documentItem,
          authorName: documentItem.authorName || currentUserName
        });
      } else {
        setFormData(getDefaultDocument());
      }
    }
  }, [isOpen, documentItem, currentUserName, currentUserId]);

  // Resolve target department Google Drive folder dynamically
  useEffect(() => {
    let active = true;
    const updateTargetFolder = async () => {
      if (driveSettings?.centralFolderId) {
        try {
          const folder = await findDepartmentFolder(
            driveSettings.centralFolderId,
            formData.category,
            formData.academicYearBE || currentYearBE,
            driveSettings.departmentFolders
          );
          if (active && folder) {
            setTargetFolderInfo(folder);
          }
        } catch (e) {
          console.warn('Could not resolve target drive folder:', e);
        }
      } else {
        setTargetFolderInfo(null);
      }
    };
    updateTargetFolder();
    return () => { active = false; };
  }, [formData.category, formData.academicYearBE, driveSettings, currentYearBE]);

  if (!isOpen) return null;

  // Connect Google Drive OAuth handler
  const handleConnectDrive = async () => {
    setConnectingDrive(true);
    setUploadNotice(null);
    try {
      await connectGoogleDrive();
      setUploadNotice({
        type: 'success',
        message: 'เชื่อมต่อสิทธิ์ Google Drive สำเร็จเรียบร้อยแล้ว! คุณสามารถกดปุ่ม "อัปโหลดจากเครื่อง" เพื่ออัปโหลดไฟล์ PDF ขึ้น Drive ได้ทันที'
      });
    } catch (err: any) {
      setUploadNotice({
        type: 'error',
        message: err?.message || 'ไม่สามารถเชื่อมต่อสิทธิ์ Google Drive ได้ กรุณาลองใหม่อีกครั้ง'
      });
    } finally {
      setConnectingDrive(false);
    }
  };

  // Local PDF File Upload Handler (Real Direct Upload to Google Drive)
  const handleLocalPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showWarning('รูปแบบไฟล์ไม่ถูกต้อง', 'กรุณาเลือกไฟล์เอกสาร PDF เท่านั้น');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Format file size
    const sizeInMB = file.size / (1024 * 1024);
    const sizeStr = sizeInMB >= 1 
      ? `${sizeInMB.toFixed(1)} MB` 
      : `${Math.round(file.size / 1024)} KB`;

    setUploadingDrive(true);
    setErrorMessage(null);
    setUploadNotice(null);

    const centralFolderId = driveSettings?.centralFolderId;

    if (centralFolderId) {
      try {
        const folder = targetFolderInfo || await findDepartmentFolder(
          centralFolderId,
          formData.category,
          formData.academicYearBE || currentYearBE,
          driveSettings?.departmentFolders
        );
        const targetId = folder?.id || centralFolderId;
        const driveResult = await uploadDriveFile(targetId, file);

        setFormData(prev => ({
          ...prev,
          pdfUrl: driveResult.webViewLink || `https://drive.google.com/file/d/${driveResult.id}/preview`,
          pdfFileName: file.name,
          fileSize: sizeStr,
          source: 'drive',
          driveFileId: driveResult.id
        }));

        setUploadNotice({
          type: 'success',
          message: `อัปโหลดไฟล์ "${file.name}" (${sizeStr}) ขึ้น Google Drive โฟลเดอร์ "${targetFolderInfo?.name || 'คลังเอกสารสถานศึกษา'}" สำเร็จเรียบร้อยแล้ว!`
        });
        setUploadingDrive(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      } catch (err: any) {
        console.error('Drive upload error:', err);
        setUploadingDrive(false);
        const rawErrMsg = err?.message || '';

        // If file is small (< 500KB) and drive fails, allow fallback
        if (file.size < 500 * 1024) {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            setFormData(prev => ({
              ...prev,
              pdfUrl: dataUrl,
              pdfFileName: file.name,
              fileSize: sizeStr,
              source: 'upload',
              driveFileId: undefined
            }));
            setUploadNotice({
              type: 'warning',
              message: `แนบไฟล์สำเร็จ (โหมดท้องถิ่น): ${rawErrMsg || 'แนะนำให้เชื่อมต่อ Google Drive เพื่อจัดเก็บไฟล์บนคลาวด์'}`
            });
          };
          reader.readAsDataURL(file);
        } else {
          // Large files (> 500KB) MUST NOT create giant base64 Data URLs that break Firestore limit
          setUploadNotice({
            type: 'error',
            message: `ไม่สามารถอัปโหลดขึ้น Google Driveได้ (${rawErrMsg || 'กรุณายืนยันสิทธิ์เข้าใช้งาน Drive'}) เนื่องจากไฟล์มีขนาด ${sizeStr} ซึ่งจำเป็นต้องจัดเก็บบน Google Drive`,
            showConnectButton: true
          });
          showWarning(
            'ต้องการสิทธิ์การเข้าถึง Google Drive',
            `ไฟล์เอกสารมีขนาด ${sizeStr} ไม่สามารถแนบเป็นรหัสข้อมูลสั้นได้\n\n${rawErrMsg}\n\nกรุณากดปุ่ม "เชื่อมต่อสิทธิ์ Google Drive" ในการ์ดด้านล่างเพื่ออัปโหลดไฟล์ขึ้นคลาวด์โรงเรียน`
          );
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    // If centralFolderId is empty / not configured
    if (file.size >= 500 * 1024) {
      setUploadingDrive(false);
      setUploadNotice({
        type: 'error',
        message: `ยังไม่ได้ตั้งค่าโฟลเดอร์ Google Drive ส่วนกลางของโรงเรียน และไฟล์มีขนาด ${sizeStr} ใหญ่เกินกำหนดฐานข้อมูล กรุณาตั้งค่ารหัสโฟลเดอร์ในระบบก่อนอัปโหลด`,
        showConnectButton: true
      });
      showWarning(
        'ยังไม่ได้ตั้งค่า Google Drive',
        `ไฟล์มีขนาด ${sizeStr} กรุณาระบุรหัสโฟลเดอร์ Google Drive ส่วนกลางของโรงเรียนก่อนอัปโหลดไฟล์เอกสาร`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Small file fallback (< 500KB)
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setFormData(prev => ({
        ...prev,
        pdfUrl: dataUrl,
        pdfFileName: file.name,
        fileSize: sizeStr,
        source: 'upload',
        driveFileId: undefined
      }));
      setUploadNotice({
        type: 'success',
        message: `แนบไฟล์ "${file.name}" (${sizeStr}) สำเร็จเรียบร้อยแล้ว`
      });
      setUploadingDrive(false);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Google Drive File Selected Handler
  const handleDriveFileSelect = (file: { id: string; name: string; url?: string; size?: string }) => {
    setFormData(prev => ({
      ...prev,
      pdfUrl: file.url || `https://drive.google.com/file/d/${file.id}/preview`,
      pdfFileName: file.name,
      fileSize: file.size || 'Google Drive',
      source: 'drive',
      driveFileId: file.id
    }));
    setIsDrivePickerOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const title = (formData.title || '').trim();
    if (!title) {
      setErrorMessage('กรุณาระบุชื่อเรื่องของเอกสารเผยแพร่');
      return;
    }

    if (!formData.pdfUrl) {
      setErrorMessage('กรุณาแนบไฟล์ PDF (อัปโหลดจากเครื่อง หรือเลือกจาก Google Drive)');
      return;
    }

    setSaving(true);
    try {
      const payload: PublicDocumentItem = {
        ...formData,
        id: documentItem?.id || `doc-${Date.now()}`,
        title,
        authorId: documentItem ? (documentItem.authorId || currentUserId) : currentUserId,
        authorName: (formData.authorName || '').trim() || currentUserName,
        updatedAt: new Date().toISOString()
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      console.error('Error saving public document:', err);
      setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการบันทึกเอกสาร กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-600 text-white rounded-2xl shadow-sm">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base leading-tight">
                  {documentItem ? 'แก้ไขเอกสารเผยแพร่' : '+ เพิ่มเอกสารเผยแพร่ใหม่'}
                </h3>
                <p className="text-2xs text-blue-200 mt-0.5">
                  คลังเอกสารทางการ รายงาน SAR และแผนพัฒนาสถานศึกษา (PDF)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-slate-800">
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Target Google Drive Folder Banner */}
            {targetFolderInfo && (
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-center justify-between text-xs text-blue-900">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-medium">
                    ที่จัดเก็บ Google Drive: <strong className="font-bold text-blue-950">{targetFolderInfo.name}</strong>
                  </span>
                </div>
                <span className="text-2xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-semibold shrink-0">
                  โฟลเดอร์อัตโนมัติ
                </span>
              </div>
            )}

            {/* Document Title */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                ชื่อเอกสารเผยแพร่ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="เช่น รายงานการประเมินตนเองของสถานศึกษา (SAR) ประจำปีการศึกษา 2568"
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-xs font-bold text-slate-900 bg-white"
                required
              />
              <p className="text-2xs text-slate-400 mt-1">
                ระบุชื่อเรื่องเอกสารอย่างชัดเจนเพื่อความสะดวกในการสืบค้นของคณะกรรมการและประชาชน
              </p>
            </div>

            {/* Category & Academic Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-700" />
                  <span>หมวดหมู่เอกสาร</span> <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as PublicDocumentCategory })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold text-slate-800 bg-white"
                >
                  <option value="sar">รายงาน SAR & การประกันคุณภาพ</option>
                  <option value="academic">01 งานบริหารวิชาการ</option>
                  <option value="budget">02 งานบริหารงบประมาณและสินทรัพย์</option>
                  <option value="personnel">03 งานบริหารงานบุคคล</option>
                  <option value="general">04 งานบริหารทั่วไป</option>
                  <option value="other">เอกสารเผยแพร่อื่นๆ</option>
                </select>
              </div>

              {/* Academic Year BE */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>ประจำปีการศึกษา พ.ศ.</span> <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.academicYearBE || currentYearBE}
                  onChange={(e) => setFormData({ ...formData, academicYearBE: parseInt(e.target.value, 10) || currentYearBE })}
                  min={2550}
                  max={2600}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-xs font-bold text-slate-800 bg-white tabular-nums"
                  required
                />
              </div>
            </div>

            {/* PDF Attachment Area */}
            <div className="p-4.5 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-red-600" />
                    <span>แนบไฟล์เอกสาร PDF</span>
                    <span className="text-rose-500">*</span>
                  </span>
                  <p className="text-2xs text-slate-500 mt-0.5">
                    รองรับการอัปโหลดไฟล์ PDF จากคอมพิวเตอร์ หรือเลือกไฟล์จาก Google Drive
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleLocalPdfUpload}
                    className="hidden"
                  />

                  {/* Local Upload Button */}
                  <button
                    type="button"
                    disabled={uploadingDrive}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingDrive ? 'กำลังอัปโหลด...' : 'อัปโหลดจากเครื่อง'}</span>
                  </button>

                  {/* Google Drive Button */}
                  <button
                    type="button"
                    disabled={uploadingDrive}
                    onClick={() => setIsDrivePickerOpen(true)}
                    className="px-3.5 py-2 bg-white border border-slate-300 hover:border-blue-600 text-blue-900 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                    <span>เลือกจาก Drive</span>
                  </button>
                </div>
              </div>

              {/* Uploading indicator */}
              {uploadingDrive && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2 animate-pulse">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>กำลังอัปโหลดไฟล์ PDF ไปยัง Google Drive...</span>
                </div>
              )}

              {/* Upload Notification Banner */}
              {uploadNotice && (
                <div className={`p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                  uploadNotice.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : uploadNotice.type === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <div className="flex items-start gap-2 min-w-0">
                    {uploadNotice.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-relaxed">{uploadNotice.message}</span>
                  </div>

                  {uploadNotice.showConnectButton && (
                    <button
                      type="button"
                      disabled={connectingDrive}
                      onClick={handleConnectDrive}
                      className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 self-end sm:self-auto cursor-pointer disabled:opacity-50"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                      <span>{connectingDrive ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อสิทธิ์ Google Drive'}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Current Attached PDF File Display */}
              {formData.pdfUrl ? (
                <div className="p-3.5 bg-white border border-red-200 rounded-2xl flex items-center justify-between text-xs shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-red-50 text-red-600 shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{formData.pdfFileName || 'เอกสารแนบ PDF'}</p>
                      <div className="flex items-center gap-2 text-2xs text-slate-500 mt-0.5">
                        <span>ขนาด: {formData.fileSize || 'ไม่ระบุ'}</span>
                        <span>·</span>
                        <span className="font-medium text-blue-700">
                          {formData.source === 'drive' ? 'แหล่งที่มา: Google Drive' : 'แหล่งที่มา: อัปโหลดจากคอมพิวเตอร์'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={formData.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="เปิดดูไฟล์ตัวอย่าง"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, pdfUrl: '', pdfFileName: '', fileSize: '' }))}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="ลบไฟล์แนบนี้ออก"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                !uploadingDrive && (
                  <p className="text-2xs text-slate-400 italic text-center py-2">
                    ยังไม่ได้แนบไฟล์ PDF กรุณากดปุ่ม "อัปโหลดจากเครื่อง" หรือ "เลือกจาก Drive" ด้านบน
                  </p>
                )
              )}
            </div>

            {/* Author Name */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-600" />
                <span>ฝ่ายงาน / ผู้เผยแพร่เอกสาร</span>
              </label>
              <input
                type="text"
                value={formData.authorName || ''}
                onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                placeholder="เช่น ฝ่ายบริหารงานวิชาการและประกันคุณภาพ"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white"
              />
            </div>

            {/* Publish Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <div>
                <p className="text-xs font-bold text-slate-800">สถานะการเผยแพร่ (Publish)</p>
                <p className="text-2xs text-slate-500">เปิดเพื่อให้ประชาชนและคณะกรรมการสามารถดาวน์โหลดได้ทันที</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={saving || uploadingDrive}
                className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'กำลังบันทึก...' : 'บันทึกเอกสารเผยแพร่'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Google Drive Picker Modal */}
      <GoogleDrivePickerModal
        isOpen={isDrivePickerOpen}
        onClose={() => setIsDrivePickerOpen(false)}
        onSelectFile={(file) => handleDriveFileSelect({
          id: file.id,
          name: file.name,
          url: file.webViewLink,
          size: file.size
        })}
        targetFolderId={targetFolderInfo?.id || driveSettings?.centralFolderId}
        targetFolderName={targetFolderInfo?.name || "คลังเอกสารสถานศึกษา"}
      />
    </>
  );
};
