import React, { useState, useEffect, useRef } from 'react';
import { 
  HardDrive, 
  Search, 
  RefreshCw, 
  FileText, 
  ExternalLink, 
  Trash2, 
  AlertCircle, 
  Folder, 
  FolderOpen, 
  Image as ImageIcon, 
  Download, 
  Settings, 
  Building2, 
  Users, 
  CheckCircle2, 
  Activity, 
  Upload, 
  Edit3, 
  Check, 
  ShieldCheck, 
  X,
  FolderPlus,
  Calendar,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  FolderTree
} from 'lucide-react';
import { 
  fetchDriveFiles, 
  deleteDriveFile, 
  uploadDriveFile, 
  updateDriveFileName, 
  getFileCategoryIcon,
  getCurrentAcademicYearBE
} from '../services/driveService';
import { DriveFileItem, DriveSettings, UserRole, User } from '../types';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { DriveDiagnosticModal } from '../components/DriveDiagnosticModal';
import { NewFolderModal } from '../components/NewFolderModal';
import { AcademicYearProvisionModal } from '../components/AcademicYearProvisionModal';
import { FolderStructureModal } from '../components/FolderStructureModal';
import { connectGoogleDrive } from '../firebase';
import { showSuccess, showError, showWarning } from '../utils/sweetalert';

interface DriveViewProps {
  user: User | null;
  userRole: UserRole;
  driveSettings: DriveSettings;
  onLogin: () => void;
  onOpenDriveSettings: () => void;
  onSaveDriveSettings?: (updated: DriveSettings) => Promise<void>;
}

interface BreadcrumbItem {
  id: string;
  name: string;
}

export const DriveView: React.FC<DriveViewProps> = ({ 
  user, 
  userRole, 
  driveSettings, 
  onLogin, 
  onOpenDriveSettings,
  onSaveDriveSettings
}) => {
  const currentBE = getCurrentAcademicYearBE();
  const canManage = userRole === 'admin' || userRole === 'superadmin' || userRole === 'editor';
  const canAdmin = userRole === 'admin' || userRole === 'superadmin';

  const [viewMode, setViewMode] = useState<'central' | 'personal'>('central');
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<DriveFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [connectingDrive, setConnectingDrive] = useState(false);

  // Folder Navigation Breadcrumbs
  const [folderHistory, setFolderHistory] = useState<BreadcrumbItem[]>([]);

  // Modals
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [showFolderStructureModal, setShowFolderStructureModal] = useState(false);

  // Upload & Rename states
  const [isUploading, setIsUploading] = useState(false);
  const [fileToRename, setFileToRename] = useState<DriveFileItem | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Department-specific upload
  const [targetDeptForUpload, setTargetDeptForUpload] = useState<{ id: string; name: string } | null>(null);
  const deptFileInputRef = useRef<HTMLInputElement>(null);

  const triggerDepartmentUpload = (folderId: string, folderName: string) => {
    setTargetDeptForUpload({ id: folderId, name: folderName });
    setTimeout(() => {
      deptFileInputRef.current?.click();
    }, 50);
  };

  const handleDeptFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetDeptForUpload) return;

    setIsUploading(true);
    setActionNotice(null);
    try {
      const uploaded = await uploadDriveFile(targetDeptForUpload.id, file);
      setActionNotice({
        type: 'success',
        message: `อัปโหลดไฟล์ "${uploaded.name}" เข้าสู่ "${targetDeptForUpload.name}" บน Google Drive เรียบร้อยแล้ว`
      });
      if (currentActiveFolderId === targetDeptForUpload.id) {
        setFiles(prev => [uploaded, ...prev]);
      }
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err.message || 'ไม่สามารถอัปโหลดไฟล์เข้าสู่ฝ่ายงานได้'
      });
    } finally {
      setIsUploading(false);
      setTargetDeptForUpload(null);
      if (deptFileInputRef.current) deptFileInputRef.current.value = '';
    }
  };

  // Determine current active folder
  const currentActiveFolderId = folderHistory.length > 0 
    ? folderHistory[folderHistory.length - 1].id
    : (selectedFolderId || driveSettings.centralFolderId);

  const currentActiveFolderName = folderHistory.length > 0
    ? folderHistory[folderHistory.length - 1].name
    : (selectedFolderId 
        ? (driveSettings.departmentFolders?.find(f => f.folderId === selectedFolderId)?.name || 'โฟลเดอร์ฝ่ายงาน')
        : (driveSettings.centralFolderName || 'คลังเอกสารส่วนกลาง'));

  const handleConnectDrive = async () => {
    setConnectingDrive(true);
    setError(null);
    try {
      await connectGoogleDrive();
      loadFiles();
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถเชื่อมต่อสิทธิ์ Google Drive ได้');
    } finally {
      setConnectingDrive(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadFiles();
    }
  }, [user, viewMode, currentActiveFolderId]);

  const loadFiles = async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const targetFolderId = viewMode === 'central' 
        ? currentActiveFolderId
        : undefined;

      const data = await fetchDriveFiles(query, targetFolderId);
      setFiles(data);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถเชื่อมต่อ Google Drive ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadFiles(searchQuery);
  };

  const handleEnterFolder = (folderItem: DriveFileItem) => {
    setFolderHistory(prev => [...prev, { id: folderItem.id, name: folderItem.name }]);
  };

  const handleNavigateBreadcrumb = (index: number) => {
    if (index === -1) {
      // Return to root
      setFolderHistory([]);
    } else {
      setFolderHistory(prev => prev.slice(0, index + 1));
    }
  };

  const handleGoBackOneFolder = () => {
    setFolderHistory(prev => prev.slice(0, prev.length - 1));
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDriveFile(fileToDelete.id);
      setFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
      showSuccess('ลบไฟล์สำเร็จ', `ลบ "${fileToDelete.name}" ออกจาก Google Drive สำเร็จเรียบร้อย`);
      setFileToDelete(null);
    } catch (err: any) {
      showError('ไม่สามารถลบไฟล์ได้', err.message || 'เกิดข้อผิดพลาดในการลบไฟล์');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!currentActiveFolderId) {
      showWarning('กรุณาเลือกโฟลเดอร์', 'กรุณาระบุหรือเลือกโฟลเดอร์ปลายทางก่อนอัปโหลด');
      return;
    }

    setIsUploading(true);
    setActionNotice(null);
    try {
      const uploaded = await uploadDriveFile(currentActiveFolderId, file);
      showSuccess('อัปโหลดไฟล์สำเร็จ', `อัปโหลด "${uploaded.name}" ขึ้น Google Drive (${currentActiveFolderName}) เรียบร้อยแล้ว`);
      setFiles(prev => [uploaded, ...prev]);
    } catch (err: any) {
      showError('ไม่สามารถอัปโหลดไฟล์ได้', err.message || 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFolderCreated = (newFolder: DriveFileItem) => {
    setFiles(prev => [newFolder, ...prev]);
    showSuccess('สร้างโฟลเดอร์สำเร็จ', `สร้างโฟลเดอร์ "${newFolder.name}" ใน Google Drive เรียบร้อยแล้ว`);
  };

  const handleStartRename = (file: DriveFileItem) => {
    setFileToRename(file);
    setNewFileName(file.name);
  };

  const confirmRename = async () => {
    if (!fileToRename || !newFileName.trim()) return;
    setIsRenaming(true);
    try {
      await updateDriveFileName(fileToRename.id, newFileName.trim());
      setFiles(prev => prev.map(f => f.id === fileToRename.id ? { ...f, name: newFileName.trim() } : f));
      showSuccess('เปลี่ยนชื่อสำเร็จ', `เปลี่ยนชื่อเป็น "${newFileName.trim()}" เรียบร้อยแล้ว`);
      setFileToRename(null);
    } catch (err: any) {
      showError('ไม่สามารถแก้ไขชื่อไฟล์ได้', err.message || 'เกิดข้อผิดพลาดในการเปลี่ยนชื่อไฟล์');
    } finally {
      setIsRenaming(false);
    }
  };

  // Filter files by type and year
  const filteredFiles = files.filter(f => {
    // Type filter
    if (selectedFilter === 'pdf' && !f.mimeType.includes('pdf')) return false;
    if (selectedFilter === 'doc' && !(f.mimeType.includes('word') || f.mimeType.includes('document'))) return false;
    if (selectedFilter === 'sheet' && !(f.mimeType.includes('sheet') || f.mimeType.includes('excel') || f.mimeType.includes('spreadsheet'))) return false;
    if (selectedFilter === 'image' && !f.mimeType.includes('image')) return false;
    if (selectedFilter === 'folder' && !f.mimeType.includes('folder')) return false;

    // Year filter (if user selected a specific academic year and we're at root)
    if (selectedYearFilter !== 'all') {
      if (!f.name.includes(selectedYearFilter)) return false;
    }

    return true;
  });

  // Calculate if current year folder is provisioned
  const isCurrentYearProvisioned = driveSettings.availableYears?.includes(currentBE) || 
    files.some(f => f.name.includes(String(currentBE)));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <HardDrive className="w-4 h-4" />
            <span>คลังเอกสารและสารสนเทศดิจิทัล</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">คลังเอกสาร Google Drive โรงเรียน</h1>
          <p className="text-sm text-slate-500 mt-1">
            ศูนย์รวมเอกสารระเบียบการ หลักสูตรสถานศึกษา แผนปฏิบัติการ และไฟล์ดาวน์โหลด
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start">
          {/* View Folder Structure Button (Always visible) */}
          <button
            type="button"
            onClick={() => setShowFolderStructureModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:border-blue-300 text-blue-900 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            title="แสดงโครงสร้างและแผนผังโฟลเดอร์ 4 ฝ่ายทั้งหมด"
          >
            <FolderTree className="w-3.5 h-3.5 text-blue-600" />
            <span>แผนผังโครงสร้างโฟลเดอร์</span>
          </button>

          {canAdmin && (
            <button
              type="button"
              onClick={() => setShowDiagnosticModal(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="ทดสอบการเข้าถึง อ่าน เขียน ลบไฟล์ ใน Google Drive ส่วนกลาง"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>ทดสอบระบบ Drive</span>
            </button>
          )}

          {user && canManage && (
            <>
              {/* Auto-Provision Academic Year Button */}
              {onSaveDriveSettings && (
                <button
                  type="button"
                  onClick={() => setShowProvisionModal(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  title="จัดเตรียมโฟลเดอร์ 4 ฝ่ายบริหารและภาพกิจกรรมตามปี พ.ศ. อัตโนมัติ"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>จัดเตรียมโฟลเดอร์ปี พ.ศ.</span>
                </button>
              )}

              {/* Upload File Input & Button */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3.5 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {isUploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>{isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลดไฟล์'}</span>
              </button>
            </>
          )}

          {canAdmin && (
            <button
              type="button"
              onClick={onOpenDriveSettings}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>ตั้งค่า Drive</span>
            </button>
          )}

          {user && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); loadFiles(); }}
              className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="รีเฟรชข้อมูลไฟล์"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
          actionNotice.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span className="font-medium">{actionNotice.message}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setActionNotice(null)}
            className="p-1 hover:bg-black/5 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}



      {/* Academic Year Auto-Provision Banner (Shows if current year hasn't been provisioned yet) */}
      {user && canManage && !isCurrentYearProvisioned && onSaveDriveSettings && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-4 sm:p-5 rounded-3xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-2xs font-bold uppercase mb-1">
                <span>ระบบจัดการอัตโนมัติ</span>
              </div>
              <h3 className="font-extrabold text-base">เริ่มต้นปีการศึกษาใหม่ พ.ศ. {currentBE}</h3>
              <p className="text-xs text-amber-50 mt-0.5 leading-relaxed max-w-2xl">
                ระบบตรวจพบว่ายังไม่มีโครงสร้างโฟลเดอร์สำหรับปีการศึกษา {currentBE} ใน Google Drive คุณสามารถกดจัดเตรียมโฟลเดอร์ 4 ฝ่ายและคลังภาพกิจกรรมให้พร้อมใช้งานได้ในคลิกเดียว
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowProvisionModal(true)}
            className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all shrink-0 cursor-pointer"
          >
            <FolderTree className="w-4 h-4 text-amber-300" />
            <span>สร้างโครงสร้างปี {currentBE} ทันที</span>
          </button>
        </div>
      )}

      {/* Central School Folder & Department Shortcuts Showcase */}
      {viewMode === 'central' && (
        <div className="space-y-4">
          {/* Main Central Card */}
          <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-2xs font-semibold">
                <HardDrive className="w-3 h-3" />
                <span>โฟลเดอร์ส่วนกลางประจำสถานศึกษา</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {driveSettings.centralFolderName}
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                จัดเก็บไฟล์เอกสารราชการ แบบฟอร์มคำร้อง คู่มือการจัดการเรียนรู้ และภาพกิจกรรมโรงเรียนบ้านนารี
                {driveSettings.sharedDriveName && ` • สังกัด: ${driveSettings.sharedDriveName}`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {user && canManage && (
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(true)}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  title="สร้างโฟลเดอร์ย่อยในตำแหน่งปัจจุบัน"
                >
                  <FolderPlus className="w-4 h-4 text-slate-950" />
                  <span>+ สร้างโฟลเดอร์ใหม่</span>
                </button>
              )}
              {driveSettings.centralFolderUrl && (
                <a
                  href={driveSettings.centralFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                  <span>เข้าสู่ไดรฟ์ส่วนกลาง</span>
                </a>
              )}
            </div>
          </div>

          {/* Department Subfolder Shortcuts */}
          {driveSettings.departmentFolders && driveSettings.departmentFolders.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Folder className="w-4 h-4 text-amber-500" />
                  <span>โฟลเดอร์เอกสารตามฝ่ายงานบริหาร</span>
                </h3>
                {selectedFolderId && (
                  <button
                    type="button"
                    onClick={() => { setSelectedFolderId(''); setFolderHistory([]); }}
                    className="text-2xs text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    ล้างการเลือก (ดูทั้งหมด)
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {driveSettings.departmentFolders.map((folder) => {
                  const isSelected = selectedFolderId === folder.folderId;
                  return (
                    <div
                      key={folder.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedFolderId('');
                          setFolderHistory([]);
                        } else {
                          setSelectedFolderId(folder.folderId);
                          setFolderHistory([{ id: folder.folderId, name: folder.name }]);
                        }
                      }}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/80 shadow-md ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
                            <Folder className="w-4 h-4" />
                          </div>
                          {folder.folderUrl && (
                            <a
                              href={folder.folderUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-slate-400 hover:text-blue-600 p-1"
                              title="เปิดในแท็บใหม่"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{folder.name}</h4>
                        <p className="text-2xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {folder.description || 'เอกสารประจำฝ่าย'}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-2xs">
                        <span className={`font-semibold ${isSelected ? 'text-blue-700' : 'text-slate-400'}`}>
                          {isSelected ? 'กำลังดูโฟลเดอร์นี้' : 'คลิกเพื่อดูไฟล์'}
                        </span>

                        {user && canManage && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerDepartmentUpload(folder.folderId, folder.name);
                            }}
                            className="px-2 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold text-3xs transition-colors flex items-center gap-1 cursor-pointer"
                            title={`อัปโหลดไฟล์ตรงเข้าสู่ ${folder.name}`}
                          >
                            <Upload className="w-2.5 h-2.5" />
                            <span>อัปโหลด</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Hidden Department File Upload Input */}
              <input
                ref={deptFileInputRef}
                type="file"
                onChange={handleDeptFileUpload}
                className="hidden"
              />
            </div>
          )}
        </div>
      )}

      {/* Auth Prompt if Not Signed In */}
      {!user ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-xl flex flex-col items-center text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
            <HardDrive className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">เข้าสู่ระบบเพื่อเข้าถึงไฟล์และเอกสาร</h2>
          <p className="text-sm text-slate-500 mb-8 max-w-lg leading-relaxed">
            ลงชื่อเข้าใช้ด้วยบัญชี Google เพื่อให้ระบบสามารถดึงรายชื่อไฟล์จาก Google Drive ส่วนกลางและไดรฟ์ของคุณมาแสดงบนหน้าเว็บได้ทันที
          </p>
          <button 
            type="button"
            onClick={onLogin}
            className="gsi-material-button shadow-lg"
          >
            <div className="gsi-material-button-state"></div>
            <div className="gsi-material-button-content-wrapper">
              <div className="gsi-material-button-icon">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              </div>
              <span className="gsi-material-button-contents">ลงชื่อเข้าใช้ด้วย Google</span>
            </div>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Drive Authorization Action Banner */}
          <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-xl">
                <HardDrive className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h4 className="font-bold text-sm">การเชื่อมต่อสิทธิ์เข้าถึง Google Drive</h4>
                <p className="text-2xs text-blue-100">คลิกปุ่มด้านข้างเพื่ออนุญาตสิทธิ์การเข้าถึงไฟล์และโฟลเดอร์ส่วนกลางของโรงเรียน</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleConnectDrive}
              disabled={connectingDrive}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors shrink-0 cursor-pointer"
            >
              {connectingDrive ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <HardDrive className="w-3.5 h-3.5" />}
              <span>อนุญาตสิทธิ์ Google Drive</span>
            </button>
          </div>

          {/* Breadcrumb Navigation Trail */}
          <div className="bg-slate-50 border border-slate-200/80 px-4 py-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleNavigateBreadcrumb(-1)}
                className={`flex items-center gap-1 font-bold ${
                  folderHistory.length === 0 ? 'text-blue-700' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Folder className="w-4 h-4 text-amber-500" />
                <span>{driveSettings.centralFolderName || 'โฟลเดอร์หลัก'}</span>
              </button>

              {folderHistory.map((item, index) => {
                const isLast = index === folderHistory.length - 1;
                return (
                  <React.Fragment key={item.id}>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => handleNavigateBreadcrumb(index)}
                      className={`font-bold line-clamp-1 max-w-[200px] ${
                        isLast ? 'text-blue-700' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {item.name}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              {folderHistory.length > 0 && (
                <button
                  type="button"
                  onClick={handleGoBackOneFolder}
                  className="px-2.5 py-1 text-2xs font-bold text-slate-700 hover:bg-slate-200/60 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>ย้อนกลับ 1 ระดับ</span>
                </button>
              )}

              {user && canManage && (
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(true)}
                  className="px-2.5 py-1 text-2xs font-bold text-blue-700 hover:bg-blue-100 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <FolderPlus className="w-3 h-3 text-amber-500" />
                  <span>สร้างโฟลเดอร์ในนี้</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter, Academic Year Selector & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              {[
                { id: 'all', label: 'ทั้งหมด' },
                { id: 'folder', label: 'โฟลเดอร์' },
                { id: 'pdf', label: 'PDF' },
                { id: 'doc', label: 'Docs/Word' },
                { id: 'sheet', label: 'Sheets' },
                { id: 'image', label: 'รูปภาพ' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedFilter === f.id
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}

              {/* Quick Year Filter Dropdown */}
              <div className="flex items-center gap-1 ml-1 pl-2 border-l border-slate-200">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedYearFilter}
                  onChange={(e) => setSelectedYearFilter(e.target.value)}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-2xs font-bold text-slate-700 outline-none"
                >
                  <option value="all">ทุกปี พ.ศ.</option>
                  <option value={String(currentBE)}>ปี {currentBE} (ปัจจุบัน)</option>
                  <option value={String(currentBE - 1)}>ปี {currentBE - 1}</option>
                  <option value={String(currentBE - 2)}>ปี {currentBE - 2}</option>
                </select>
              </div>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-80">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อเอกสารหรือโฟลเดอร์..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
              >
                ค้นหา
              </button>
            </form>
          </div>

          {/* Drive Error state */}
          {error && (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-900 text-base">การเข้าถึง Google Drive</p>
                  <p className="text-xs text-amber-800 leading-relaxed max-w-xl">{error}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleConnectDrive}
                disabled={connectingDrive}
                className="px-5 py-3 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                {connectingDrive ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>กำลังเชื่อมต่อสิทธิ์...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>อนุญาตสิทธิ์เข้าถึง Google Drive ทันที</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm font-semibold">กำลังเชื่อมต่อข้อมูลจาก Google Drive...</p>
            </div>
          )}

          {/* Files and Folders Grid */}
          {!loading && !error && filteredFiles.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredFiles.map((file) => {
                const isFolder = file.mimeType.includes('folder');
                const iconType = getFileCategoryIcon(file.mimeType);

                return (
                  <div
                    key={file.id}
                    className={`group bg-white rounded-2xl border p-4 shadow-xs transition-all flex flex-col justify-between ${
                      isFolder
                        ? 'border-amber-200/80 bg-amber-50/20 hover:border-amber-400 hover:shadow-md'
                        : 'border-slate-100 hover:shadow-lg hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div 
                          onClick={() => isFolder && handleEnterFolder(file)}
                          className={`p-3 rounded-xl shrink-0 ${isFolder ? 'cursor-pointer hover:scale-105 transition-transform' : ''} ${
                            isFolder ? 'bg-amber-100 text-amber-600' :
                            iconType === 'pdf' ? 'bg-rose-100 text-rose-600' :
                            iconType === 'sheet' ? 'bg-emerald-100 text-emerald-600' :
                            iconType === 'image' ? 'bg-sky-100 text-sky-600' :
                            'bg-blue-100 text-blue-600'
                          }`}
                        >
                          {isFolder ? (
                            <Folder className="w-6 h-6 fill-amber-500 text-amber-600" />
                          ) : iconType === 'image' ? (
                            <ImageIcon className="w-6 h-6" />
                          ) : (
                            <FileText className="w-6 h-6" />
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg cursor-pointer"
                              title="เปิดดูใน Google Drive"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => handleStartRename(file)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                              title={`แก้ไขชื่อ${isFolder ? 'โฟลเดอร์' : 'ไฟล์'}ใน Drive`}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          {canAdmin && (
                            <button
                              type="button"
                              onClick={() => setFileToDelete(file)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title={`ลบ${isFolder ? 'โฟลเดอร์' : 'ไฟล์'}จาก Drive`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Title & Click Action */}
                      <h4 
                        onClick={() => isFolder && handleEnterFolder(file)}
                        className={`text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug ${
                          isFolder ? 'cursor-pointer' : ''
                        }`}
                      >
                        {file.name}
                      </h4>

                      <p className="text-2xs text-slate-400 mt-2">
                        {isFolder 
                          ? 'โฟลเดอร์ใน Drive' 
                          : file.size ? `ขนาด: ${file.size}` : 'ไฟล์เอกสาร'}
                        {file.modifiedTime && ` • แก้ไขเมื่อ ${new Date(file.modifiedTime).toLocaleDateString('th-TH')}`}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                      {isFolder ? (
                        <button
                          type="button"
                          onClick={() => handleEnterFolder(file)}
                          className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>เปิดดูในโฟลเดอร์นี้ →</span>
                        </button>
                      ) : file.webViewLink ? (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>เปิด / ดาวน์โหลด</span>
                        </a>
                      ) : (
                        <span className="text-2xs text-slate-400">เข้าถึงได้ผ่าน Drive</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && !error && filteredFiles.length === 0 && (
            <div className="py-20 text-center text-slate-400">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-base font-bold text-slate-700">ไม่พบเอกสารหรือโฟลเดอร์ในตำแหน่งนี้</p>
              <p className="text-xs text-slate-400 mt-1">
                {folderHistory.length > 0 
                  ? `โฟลเดอร์ "${currentActiveFolderName}" ยังไม่มีไฟล์ คุณสามารถอัปโหลดไฟล์หรือสร้างโฟลเดอร์ย่อยได้ทันที`
                  : 'ลองตรวจสอบการค้นหา หรืออัปโหลดไฟล์ใหม่ขึ้น Google Drive ส่วนกลางของโรงเรียน'}
              </p>
              {user && canManage && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewFolderModal(true)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
                    <span>+ สร้างโฟลเดอร์ย่อย</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>อัปโหลดไฟล์</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for File/Folder Deletion */}
      <ConfirmationModal
        isOpen={!!fileToDelete}
        title={`ยืนยันการลบ${fileToDelete?.mimeType.includes('folder') ? 'โฟลเดอร์' : 'ไฟล์'}จาก Google Drive`}
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบ "${fileToDelete?.name}" ออกจาก Google Drive?\n\nการกระทำนี้จะส่งไฟล์หรือโฟลเดอร์ไปยังถังขยะใน Google Drive`}
        confirmText={isDeleting ? 'กำลังลบ...' : 'ลบถาวร'}
        cancelText="ยกเลิก"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setFileToDelete(null)}
      />

      {/* Rename File/Folder Modal */}
      {fileToRename && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span>แก้ไขชื่อใน Google Drive</span>
              </h3>
              <button
                type="button"
                onClick={() => setFileToRename(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-slate-500">
              ระบบจะแก้ไขชื่อ <strong>"{fileToRename.name}"</strong> บน Google Drive ส่วนกลาง
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อใหม่ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
                placeholder="ระบุชื่อใหม่..."
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setFileToRename(null)}
                className="px-4 py-2 text-xs rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmRename}
                disabled={isRenaming || !newFileName.trim()}
                className="px-5 py-2 text-xs rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {isRenaming ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>ยืนยันเปลี่ยนชื่อ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Subfolder Creation Modal */}
      <NewFolderModal
        isOpen={showNewFolderModal}
        onClose={() => setShowNewFolderModal(false)}
        parentFolderId={currentActiveFolderId}
        parentFolderName={currentActiveFolderName}
        onFolderCreated={handleFolderCreated}
      />

      {/* Academic Year 1-Click Provision Modal */}
      {onSaveDriveSettings && (
        <AcademicYearProvisionModal
          isOpen={showProvisionModal}
          onClose={() => setShowProvisionModal(false)}
          driveSettings={driveSettings}
          onSaveDriveSettings={onSaveDriveSettings}
          onSuccessNotice={(msg) => {
            setActionNotice({ type: 'success', message: msg });
            loadFiles();
          }}
        />
      )}

      {/* Live Diagnostic Modal */}
      <DriveDiagnosticModal
        isOpen={showDiagnosticModal}
        onClose={() => setShowDiagnosticModal(false)}
        driveSettings={driveSettings}
      />

      {/* Visual Folder Structure Hierarchy Modal */}
      <FolderStructureModal
        isOpen={showFolderStructureModal}
        onClose={() => setShowFolderStructureModal(false)}
        driveSettings={driveSettings}
        canManage={canManage}
        onOpenCreateFolder={() => setShowNewFolderModal(true)}
        onOpenProvisionModal={onSaveDriveSettings ? () => setShowProvisionModal(true) : undefined}
        onOpenDriveSettings={canAdmin ? onOpenDriveSettings : undefined}
        onSelectFolder={(folderId, folderName) => {
          setSelectedFolderId(folderId);
          setFolderHistory([{ id: folderId, name: folderName }]);
        }}
      />
    </div>
  );
};
