import React from 'react';
import { Building2, Phone, Mail, MapPin, ExternalLink, HardDrive, Eye, BarChart3, Film } from 'lucide-react';
import { SchoolInfo, SiteStats, UserRole } from '../types';

interface FooterProps {
  schoolInfo: SchoolInfo;
  setActiveTab: (tab: string) => void;
  siteStats?: SiteStats;
  userRole?: UserRole;
  enableVideoGallery?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ schoolInfo, setActiveTab, siteStats, userRole, enableVideoGallery = true }) => {
  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-10 border-t border-slate-900 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Col 1: School Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                <Building2 className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white leading-tight">{schoolInfo.schoolName}</h4>
                <p className="text-2xs text-slate-400 font-medium">{schoolInfo.schoolNameEn}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {schoolInfo.vision.slice(0, 160)}...
            </p>
            <div className="pt-1">
              <span className="inline-block bg-slate-900 border border-slate-800 text-amber-300 text-2xs px-3 py-1 rounded-full">
                {schoolInfo.motto}
              </span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h5 className="text-sm font-bold text-white mb-4 tracking-wider uppercase">แผนผังเว็บไซต์</h5>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <button onClick={() => setActiveTab('home')} className="hover:text-amber-400 transition-colors">
                  หน้าแรก
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('about')} className="hover:text-amber-400 transition-colors">
                  ประวัติและโครงสร้างสถานศึกษา
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('staff')} className="hover:text-amber-400 transition-colors">
                  ทำเนียบครูและบุคลากร
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('boards')} className="hover:text-amber-400 transition-colors">
                  คณะกรรมการสถานศึกษา & เครือข่ายผู้ปกครอง
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('news')} className="hover:text-amber-400 transition-colors">
                  ข่าวประชาสัมพันธ์
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('gallery')} className="hover:text-amber-400 transition-colors">
                  คลังภาพกิจกรรม
                </button>
              </li>
              {enableVideoGallery !== false && (
                <li>
                  <button onClick={() => setActiveTab('videos')} className="hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer">
                    <Film className="w-3.5 h-3.5 text-amber-400" />
                    <span>คลังวิดีโอกิจกรรม</span>
                  </button>
                </li>
              )}
              <li>
                <button onClick={() => setActiveTab('drive')} className="hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer">
                  <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                  <span>คลังเอกสาร Google Drive</span>
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('contact')} className="hover:text-amber-400 transition-colors">
                  ติดต่อเรา & แผนที่
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Official External Links */}
          <div>
            <h5 className="text-sm font-bold text-white mb-4 tracking-wider uppercase">หน่วยงานทางการศึกษา</h5>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <a
                  href="https://www.moe.go.th"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 flex items-center gap-1.5 transition-colors"
                >
                  <span>กระทรวงศึกษาธิการ (ศธ.)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.obec.go.th"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 flex items-center gap-1.5 transition-colors"
                >
                  <span>สพฐ. (คณะกรรมการการศึกษาขั้นพื้นฐาน)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <span className="block text-slate-400">{schoolInfo.affiliation}</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact */}
          <div>
            <h5 className="text-sm font-bold text-white mb-4 tracking-wider uppercase">ติดต่อโรงเรียน</h5>
            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>{schoolInfo.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{schoolInfo.phone}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{schoolInfo.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Website Realtime Hit Counter Widget */}
        <div className="py-5 px-6 mb-8 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-[#0c182b] border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-5 shadow-inner">
          <div className="flex items-center gap-3.5 text-center md:text-left">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 shadow-xs">
              <Eye className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>สถิติผู้เข้าชมเว็บไซต์ (Website Hit Counter)</span>
                </span>
              </div>
              <p className="text-2xs text-slate-400 mt-0.5">
                ติดตามยอดการเข้าชมของสถานศึกษาแบบเรียลไทม์ พร้อมระบบจัดเก็บและรีเซ็ตผ่านแผงควบคุม
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {/* Digital Counter Display */}
            <div className="flex items-center gap-2 bg-slate-950/90 px-3.5 py-2 rounded-xl border border-slate-800">
              <span className="text-2xs font-semibold text-slate-400">เข้าชมรวม:</span>
              <div className="flex items-center gap-1 font-mono">
                {String(siteStats?.totalVisits || 0).padStart(6, '0').split('').map((digit, idx) => (
                  <span
                    key={idx}
                    className="w-5 sm:w-6 h-6 sm:h-7 rounded-md bg-slate-900 border border-slate-700/80 text-amber-400 font-black text-xs sm:text-sm flex items-center justify-center shadow-xs select-none tabular-nums"
                  >
                    {digit}
                  </span>
                ))}
              </div>
              <span className="text-2xs text-slate-400 font-medium">ครั้ง</span>
            </div>

            {/* Today's count chip */}
            <div className="px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs flex items-center gap-1.5">
              <span className="text-2xs text-slate-400">วันนี้:</span>
              <span className="font-bold text-emerald-400 tabular-nums">
                {(siteStats?.todayVisits || 0).toLocaleString('th-TH')}
              </span>
              <span className="text-3xs text-slate-500">ครั้ง</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-2xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} {schoolInfo.schoolName} ({schoolInfo.schoolNameEn}). สงวนลิขสิทธิ์ทั้งหมด.</p>
          <div className="flex items-center gap-3">
            <span>รหัสสถานศึกษา: {schoolInfo.schoolIdCode}</span>
            <span>•</span>
            <span>ระบบสารสนเทศและประชาสัมพันธ์โรงเรียน</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
