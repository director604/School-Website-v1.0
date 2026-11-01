import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Building, 
  Sparkles, 
  RefreshCw, 
  Upload, 
  Image as ImageIcon,
  Compass,
  BookOpen,
  Laptop,
  Sprout,
  Quote,
  Target,
  Layout,
  User,
  MapPin,
  Plus,
  Trash2,
  Sliders,
  Megaphone,
  ExternalLink,
  Users,
  Eye,
  EyeOff,
  CheckCircle2,
  HelpCircle,
  Link,
  Award,
  Video,
  Film
} from 'lucide-react';
import { 
  QuickLinkItem,
  HomepageSectionVisibility,
  DriveSettings,
  SchoolInfo,
  MediaItem,
  EducationalPillar,
  GovernanceCardItem
} from '../types';
import { 
  findDepartmentFolder, 
  getCurrentAcademicYearBE 
} from '../services/driveService';
import { MediaUploadModal } from './MediaUploadModal';
import { HomepageTabKey } from '../views/HomeView';
import { cleanMapEmbedUrl } from '../utils/mapUtils';

interface SchoolInfoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolInfo: SchoolInfo;
  mediaList?: MediaItem[];
  onAddMediaItem?: (item: MediaItem) => void;
  onSave: (updatedInfo: SchoolInfo) => Promise<void>;
  initialTab?: HomepageTabKey;
  driveSettings?: DriveSettings;
}

export const SchoolInfoEditModal: React.FC<SchoolInfoEditModalProps> = ({
  isOpen,
  onClose,
  schoolInfo,
  mediaList = [],
  onAddMediaItem,
  onSave,
  initialTab = 'homepage',
  driveSettings
}) => {
  const [formData, setFormData] = useState<SchoolInfo>({ ...schoolInfo });
  const [activeTab, setActiveTab] = useState<HomepageTabKey>(initialTab);
  const [saving, setSaving] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaTargetField, setMediaTargetField] = useState<'directorImageUrl' | 'heroImageUrl'>('directorImageUrl');
  const [targetFolderId, setTargetFolderId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...schoolInfo,
        sectionsVisibility: schoolInfo.sectionsVisibility || {
          heroStats: true,
          urgentTicker: true,
          directorWelcome: true,
          educationalPillars: true,
          recentNews: true,
          recentGallery: true,
          videoGallery: true,
          quickLinks: true,
          communityGovernance: true,
          contactStrip: true
        },
        governanceCards: (schoolInfo.governanceCards && schoolInfo.governanceCards.length > 0)
          ? schoolInfo.governanceCards
          : [
              {
                id: 'gov-1',
                title: 'ครูและบุคลากรทางการศึกษา',
                desc: 'ทำเนียบคณะครูผู้สอนตาม 8 กลุ่มสาระการเรียนรู้ และฝ่ายบริหารสถานศึกษา',
                buttonText: 'ดูทำเนียบบุคลากร',
                targetTab: 'staff',
                icon: 'Users'
              },
              {
                id: 'gov-2',
                title: 'คณะกรรมการสถานศึกษาขั้นพื้นฐาน',
                desc: 'ผู้แทนชุมชน ศาสนา ศิษย์เก่า องค์กรปกครองส่วนท้องถิ่น และผู้ทรงคุณวุฒิ',
                buttonText: 'ดูรายชื่อคณะกรรมการ',
                targetTab: 'boards',
                icon: 'Award'
              },
              {
                id: 'gov-3',
                title: 'คณะกรรมการเครือข่ายผู้ปกครอง',
                desc: 'ตัวแทนผู้ปกครองนักเรียนทุกระดับชั้น ร่วมดูแลช่วยเหลือและพัฒนาลูกหลาน',
                buttonText: 'ดูรายชื่อเครือข่าย',
                targetTab: 'boards',
                icon: 'HeartHandshake'
              }
            ],
        quickLinks: (schoolInfo.quickLinks && schoolInfo.quickLinks.length > 0)
          ? schoolInfo.quickLinks
          : [
              {
                id: 'ql-1',
                title: 'ระบบวัดผล SGS',
                desc: 'ระบบประเมินผลการเรียนออนไลน์',
                url: 'https://sgs.bopp.go.th',
                icon: 'GraduationCap',
                badge: 'นักเรียน & ผู้ปกครอง',
                color: 'blue',
                isExternal: true
              },
              {
                id: 'ql-2',
                title: 'ระบบ DPA (PA)',
                desc: 'ระบบการประเมินวิทยฐานะดิจิทัล',
                url: 'https://dpa.otepc.go.th',
                icon: 'Award',
                badge: 'คุณครู & บุคลากร',
                color: 'amber',
                isExternal: true
              },
              {
                id: 'ql-3',
                title: 'ระบบสารสนเทศ EMIS',
                desc: 'ฐานข้อมูลนักเรียนและโรงเรียน สพฐ.',
                url: 'https://data.bopp-obec.info',
                icon: 'Database',
                badge: 'งานสารสนเทศ',
                color: 'emerald',
                isExternal: true
              },
              {
                id: 'ql-4',
                title: 'สพป.ชัยภูมิ เขต 1',
                desc: 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษา',
                url: 'https://www.cpm1.go.th',
                icon: 'Building2',
                badge: 'หน่วยงานต้นสังกัด',
                color: 'indigo',
                isExternal: true
              }
            ]
      });
      if (initialTab) setActiveTab(initialTab);

      // Resolve target folder for school assets (General Management 04)
      if (driveSettings?.centralFolderId) {
        const yearBE = getCurrentAcademicYearBE();
        findDepartmentFolder(driveSettings.centralFolderId, 'general', yearBE)
          .then(folder => {
            if (folder) setTargetFolderId(folder.id);
            else setTargetFolderId(driveSettings.centralFolderId);
          })
          .catch(() => setTargetFolderId(driveSettings.centralFolderId));
      }
    }
  }, [isOpen, schoolInfo, initialTab, driveSettings]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...formData,
        googleMapEmbedUrl: cleanMapEmbedUrl(formData.googleMapEmbedUrl),
        updatedAt: new Date().toISOString()
      });
      onClose();
    } catch (err) {
      console.error('Error saving school info:', err);
    } finally {
      setSaving(false);
    }
  };

  const openMediaPicker = (field: 'directorImageUrl' | 'heroImageUrl') => {
    setMediaTargetField(field);
    setIsMediaModalOpen(true);
  };

  const handleUpdatePillar = (index: number, field: keyof EducationalPillar, value: string) => {
    const currentPillars = [...(formData.educationalPillars || [])];
    if (currentPillars[index]) {
      currentPillars[index] = {
        ...currentPillars[index],
        [field]: value
      };
      setFormData({ ...formData, educationalPillars: currentPillars });
    }
  };

  const handleAddPillar = () => {
    const currentPillars = [...(formData.educationalPillars || [])];
    currentPillars.push({
      id: `pillar-${Date.now()}`,
      title: `${currentPillars.length + 1}. จุดเน้นการเรียนรู้ใหม่`,
      desc: 'ระบุคำอธิบายจุดเน้นและเป้าหมายการพัฒนาผู้เรียนด้านนี้...',
      targetGrade: 'ทุกระดับชั้น',
      icon: 'Sparkles'
    });
    setFormData({ ...formData, educationalPillars: currentPillars });
  };

  const handleDeletePillar = (index: number) => {
    const currentPillars = [...(formData.educationalPillars || [])];
    currentPillars.splice(index, 1);
    setFormData({ ...formData, educationalPillars: currentPillars });
  };

  const handleToggleSection = (sectionKey: keyof HomepageSectionVisibility) => {
    setFormData(prev => {
      const current = prev.sectionsVisibility || {
        heroStats: true,
        urgentTicker: true,
        directorWelcome: true,
        educationalPillars: true,
        recentNews: true,
        recentGallery: true,
        videoGallery: true,
        quickLinks: true,
        communityGovernance: true,
        contactStrip: true
      };
      return {
        ...prev,
        sectionsVisibility: {
          ...current,
          [sectionKey]: current[sectionKey] === false ? true : false
        }
      };
    });
  };

  const handleUpdateGovCard = (index: number, field: keyof GovernanceCardItem, value: string) => {
    const currentCards = [...(formData.governanceCards || [])];
    if (currentCards[index]) {
      currentCards[index] = {
        ...currentCards[index],
        [field]: value
      };
      setFormData({ ...formData, governanceCards: currentCards });
    }
  };

  const handleUpdateQuickLink = (index: number, field: keyof QuickLinkItem, value: any) => {
    const currentLinks = [...(formData.quickLinks || [])];
    if (currentLinks[index]) {
      currentLinks[index] = {
        ...currentLinks[index],
        [field]: value
      };
      setFormData({ ...formData, quickLinks: currentLinks });
    }
  };

  const handleAddQuickLink = () => {
    const currentLinks = [...(formData.quickLinks || [])];
    currentLinks.push({
      id: `ql-${Date.now()}`,
      title: 'ลิงก์ระบบใหม่',
      desc: 'คำอธิบายระบบและผู้ใช้งาน',
      url: 'https://',
      icon: 'ExternalLink',
      badge: 'บริการออนไลน์',
      color: 'blue',
      isExternal: true
    });
    setFormData({ ...formData, quickLinks: currentLinks });
  };

  const handleDeleteQuickLink = (index: number) => {
    const currentLinks = [...(formData.quickLinks || [])];
    currentLinks.splice(index, 1);
    setFormData({ ...formData, quickLinks: currentLinks });
  };

  const tabs: { id: HomepageTabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'homepage', label: 'หน้าแรก & ภาพหน้าปก', icon: Layout },
    { id: 'sections', label: 'เปิด/ปิดส่วนประกอบ', icon: Sliders },
    { id: 'ticker', label: 'ประกาศด่วน & สถิติ', icon: Megaphone },
    { id: 'director', label: 'ผู้บริหาร & สาร ผอ.', icon: User },
    { id: 'pillars', label: '4 เสาหลักการศึกษา', icon: Compass },
    { id: 'videos', label: 'วิดีโอกิจกรรมหน้าแรก', icon: Video },
    { id: 'quicklinks', label: 'ลิงก์ด่วน e-Services', icon: ExternalLink },
    { id: 'governance', label: 'เครือข่าย 3 ฝ่าย', icon: Users },
    { id: 'general', label: 'ข้อมูลทั่วไป', icon: Building },
    { id: 'vision', label: 'วิสัยทัศน์ & ประวัติ', icon: Target },
    { id: 'contact', label: 'ที่อยู่ & แถบติดต่อ', icon: MapPin },
  ];

  const vis = formData.sectionsVisibility || {
    heroStats: true,
    urgentTicker: true,
    directorWelcome: true,
    educationalPillars: true,
    recentNews: true,
    recentGallery: true,
    videoGallery: true,
    quickLinks: true,
    communityGovernance: true,
    contactStrip: true
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-[#0F224A] via-[#1E3A8A] to-[#1E293B] text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-400 text-slate-950 rounded-xl shadow-xs">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">ระบบจัดการข้อมูลหน้าหลักและสถานศึกษา</h3>

              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1 px-4 py-2 bg-slate-100 border-b border-slate-200 overflow-x-auto select-none scrollbar-thin">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-blue-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-700' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-700">
            {/* TAB 1: HOMEPAGE & HERO SETTINGS */}
            {activeTab === 'homepage' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-200 pb-3">
                  <h4 className="font-bold text-slate-900 text-base">ปรับแต่งส่วนหัวหน้าแรก (Hero Section)</h4>
                  <p className="text-xs text-slate-500">กำหนดรูปภาพอาคารเรียน ข้อความต้อนรับ คติพจน์ และป้ายเด่นของโรงเรียน</p>
                </div>

                {/* Hero Campus Image */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <label className="block text-xs font-bold text-slate-800">
                    รูปภาพหน้าปกอาคารสถานที่ / บรรยากาศโรงเรียน (Hero Image)
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    <div className="sm:col-span-5 aspect-16/10 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-xs relative group">
                      <img
                        src={formData.heroImageUrl || '/src/assets/images/hero_school_campus_1792082308721.jpg'}
                        alt="Campus Preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => openMediaPicker('heroImageUrl')}
                          className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold shadow-md cursor-pointer"
                        >
                          เปลี่ยนภาพ
                        </button>
                      </div>
                    </div>

                    <div className="sm:col-span-7 space-y-2">
                      <button
                        type="button"
                        onClick={() => openMediaPicker('heroImageUrl')}
                        className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-amber-300" />
                        <span>อัปโหลดภาพหน้าปกใหม่ / เลือกจากคลังสื่อ</span>
                      </button>
                      <p className="text-2xs text-slate-500 leading-relaxed">
                        แนะนำ: ภาพถ่ายแนวนอน ความละเอียดสูง (1920x1080 หรือ 1200x800) บรรยากาศอาคารเรียนหรือกิจกรรมหน้าเสาธง
                      </p>
                      <div>
                        <label className="block text-2xs font-semibold text-slate-500 mb-0.5">หรือระบุ URL รูปภาพโดยตรง:</label>
                        <input
                          type="text"
                          value={formData.heroImageUrl || ''}
                          onChange={(e) => setFormData({ ...formData, heroImageUrl: e.target.value })}
                          placeholder="https://..."
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hero Badges & Subtitle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ข้อความส่วนหัวบน (Tagline สพป./สังกัด)
                    </label>
                    <input
                      type="text"
                      value={formData.heroTagline || ''}
                      onChange={(e) => setFormData({ ...formData, heroTagline: e.target.value })}
                      placeholder="สถานศึกษาพอเพียงและปลอดภัย · สพป.ชัยภูมิ เขต 1"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ป้ายเด่นมุมบนรูปภาพ (Badge Title)
                    </label>
                    <input
                      type="text"
                      value={formData.heroBadgeTitle || ''}
                      onChange={(e) => setFormData({ ...formData, heroBadgeTitle: e.target.value })}
                      placeholder="โรงเรียนวิถีพุทธ & คุณธรรม"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ป้ายคำบรรยายใต้ภาพ (Badge Subtitle)
                    </label>
                    <input
                      type="text"
                      value={formData.heroBadgeSubtitle || ''}
                      onChange={(e) => setFormData({ ...formData, heroBadgeSubtitle: e.target.value })}
                      placeholder="บรรยากาศร่มรื่น น้อมนำศาสตร์พระราชา"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      คำขวัญ / คติพจน์ประจำโรงเรียน (Motto)
                    </label>
                    <input
                      type="text"
                      value={formData.motto || ''}
                      onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
                      placeholder="สุวิชาโน ภวํ โหติ"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SECTIONS VISIBILITY TOGGLES */}
            {activeTab === 'sections' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-200 pb-3">
                  <h4 className="font-bold text-slate-900 text-base">เปิด/ปิด การแสดงผลส่วนประกอบบนหน้าหลัก</h4>
                  <p className="text-xs text-slate-500">เลือกเปิดหรือซ่อนส่วนต่างๆ บนหน้าแรกของเว็บไซต์ตามความเหมาะสมของสถานศึกษา</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'heroStats', label: 'แถบตัวเลขสถิติสถานศึกษา (นร./ครู/ห้องเรียน)', desc: 'แสดงสรุปจำนวนนักเรียน ครู และความปลอดภัยใต้ภาพหน้าแรก' },
                    { key: 'urgentTicker', label: 'แถบประกาศด่วน / ข้อความวิ่ง (Ticker)', desc: 'แสดงกล่องประกาศด่วนสีทองด้านบนเพื่อแจ้งเรื่องสำคัญ' },
                    { key: 'directorWelcome', label: 'สารจากผู้บริหารสถานศึกษา (Director Message)', desc: 'แสดงการ์ดภาพถ่ายผู้บริหารและสารจาก ผอ.' },
                    { key: 'educationalPillars', label: 'จุดเน้น 4 เสาหลักการจัดการศึกษา', desc: 'แสดง 4 เสาหลักจุดเน้นการพัฒนาผู้เรียน' },
                    { key: 'quickLinks', label: 'ระบบบริการอิเล็กทรอนิกส์ & ลิงก์ด่วน (e-Services)', desc: 'แสดงลิงก์ด่วน SGS, DPA, EMIS และหน่วยงานทางการศึกษา' },
                    { key: 'recentNews', label: 'ข่าวประชาสัมพันธ์ล่าสุด (News Grid)', desc: 'แสดงการ์ดข่าวสาร 6 ข่าวล่าสุด' },
                    { key: 'recentGallery', label: 'ภาพกิจกรรมและผลงานนักเรียน (Gallery)', desc: 'แสดงอัลบั้มภาพกิจกรรม 3 อัลบั้มล่าสุด' },
                    { key: 'videoGallery', label: 'วิดีโอกิจกรรมและผลงานสถานศึกษา (Video Showcase)', desc: 'แสดงคลิปวิดีโอกิจกรรม YouTube & Google Drive บนหน้าหลัก' },
                    { key: 'communityGovernance', label: 'พลังความร่วมมือ 3 ฝ่าย (โครงสร้างการมีส่วนร่วม)', desc: 'แสดงการ์ด ครู, คณะกรรมการสถานศึกษา, และเครือข่ายผู้ปกครอง' },
                    { key: 'contactStrip', label: 'แถบติดต่อประสานงานท้ายหน้า (Contact Strip)', desc: 'แสดงเบอร์โทร อีเมล ปุ่ม Drive และแผนที่ด้านล่างสุด' }
                  ].map((sec) => {
                    const isVisible = vis[sec.key as keyof HomepageSectionVisibility] !== false;
                    return (
                      <div
                        key={sec.key}
                        onClick={() => handleToggleSection(sec.key as keyof HomepageSectionVisibility)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                          isVisible
                            ? 'bg-blue-50/50 border-blue-300 text-slate-900'
                            : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                        }`}
                      >
                        <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                          isVisible ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h5 className="font-bold text-xs">{sec.label}</h5>
                            <span className={`text-3xs font-black px-2 py-0.5 rounded-full ${
                              isVisible ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {isVisible ? 'กำลังแสดงผล' : 'ซ่อนอยู่'}
                            </span>
                          </div>
                          <p className="text-2xs mt-1 text-slate-500 leading-relaxed">
                            {sec.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: TICKER & STATS */}
            {activeTab === 'ticker' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-200 pb-3">
                  <h4 className="font-bold text-slate-900 text-base">แถบประกาศด่วนวิ่ง (Ticker) & สถิติตัวเลข</h4>
                  <p className="text-xs text-slate-500">จัดการข้อความประกาศสำคัญเร่งด่วน และตัวเลขสถิติบนหน้าแรก</p>
                </div>

                {/* Urgent Ticker Config */}
                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Megaphone className="w-5 h-5 text-amber-600" />
                      <h5 className="font-bold text-xs text-amber-950">ข้อความประกาศด่วนสำคัญ (Breaking Announcement)</h5>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.urgentTickerEnabled !== false}
                        onChange={(e) => setFormData({ ...formData, urgentTickerEnabled: e.target.checked })}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span>เปิดใช้งานแถบประกาศ</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-2xs font-semibold text-slate-600 mb-1">ป้ายกำกับ (Label)</label>
                      <input
                        type="text"
                        value={formData.urgentTickerLabel || ''}
                        onChange={(e) => setFormData({ ...formData, urgentTickerLabel: e.target.value })}
                        placeholder="ประกาศสำคัญ / ด่วนที่สุด"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-amber-900"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-2xs font-semibold text-slate-600 mb-1">ข้อความประกาศที่แสดงวิ่งบนหน้าแรก</label>
                      <input
                        type="text"
                        value={formData.urgentTickerText || ''}
                        onChange={(e) => setFormData({ ...formData, urgentTickerText: e.target.value })}
                        placeholder="ขอเชิญผู้ปกครองและนักเรียนร่วมกิจกรรม..."
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Quantitative Stats */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <h5 className="font-bold text-xs text-slate-800">ตัวเลขสถิติสถานศึกษาที่แสดงบนหน้าแรก</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-2xs font-semibold text-slate-600 mb-1">นักเรียนทั้งหมด (คน)</label>
                      <input
                        type="number"
                        value={formData.studentCount}
                        onChange={(e) => setFormData({ ...formData, studentCount: parseInt(e.target.value, 10) || 0 })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-amber-600"
                      />
                    </div>
                    <div>
                      <label className="block text-2xs font-semibold text-slate-600 mb-1">ครูและบุคลากร (ท่าน)</label>
                      <input
                        type="number"
                        value={formData.teacherCount}
                        onChange={(e) => setFormData({ ...formData, teacherCount: parseInt(e.target.value, 10) || 0 })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-2xs font-semibold text-slate-600 mb-1">ห้องเรียนเปิดสอน (ห้อง)</label>
                      <input
                        type="number"
                        value={formData.classroomCount}
                        onChange={(e) => setFormData({ ...formData, classroomCount: parseInt(e.target.value, 10) || 0 })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-2xs font-semibold text-slate-600 mb-1">สถิติความปลอดภัย (เด่น)</label>
                      <input
                        type="text"
                        value={formData.safetyStatPercent || '100%'}
                        onChange={(e) => setFormData({ ...formData, safetyStatPercent: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-amber-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-2xs font-semibold text-slate-600 mb-1">คำอธิบายป้ายสถิติที่ 4</label>
                    <input
                      type="text"
                      value={formData.safetyStatLabel || 'สถานศึกษาปลอดภัยและสุขอนามัย'}
                      onChange={(e) => setFormData({ ...formData, safetyStatLabel: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: DIRECTOR & EDITORIAL */}
            {activeTab === 'director' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-200 pb-3">
                  <h4 className="font-bold text-slate-900 text-base">ผู้บริหารสถานศึกษา & สารผู้อำนวยการ</h4>
                  <p className="text-xs text-slate-500">ข้อมูลผู้บริหาร คำคมประจำสาร และสารจากผู้บริหารที่แสดงบนหน้าแรก</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อ-สกุล ผู้อำนวยการ</label>
                    <input
                      type="text"
                      value={formData.directorName}
                      onChange={(e) => setFormData({ ...formData, directorName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ตำแหน่ง</label>
                    <input
                      type="text"
                      value={formData.directorPosition}
                      onChange={(e) => setFormData({ ...formData, directorPosition: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">วิทยฐานะ</label>
                    <input
                      type="text"
                      value={formData.directorRank}
                      onChange={(e) => setFormData({ ...formData, directorRank: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      หัวข้อป้ายบนสาร (Greeting Title)
                    </label>
                    <input
                      type="text"
                      value={formData.directorGreetingTitle || ''}
                      onChange={(e) => setFormData({ ...formData, directorGreetingTitle: e.target.value })}
                      placeholder="สารจากผู้บริหารสถานศึกษา"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-amber-800 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      คำคม / หัวข้อเด่นของสาร (Quote Headline)
                    </label>
                    <input
                      type="text"
                      value={formData.directorQuoteTitle || ''}
                      onChange={(e) => setFormData({ ...formData, directorQuoteTitle: e.target.value })}
                      placeholder="เช่น ร่วมแรงร่วมใจ สร้างวินัย ใฝ่หาความรู้..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-blue-900"
                    />
                  </div>
                </div>

                {/* Director Photo Upload */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <label className="block text-xs font-bold text-slate-800">รูปภาพผู้อำนวยการโรงเรียน</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 bg-white shrink-0 shadow-md">
                      {formData.directorImageUrl ? (
                        <img
                          src={formData.directorImageUrl}
                          alt="Director Preview"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs bg-slate-100">
                          No Photo
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <button
                        type="button"
                        onClick={() => openMediaPicker('directorImageUrl')}
                        className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-amber-300" />
                        <span>อัปโหลดรูป / เลือกจากคลังสื่อ</span>
                      </button>
                      <input
                        type="text"
                        value={formData.directorImageUrl || ''}
                        onChange={(e) => setFormData({ ...formData, directorImageUrl: e.target.value })}
                        placeholder="หรือระบุ URL รูปภาพ..."
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">สารจากผู้อำนวยการ (เนื้อความเต็ม)</label>
                  <textarea
                    rows={4}
                    value={formData.directorMessage}
                    onChange={(e) => setFormData({ ...formData, directorMessage: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* TAB 5: FOUR PILLARS */}
            {activeTab === 'pillars' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">จุดเน้นการจัดการศึกษา (Educational Pillars)</h4>
                    <p className="text-xs text-slate-500">จัดการจุดเน้นการพัฒนาผู้เรียนที่แสดงผลบนหน้าแรก (เพิ่ม/ลด/แก้ไขได้)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddPillar}
                      className="px-3 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มเสาหลัก</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">หัวข้อหลักของส่วนนี้</label>
                    <input
                      type="text"
                      value={formData.pillarsTitle || ''}
                      onChange={(e) => setFormData({ ...formData, pillarsTitle: e.target.value })}
                      placeholder="4 เสาหลักการจัดการศึกษา โรงเรียนบ้านนารี"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">คำบรรยายสรุปส่วนนี้</label>
                    <input
                      type="text"
                      value={formData.pillarsSubtitle || ''}
                      onChange={(e) => setFormData({ ...formData, pillarsSubtitle: e.target.value })}
                      placeholder="มุ่งเน้นการจัดการเรียนรู้เชิงรุก (Active Learning)..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  {(formData.educationalPillars || []).map((pillar, idx) => (
                    <div key={pillar.id || idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative group">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-900 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-900 text-white flex items-center justify-center text-3xs font-black">
                            {idx + 1}
                          </span>
                          <span>เสาหลักด้านที่ {idx + 1}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeletePillar(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                          title="ลบเสาหลักนี้"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-7">
                          <label className="block text-2xs font-semibold text-slate-600 mb-1">ชื่อเสาหลัก / จุดเน้น</label>
                          <input
                            type="text"
                            value={pillar.title}
                            onChange={(e) => handleUpdatePillar(idx, 'title', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-800"
                          />
                        </div>

                        <div className="sm:col-span-5">
                          <label className="block text-2xs font-semibold text-slate-600 mb-1">กลุ่มเป้าหมาย / ระดับชั้น</label>
                          <input
                            type="text"
                            value={pillar.targetGrade}
                            onChange={(e) => handleUpdatePillar(idx, 'targetGrade', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                          />
                        </div>

                        <div className="sm:col-span-12">
                          <label className="block text-2xs font-semibold text-slate-600 mb-1">คำอธิบายรายละเอียด</label>
                          <textarea
                            rows={2}
                            value={pillar.desc}
                            onChange={(e) => handleUpdatePillar(idx, 'desc', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB VIDEOS: VIDEO SHOWCASE SETTINGS */}
            {activeTab === 'videos' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">จัดการส่วนแสดงวิดีโอกิจกรรมสถานศึกษา (Video Showcase)</h4>
                    <p className="text-xs text-slate-500">ปรับแต่งการแสดงผลคลิปวิดีโอ YouTube และ Google Drive บนหน้าแรกของเว็บไซต์</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      vis.videoGallery !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {vis.videoGallery !== false ? '● กำลังเปิดแสดงผลบนหน้าแรก' : '○ ซ่อนอยู่'}
                    </span>
                  </div>
                </div>

                {/* Visibility Toggle Card */}
                <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-xs">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-rose-950">เปิด/ปิด ส่วนแสดงวิดีโอบนหน้าหลัก (Homepage Video Section)</h5>
                      <p className="text-2xs text-rose-700">เมื่อเปิด จะมีเซกชันคลิปวิดีโอกิจกรรมและผลงานนักเรียนแสดงบนหน้าแรกของโรงเรียน</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleSection('videoGallery')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                      vis.videoGallery !== false
                        ? 'bg-rose-600 text-white hover:bg-rose-700'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {vis.videoGallery !== false ? 'เปิดใช้งานอยู่ (คลิกเพื่อปิด)' : 'ปิดอยู่ (คลิกเพื่อเปิด)'}
                  </button>
                </div>

                {/* Section Titles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      หัวข้อส่วนแสดงวิดีโอ (Section Title)
                    </label>
                    <input
                      type="text"
                      value={formData.videoSectionTitle || ''}
                      onChange={(e) => setFormData({ ...formData, videoSectionTitle: e.target.value })}
                      placeholder="วิดีโอกิจกรรมและผลงานสถานศึกษา"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <p className="text-3xs text-slate-400 mt-1">ข้อความหัวข้อหลักขนาดใหญ่บนหน้าแรก (ค่าเริ่มต้น: วิดีโอกิจกรรมและผลงานสถานศึกษา)</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      คำบรรยายย่อย (Section Subtitle)
                    </label>
                    <input
                      type="text"
                      value={formData.videoSectionSubtitle || ''}
                      onChange={(e) => setFormData({ ...formData, videoSectionSubtitle: e.target.value })}
                      placeholder="ประมวลภาพเคลื่อนไหว การจัดการเรียนรู้ และกิจกรรมส่งเสริมศักยภาพผู้เรียน"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <p className="text-3xs text-slate-400 mt-1">คำอธิบายเพิ่มเติมใต้หัวข้อ</p>
                  </div>
                </div>

                {/* Max Videos to Show */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h5 className="font-bold text-xs text-slate-800">จำนวนวิดีโอที่จะแสดงบนหน้าแรก</h5>
                      <p className="text-2xs text-slate-500">เลือกจำนวนคลิปที่จะนำมาแสดงในกริดหน้าหลัก (ระบบจะเลือกคลิปล่าสุดที่เผยแพร่)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {[3, 4, 6, 8].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setFormData({ ...formData, videoSectionMaxItems: num })}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            (formData.videoSectionMaxItems || 4) === num
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {num} วิดีโอ
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Info Card on Supported Sources */}
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                  <h5 className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>คำแนะนำและแหล่งวิดีโอที่รองรับ</span>
                  </h5>
                  <ul className="text-2xs text-amber-800 space-y-1 list-disc list-inside leading-relaxed">
                    <li>รองรับคลิปจาก <strong>YouTube</strong> ทั้งลิงก์ปกติ, Shorts, และคลิปแชร์ (youtu.be) พร้อมระบบดึงภาพหน้าปกอัตโนมัติ</li>
                    <li>รองรับไฟล์วิดีโอบน <strong>Google Drive</strong> (โฟลเดอร์ 06_คลังวีดีโอกิจกรรมโรงเรียน_2569) เล่นผ่านระบบแสดงผลในตัว</li>
                    <li>สามารถเพิ่ม ลบ หรือแก้ไขวิดีโอแต่ละคลิปได้ที่เมนู <strong>คลังวิดีโอกิจกรรม</strong> หรือกดปุ่มลัดด้านล่าง</li>
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 6: QUICK LINKS & E-SERVICES */}
            {activeTab === 'quicklinks' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">ระบบบริการอิเล็กทรอนิกส์ & ลิงก์ด่วน (e-Services)</h4>
                    <p className="text-xs text-slate-500">จัดการลิงก์บริการออนไลน์ที่แสดงบนหน้าแรกสำหรับนักเรียน ครู และผู้ปกครอง</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddQuickLink}
                    className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มลิงก์บริการใหม่</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">หัวข้อส่วนนี้</label>
                    <input
                      type="text"
                      value={formData.quickLinksTitle || ''}
                      onChange={(e) => setFormData({ ...formData, quickLinksTitle: e.target.value })}
                      placeholder="ระบบบริการอิเล็กทรอนิกส์ & ลิงก์ด่วนทางการศึกษา"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">คำบรรยายสรุปส่วนนี้</label>
                    <input
                      type="text"
                      value={formData.quickLinksSubtitle || ''}
                      onChange={(e) => setFormData({ ...formData, quickLinksSubtitle: e.target.value })}
                      placeholder="e-Services Portals · เข้าถึงระบบงานสำคัญ สพฐ."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {(formData.quickLinks || []).map((link, idx) => (
                    <div key={link.id || idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                          <ExternalLink className="w-4 h-4 text-blue-600" />
                          <span>ลิงก์ที่ {idx + 1}: {link.title || 'ไม่มีชื่อ'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuickLink(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                          title="ลบลิงก์นี้"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-4">
                          <label className="block text-2xs font-semibold text-slate-600 mb-1">ชื่อระบบ / หน่วยงาน</label>
                          <input
                            type="text"
                            value={link.title}
                            onChange={(e) => handleUpdateQuickLink(idx, 'title', e.target.value)}
                            placeholder="เช่น ระบบวัดผล SGS"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-2xs font-semibold text-slate-600 mb-1">ป้ายระบุกลุ่มเป้าหมาย (Badge)</label>
                          <input
                            type="text"
                            value={link.badge || ''}
                            onChange={(e) => handleUpdateQuickLink(idx, 'badge', e.target.value)}
                            placeholder="เช่น นักเรียน / ครู"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                          />
                        </div>

                        <div className="sm:col-span-5">
                          <label className="block text-2xs font-semibold text-slate-600 mb-1">URL ปลายทาง</label>
                          <input
                            type="text"
                            value={link.url}
                            onChange={(e) => handleUpdateQuickLink(idx, 'url', e.target.value)}
                            placeholder="https://..."
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                          />
                        </div>

                        <div className="sm:col-span-12">
                          <label className="block text-2xs font-semibold text-slate-600 mb-1">คำอธิบายสั้น</label>
                          <input
                            type="text"
                            value={link.desc}
                            onChange={(e) => handleUpdateQuickLink(idx, 'desc', e.target.value)}
                            placeholder="ระบุคำอธิบายระบบ..."
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 7: COMMUNITY GOVERNANCE (3 CARDS) */}
            {activeTab === 'governance' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-200 pb-3">
                  <h4 className="font-bold text-slate-900 text-base">โครงสร้างและการมีส่วนร่วม 3 ฝ่าย (Community Governance)</h4>
                  <p className="text-xs text-slate-500">จัดการข้อความส่วนหัว และการ์ด 3 ใบ (ครู/บุคลากร, กรรมการสถานศึกษา, เครือข่ายผู้ปกครอง)</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ป้ายหัวเรื่องบน (Kicker)</label>
                    <input
                      type="text"
                      value={formData.governanceSubtitle || ''}
                      onChange={(e) => setFormData({ ...formData, governanceSubtitle: e.target.value })}
                      placeholder="โครงสร้างและการมีส่วนร่วม"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-amber-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">หัวข้อหลัก</label>
                    <input
                      type="text"
                      value={formData.governanceTitle || ''}
                      onChange={(e) => setFormData({ ...formData, governanceTitle: e.target.value })}
                      placeholder="พลังความร่วมมือระหว่าง ครู คณะกรรมการสถานศึกษา และเครือข่ายผู้ปกครอง"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">คำบรรยายรายละเอียดส่วนนี้</label>
                    <textarea
                      rows={2}
                      value={formData.governanceDesc || ''}
                      onChange={(e) => setFormData({ ...formData, governanceDesc: e.target.value })}
                      placeholder="โรงเรียนบ้านนารีขับเคลื่อนการศึกษาด้วยหลักการมีส่วนร่วมของทุกภาคส่วน..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs leading-relaxed"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <h5 className="font-bold text-xs text-slate-900">แก้ไขข้อมูลการ์ดทั้ง 3 ใบ:</h5>

                  {(formData.governanceCards || []).map((card, idx) => (
                    <div key={card.id || idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-900 flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span>การ์ดที่ {idx + 1}: {card.title}</span>
                        </span>
                        <span className="text-2xs text-slate-400">เป้าหมายแท็บ: {card.targetTab}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-6">
                          <label className="block text-2xs font-semibold text-slate-600 mb-1">ชื่อการ์ด</label>
                          <input
                            type="text"
                            value={card.title}
                            onChange={(e) => handleUpdateGovCard(idx, 'title', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-2xs font-semibold text-slate-600 mb-1">ข้อความบนปุ่ม</label>
                          <input
                            type="text"
                            value={card.buttonText}
                            onChange={(e) => handleUpdateGovCard(idx, 'buttonText', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-2xs font-semibold text-slate-600 mb-1">เปิดไปที่หน้า (แท็บ)</label>
                          <select
                            value={card.targetTab}
                            onChange={(e) => handleUpdateGovCard(idx, 'targetTab', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                          >
                            <option value="staff">ครูและบุคลากร (staff)</option>
                            <option value="boards">คณะกรรมการ (boards)</option>
                            <option value="about">ข้อมูลโรงเรียน (about)</option>
                            <option value="news">ข่าวสาร (news)</option>
                          </select>
                        </div>

                        <div className="sm:col-span-12">
                          <label className="block text-2xs font-semibold text-slate-600 mb-1">คำอธิบายในการ์ด</label>
                          <textarea
                            rows={2}
                            value={card.desc}
                            onChange={(e) => handleUpdateGovCard(idx, 'desc', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 8: GENERAL INFO */}
            {activeTab === 'general' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-200 pb-3">
                  <h4 className="font-bold text-slate-900 text-base">ข้อมูลพื้นฐานสถานศึกษา</h4>
                  <p className="text-xs text-slate-500">ชื่อทางการ รหัสสถานศึกษา สังกัด และเอกลักษณ์</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อโรงเรียน (ภาษาไทย)</label>
                    <input
                      type="text"
                      value={formData.schoolName}
                      onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อโรงเรียน (ภาษาอังกฤษ)</label>
                    <input
                      type="text"
                      value={formData.schoolNameEn}
                      onChange={(e) => setFormData({ ...formData, schoolNameEn: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">สังกัด</label>
                    <input
                      type="text"
                      value={formData.affiliation}
                      onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">รหัสสถานศึกษา (สพฐ.)</label>
                    <input
                      type="text"
                      value={formData.schoolIdCode}
                      onChange={(e) => setFormData({ ...formData, schoolIdCode: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 9: VISION & MISSION */}
            {activeTab === 'vision' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-200 pb-3">
                  <h4 className="font-bold text-slate-900 text-base">วิสัยทัศน์ ปรัชญา และประวัติสถานศึกษา</h4>
                  <p className="text-xs text-slate-500">วิสัยทัศน์ที่แสดงทั้งบนหน้าแรกและหน้าข้อมูลโรงเรียน</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">วิสัยทัศน์ (Vision)</label>
                  <textarea
                    rows={3}
                    value={formData.vision}
                    onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ปรัชญาของโรงเรียน</label>
                    <input
                      type="text"
                      value={formData.philosophy}
                      onChange={(e) => setFormData({ ...formData, philosophy: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">อัตลักษณ์</label>
                    <input
                      type="text"
                      value={formData.identity}
                      onChange={(e) => setFormData({ ...formData, identity: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1">
                    <label className="block text-xs font-bold text-slate-700">ประวัติความเป็นมา</label>
                  </div>
                  <textarea
                    rows={4}
                    value={formData.history}
                    onChange={(e) => setFormData({ ...formData, history: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* TAB 10: CONTACT & LOCATION */}
            {activeTab === 'contact' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-200 pb-3">
                  <h4 className="font-bold text-slate-900 text-base">ข้อมูลการติดต่อและแถบติดต่อประสานงานท้ายหน้า</h4>
                  <p className="text-xs text-slate-500">ข้อมูลที่อยู่ เบอร์โทร อีเมล แผนที่ และข้อความแถบท้ายหน้าแรก</p>
                </div>

                {/* Footer Strip Config */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <h5 className="font-bold text-xs text-slate-800">แถบติดต่อประสานงานด่วนท้ายหน้าแรก (Contact Strip)</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-2xs font-semibold text-slate-600 mb-1">หัวข้อแถบติดต่อ</label>
                      <input
                        type="text"
                        value={formData.contactStripTitle || ''}
                        onChange={(e) => setFormData({ ...formData, contactStripTitle: e.target.value })}
                        placeholder="ติดต่อสอบถามข้อมูล หรือประสานงานราชการ"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-2xs font-semibold text-slate-600 mb-1">คำอธิบายเวลาทำการ</label>
                      <input
                        type="text"
                        value={formData.contactStripDesc || ''}
                        onChange={(e) => setFormData({ ...formData, contactStripDesc: e.target.value })}
                        placeholder="เปิดทำการวันจันทร์ - ศุกร์ เวลา 08.00 - 16.30 น."
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-2xs font-semibold text-slate-600 mb-1">ข้อความปุ่ม Drive</label>
                      <input
                        type="text"
                        value={formData.contactStripButtonDrive || ''}
                        onChange={(e) => setFormData({ ...formData, contactStripButtonDrive: e.target.value })}
                        placeholder="ดาวน์โหลดเอกสาร Drive"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-2xs font-semibold text-slate-600 mb-1">ข้อความปุ่มแผนที่</label>
                      <input
                        type="text"
                        value={formData.contactStripButtonMap || ''}
                        onChange={(e) => setFormData({ ...formData, contactStripButtonMap: e.target.value })}
                        placeholder="แผนที่และการเดินทาง"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">ที่อยู่โรงเรียน</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">อีเมลทางการ</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Facebook Page URL</label>
                    <input
                      type="text"
                      value={formData.facebookUrl || ''}
                      onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                      placeholder="https://facebook.com/..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Google Maps Embed URL</label>
                    <input
                      type="text"
                      value={formData.googleMapEmbedUrl || ''}
                      onChange={(e) => setFormData({ ...formData, googleMapEmbedUrl: e.target.value })}
                      placeholder="https://www.google.com/maps/embed?..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <span className="text-2xs text-slate-400">
                ระบบจะบันทึกข้อมูลไปยังฐานข้อมูล Firestore และอัปเดตหน้าแรกทันทีแบบเรียลไทม์
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-amber-300" />}
                  <span>บันทึกการเปลี่ยนแปลงทั้งหมด</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {isMediaModalOpen && (
        <MediaUploadModal
          isOpen={isMediaModalOpen}
          onClose={() => setIsMediaModalOpen(false)}
          onSelect={(urls) => {
            if (urls.length > 0) {
              setFormData(prev => ({ ...prev, [mediaTargetField]: urls[0] }));
            }
          }}
          mediaList={mediaList}
          onAddMediaItem={onAddMediaItem}
          multiple={false}
          title={mediaTargetField === 'heroImageUrl' ? 'เลือกภาพหน้าปกโรงเรียน (Hero Image)' : 'เลือกภาพผู้อำนวยการโรงเรียน'}
          initialSelectedUrl={formData[mediaTargetField]}
        />
      )}
    </>
  );
};
