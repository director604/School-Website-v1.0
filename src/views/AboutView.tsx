import React from 'react';
import { 
  Building2, 
  Target, 
  Compass, 
  Sparkles, 
  Award, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle2, 
  Edit3,
  Layers
} from 'lucide-react';
import { SchoolInfo, UserRole } from '../types';

interface AboutViewProps {
  schoolInfo: SchoolInfo;
  isQuickEditMode: boolean;
  userRole: UserRole;
  onEditSchoolInfo: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({
  schoolInfo,
  isQuickEditMode,
  userRole,
  onEditSchoolInfo
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>ข้อมูลองค์การสถานศึกษา</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">เกี่ยวกับโรงเรียนบ้านนารี</h1>
          <p className="text-sm text-slate-500 mt-1">
            ประวัติความเป็นมา วิสัยทัศน์ พันธกิจ และโครงสร้างการบริหารงาน
          </p>
        </div>

        {(userRole === 'admin' || userRole === 'superadmin') && (
          <button
            type="button"
            onClick={onEditSchoolInfo}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span>แก้ไขข้อมูลโรงเรียนทั้งหมด</span>
          </button>
        )}
      </div>

      {/* Philosophy & Vision Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Vision */}
        <div className="bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl"></div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              {(userRole === 'admin' || userRole === 'superadmin') && (
                <button
                  type="button"
                  onClick={onEditSchoolInfo}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-amber-300 rounded-lg text-2xs font-bold flex items-center gap-1 border border-white/10"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>แก้ไขวิสัยทัศน์ & ปรัชญา</span>
                </button>
              )}
            </div>
            <span className="text-amber-300 text-xs font-bold uppercase tracking-wider">
              วิสัยทัศน์ (Vision)
            </span>
            <h2 className="text-xl sm:text-2xl font-bold leading-relaxed text-white">
              "{schoolInfo.vision}"
            </h2>
            <div className="pt-4 border-t border-white/10 space-y-2">
              <p className="text-xs text-slate-300">
                <strong className="text-amber-300">ปรัชญาโรงเรียน:</strong> {schoolInfo.philosophy}
              </p>
              <p className="text-xs text-slate-300">
                <strong className="text-amber-300">คำขวัญ:</strong> {schoolInfo.motto}
              </p>
            </div>
          </div>
        </div>

        {/* Identity & Uniqueness */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">อัตลักษณ์ & เอกลักษณ์</h3>
              </div>
              {(userRole === 'admin' || userRole === 'superadmin') && (
                <button
                  type="button"
                  onClick={onEditSchoolInfo}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-2xs font-bold flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3 text-blue-600" />
                  <span>แก้ไข</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-2xs font-bold text-blue-700 uppercase tracking-wider block mb-1">
                  อัตลักษณ์ของผู้เรียน
                </span>
                <p className="text-sm font-semibold text-slate-800">{schoolInfo.identity}</p>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100">
                <span className="text-2xs font-bold text-amber-800 uppercase tracking-wider block mb-1">
                  เอกลักษณ์ของสถานศึกษา
                </span>
                <p className="text-sm font-semibold text-slate-800">{schoolInfo.uniqueness}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">สัญลักษณ์ประจำสถานศึกษา</h3>
              </div>
              {(userRole === 'admin' || userRole === 'superadmin') && (
                <button
                  type="button"
                  onClick={onEditSchoolInfo}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-2xs font-bold flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3 text-emerald-600" />
                  <span>แก้ไข</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-slate-500">สีประจำโรงเรียน:</span>
                <p className="font-bold text-slate-800 text-sm">{schoolInfo.colors}</p>
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-slate-500">ต้นไม้ประจำโรงเรียน:</span>
                <p className="font-bold text-slate-800 text-sm">{schoolInfo.tree}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Missions & Goals */}
      <div className="space-y-4">
        {(userRole === 'admin' || userRole === 'superadmin') && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onEditSchoolInfo}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-blue-200"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-700" />
              <span>แก้ไขพันธกิจและเป้าประสงค์</span>
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Mission */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-md space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">พันธกิจ (Mission)</h3>
            </div>
            <ul className="space-y-3">
              {schoolInfo.mission.map((m, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Goals */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-md space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">เป้าประสงค์ (Goals)</h3>
            </div>
            <ul className="space-y-3">
              {schoolInfo.goals.map((g, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* School History */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-100 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">ประวัติความเป็นมาของโรงเรียนบ้านนารี</h3>
          </div>
          {(userRole === 'admin' || userRole === 'superadmin') && (
            <button
              type="button"
              onClick={onEditSchoolInfo}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-indigo-200"
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-700" />
              <span>แก้ไขประวัติโรงเรียน</span>
            </button>
          )}
        </div>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal whitespace-pre-line">
          {schoolInfo.history}
        </p>
      </div>

      {/* School Organizational Chart */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-100 shadow-md space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">โครงสร้างการบริหารงานสถานศึกษา</h3>
            <p className="text-xs text-slate-500">แบ่งการบริหารงานออกเป็น 4 ฝ่ายหลักตามมาตรฐานกระทรวงศึกษาธิการ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
            <span className="text-xs font-bold text-blue-900 block">1. กลุ่มบริหารงานวิชาการ</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              การพัฒนาหลักสูตร, การจัดกระบวนการเรียนรู้, สื่อและเทคโนโลยี, การวัดและประเมินผล, การประกันคุณภาพการศึกษา
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
            <span className="text-xs font-bold text-emerald-900 block">2. กลุ่มบริหารงบประมาณและแผนงาน</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              การจัดทำแผนปฏิบัติการประจำปี, งานพัสดุและสินทรัพย์, งานการเงินและบัญชี, การตรวจสอบภายใน
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-2">
            <span className="text-xs font-bold text-amber-900 block">3. กลุ่มบริหารงานบุคคล</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              การวางแผนอัตรากำลัง, วินัยและการรักษาวินัย, การส่งเสริมและพัฒนาครู, ทะเบียนประวัติและสถิติ
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2">
            <span className="text-xs font-bold text-purple-900 block">4. กลุ่มบริหารงานทั่วไป</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              อาคารสถานที่และสิ่งแวดล้อม, ระบบดูแลช่วยเหลือนักเรียน, กิจการนักเรียน, ประชาสัมพันธ์, ชุมชนสัมพันธ์
            </p>
          </div>
        </div>
      </div>

      {/* Contact & Map Information */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white">ข้อมูลการติดต่อและที่ตั้งโรงเรียน</h3>
            <p className="text-xs text-slate-400">ติดต่อสอบถามและเยี่ยมชมสถานศึกษาโรงเรียนบ้านนารี</p>
          </div>
          {(userRole === 'admin' || userRole === 'superadmin') && (
            <button
              type="button"
              onClick={onEditSchoolInfo}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm self-start sm:self-auto transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>แก้ไขข้อมูลติดต่อ & แผนที่</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-400" />
              <span>ที่อยู่และการเดินทาง</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {schoolInfo.address}
            </p>
            <p className="text-xs text-amber-300 pt-2 font-medium">
              รหัสสถานศึกษา (สพฐ.): {schoolInfo.schoolIdCode}
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-400" />
              <span>ช่องทางการติดต่อ</span>
            </h4>
            <p className="text-xs text-slate-300">
              เบอร์โทรศัพท์: {schoolInfo.phone}
            </p>
            <p className="text-xs text-slate-300">
              อีเมล: {schoolInfo.email}
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              <span>หน่วยงานต้นสังกัด</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {schoolInfo.affiliation} <br />
              สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน (สพฐ.) กระทรวงศึกษาธิการ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
