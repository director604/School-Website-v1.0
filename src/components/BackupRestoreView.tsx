import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  Database, 
  Download, 
  RefreshCw, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound, 
  FileText, 
  RotateCcw, 
  Trash2, 
  ExternalLink, 
  Upload, 
  UserCheck, 
  Layers,
  Sparkles,
  Lock,
  ArrowUpRight
} from 'lucide-react';
import { UserRole, DriveSettings, User } from '../types';
import { 
  createFullBackupToDrive, 
  fetchDriveBackupsList, 
  findOrCreateBackupFolder,
  restoreBackupFromDrive, 
  restoreBackupFromPayload,
  fetchBackupAuditLogs, 
  BackupAuditLog 
} from '../services/backupService';
import { DriveFileItem } from '../types';
import { connectGoogleDrive } from '../services/googleAuth';
import { showSuccess, showError, showWarning, showConfirm } from '../utils/sweetalert';

interface BackupRestoreViewProps {
  user: User | null;
  userRole: UserRole;
  driveSettings?: DriveSettings;
  onRefreshData?: () => void;
}

export const BackupRestoreView: React.FC<BackupRestoreViewProps> = ({
  user,
  userRole,
  driveSettings,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<'drive' | 'logs' | 'local'>('drive');
  const [backupFiles, setBackupFiles] = useState<DriveFileItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<BackupAuditLog[]>([]);
  const [backupFolder, setBackupFolder] = useState<{ id: string; name: string; webViewLink?: string } | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [connectingDrive, setConnectingDrive] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  // Restore Confirmation Modal State
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<DriveFileItem | null>(null);
  const [confirmTextInput, setConfirmTextInput] = useState('');
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  // Manual Local JSON Upload State
  const [localJsonText, setLocalJsonText] = useState('');
  const [localFileName, setLocalFileName] = useState('');

  const currentUserEmail = user?.email || 'SIRASIT.P@gmail.com';
  const currentUserName = user?.displayName || 'ผู้อำนวยการโรงเรียน (Super Admin)';
  const centralFolderId = driveSettings?.centralFolderId || '';

  // Load backups list and logs on mount
  const loadData = async () => {
    setLoadingList(true);
    setNotice(null);
    try {
      // Always find or create backup folder directly on Drive
      const folder = await findOrCreateBackupFolder(centralFolderId);
      setBackupFolder(folder);

      const files = await fetchDriveBackupsList(centralFolderId);
      setBackupFiles(files);

      const logs = await fetchBackupAuditLogs();
      setAuditLogs(logs);
    } catch (err: any) {
      console.warn('Error loading backup list:', err);
      if (err?.message?.includes('สิทธิ์') || err?.message?.includes('หมดอายุ') || err?.message?.includes('ลงชื่อเข้าใช้')) {
        setNotice({
          type: 'warning',
          message: 'ยังไม่ได้เชื่อมต่อ Google Drive หรือสิทธิ์หมดอายุ กรุณากดปุ่ม "เชื่อมต่อสิทธิ์ Google Drive" ด้านบนเพื่อสร้างโฟลเดอร์สำรองข้อมูลบน Google Drive'
        });
      } else {
        setNotice({
          type: 'error',
          message: err.message || 'ไม่สามารถค้นหาหรือสร้างโฟลเดอร์สำรองข้อมูลบน Google Drive ได้'
        });
      }
      // Load audit logs regardless
      const logs = await fetchBackupAuditLogs().catch(() => []);
      setAuditLogs(logs);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [centralFolderId]);

  // Connect Google Drive Handler
  const handleConnectDrive = async () => {
    setConnectingDrive(true);
    setNotice(null);
    try {
      await connectGoogleDrive();
      showSuccess('เชื่อมต่อสำเร็จ', 'เชื่อมต่อสิทธิ์ Google Drive และจัดเตรียมโฟลเดอร์สำรองข้อมูลสำเร็จ');
      await loadData();
    } catch (err: any) {
      showError('เชื่อมต่อล้มเหลว', err.message);
    } finally {
      setConnectingDrive(false);
    }
  };

  // Trigger Instant Full Backup To Google Drive
  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    setNotice(null);
    try {
      const result = await createFullBackupToDrive(
        centralFolderId,
        currentUserEmail,
        currentUserName,
        driveSettings?.currentAcademicYear || 2569
      );

      showSuccess(
        'สำรองข้อมูลสำเร็จ!',
        `สร้างไฟล์ "${result.driveFile.name}" ขึ้น Google Drive เรียบร้อยแล้ว (รวมทั้งสิ้น ${result.totalRecords} รายการ)`
      );
      setNotice({
        type: 'success',
        message: `สำรองข้อมูลเข้าสู่ Google Drive สำเร็จแล้ว (${result.totalRecords} รายการข้อมูล)`
      });
      await loadData();
    } catch (err: any) {
      console.error('Backup error:', err);
      showError('สำรองข้อมูลไม่สำเร็จ', err.message || 'เกิดข้อผิดพลาดในการสำรองข้อมูลขึ้น Google Drive');
      setNotice({
        type: 'error',
        message: err.message || 'ไม่สามารถสำรองข้อมูลขึ้น Google Drive ได้'
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  // Open Restore Confirmation Modal
  const handleOpenRestoreModal = (file: DriveFileItem) => {
    setSelectedBackupForRestore(file);
    setConfirmTextInput('');
    setShowRestoreModal(true);
  };

  // Execute Restore from Selected Google Drive Backup File
  const handleConfirmRestore = async () => {
    if (!selectedBackupForRestore) return;
    if (confirmTextInput.trim().toUpperCase() !== 'RESTORE') {
      showWarning('คำยืนยันไม่ถูกต้อง', 'กรุณาพิมพ์คำว่า "RESTORE" ตัวพิมพ์ใหญ่ให้ถูกต้องเพื่อยืนยัน');
      return;
    }

    setIsRestoring(true);
    try {
      const result = await restoreBackupFromDrive(
        selectedBackupForRestore.id,
        currentUserEmail,
        currentUserName
      );

      showSuccess(
        'กู้คืนข้อมูลสำเร็จ!',
        `กู้คืนข้อมูลสถานศึกษาเรียบร้อยแล้ว รวมทั้งสิ้น ${result.totalRestored} รายการข้อมูล`
      );
      setShowRestoreModal(false);
      setSelectedBackupForRestore(null);
      if (onRefreshData) onRefreshData();
      await loadData();
    } catch (err: any) {
      console.error('Restore error:', err);
      showError('เกิดข้อผิดพลาดในการกู้คืนข้อมูล', err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  // Manual Local JSON Upload Handler
  const handleLocalJsonFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLocalFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setLocalJsonText(reader.result as string);
    };
    reader.readAsText(file);
  };

  const handleRestoreFromLocalJson = async () => {
    if (!localJsonText.trim()) {
      showWarning('ยังไม่มีข้อมูล', 'กรุณาเลือกไฟล์ JSON สำรองข้อมูลจากเครื่อง');
      return;
    }

    const confirmed = await showConfirm(
      'ยืนยันการกู้คืนข้อมูลจากไฟล์ท้องถิ่น',
      'ข้อมูลปัจจุบันในระบบจะถูกปรับปรุงตามไฟล์สำรองข้อมูลที่คุณเลือก คุณแน่ใจหรือไม่?',
      'กู้คืนข้อมูล',
      'ยกเลิก',
      true
    );

    if (!confirmed) return;

    setIsRestoring(true);
    try {
      let payload: any;
      try {
        payload = JSON.parse(localJsonText);
      } catch (e) {
        throw new Error('โครงสร้างไฟล์ JSON ไม่ถูกต้อง');
      }

      if (!payload || !payload.data) {
        throw new Error('ไฟล์สำรองข้อมูลต้องมีโครงสร้างส่วนประกอบ "data"');
      }

      // Restore data directly into Cloudflare D1
      const result = await restoreBackupFromPayload(
        payload,
        currentUserEmail,
        currentUserName,
        'ไฟล์ JSON ท้องถิ่น'
      );

      showSuccess(
        'กู้คืนข้อมูลสำเร็จ!',
        `กู้คืนข้อมูลเข้าสู่ Cloudflare D1 เรียบร้อยแล้ว (รวม ${result.totalRestored} รายการข้อมูล)`
      );
      setLocalJsonText('');
      setLocalFileName('');
      if (onRefreshData) onRefreshData();
      await loadData();
    } catch (err: any) {
      showError('กู้คืนล้มเหลว', err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Banner (Compact & Organized) */}
      <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-4 sm:p-5 overflow-hidden shadow-md border border-slate-800/80">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left Title & Info */}
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-3xs font-extrabold uppercase tracking-wider">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>Cloudflare D1 Native Backup</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-3xs font-mono font-bold">
                15 Tables
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-3xs font-mono">
                DB: bannaree-db (56fe1149)
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-3xs font-semibold">
                Firebase 0 Read/Write
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-snug">
              ระบบสำรองและกู้คืนฐานข้อมูล Cloudflare D1 (Google Drive Archive)
            </h1>
            <p className="text-xs text-slate-300 leading-normal line-clamp-1 sm:line-clamp-none">
              ส่งออกโครงสร้างข้อมูลครบ 15 ตารางจาก Cloudflare D1 และจัดเก็บไฟล์ JSON บน Google Drive อัตโนมัติ ปลอดภัยและไม่กินโควต้า Firebase
            </p>
          </div>

          {/* Right Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
            {/* Open Drive Backup Folder Button */}
            {backupFolder && (
              <a
                href={backupFolder.webViewLink || `https://drive.google.com/drive/folders/${backupFolder.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 px-3.5 bg-blue-600/90 hover:bg-blue-500 text-white border border-blue-400/30 rounded-xl font-semibold text-xs inline-flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <HardDrive className="w-3.5 h-3.5 text-amber-300" />
                <span>เปิดโฟลเดอร์ Drive</span>
                <ExternalLink className="w-3 h-3 text-blue-200" />
              </a>
            )}

            {/* Connect Drive Button */}
            <button
              type="button"
              disabled={connectingDrive}
              onClick={handleConnectDrive}
              className="h-9 px-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-300" />
              <span>{connectingDrive ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อสิทธิ์ Drive'}</span>
            </button>

            {/* Instant Backup Button */}
            <button
              type="button"
              disabled={isBackingUp}
              onClick={handleCreateBackup}
              className="h-9 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-extrabold text-xs inline-flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isBackingUp ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                  <span>กำลังสำรองข้อมูล...</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5 fill-slate-950" />
                  <span>+ สำรองข้อมูลทันที</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 shadow-2xs ${
          notice.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : notice.type === 'warning'
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-2.5">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            <span className="font-semibold">{notice.message}</span>
          </div>

          <button
            type="button"
            onClick={handleConnectDrive}
            className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 rounded-xl font-bold text-2xs shrink-0 shadow-2xs cursor-pointer hover:bg-amber-100"
          >
            เชื่อมต่อ Drive ทันที
          </button>
        </div>
      )}

      {/* 2. Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 border border-slate-200 rounded-2xl shadow-2xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('drive')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'drive'
                ? 'bg-blue-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <HardDrive className="w-4 h-4 text-amber-400" />
            <span>ไฟล์สำรองบน Google Drive ({backupFiles.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-blue-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-4 h-4 text-blue-400" />
            <span>บันทึกประวัติการทำงาน ({auditLogs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('local')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'local'
                ? 'bg-blue-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>นำเข้าไฟล์ JSON จากเครื่อง</span>
          </button>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loadingList}
          className="px-3 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? 'animate-spin' : ''}`} />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>

      {/* 3. TAB 1: Google Drive Backups List */}
      {activeTab === 'drive' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-blue-950 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0">
                <HardDrive className="w-5 h-5 text-amber-300" />
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-sm text-blue-950 flex items-center gap-2">
                  <span>00_ระบบสำรองข้อมูล_โรงเรียนบ้านนารี</span>
                  {backupFolder?.id && (
                    <span className="text-3xs font-mono bg-blue-200/80 text-blue-900 px-2 py-0.5 rounded-md">
                      ID: {backupFolder.id}
                    </span>
                  )}
                </div>
                <div className="text-2xs text-blue-700 mt-0.5">
                  {backupFolder ? 'โฟลเดอร์จัดเก็บไฟล์สำรองข้อมูล JSON บน Google Drive' : 'กำลังค้นหาหรือสร้างโฟลเดอร์บน Google Drive...'}
                </div>
              </div>
            </div>

            {backupFolder ? (
              <a
                href={backupFolder.webViewLink || `https://drive.google.com/drive/folders/${backupFolder.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-2xs transition-all"
              >
                <span>เปิดดูโฟลเดอร์ใน Google Drive</span>
                <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
              </a>
            ) : (
              <button
                type="button"
                onClick={handleConnectDrive}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>เชื่อมต่อ Drive เพื่อเปิดโฟลเดอร์</span>
              </button>
            )}
          </div>

          {loadingList ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3 shadow-2xs">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-600 font-medium">กำลังโหลดรายการไฟล์สำรองข้อมูลจาก Google Drive...</p>
            </div>
          ) : backupFiles.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-4 shadow-2xs">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Database className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">ยังไม่มีไฟล์สำรองข้อมูลใน Google Drive</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                  กดปุ่ม "+ สำรองข้อมูลทันที (Backup Now)" ด้านบนเพื่อสร้างไฟล์สำรองข้อมูลฉบับแรกขึ้น Google Drive ของโรงเรียน
                </p>
              </div>
              <button
                type="button"
                onClick={handleCreateBackup}
                disabled={isBackingUp}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Database className="w-4 h-4" />
                <span>สำรองข้อมูลทันที</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {backupFiles.map((file) => (
                <div
                  key={file.id}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-3 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-2xl shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 truncate" title={file.name}>
                          {file.name}
                        </h4>
                        <div className="flex items-center gap-2 text-2xs text-slate-500 mt-1">
                          <span>ขนาด: {file.size}</span>
                          <span>•</span>
                          <span>สร้างเมื่อ: {file.modifiedTime ? new Date(file.modifiedTime).toLocaleString('th-TH') : 'ไม่ระบุ'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {/* View in Drive */}
                    {file.webViewLink && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-2xs font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        <span>ดูบน Drive</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {/* Restore Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenRestoreModal(file)}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>กู้คืนข้อมูล (Restore)</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 2: Audit Logs List */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-sm">ประวัติบันทึกกิจกรรมการสำรองและกู้คืน (Audit Logs)</h3>
            </div>
            <span className="text-2xs text-slate-400">แสดง 50 รายการล่าสุด</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-900 font-bold">
                <tr>
                  <th className="p-3.5">วัน/เวลา</th>
                  <th className="p-3.5">กิจกรรม (Action)</th>
                  <th className="p-3.5">ผู้ดำเนินการ</th>
                  <th className="p-3.5">รายละเอียดผลลัพธ์</th>
                  <th className="p-3.5 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                      ยังไม่มีประวัติบันทึกกิจกรรม
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log, idx) => (
                    <tr key={log.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-medium whitespace-nowrap text-slate-600">
                        {new Date(log.timestamp).toLocaleString('th-TH')}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-md text-3xs font-extrabold ${
                          log.action === 'BACKUP_CREATE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.action === 'BACKUP_RESTORE'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {log.actionLabel || log.action}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{log.performedByName}</div>
                        <div className="text-3xs text-slate-500">{log.performedByEmail}</div>
                      </td>
                      <td className="p-3.5 leading-relaxed text-slate-800">
                        {log.details}
                        {log.driveFileName && (
                          <div className="text-3xs text-blue-700 font-medium mt-0.5">
                            ไฟล์: {log.driveFileName}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-3xs font-bold ${
                          log.status === 'SUCCESS' 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-rose-600 text-white'
                        }`}>
                          {log.status === 'SUCCESS' ? 'สำเร็จ' : 'ล้มเหลว'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. TAB 3: Local JSON Import Restore */}
      {activeTab === 'local' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-2xs">
          <div className="space-y-1">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-600" />
              <span>นำเข้าและกู้คืนข้อมูลจากไฟล์ JSON ท้องถิ่น</span>
            </h3>
            <p className="text-xs text-slate-500">
              สามารถเลือกไฟล์สำรองข้อมูลรูปแบบ `.json` ที่คอมพิวเตอร์ของคุณเพื่อนำเข้าและอัปเดตข้อมูลเข้าสู่ฐานข้อมูลโรงเรียนได้ทันที
            </p>
          </div>

          <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 flex flex-col items-center justify-center space-y-3">
            <FileText className="w-10 h-10 text-slate-400" />
            <p className="text-xs text-slate-600 font-semibold text-center">
              เลือกไฟล์ JSON สำรองข้อมูลจากคอมพิวเตอร์ของคุณ
            </p>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleLocalJsonFileSelect}
              className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-900 file:text-white hover:file:bg-blue-800 cursor-pointer"
            />
            {localFileName && (
              <p className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                เลือกไฟล์: {localFileName}
              </p>
            )}
          </div>

          {localJsonText && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-800">
                เนื้อหาตัวอย่างไฟล์สำรองข้อมูล (JSON Preview)
              </label>
              <textarea
                value={localJsonText.slice(0, 1000) + (localJsonText.length > 1000 ? '\n...[ข้อมูลเพิ่มเติม]' : '')}
                readOnly
                rows={6}
                className="w-full p-3 bg-slate-900 text-emerald-400 font-mono text-2xs rounded-xl border border-slate-800"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={isRestoring}
                  onClick={handleRestoreFromLocalJson}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                  <span>{isRestoring ? 'กำลังกู้คืนข้อมูล...' : 'กู้คืนข้อมูลจากไฟล์นี้'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. Restore Confirmation Modal */}
      {showRestoreModal && selectedBackupForRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                  ยืนยันการกู้คืนข้อมูลสถานศึกษา (Data Restore)
                </h3>
                <p className="text-2xs text-slate-500 mt-0.5">
                  โปรดตรวจสอบข้อมูลให้แน่ใจก่อนดำเนินการ
                </p>
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>คำเตือนความปลอดภัย</span>
              </p>
              <p className="leading-relaxed">
                การกู้คืนข้อมูลจะนำข้อมูลจากไฟล์ <strong>"{selectedBackupForRestore.name}"</strong> มาเขียนทับและอัปเดตข้อมูลปัจจุบันในระบบโรงเรียนบ้านนารี
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                พิมพ์คำว่า <strong className="text-rose-600 font-mono">RESTORE</strong> ตัวพิมพ์ใหญ่เพื่อยืนยัน:
              </label>
              <input
                type="text"
                value={confirmTextInput}
                onChange={(e) => setConfirmTextInput(e.target.value)}
                placeholder="พิมพ์ RESTORE ตรงนี้..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-xs font-bold text-slate-900 bg-white uppercase focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowRestoreModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isRestoring || confirmTextInput.trim().toUpperCase() !== 'RESTORE'}
                onClick={handleConfirmRestore}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-40"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isRestoring ? 'กำลังกู้คืนข้อมูล...' : 'กู้คืนข้อมูลทันที'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
