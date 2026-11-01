import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Download, 
  ExternalLink, 
  Plus, 
  Edit3, 
  Trash2, 
  Filter, 
  Calendar, 
  Building2, 
  HardDrive, 
  Upload, 
  FileCheck2, 
  Share2,
  Check,
  Award
} from 'lucide-react';
import { 
  PublicDocumentItem, 
  PublicDocumentCategory, 
  UserRole, 
  DriveSettings 
} from '../types';
import { getCurrentAcademicYearBE } from '../services/driveService';

interface PublicDocumentsViewProps {
  documentList: PublicDocumentItem[];
  userRole?: UserRole;
  isQuickEditMode?: boolean;
  currentUserId?: string;
  driveSettings?: DriveSettings;
  onEditDocument?: (docItem?: PublicDocumentItem) => void;
  onDeleteDocument?: (docItem: PublicDocumentItem) => void;
}

export const PublicDocumentsView: React.FC<PublicDocumentsViewProps> = ({
  documentList = [],
  userRole = 'guest',
  isQuickEditMode = false,
  currentUserId,
  driveSettings,
  onEditDocument,
  onDeleteDocument
}) => {
  const currentYearBE = driveSettings?.currentAcademicYear || getCurrentAcademicYearBE();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const canEdit = userRole === 'admin' || userRole === 'superadmin' || userRole === 'editor' || userRole === 'teacher';
  const canDirectAdmin = (userRole === 'admin' || userRole === 'superadmin') && isQuickEditMode;

  // Department tabs list
  const categoryTabs = [
    { id: 'all', label: 'เอกสารทั้งหมด' },
    { id: 'sar', label: 'รายงาน SAR & ประกันคุณภาพ' },
    { id: 'academic', label: '01 งานบริหารวิชาการ' },
    { id: 'budget', label: '02 งานบริหารงบประมาณ' },
    { id: 'personnel', label: '03 งานบริหารงานบุคคล' },
    { id: 'general', label: '04 งานบริหารทั่วไป' }
  ];

  // Distinct academic years for filter
  const availableYears = Array.from(
    new Set([
      currentYearBE,
      ...documentList.map(d => d.academicYearBE).filter(Boolean)
    ])
  ).sort((a, b) => b - a);

  // Filter document list
  const filteredDocs = documentList.filter(doc => {
    if (!doc.published && !canEdit) return false;
    const matchCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchYear = selectedYear === 'all' || doc.academicYearBE.toString() === selectedYear;
    const matchSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (doc.pdfFileName && doc.pdfFileName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (doc.authorName && doc.authorName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchYear && matchSearch;
  });

  const getCategoryLabel = (cat: PublicDocumentCategory): string => {
    switch (cat) {
      case 'sar': return 'รายงาน SAR & การประกันคุณภาพ';
      case 'academic': return 'งานบริหารวิชาการ';
      case 'budget': return 'งานบริหารงบประมาณและสินทรัพย์';
      case 'personnel': return 'งานบริหารงานบุคคล';
      case 'general': return 'งานบริหารทั่วไป';
      default: return 'เอกสารทั่วไป';
    }
  };

  const handleCopyLink = (docItem: PublicDocumentItem) => {
    if (docItem.pdfUrl) {
      navigator.clipboard.writeText(docItem.pdfUrl);
      setCopiedId(docItem.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-red-600/15 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded-full text-2xs font-bold uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5 text-red-400" />
              <span>คลังเอกสารเผยแพร่สถานศึกษา</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              เอกสารเผยแพร่และรายงาน SAR
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              ศูนย์รวมรายงานการประเมินตนเองของสถานศึกษา (SAR), แผนปฏิบัติการประจำปี, หลักสูตรสถานศึกษา และระเบียบข้อบังคับทางการ สำหรับคณะกรรมการ ชุมชน และประชาชน
            </p>
          </div>

          {canEdit && onEditDocument && (
            <button
              type="button"
              onClick={() => onEditDocument()}
              className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer shrink-0 self-start md:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ เพิ่มเอกสารเผยแพร่ใหม่</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
        {/* Category Tabs (Segmented Controls) */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categoryTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === tab.id
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Year Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>ปีการศึกษา:</span>
            </span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">ทุกปีการศึกษา</option>
              {availableYears.map(year => (
                <option key={year} value={year.toString()}>
                  พ.ศ. {year}
                </option>
              ))}
            </select>

            <span className="text-2xs text-slate-400 pl-2">
              (พบ {filteredDocs.length} ฉบับ)
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อเอกสาร หรือชื่อไฟล์..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </div>

      {/* 3. Document Items List */}
      {filteredDocs.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl p-8 space-y-4 shadow-2xs">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto text-red-600">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">ไม่พบเอกสารเผยแพร่ที่ตรงกับเงื่อนไข</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              ลองเปลี่ยนหมวดหมู่ ตัวกรองปีการศึกษา หรือคำค้นหาใหม่อีกครั้ง
            </p>
          </div>
          {canEdit && onEditDocument && (
            <button
              type="button"
              onClick={() => onEditDocument()}
              className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มเอกสารฉบับใหม่</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredDocs.map((docItem) => {
            const isAuthor = currentUserId && docItem.authorId === currentUserId;
            const canManageThis = canDirectAdmin || (isQuickEditMode && isAuthor);

            return (
              <div
                key={docItem.id}
                className="group bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400 hover:shadow-md transition-all p-5 flex flex-col justify-between relative text-left"
              >
                <div className="space-y-3">
                  {/* Top Line: PDF Icon + Department & Year */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center font-bold shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        {/* Unboxed Metadata (Zero-Pill Discipline) */}
                        <div className="flex items-center gap-2 text-2xs text-slate-500 font-medium truncate">
                          <span className="font-bold text-blue-900">
                            {getCategoryLabel(docItem.category)}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>ปีการศึกษา {docItem.academicYearBE}</span>
                        </div>
                      </div>
                    </div>

                    {/* Admin Action Buttons if Authorized */}
                    {canManageThis && (
                      <div className="flex items-center gap-1 shrink-0">
                        {onEditDocument && (
                          <button
                            type="button"
                            onClick={() => onEditDocument(docItem)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="แก้ไขเอกสารนี้"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                          </button>
                        )}
                        {onDeleteDocument && (
                          <button
                            type="button"
                            onClick={() => onDeleteDocument(docItem)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="ลบเอกสารนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Document Title */}
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug group-hover:text-blue-900 transition-colors line-clamp-2">
                    {docItem.title}
                  </h3>

                  {/* Clean unboxed file metadata */}
                  <div className="flex flex-wrap items-center gap-2 text-2xs text-slate-500">
                    <span className="truncate max-w-[200px]">{docItem.pdfFileName || 'ไฟล์เอกสาร PDF'}</span>
                    {docItem.fileSize && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{docItem.fileSize}</span>
                      </>
                    )}
                    {docItem.authorName && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-600 font-medium truncate max-w-[150px]">{docItem.authorName}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Footer Actions Strip */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {/* Open in Viewer / Tab */}
                    {docItem.pdfUrl && (
                      <a
                        href={docItem.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>เปิดอ่าน PDF</span>
                      </a>
                    )}

                    {/* Download */}
                    {docItem.pdfUrl && (
                      <a
                        href={docItem.pdfUrl}
                        download={docItem.pdfFileName || `${docItem.title}.pdf`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                        title="ดาวน์โหลดไฟล์ PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>ดาวน์โหลด</span>
                      </a>
                    )}
                  </div>

                  {/* Copy Link Button */}
                  <button
                    type="button"
                    onClick={() => handleCopyLink(docItem)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="คัดลอกลิงก์ไฟล์เอกสาร"
                  >
                    {copiedId === docItem.id ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
