import React, { useState } from 'react';
import { 
  Calendar, 
  Sparkles, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  FolderPlus, 
  ExternalLink, 
  Layers, 
  ShieldCheck,
  FolderTree,
  ArrowRight
} from 'lucide-react';
import { 
  provisionAcademicYearFolders, 
  STANDARD_ACADEMIC_SUBFOLDERS, 
  getCurrentAcademicYearBE,
  AcademicYearProvisionResult 
} from '../services/driveService';
import { DriveSettings, DriveFolderConfig } from '../types';

interface AcademicYearProvisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  driveSettings: DriveSettings;
  onSaveDriveSettings: (updated: DriveSettings) => Promise<void>;
  onSuccessNotice?: (message: string) => void;
}

export const AcademicYearProvisionModal: React.FC<AcademicYearProvisionModalProps> = ({
  isOpen,
  onClose,
  driveSettings,
  onSaveDriveSettings,
  onSuccessNotice
}) => {
  const currentBE = getCurrentAcademicYearBE();
  const [selectedYear, setSelectedYear] = useState<number>(currentBE);
  const [syncShortcuts, setSyncShortcuts] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AcademicYearProvisionResult | null>(null);

  if (!isOpen) return null;

  const yearOptions = [
    currentBE + 1,
    currentBE,
    currentBE - 1,
    currentBE - 2
  ];

  const handleStartProvision = async () => {
    if (!driveSettings.centralFolderId) {
      setError('ยังไม่ได้ระบุโฟลเดอร์ส่วนกลางของโรงเรียน กรุณาตั้งค่าโฟลเดอร์กลางก่อน');
      return;
    }

    setLoading(true);
    setError(null);
    setProgressMsg(`กำลังเริ่มจัดเตรียมโครงสร้างปีการศึกษา ${selectedYear}...`);

    try {
      const res = await provisionAcademicYearFolders(
        driveSettings.centralFolderId,
        selectedYear,
        (msg) => setProgressMsg(msg)
      );

      setResult(res);

      // If user wants to sync to shortcuts
      if (syncShortcuts) {
        setProgressMsg('กำลังบันทึกและเชื่อมโยงปุ่มลัดของโรงเรียน...');

        // Map newly created subfolders to DriveFolderConfig
        const newDepartmentFolders: DriveFolderConfig[] = res.createdSubfolders.map((sf, idx) => ({
          id: `dept-${selectedYear}-${idx}`,
          name: sf.configName,
          folderId: sf.folder.id,
          folderUrl: sf.folder.webViewLink || `https://drive.google.com/drive/folders/${sf.folder.id}`,
          category: sf.category,
          yearBE: selectedYear,
          description: STANDARD_ACADEMIC_SUBFOLDERS.find(s => s.category === sf.category)?.description || 'เอกสารประจำฝ่าย'
        }));

        // Keep other year department folders or replace/merge
        const existingOtherYears = (driveSettings.departmentFolders || []).filter(
          f => f.yearBE !== selectedYear
        );

        const updatedAvailableYears = Array.from(
          new Set([...(driveSettings.availableYears || []), selectedYear])
        ).sort((a, b) => b - a);

        const updatedSettings: DriveSettings = {
          ...driveSettings,
          currentAcademicYear: selectedYear,
          availableYears: updatedAvailableYears,
          departmentFolders: [...newDepartmentFolders, ...existingOtherYears],
          updatedAt: new Date().toISOString()
        };

        await onSaveDriveSettings(updatedSettings);
      }

      if (onSuccessNotice) {
        onSuccessNotice(`จัดเตรียมโฟลเดอร์ปีการศึกษา ${selectedYear} บน Google Drive เสร็จสมบูรณ์แล้ว!`);
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการจัดเตรียมโฟลเดอร์ใน Drive');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setProgressMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-950 via-indigo-900 to-blue-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400 text-slate-950 rounded-2xl shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">ระบบจัดเตรียมโฟลเดอร์ประจำปีการศึกษาอัตโนมัติ</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-2xs font-semibold">
                  Auto-Provisioning
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                สร้างชุดโฟลเดอร์มาตรฐาน 4 ฝ่ายบริหารและภาพกิจกรรมใน Google Drive อัตโนมัติในคลิกเดียว
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-700">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">เกิดข้อผิดพลาดในการดำเนินการ</p>
                <p className="mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {!result ? (
            <>
              {/* Year Selection */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-900 block">
                      เลือกปีการศึกษา / ปี พ.ศ. ที่ต้องการจัดเตรียม
                    </label>
                    <p className="text-2xs text-slate-500">
                      ระบบจะสร้างโฟลเดอร์หลัก "ปีการศึกษา [พ.ศ.]" ภายใต้โฟลเดอร์ {driveSettings.centralFolderName}
                    </p>
                  </div>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    disabled={loading}
                    className="px-4 py-2 bg-white rounded-xl border border-slate-300 text-sm font-bold text-blue-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none cursor-pointer"
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        ปีการศึกษา {year} {year === currentBE ? '(ปีปัจจุบัน)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Folder Structure Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <FolderTree className="w-4 h-4 text-amber-500" />
                    <span>โครงสร้างโฟลเดอร์ที่จะถูกสร้างใน Google Drive</span>
                  </h4>
                  <span className="text-2xs text-slate-400">รวม 6 โฟลเดอร์มาตรฐาน</span>
                </div>

                <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl text-xs font-mono space-y-2 border border-slate-800">
                  <div className="text-amber-400 font-bold flex items-center gap-2">
                    <span>📁</span>
                    <span>{driveSettings.centralFolderName || 'โฟลเดอร์กลางโรงเรียน'}</span>
                  </div>
                  <div className="pl-4 text-blue-300 font-bold flex items-center gap-2">
                    <span>└── 📁</span>
                    <span>ปีการศึกษา {selectedYear}</span>
                  </div>
                  {STANDARD_ACADEMIC_SUBFOLDERS.map((sub) => (
                    <div key={sub.name} className="pl-10 text-slate-300 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5">
                        <span className="text-slate-500">├── 📁</span>
                        <span>{sub.name}_{selectedYear}</span>
                      </span>
                      <span className="text-2xs text-slate-400 font-sans hidden sm:inline">
                        ({sub.description.slice(0, 28)}...)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shortcut Sync Option */}
              <label className="flex items-start gap-3 p-3.5 bg-blue-50/60 border border-blue-200/60 rounded-2xl cursor-pointer hover:bg-blue-50 transition-colors">
                <input
                  type="checkbox"
                  checked={syncShortcuts}
                  onChange={(e) => setSyncShortcuts(e.target.checked)}
                  disabled={loading}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-blue-950 block">
                    อัปเดตปุ่มลัด (Shortcut Badges) บนหน้าเว็บโรงเรียนทันที
                  </span>
                  <span className="text-slate-600 text-2xs leading-relaxed block mt-0.5">
                    จะเชื่อมโยงโฟลเดอร์ของปีการศึกษา {selectedYear} เข้าสู่เมนูกลุ่มงาน 4 ฝ่ายบนหน้าเว็บโรงเรียนโดยอัตโนมัติ เพื่อให้ครูคลิกเข้าถึงได้ทันที
                  </span>
                </div>
              </label>

              {/* Progress State */}
              {loading && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3 animate-pulse">
                  <RefreshCw className="w-5 h-5 animate-spin text-amber-600 shrink-0" />
                  <div>
                    <p className="font-bold">ระบบกำลังจัดเตรียมโฟลเดอร์ใน Google Drive...</p>
                    <p className="text-2xs mt-0.5 text-amber-700">{progressMsg}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Success Summary View */
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">จัดเตรียมโฟลเดอร์ปีการศึกษา {result.yearBE} สำเร็จเรียบร้อย!</h4>
                  <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                    ระบบได้สร้างหรือเชื่อมโยงโฟลเดอร์มาตรฐานใน Google Drive ของโรงเรียนเรียบร้อยแล้ว ทุกไฟล์ที่เพิ่มในโฟลเดอร์เหล่านี้จะได้รับสิทธิ์ตามโฟลเดอร์หลักทันที
                  </p>
                </div>
              </div>

              {/* Created Folders List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">โฟลเดอร์ที่พร้อมใช้งาน:</span>
                  {result.yearFolder.webViewLink && (
                    <a
                      href={result.yearFolder.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-2xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <span>เปิดโฟลเดอร์ปี {result.yearBE} ใน Google Drive</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  {result.createdSubfolders.map((item) => (
                    <div key={item.folder.id} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                          <FolderTree className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{item.configName}</p>
                          <span className={`text-2xs font-semibold ${item.isNew ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {item.isNew ? '• สร้างใหม่ใน Drive' : '• ตรวจพบโฟลเดอร์เดิม'}
                          </span>
                        </div>
                      </div>

                      {item.folder.webViewLink && (
                        <a
                          href={item.folder.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-semibold text-2xs flex items-center gap-1 transition-colors"
                        >
                          <span>เปิด Drive</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {!result ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={handleStartProvision}
                disabled={loading}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 hover:from-blue-800 hover:to-indigo-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>กำลังประมวลผล...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>สร้างโครงสร้างปี {selectedYear} ทันที (1-Click)</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                สร้างสำหรับปีอื่นเพิ่มเติม
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                เสร็จสิ้น / ปิดหน้าต่าง
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
