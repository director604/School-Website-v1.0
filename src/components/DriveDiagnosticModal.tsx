import React, { useState } from 'react';
import { 
  X, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  HardDrive, 
  Folder, 
  ExternalLink,
  ShieldCheck,
  FilePlus2,
  FileEdit,
  Trash2,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  runDriveDiagnosticSuite, 
  DiagnosticStep, 
  DiagnosticReport, 
  extractFolderId 
} from '../services/driveService';
import { connectGoogleDrive } from '../firebase';
import { DriveSettings } from '../types';
import { showError } from '../utils/sweetalert';

interface DriveDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  driveSettings: DriveSettings;
}

export const DriveDiagnosticModal: React.FC<DriveDiagnosticModalProps> = ({
  isOpen,
  onClose,
  driveSettings
}) => {
  const [targetFolderInput, setTargetFolderInput] = useState<string>(driveSettings.centralFolderId || '');
  const [isRunning, setIsRunning] = useState(false);
  const [connectingAuth, setConnectingAuth] = useState(false);
  const [steps, setSteps] = useState<DiagnosticStep[]>([]);
  const [report, setReport] = useState<DiagnosticReport | null>(null);

  if (!isOpen) return null;

  const handleRunDiagnostics = async () => {
    setIsRunning(true);
    setReport(null);
    setSteps([]);

    try {
      const res = await runDriveDiagnosticSuite(targetFolderInput, (updatedSteps) => {
        setSteps(updatedSteps);
      });
      setReport(res);
    } catch (err: any) {
      console.error('Diagnostic error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleConnectAuth = async () => {
    setConnectingAuth(true);
    try {
      await connectGoogleDrive();
      // Re-run test immediately after connecting
      handleRunDiagnostics();
    } catch (err: any) {
      showError('เชื่อมต่อ Google Drive ไม่สำเร็จ', err.message || 'ไม่สามารถเชื่อมต่อ Google Drive ได้');
    } finally {
      setConnectingAuth(false);
    }
  };

  const getStepIcon = (status: DiagnosticStep['status'], stepId: string) => {
    if (status === 'running') {
      return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin shrink-0" />;
    }
    if (status === 'success') {
      return <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
    }
    if (status === 'error') {
      return <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />;
    }
    
    // Pending icons based on step
    switch (stepId) {
      case 'auth': return <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0" />;
      case 'folder': return <Folder className="w-5 h-5 text-slate-400 shrink-0" />;
      case 'permission': return <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0" />;
      case 'create': return <FilePlus2 className="w-5 h-5 text-slate-400 shrink-0" />;
      case 'update': return <FileEdit className="w-5 h-5 text-slate-400 shrink-0" />;
      case 'delete': return <Trash2 className="w-5 h-5 text-slate-400 shrink-0" />;
      default: return <Activity className="w-5 h-5 text-slate-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-300 rounded-xl ring-1 ring-white/10">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <span>ระบบทดสอบการเชื่อมต่อ Google Drive แบบครบวงจร</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-200 border border-blue-400/30">
                  Live Diagnostics
                </span>
              </h3>
              <p className="text-xs text-blue-200 mt-0.5">
                ทดสอบสิทธิ์การเข้าถึง อ่าน เขียน เพิ่ม แก้ไข และลบข้อมูลในโฟลเดอร์ส่วนกลาง
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-700">
          {/* Target Folder Selection */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              โฟลเดอร์ที่ต้องการทดสอบ (Target Google Drive Folder)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={targetFolderInput}
                onChange={(e) => setTargetFolderInput(e.target.value)}
                placeholder="วาง Folder ID หรือ URL โฟลเดอร์ Google Drive"
                disabled={isRunning}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-mono text-xs bg-white"
              />
              <button
                type="button"
                onClick={handleRunDiagnostics}
                disabled={isRunning || !targetFolderInput.trim()}
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>กำลังทดสอบ...</span>
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4" />
                    <span>เริ่มทดสอบระบบ</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick folder chips if department folders exist */}
            {driveSettings.departmentFolders && driveSettings.departmentFolders.length > 0 && (
              <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[11px] text-slate-500">เลือกโฟลเดอร์ฝ่าย:</span>
                <button
                  type="button"
                  onClick={() => setTargetFolderInput(driveSettings.centralFolderId || '')}
                  className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-blue-400 text-[11px]"
                >
                  โฟลเดอร์ส่วนกลางหลัก
                </button>
                {driveSettings.departmentFolders.map(dept => (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => setTargetFolderInput(dept.folderId || '')}
                    className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-blue-400 text-[11px]"
                  >
                    {dept.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Test Execution Steps */}
          {steps.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  ขั้นตอนการทดสอบ (Test Execution Pipeline)
                </h4>
                {report && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    report.overallSuccess 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {report.overallSuccess ? 'ผ่านการทดสอบทั้งหมด (100% OK)' : 'มีข้อผิดพลาดบางขั้นตอน'}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      step.status === 'success'
                        ? 'bg-emerald-50/60 border-emerald-200 text-slate-800'
                        : step.status === 'error'
                        ? 'bg-rose-50/70 border-rose-200 text-slate-800'
                        : step.status === 'running'
                        ? 'bg-blue-50/70 border-blue-200 text-blue-900 ring-2 ring-blue-500/10'
                        : 'bg-slate-50/50 border-slate-200/60 text-slate-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getStepIcon(step.status, step.id)}
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-slate-900">
                            {step.title}
                          </div>
                          {step.message && (
                            <div className={`text-xs mt-1 leading-relaxed ${
                              step.status === 'error' 
                                ? 'text-rose-700 font-medium' 
                                : step.status === 'success' 
                                ? 'text-emerald-700' 
                                : 'text-slate-600'
                            }`}>
                              {step.message}
                            </div>
                          )}
                        </div>
                      </div>

                      {step.durationMs !== undefined && (
                        <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 bg-white rounded-md border border-slate-200 shrink-0">
                          {step.durationMs}ms
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action button if Auth Token fails */}
          {steps.some(s => s.id === 'auth' && s.status === 'error') && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>ยังไม่ได้อนุญาตการเข้าถึง Google Drive สำหรับบัญชีที่กำลังใช้งาน</span>
              </div>
              <button
                type="button"
                onClick={handleConnectAuth}
                disabled={connectingAuth}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
              >
                {connectingAuth ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <HardDrive className="w-3.5 h-3.5" />}
                <span>เชื่อมต่อสิทธิ์ Google Drive ทันที</span>
              </button>
            </div>
          )}

          {/* Success summary card */}
          {report?.overallSuccess && (
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>โฟลเดอร์ส่วนกลางพร้อมใช้งานจริง 100%</span>
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                ระบบได้จำลองการสร้างไฟล์ทดสอบ, อัปเดตข้อมูลไฟล์, และลบไฟล์ทดสอบออกจาก Google Drive เรียบร้อยแล้ว 
                บุคลากรและคุณครูสามารถอัปโหลดและดาวน์โหลดไฟล์เอกสารผ่านระบบได้ทันที
              </p>
            </div>
          )}

          {/* Helpful Tips Section */}
          <div className="p-4 bg-blue-50/60 border border-blue-200/60 rounded-2xl space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-bold text-blue-900">
              <Info className="w-4 h-4 text-blue-600" />
              <span>เกร็ดความรู้การตั้งค่าโฟลเดอร์ส่วนกลาง (จากอีเมลใดก็ได้):</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-700 leading-relaxed pl-1 text-[11px]">
              <li>โฟลเดอร์นี้สร้างขึ้นจากอีเมล Gmail ส่วนตัว, อีเมลโรงเรียน, หรือ Google Workspace ของใครก็ได้</li>
              <li>ในหน้าเว็บ Google Drive ให้คลิกขวาที่โฟลเดอร์ &gt; เลือก <strong>แชร์ (Share)</strong></li>
              <li>หากต้องการให้ทุกคนในระบบอัปโหลดไฟล์ได้ ให้เปลี่ยนเป็น <strong>"ทุกคนที่มีลิงก์ (Anyone with link)" &gt; "ผู้แก้ไข (Editor)"</strong> หรือเพิ่มอีเมลของผู้ดูแลระบบเป็น Editor โดยตรง</li>
              <li>ระบบทดสอบจะลบไฟล์ขยะที่สร้างขึ้นระหว่างการทดสอบอัตโนมัติ ไม่เปลืองเนื้อที่ในไดรฟ์ของคุณ</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {report ? `ทดสอบล่าสุด: ${new Date(report.timestamp).toLocaleTimeString('th-TH')}` : 'พร้อมเริ่มการทดสอบ'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
