import React, { useState } from 'react';
import { 
  X, 
  Save, 
  HardDrive, 
  FolderPlus, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Folder,
  Link2,
  FolderOpen,
  Info,
  Activity
} from 'lucide-react';
import { DriveSettings, DriveFolderConfig, DriveFolderCategory } from '../types';
import { extractFolderId, validateDriveFolder } from '../services/driveService';
import { DriveDiagnosticModal } from './DriveDiagnosticModal';

interface DriveSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DriveSettings;
  onSave: (updatedSettings: DriveSettings) => Promise<void>;
}

export const DriveSettingsModal: React.FC<DriveSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave
}) => {
  const [formData, setFormData] = useState<DriveSettings>({ ...settings });
  const [saving, setSaving] = useState(false);
  const [testingFolder, setTestingFolder] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; name?: string; error?: string } | null>(null);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);

  // New Subfolder state
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderCategory, setNewFolderCategory] = useState<DriveFolderCategory>('academic');
  const [newFolderInput, setNewFolderInput] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');

  if (!isOpen) return null;

  const handleTestCentralFolder = async () => {
    if (!formData.centralFolderId.trim()) return;
    setTestingFolder(true);
    setTestResult(null);

    const folderId = extractFolderId(formData.centralFolderId);
    const result = await validateDriveFolder(folderId);
    setTestResult(result);
    setTestingFolder(false);
  };

  const handleAddSubfolder = () => {
    if (!newFolderName.trim()) return;

    const folderId = extractFolderId(newFolderInput);
    const folderUrl = newFolderInput.startsWith('http')
      ? newFolderInput
      : `https://drive.google.com/drive/folders/${folderId}`;

    const newFolder: DriveFolderConfig = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      folderId: folderId,
      folderUrl: folderUrl,
      category: newFolderCategory,
      description: newFolderDesc.trim()
    };

    setFormData(prev => ({
      ...prev,
      departmentFolders: [...(prev.departmentFolders || []), newFolder]
    }));

    setNewFolderName('');
    setNewFolderInput('');
    setNewFolderDesc('');
  };

  const handleRemoveSubfolder = (id: string) => {
    setFormData(prev => ({
      ...prev,
      departmentFolders: prev.departmentFolders.filter(f => f.id !== id)
    }));
  };

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const cleanCentralId = extractFolderId(formData.centralFolderId);
      const cleanCentralUrl = formData.centralFolderUrl || (cleanCentralId ? `https://drive.google.com/drive/folders/${cleanCentralId}` : '');

      await onSave({
        ...formData,
        centralFolderId: cleanCentralId,
        centralFolderUrl: cleanCentralUrl,
        updatedAt: new Date().toISOString()
      });
      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: any) {
      console.error('Error saving drive settings:', err);
      setSaveError(err?.message || 'บันทึกการตั้งค่าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 to-indigo-950 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-300 rounded-xl">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">โมดูลการตั้งค่า Google Drive ส่วนกลาง</h3>
              <p className="text-xs text-blue-200">
                กำหนดโฟลเดอร์กลางและแยกโฟลเดอร์เอกสารตาม 4 ฝ่ายบริหารงานของโรงเรียน
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {formData.centralFolderUrl && (
              <a
                href={formData.centralFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                title="เปิดคลังเอกสารใน Google Drive แท็บใหม่"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">เข้าสู่คลังเอกสาร Drive</span>
                <span className="sm:hidden">คลัง Drive</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-700">
          {/* Info Banner */}
          <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-blue-950">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>วิธีใช้งาน Google Drive ส่วนกลาง:</strong>
                <p className="mt-1">
                  1. สร้างโฟลเดอร์หลักใน Google Drive ของโรงเรียน (เช่น บัญชีโรงเรียน หรือ Shared Drive)
                  <br />
                  2. ตั้งค่าการแชร์เป็น "ทุกคนที่มีลิงก์มีสิทธิ์ดู" (Anyone with the link can view) หรือแชร์ให้คณะครู
                  <br />
                  3. คัดลอก Folder ID หรือลิงก์ URL มาวางในช่องด้านล่างนี้ ระบบจะเชื่อมต่อและแสดงไฟล์ในคลังเอกสารอัตโนมัติ
                </p>
              </div>
            </div>

            {formData.centralFolderUrl && (
              <a
                href={formData.centralFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-all shrink-0 self-stretch sm:self-auto justify-center"
              >
                <ExternalLink className="w-4 h-4" />
                <span>คลังเอกสาร Drive (เปิดใน Google Drive)</span>
              </a>
            )}
          </div>

          {/* Central Folder Configuration */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 text-sm border-b pb-2 flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-blue-600" />
              <span>โฟลเดอร์หลักส่วนกลาง (Central School Drive)</span>
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                ชื่อโฟลเดอร์ส่วนกลาง <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.centralFolderName}
                onChange={(e) => setFormData({ ...formData, centralFolderName: e.target.value })}
                placeholder="เช่น โรงเรียนบ้านนารี - คลังเอกสารราชการส่วนกลาง"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Google Drive Folder ID หรือ Link URL <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.centralFolderId}
                    onChange={(e) => setFormData({ ...formData, centralFolderId: e.target.value })}
                    placeholder="วางลิงก์ https://drive.google.com/drive/folders/... หรือ ID"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-sm font-mono text-xs"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 items-end">
                <button
                  type="button"
                  onClick={handleTestCentralFolder}
                  disabled={testingFolder || !formData.centralFolderId.trim()}
                  className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  title="ทดสอบอ่านชื่อโฟลเดอร์"
                >
                  {testingFolder ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                  <span>ตรวจการเชื่อมต่อ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDiagnosticModal(true)}
                  disabled={!formData.centralFolderId.trim()}
                  className="flex-1 py-2.5 px-3 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                  title="ทดสอบสร้าง เขียน ลบไฟล์ ใน Drive ส่วนกลางจริง"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>ทดสอบ เพิ่ม-ลบ-แก้ไข</span>
                </button>
              </div>
            </div>

            {/* Test result feedback */}
            {testResult && (
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                testResult.valid
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                {testResult.valid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      เชื่อมต่อสำเร็จ: <strong>"{testResult.name}"</strong> พร้อมใช้งาน
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      หมายเหตุ: {testResult.error || 'ไม่พบโฟลเดอร์ กรุณาตรวจสอบสิทธิ์การแชร์หรือ Folder ID'}
                    </span>
                  </>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ชื่อไดรฟ์ที่แชร์ (Shared Drive / Workspace)
                </label>
                <input
                  type="text"
                  value={formData.sharedDriveName || ''}
                  onChange={(e) => setFormData({ ...formData, sharedDriveName: e.target.value })}
                  placeholder="เช่น Ban Naree Educational Cloud"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowPublicDownload}
                    onChange={(e) => setFormData({ ...formData, allowPublicDownload: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    เปิดให้ประชาชน/ผู้ปกครองดาวน์โหลดเอกสารสาธารณะได้
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enableVideoGallery !== false}
                    onChange={(e) => setFormData({ ...formData, enableVideoGallery: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-blue-900">
                    เปิดแสดงผล "คลังวิดีโอกิจกรรมโรงเรียน" บนหน้าเว็บไซต์
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Department Folders Management */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Folder className="w-4 h-4 text-amber-600" />
                <span>โฟลเดอร์ประจำฝ่ายงาน ({formData.departmentFolders?.length || 0} โฟลเดอร์)</span>
              </h4>
            </div>

            {/* List Existing Folders */}
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {(formData.departmentFolders || []).map((f) => (
                <div
                  key={f.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{f.name}</p>
                      <p className="text-2xs text-slate-500 truncate">{f.description || f.category}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {f.folderUrl && (
                      <a
                        href={f.folderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-white"
                        title="เปิดโฟลเดอร์นี้ใน Google Drive"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveSubfolder(f.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white"
                      title="ลบโฟลเดอร์นี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Folder Box */}
            <div className="p-4 bg-slate-50/70 border border-dashed border-slate-300 rounded-2xl space-y-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4 text-blue-600" />
                <span>เพิ่มโฟลเดอร์ฝ่ายงานใหม่</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="ชื่อโฟลเดอร์ เช่น 01_งานวิชาการ..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  />
                </div>
                <div>
                  <select
                    value={newFolderCategory}
                    onChange={(e) => setNewFolderCategory(e.target.value as DriveFolderCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="academic">งานวิชาการ</option>
                    <option value="budget">งานงบประมาณ/แผนงาน</option>
                    <option value="personnel">งานบุคคล</option>
                    <option value="general">งานบริหารทั่วไป</option>
                    <option value="gallery">คลังภาพกิจกรรม</option>
                    <option value="other">อื่นๆ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={newFolderInput}
                    onChange={(e) => setNewFolderInput(e.target.value)}
                    placeholder="ลิงก์ URL หรือ ID ของโฟลเดอร์ใน Google Drive..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleAddSubfolder}
                    disabled={!newFolderName.trim()}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>เพิ่มโฟลเดอร์</span>
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={newFolderDesc}
                onChange={(e) => setNewFolderDesc(e.target.value)}
                placeholder="คำอธิบายสั้นๆ เกี่ยวกับเอกสารในโฟลเดอร์นี้..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
              />
            </div>
          </div>

          {/* Success or Error Notice */}
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>บันทึกการตั้งค่า Google Drive เรียบร้อยแล้ว! กำลังปิดหน้าต่าง...</span>
            </div>
          )}

          {saveError && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Footer Buttons */}
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
              disabled={saving || saveSuccess}
              className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : saveSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{saveSuccess ? 'บันทึกสำเร็จ' : 'บันทึกการตั้งค่า Drive'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Full Diagnostic Modal */}
      <DriveDiagnosticModal
        isOpen={showDiagnosticModal}
        onClose={() => setShowDiagnosticModal(false)}
        driveSettings={formData}
      />
    </div>
  );
};
