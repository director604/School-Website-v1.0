import React from 'react';
import { 
  X, 
  FolderTree, 
  Folder, 
  FolderPlus, 
  ExternalLink, 
  Sparkles, 
  Layers, 
  HardDrive, 
  Settings,
  ChevronRight,
  Info,
  CheckCircle2
} from 'lucide-react';
import { DriveSettings } from '../types';

interface FolderStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  driveSettings: DriveSettings;
  canManage: boolean;
  onOpenCreateFolder: () => void;
  onOpenProvisionModal?: () => void;
  onOpenDriveSettings?: () => void;
  onSelectFolder?: (folderId: string, folderName: string) => void;
}

export const FolderStructureModal: React.FC<FolderStructureModalProps> = ({
  isOpen,
  onClose,
  driveSettings,
  canManage,
  onOpenCreateFolder,
  onOpenProvisionModal,
  onOpenDriveSettings,
  onSelectFolder
}) => {
  if (!isOpen) return null;

  const departmentFolders = driveSettings.departmentFolders || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-300 rounded-2xl border border-blue-400/20">
              <FolderTree className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-3xs font-extrabold uppercase tracking-wider mb-0.5">
                <span>Google Drive Workspace</span>
              </div>
              <h3 className="text-lg font-bold">โครงสร้างและแผนผังโฟลเดอร์โรงเรียน</h3>
              <p className="text-xs text-blue-200/80">
                แผนผังการจัดเก็บเอกสาร 4 ฝ่ายบริหารและตำแหน่งปุ่มสร้างโฟลเดอร์
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs">
          
          {/* Guide Banner: Where are the folder buttons? */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-900 text-xs">
                ตำแหน่งของปุ่มสร้างโฟลเดอร์ (+ โฟลเดอร์ใหม่)
              </h4>
              <p className="text-2xs text-slate-600 leading-relaxed">
                ปุ่ม <strong>"+ สร้างโฟลเดอร์ใหม่"</strong> อยู่ในหน้า <strong>"คลังไดรฟ์โรงเรียน (Drive)"</strong> ที่ <strong>แถบเครื่องมือด้านบนขวา</strong> (ปุ่มสีเหลืองทองเด่นชัด) และจะปรากฏอยู่บน <strong>แถบเส้นทางโฟลเดอร์ (Breadcrumb)</strong> ทุกครั้งที่คลิกเข้าไปดูในโฟลเดอร์ย่อย เพื่อให้สามารถสร้างโฟลเดอร์ซ้อนลงไปได้ทันที
              </p>
              {canManage && (
                <div className="pt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCreateFolder();
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-slate-950" />
                    <span>กดสร้างโฟลเดอร์ใหม่ทันที</span>
                  </button>

                  {onOpenProvisionModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenProvisionModal();
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>จัดเตรียมโครงสร้าง 4 ฝ่ายอัตโนมัติ</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Visual Folder Tree */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>แผนผังลำดับชั้นโฟลเดอร์ (Folder Hierarchy)</span>
            </h4>

            {/* Root: Central Drive Folder */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3 font-mono">
              <div className="flex items-center justify-between p-3 bg-blue-900 text-white rounded-xl shadow-xs">
                <div className="flex items-center gap-2.5 font-sans">
                  <HardDrive className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="font-bold text-sm">{driveSettings.centralFolderName || 'โฟลเดอร์ส่วนกลางประจำสถานศึกษา'}</div>
                    <div className="text-3xs text-blue-200">
                      Root Folder ID: {driveSettings.centralFolderId || '(ยังไม่ได้ระบุ)'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-sans">
                  {driveSettings.centralFolderUrl && (
                    <a
                      href={driveSettings.centralFolderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-2xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>เปิดในไดรฟ์</span>
                    </a>
                  )}
                  {onSelectFolder && driveSettings.centralFolderId && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectFolder(driveSettings.centralFolderId, driveSettings.centralFolderName);
                      }}
                      className="px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-lg text-2xs font-extrabold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>ดูไฟล์ในนี้</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Subfolders Level 1: 4 Departments + Media */}
              <div className="pl-6 space-y-2 border-l-2 border-dashed border-blue-200 ml-4 font-sans">
                {departmentFolders.length > 0 ? (
                  departmentFolders.map((f, idx) => (
                    <div 
                      key={f.id || idx}
                      className="p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-xs transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                          <Folder className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                            <span className="truncate">{f.name}</span>
                            {f.yearBE && (
                              <span className="px-1.5 py-0.2 rounded-md bg-blue-50 text-blue-700 font-extrabold text-3xs shrink-0">
                                พ.ศ. {f.yearBE}
                              </span>
                            )}
                          </div>
                          <p className="text-3xs text-slate-500 truncate">
                            {f.description || `Folder ID: ${f.folderId}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {f.folderUrl && (
                          <a
                            href={f.folderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition-colors"
                            title="เปิดในแท็บใหม่"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {onSelectFolder && f.folderId && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onSelectFolder(f.folderId, f.name);
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-3xs font-bold transition-colors cursor-pointer"
                          >
                            <span>เลือกโฟลเดอร์นี้</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-slate-100/60 rounded-xl text-center text-slate-500 space-y-2">
                    <p className="text-xs">ยังไม่มีโฟลเดอร์ฝ่ายงานย่อยที่ลงทะเบียนไว้</p>
                    {canManage && onOpenProvisionModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenProvisionModal();
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-2xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>สร้างโครงสร้าง 4 ฝ่ายอัตโนมัติทันที</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tips for Admins */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>วิธีจัดการโฟลเดอร์ในระบบโรงเรียนบ้านนารี</span>
            </h5>
            <ul className="list-disc list-inside space-y-1 text-2xs text-slate-600 leading-relaxed pl-1">
              <li><strong>สร้างโฟลเดอร์ย่อย:</strong> เมื่อเข้าสู่โฟลเดอร์ฝ่ายใดฝ่ายหนึ่ง ให้กดปุ่ม <strong>"+ สร้างโฟลเดอร์ใหม่"</strong> ที่แถบเครื่องมือด้านบน เพื่อตั้งชื่อโฟลเดอร์ตามงาน</li>
              <li><strong>อัปโหลดไฟล์:</strong> สามารถกดปุ่ม <strong>"อัปโหลดไฟล์"</strong> หรือลากไฟล์มาวางเพื่ออัปโหลดตรงเข้าโฟลเดอร์ที่กำลังเปิดอยู่</li>
              <li><strong>โครงสร้างอัตโนมัติตามปี พ.ศ.:</strong> สามารถกดปุ่ม <strong>"จัดเตรียมโฟลเดอร์ปี พ.ศ."</strong> เพื่อให้ระบบสร้างโฟลเดอร์ 4 ฝ่ายตามปีการศึกษาปัจจุบันให้อัตโนมัติในคลิกเดียว</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-2xs text-slate-500">
            ระบบบริหารจัดการคลังไดรฟ์โรงเรียนบ้านนารี
          </div>
          <div className="flex items-center gap-2">
            {canManage && onOpenDriveSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDriveSettings();
                }}
                className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>ตั้งค่าไดรฟ์</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
