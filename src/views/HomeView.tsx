import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  BookOpen, 
  Award, 
  ChevronRight, 
  Calendar, 
  Megaphone, 
  Sparkles, 
  HardDrive, 
  Edit3, 
  Quote, 
  ArrowRight, 
  Trash2, 
  ShieldCheck, 
  Plus,
  Compass,
  Laptop,
  Sprout,
  HeartHandshake,
  FileText,
  MapPin,
  Phone,
  Mail,
  School,
  ExternalLink,
  GraduationCap,
  Database,
  Tv,
  CheckCircle2,
  Sliders,
  Layers,
  ArrowUpRight,
  Play,
  Video,
  Film,
  Eye,
  X,
  Share2
} from 'lucide-react';
import { 
  SchoolInfo, 
  NewsPost, 
  GalleryAlbum, 
  UserRole, 
  PostCategory, 
  EducationalPillar,
  GovernanceCardItem,
  QuickLinkItem,
  VideoItem
} from '../types';
import { extractDriveFileId } from '../services/driveService';

export type HomepageTabKey = 'homepage' | 'sections' | 'ticker' | 'pillars' | 'director' | 'governance' | 'quicklinks' | 'videos' | 'vision' | 'general' | 'contact';

interface HomeViewProps {
  schoolInfo: SchoolInfo;
  newsList: NewsPost[];
  galleryList: GalleryAlbum[];
  videoList?: VideoItem[];
  categories?: PostCategory[];
  setActiveTab: (tab: string) => void;
  onOpenNewsDetail: (news: NewsPost) => void;
  onOpenAlbumDetail: (album: GalleryAlbum) => void;
  isQuickEditMode: boolean;
  userRole: UserRole;
  onEditSchoolInfo: (tab?: HomepageTabKey) => void;
  onEditNews: (news?: NewsPost) => void;
  onDeleteNews?: (news: NewsPost) => void;
  onEditAlbum: (album?: GalleryAlbum) => void;
  onDeleteAlbum?: (album: GalleryAlbum) => void;
  onEditVideo?: (video?: VideoItem) => void;
  onDeleteVideo?: (video: VideoItem) => void;
}

const defaultPillars: EducationalPillar[] = [
  {
    id: 'pillar-1',
    title: '1. ปฐมวัยคุณภาพ & BBL',
    desc: 'เสริมสร้างพัฒนาการรอบด้านทั้งร่างกาย อารมณ์ และสังคม ผ่านการเล่นสร้างสรรค์ และการเรียนรู้ตามหลักพัฒนาการสมอง (BBL & EF)',
    targetGrade: 'ระดับชั้นอนุบาล 2 - อนุบาล 3',
    icon: 'Compass'
  },
  {
    id: 'pillar-2',
    title: '2. ประถมศึกษา & สมรรถนะหลัก',
    desc: 'เน้นการอ่านออก เขียนได้ คิดคำนวณคล่อง สื่อสารได้ 2 ภาษา พร้อมปลูกฝังทักษะการคิดวิเคราะห์และการแก้ปัญหาอย่างเป็นระบบ',
    targetGrade: 'ระดับชั้น ป.1 - ป.6',
    icon: 'BookOpen'
  },
  {
    id: 'pillar-3',
    title: '3. นวัตกรรมดิจิทัล & STEM',
    desc: 'เรียนรู้ Coding, วิทยาการคำนวณ, และโครงงาน STEM นำเทคโนโลยีสารสนเทศมาเป็นเครื่องมือแสวงหาความรู้ตลอดชีวิต',
    targetGrade: 'ระดับประถม - มัธยมศึกษาตอนต้น',
    icon: 'Laptop'
  },
  {
    id: 'pillar-4',
    title: '4. วิถีพอเพียง & จิตอาสา',
    desc: 'น้อมนำหลักปรัชญาของเศรษฐกิจพอเพียง แปลงเกษตรอินทรีย์โรงเรียน ปลูกฝังค่านิยมความซื่อสัตย์ มีวินัย และจิตสาธารณะ',
    targetGrade: 'ทุกระดับชั้น & สังคมชุมชน',
    icon: 'Sprout'
  }
];

const defaultGovernanceCards: GovernanceCardItem[] = [
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
];

const defaultQuickLinks: QuickLinkItem[] = [
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
  },
  {
    id: 'ql-5',
    title: 'มูลนิธิการศึกษา DLTV',
    desc: 'ห้องเรียนออนไลน์และการเรียนรู้ทางไกล',
    url: 'https://www.dltv.ac.th',
    icon: 'Tv',
    badge: 'สื่อการเรียนรู้',
    color: 'rose',
    isExternal: true
  },
  {
    id: 'ql-6',
    title: 'ระบบ e-GP จัดซื้อจัดจ้าง',
    desc: 'ระบบการจัดซื้อจัดจ้างภาครัฐ กรมบัญชีกลาง',
    url: 'http://www.gprocurement.go.th',
    icon: 'FileText',
    badge: 'งานพัสดุและงบประมาณ',
    color: 'slate',
    isExternal: true
  }
];

export const HomeView: React.FC<HomeViewProps> = ({
  schoolInfo,
  newsList,
  galleryList,
  videoList = [],
  categories = [],
  setActiveTab,
  onOpenNewsDetail,
  onOpenAlbumDetail,
  isQuickEditMode,
  userRole,
  onEditSchoolInfo,
  onEditNews,
  onDeleteNews,
  onEditAlbum,
  onDeleteAlbum,
  onEditVideo,
  onDeleteVideo
}) => {
  const [activeVideoModal, setActiveVideoModal] = useState<VideoItem | null>(null);

  const pinnedNews = newsList.filter(n => n.pinned && n.published);
  const recentNews = newsList.filter(n => n.published).slice(0, 6);
  const recentAlbums = galleryList.slice(0, 3);
  
  // กำหนดสิทธิ์การแก้ไขที่หน้าเว็บ frontpage โดยตรงให้สิทธิ์เฉพาะ admin และ super admin เท่านั้น
  const canDirectEdit = (userRole === 'admin' || userRole === 'superadmin') && isQuickEditMode;
  const canEdit = canDirectEdit;
  const maxVideos = schoolInfo.videoSectionMaxItems || 4;
  const recentVideos = (videoList || [])
    .filter(v => v.published || canEdit)
    .slice(0, maxVideos);

  const getEmbedUrl = (url: string): { type: 'youtube' | 'drive' | 'html5'; embedUrl: string } => {
    if (!url) return { type: 'html5', embedUrl: '' };

    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`
      };
    }

    if (url.includes('drive.google.com')) {
      const fileId = extractDriveFileId(url);
      return {
        type: 'drive',
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`
      };
    }

    return { type: 'html5', embedUrl: url };
  };

  const activePillars = (schoolInfo.educationalPillars && schoolInfo.educationalPillars.length > 0)
    ? schoolInfo.educationalPillars
    : defaultPillars;

  const activeGovernanceCards = (schoolInfo.governanceCards && schoolInfo.governanceCards.length > 0)
    ? schoolInfo.governanceCards
    : defaultGovernanceCards;

  const activeQuickLinks = (schoolInfo.quickLinks && schoolInfo.quickLinks.length > 0)
    ? schoolInfo.quickLinks
    : defaultQuickLinks;

  const vis = schoolInfo.sectionsVisibility || {
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

  const getQuickLinkIcon = (iconName?: string) => {
    switch (iconName) {
      case 'GraduationCap': return <GraduationCap className="w-5 h-5" />;
      case 'Award': return <Award className="w-5 h-5" />;
      case 'Database': return <Database className="w-5 h-5" />;
      case 'Building2': return <Building2 className="w-5 h-5" />;
      case 'Tv': return <Tv className="w-5 h-5" />;
      case 'FileText': return <FileText className="w-5 h-5" />;
      default: return <ExternalLink className="w-5 h-5" />;
    }
  };

  const getGovIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Users': return <Users className="w-6 h-6" />;
      case 'Award': return <Award className="w-6 h-6" />;
      case 'HeartHandshake': return <HeartHandshake className="w-6 h-6" />;
      default: return <Users className="w-6 h-6" />;
    }
  };

  return (
    <div className="space-y-12 lg:space-y-20 pb-16 animate-in fade-in duration-300">
      {/* 1. Admin Universal Management Bar (เฉพาะ admin และ superadmin เท่านั้น) */}
      {canDirectEdit && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-gradient-to-r from-amber-500/15 via-blue-900/10 to-indigo-900/10 border border-amber-400/40 rounded-2xl p-4 flex flex-col xl:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">แผงควบคุมระบบหลังบ้านหน้าหลัก (Homepage Manager)</span>
                  <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    จัดการได้ทุกส่วน 100%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center xl:justify-end gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onEditSchoolInfo('homepage')}
                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                title="แก้ไขส่วนหัวและภาพหน้าปก"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>ภาพหน้าปก</span>
              </button>
              <button
                type="button"
                onClick={() => onEditSchoolInfo('sections')}
                className="px-2.5 py-1.5 bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                title="เปิด/ปิด การแสดงผลส่วนต่างๆ บนหน้าหลัก"
              >
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                <span>เปิด/ปิดส่วนประกอบ</span>
              </button>
              <button
                type="button"
                onClick={() => onEditSchoolInfo('quicklinks')}
                className="px-2.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-900 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="จัดการลิงก์ด่วนและระบบบริการ e-Services"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-700" />
                <span>ลิงก์ด่วน</span>
              </button>
              <button
                type="button"
                onClick={() => onEditSchoolInfo('governance')}
                className="px-2.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-900 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="จัดการข้อความโครงสร้างการมีส่วนร่วม 3 ฝ่าย"
              >
                <Users className="w-3.5 h-3.5 text-blue-700" />
                <span>เครือข่าย 3 ฝ่าย</span>
              </button>
              <button
                type="button"
                onClick={() => onEditSchoolInfo('pillars')}
                className="px-2.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-900 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="แก้ไขจุดเน้น 4 เสาหลัก"
              >
                <Compass className="w-3.5 h-3.5 text-blue-700" />
                <span>4 เสาหลัก</span>
              </button>
              <button
                type="button"
                onClick={() => onEditSchoolInfo('videos')}
                className="px-2.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-900 hover:bg-rose-100 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="ตั้งค่าส่วนแสดงวิดีโอกิจกรรมบนหน้าแรก"
              >
                <Video className="w-3.5 h-3.5 text-rose-600" />
                <span>วิดีโอหน้าแรก</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
              >
                <span>แดชบอร์ดหลังบ้าน</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 2. Institutional Hero Section (Fully Dynamic) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#071329] via-[#0F224A] to-[#0A1938] text-white mx-4 sm:mx-6 lg:mx-8 rounded-3xl shadow-2xl border border-blue-900/40">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-6 py-10 sm:py-14 lg:py-16 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Content (Col 7) */}
            <div className="lg:col-span-7 space-y-5 text-left">
              {/* Institution Identity Kicker */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-semibold backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{schoolInfo.heroTagline || 'สถานศึกษาพอเพียงและปลอดภัย · สพป.ชัยภูมิ เขต 1'}</span>
              </div>

              {/* Headline */}
              <div className="space-y-1.5">
                <p className="text-xs sm:text-sm font-medium text-slate-300 uppercase tracking-widest">
                  ยินดีต้อนรับสู่
                </p>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                  {schoolInfo.schoolName}
                </h1>
                <p className="text-sm sm:text-base font-semibold text-amber-400 tracking-wide">
                  {schoolInfo.schoolNameEn} <span className="text-slate-400 font-normal">· รหัสสถานศึกษา {schoolInfo.schoolIdCode || '1040180234'}</span>
                </p>
              </div>

              {/* Motto Callout */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs relative group">
                <div className="text-amber-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                  <span>คติพจน์ประจำโรงเรียน</span>
                </div>
                <p className="text-base sm:text-lg font-bold text-white tracking-tight">
                  "{schoolInfo.motto}"
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  ปรัชญา: {schoolInfo.philosophy}
                </p>
              </div>

              {/* School Vision */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <Quote className="w-3.5 h-3.5 text-amber-400 rotate-180" />
                  <span>วิสัยทัศน์สถานศึกษา (Vision)</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                  "{schoolInfo.vision}"
                </p>
              </div>

              {/* Hero Action CTA Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('about')}
                  className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <span>ข้อมูลและประวัติโรงเรียน</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('news')}
                  className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm transition-all border border-white/20 backdrop-blur-xs flex items-center gap-2 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-amber-300" />
                  <span>ข่าวสาร & ประกาศ</span>
                </button>

                {userRole !== 'guest' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('drive')}
                    className="px-5 py-3 rounded-xl bg-blue-900/60 hover:bg-blue-800/80 text-blue-200 font-semibold text-xs sm:text-sm transition-all border border-blue-700/50 backdrop-blur-xs flex items-center gap-2 cursor-pointer"
                  >
                    <HardDrive className="w-4 h-4 text-blue-400" />
                    <span>คลัง Google Drive</span>
                  </button>
                )}
              </div>

              {/* Admin Quick Edit Button */}
              {canEdit && (
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEditSchoolInfo('homepage')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>แก้ไขวิสัยทัศน์ ข้อความ และรูปหน้าแรก</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditSchoolInfo('sections')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-300 border border-white/20 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-blue-400" />
                    <span>เปิด/ปิดการแสดงผลแต่ละส่วน</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right Media (Col 5) - High-Fidelity Campus Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/15 bg-slate-900 aspect-16/10 lg:aspect-4/3 group">
                <img
                  src={schoolInfo.heroImageUrl || '/src/assets/images/hero_school_campus_1792082308721.jpg'}
                  alt={schoolInfo.schoolName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                
                {/* Visual Scrim for contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>

                {/* Floating Institutional Badge */}
                <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md border border-white/20 rounded-xl p-3 text-left shadow-lg">
                  <p className="text-2xs font-extrabold text-amber-400 uppercase tracking-widest">
                    {schoolInfo.heroBadgeTitle || 'โรงเรียนวิถีพุทธ & คุณธรรม'}
                  </p>
                  <p className="text-xs font-bold text-white mt-0.5">
                    อัตลักษณ์: {schoolInfo.identity}
                  </p>
                </div>

                {/* Floating Bottom Trust Label */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-white/90">
                  <span className="font-semibold text-white drop-shadow-xs truncate max-w-[220px]">
                    {schoolInfo.heroBadgeSubtitle || 'บรรยากาศร่มรื่น น้อมนำศาสตร์พระราชา'}
                  </span>
                  <span className="text-2xs text-amber-300 font-bold bg-amber-400/20 px-2 py-0.5 rounded-md border border-amber-400/30 shrink-0">
                    ชัยภูมิ
                  </span>
                </div>

                {/* Quick Edit Overlay for Image */}
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => onEditSchoolInfo('homepage')}
                    className="absolute bottom-4 right-4 z-20 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>เปลี่ยนภาพหน้าปก</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 3. Hero Quantitative Metrics Strip (Tabular Numerals) */}
          {vis.heroStats !== false && (
            <div className="w-full mt-10 pt-8 border-t border-white/10 relative">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xs text-center">
                  <p className="text-3xl lg:text-4xl font-extrabold text-amber-300 tabular-nums">
                    {schoolInfo.studentCount}
                  </p>
                  <p className="text-xs text-slate-300 mt-1 font-medium">นักเรียนทั้งหมด (คน)</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xs text-center">
                  <p className="text-3xl lg:text-4xl font-extrabold text-blue-300 tabular-nums">
                    {schoolInfo.teacherCount}
                  </p>
                  <p className="text-xs text-slate-300 mt-1 font-medium">ครูและบุคลากร (ท่าน)</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xs text-center">
                  <p className="text-3xl lg:text-4xl font-extrabold text-emerald-300 tabular-nums">
                    {schoolInfo.classroomCount}
                  </p>
                  <p className="text-xs text-slate-300 mt-1 font-medium">ห้องเรียนเปิดสอน (ห้อง)</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-2xs text-center">
                  <p className="text-3xl lg:text-4xl font-extrabold text-amber-400 tabular-nums">
                    {schoolInfo.safetyStatPercent || '100%'}
                  </p>
                  <p className="text-xs text-slate-300 mt-1 font-medium">
                    {schoolInfo.safetyStatLabel || 'สถานศึกษาปลอดภัยและสุขอนามัย'}
                  </p>
                </div>
              </div>

              {canEdit && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => onEditSchoolInfo('ticker')}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-lg text-2xs font-semibold flex items-center gap-1.5 transition-colors border border-white/10 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3 text-amber-300" />
                    <span>แก้ไขตัวเลขสถิติสถานศึกษา</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 4. Urgent Announcement / Breaking Ticker Banner */}
      {vis.urgentTicker !== false && (schoolInfo.urgentTickerText || pinnedNews.length > 0) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 sm:p-4.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2.5 bg-amber-400 text-slate-900 rounded-xl shrink-0 shadow-xs">
                <Megaphone className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xs font-extrabold text-amber-950 bg-amber-200/90 px-2 py-0.5 rounded-md shrink-0">
                    {schoolInfo.urgentTickerLabel || 'ประกาศสำคัญ'}
                  </span>
                  <span className="text-2xs text-slate-500 shrink-0">
                    {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 mt-1 leading-snug truncate">
                  {schoolInfo.urgentTickerText || (pinnedNews[0] ? pinnedNews[0].title : '')}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              {pinnedNews.length > 0 && (
                <button
                  type="button"
                  onClick={() => onOpenNewsDetail(pinnedNews[0])}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <span>อ่านประกาศทางการ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {canEdit && (
                <button
                  type="button"
                  onClick={() => onEditSchoolInfo('ticker')}
                  className="px-2.5 py-1.5 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100/70 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="แก้ไขข้อความประกาศด่วน"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                  <span>แก้ไขประกาศวิ่ง</span>
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 5. Director's Welcome & Institutional Message (Editorial Pattern) */}
      {vis.directorWelcome !== false && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xl shadow-slate-100 flex flex-col md:flex-row items-center gap-8 lg:gap-12 relative">
            {/* Director Portrait */}
            <div className="relative shrink-0 text-center">
              <div className="w-40 h-40 sm:w-52 sm:h-52 rounded-2xl overflow-hidden ring-4 ring-amber-400/20 shadow-lg bg-slate-100">
                <img
                  src={schoolInfo.directorImageUrl || '/src/assets/images/school_director_portrait_1792082309465.jpg'}
                  alt={schoolInfo.directorName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="mt-3 inline-block bg-blue-900 text-white text-2xs font-bold px-3 py-1 rounded-full shadow-xs">
                {schoolInfo.directorPosition}
              </div>
            </div>

            {/* Director Message & Signature */}
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 text-amber-700 text-xs font-bold tracking-wider uppercase">
                  <Quote className="w-4 h-4 rotate-180" />
                  <span>{schoolInfo.directorGreetingTitle || 'สารจากผู้บริหารสถานศึกษา'}</span>
                </div>

                {canEdit && (
                  <button
                    type="button"
                    onClick={() => onEditSchoolInfo('director')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-colors self-center sm:self-auto cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                    <span>แก้ไขสารและข้อมูลผู้บริหาร</span>
                  </button>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                "{schoolInfo.directorQuoteTitle || 'ร่วมแรงร่วมใจ สร้างวินัย ใฝ่หาความรู้ เพื่ออนาคตที่สดใสของเยาวชนบ้านนารี'}"
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                {schoolInfo.directorMessage}
              </p>

              <div className="pt-3 border-t border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-base">{schoolInfo.directorName}</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {schoolInfo.directorPosition} {schoolInfo.directorRank && `· ${schoolInfo.directorRank}`}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 6. Four Educational Pillars & Curriculum Highlights */}
      {vis.educationalPillars !== false && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="space-y-1">
              <span className="text-blue-700 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Compass className="w-4 h-4" />
                <span>จุดเน้นการพัฒนาผู้เรียน</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {schoolInfo.pillarsTitle || '4 เสาหลักการจัดการศึกษา โรงเรียนบ้านนารี'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-2xl">
                {schoolInfo.pillarsSubtitle || 'มุ่งเน้นการจัดการเรียนรู้เชิงรุก (Active Learning) บูรณาการคุณธรรม จริยธรรม และทักษะดิจิทัลแห่งศตวรรษที่ 21'}
              </p>
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={() => onEditSchoolInfo('pillars')}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>แก้ไข 4 เสาหลักการศึกษา</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {activePillars.map((pillar, idx) => {
              const colors = [
                { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-600', tag: 'text-amber-700' },
                { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600', tag: 'text-blue-700' },
                { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'text-indigo-600', tag: 'text-indigo-700' },
                { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-600', tag: 'text-emerald-700' },
              ];
              const colorTheme = colors[idx % colors.length];

              return (
                <div 
                  key={pillar.id || idx} 
                  className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow group flex flex-col justify-between relative"
                >
                  <div className="space-y-3">
                    <div className={`w-12 h-12 rounded-xl ${colorTheme.bg} ${colorTheme.text} flex items-center justify-center font-bold`}>
                      {idx === 0 && <Compass className="w-6 h-6" />}
                      {idx === 1 && <BookOpen className="w-6 h-6" />}
                      {idx === 2 && <Laptop className="w-6 h-6" />}
                      {idx === 3 && <Sprout className="w-6 h-6" />}
                      {idx > 3 && <Sparkles className="w-6 h-6" />}
                    </div>
                    <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-900 transition-colors">
                      {pillar.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                  <div className={`pt-4 mt-4 border-t border-slate-100 text-2xs font-semibold ${colorTheme.tag}`}>
                    {pillar.targetGrade}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 7. Quick Links / Online Services (e-Services Portals) */}
      {vis.quickLinks !== false && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2 text-blue-900 text-xs font-bold uppercase tracking-wider">
                <ExternalLink className="w-4 h-4 text-blue-600" />
                <span>บริการออนไลน์สำหรับนักเรียน ครู และผู้ปกครอง</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                {schoolInfo.quickLinksTitle || 'ระบบบริการอิเล็กทรอนิกส์ & ลิงก์ด่วนทางการศึกษา'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {schoolInfo.quickLinksSubtitle || 'e-Services Portals · เข้าถึงระบบงานสำคัญ สพฐ. กระทรวงศึกษาธิการ และหน่วยงานต้นสังกัด'}
              </p>
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={() => onEditSchoolInfo('quicklinks')}
                className="px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                <span>จัดการลิงก์ด่วนหลังบ้าน</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {activeQuickLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target={link.isExternal ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className="group p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-lg transition-all flex flex-col justify-between text-left relative"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors flex items-center justify-center font-bold mb-3 shadow-2xs">
                    {getQuickLinkIcon(link.icon)}
                  </div>
                  {link.badge && (
                    <span className="inline-block text-3xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mb-1.5">
                      {link.badge}
                    </span>
                  )}
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-900 transition-colors line-clamp-1">
                    {link.title}
                  </h4>
                  <p className="text-2xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {link.desc}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-2xs text-blue-800 font-semibold group-hover:text-amber-600">
                  <span>เข้าสู่ระบบ</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* 8. News & Announcements Grid (Editorial Card Architecture) */}
      {vis.recentNews !== false && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2 text-blue-900 text-xs font-bold uppercase tracking-wider">
                <BookOpen className="w-4 h-4 text-amber-500" />
                <span>ข่าวสารและความเคลื่อนไหว</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                ข่าวประชาสัมพันธ์ล่าสุด
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {canDirectEdit && (
                <button
                  type="button"
                  onClick={() => onEditNews()}
                  className="px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เขียนข่าวใหม่</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('news')}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <span>ดูข่าวทั้งหมด ({newsList.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* News Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentNews.map((item) => (
              <article
                key={item.id}
                onClick={() => onOpenNewsDetail(item)}
                className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer relative"
              >
                {/* Cover Image Container */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                  <img
                    src={item.coverImage || '/src/assets/images/hero_school_campus_1792082308721.jpg'}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Category Tag */}
                  <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-xs text-white text-2xs font-bold px-2.5 py-1 rounded-lg shadow-xs">
                    {(() => {
                      const foundCat = categories.find(c => c.slug === item.category);
                      if (foundCat) return foundCat.name;
                      if (item.category === 'announcement') return 'ประกาศทางการ';
                      if (item.category === 'procurement') return 'จัดซื้อจัดจ้าง';
                      if (item.category === 'academic') return 'วิชาการ';
                      return 'ข่าวประชาสัมพันธ์';
                    })()}
                  </div>

                  {item.driveFileName && (
                    <span className="absolute top-3 right-3 bg-white/95 text-blue-900 text-2xs font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                      <HardDrive className="w-3 h-3 text-blue-600" />
                      <span>มีเอกสารแนบ</span>
                    </span>
                  )}
                </div>

                {/* Text Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-2xs text-slate-500 mb-2 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(item.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate max-w-[140px]">{item.authorName || 'ฝ่ายประชาสัมพันธ์'}</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-900 transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {item.summary || (item.content ? item.content.replace(/<[^>]+>/g, '') : '')}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-blue-900 font-bold group-hover:underline flex items-center gap-1">
                      <span>อ่านรายละเอียด</span>
                      <ArrowRight className="w-3 h-3 text-blue-600" />
                    </span>

                    {canDirectEdit && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onEditNews(item); }}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="แก้ไขข่าวนี้"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteNews && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onDeleteNews(item); }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="ลบข่าวนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* 9. Photo Gallery Highlights */}
      {vis.recentGallery !== false && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-wider">
                <Award className="w-4 h-4 text-amber-600" />
                <span>ภาพความประทับใจ</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                ภาพกิจกรรมและผลงานนักเรียน
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {canDirectEdit && (
                <button
                  type="button"
                  onClick={() => onEditAlbum()}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มอัลบั้มภาพ</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('gallery')}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <span>ดูภาพกิจกรรมทั้งหมด</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentAlbums.map((album) => (
              <div
                key={album.id}
                onClick={() => onOpenAlbumDetail(album)}
                className="group relative rounded-2xl overflow-hidden bg-slate-900 aspect-4/3 cursor-pointer shadow-md hover:shadow-xl transition-all"
              >
                <img
                  src={album.coverImage}
                  alt={album.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95 group-hover:opacity-100"
                />

                {(album.driveFolderUrl || album.driveFolderId) && (
                  <span className="absolute top-3 left-3 bg-white/95 text-blue-900 text-2xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-xs z-10">
                    <HardDrive className="w-3 h-3 text-blue-600" />
                    <span>Google Drive</span>
                  </span>
                )}

                {canDirectEdit && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 z-20">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onEditAlbum(album); }}
                      className="p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-lg shadow-sm transition-colors cursor-pointer"
                      title="แก้ไขอัลบั้มนี้"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                    </button>
                    {onDeleteAlbum && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDeleteAlbum(album); }}
                        className="p-1.5 bg-white/90 hover:bg-rose-600 hover:text-white text-rose-600 rounded-lg shadow-sm transition-colors cursor-pointer"
                        title="ลบอัลบั้มนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent p-5 flex flex-col justify-end text-white">
                  <span className="text-2xs text-amber-300 font-semibold mb-1">
                    {album.activityDate} · {album.images.length} รูปภาพ
                  </span>
                  <h3 className="text-base font-bold leading-snug group-hover:text-amber-300 transition-colors line-clamp-2">
                    {album.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 9.5. Video Gallery Showcase Section (Modern Responsive Architecture) */}
      {vis.videoGallery !== false && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2 text-rose-700 text-xs font-bold uppercase tracking-wider">
                <Film className="w-4 h-4 text-rose-600" />
                <span>วิดีโอกิจกรรม & สื่อสร้างสรรค์</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                {schoolInfo.videoSectionTitle || 'วิดีโอกิจกรรมและผลงานสถานศึกษา'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
                {schoolInfo.videoSectionSubtitle || 'ประมวลภาพเคลื่อนไหว การจัดการเรียนรู้ และกิจกรรมส่งเสริมศักยภาพผู้เรียน'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canEdit && (
                <>
                  <button
                    type="button"
                    onClick={() => onEditSchoolInfo('videos')}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    title="ตั้งค่าส่วนแสดงวิดีโอบนหน้าหลัก"
                  >
                    <Sliders className="w-3.5 h-3.5 text-slate-600" />
                    <span>ตั้งค่าส่วนนี้</span>
                  </button>
                  {onEditVideo && (
                    <button
                      type="button"
                      onClick={() => onEditVideo()}
                      className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มวิดีโอใหม่</span>
                    </button>
                  )}
                </>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('videos')}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <span>ดูวิดีโอทั้งหมด ({(videoList || []).length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {recentVideos.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
                <Film className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-base text-slate-800">ยังไม่มีวิดีโอกิจกรรมที่เผยแพร่</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                เพิ่มคลิปวิดีโอ YouTube หรือ Google Drive เพื่อให้แสดงในพื้นที่ส่วนนี้บนหน้าหลัก
              </p>
              {canEdit && onEditVideo && (
                <button
                  type="button"
                  onClick={() => onEditVideo()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs mt-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มวิดีโอกิจกรรมแรก</span>
                </button>
              )}
            </div>
          ) : (
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${recentVideos.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
              {recentVideos.map((video) => {
                const isDrive = (video.videoUrl || '').includes('drive.google.com') || !!video.driveFileId;
                return (
                  <article
                    key={video.id}
                    onClick={() => setActiveVideoModal(video)}
                    className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer relative"
                  >
                    <div>
                      {/* Video Thumbnail with Play Button Overlay */}
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                        <img
                          src={video.thumbnailUrl || '/src/assets/images/hero_school_campus_1792082308721.jpg'}
                          alt={video.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                        />

                        {/* Centered Play Button */}
                        <div className="absolute inset-0 bg-slate-950/25 group-hover:bg-slate-950/40 transition-colors flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-rose-600/90 group-hover:bg-rose-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          </div>
                        </div>

                        {/* Source Badge (YouTube / Google Drive) */}
                        <div className="absolute top-3 left-3">
                          {isDrive ? (
                            <span className="bg-blue-900/90 backdrop-blur-xs text-white text-3xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                              <HardDrive className="w-3 h-3 text-blue-300" />
                              <span>Google Drive</span>
                            </span>
                          ) : (
                            <span className="bg-rose-700/90 backdrop-blur-xs text-white text-3xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                              <Video className="w-3 h-3 text-white" />
                              <span>YouTube</span>
                            </span>
                          )}
                        </div>

                        {/* Duration Badge */}
                        {video.duration && (
                          <div className="absolute bottom-2.5 right-2.5 bg-slate-950/85 backdrop-blur-xs text-white text-3xs font-medium px-2 py-0.5 rounded shadow-2xs">
                            {video.duration}
                          </div>
                        )}
                      </div>

                      {/* Content Body */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center gap-2 text-2xs text-slate-500 font-medium">
                          <span className="text-rose-700 font-bold">{video.category || 'กิจกรรมโรงเรียน'}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {video.createdAt
                              ? new Date(video.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
                              : 'ล่าสุด'}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-900 transition-colors line-clamp-2 leading-snug">
                          {video.title}
                        </h3>

                        {video.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {video.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom Strip */}
                    <div className="px-4 pb-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-blue-900 group-hover:text-rose-600 font-bold flex items-center gap-1 transition-colors">
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>รับชมวิดีโอ</span>
                      </span>

                      {canEdit && (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {onEditVideo && (
                            <button
                              type="button"
                              onClick={() => onEditVideo(video)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="แก้ไขวิดีโอนี้"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteVideo && (
                            <button
                              type="button"
                              onClick={() => onDeleteVideo(video)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="ลบวิดีโอนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 10. School Community & Stakeholder Governance (Fully Managed Dynamic Architecture) */}
      {vis.communityGovernance !== false && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#0B1528] via-[#0F224A] to-[#1E293B] text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-blue-900/50 relative">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
              <div className="max-w-2xl space-y-2">
                <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">
                  {schoolInfo.governanceSubtitle || 'โครงสร้างและการมีส่วนร่วม'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {schoolInfo.governanceTitle || 'พลังความร่วมมือระหว่าง ครู คณะกรรมการสถานศึกษา และเครือข่ายผู้ปกครอง'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  {schoolInfo.governanceDesc || 'โรงเรียนบ้านนารีขับเคลื่อนการศึกษาด้วยหลักการมีส่วนร่วมของทุกภาคส่วนอย่างโปร่งใส ตรวจสอบได้ และยึดประโยชน์สูงสุดของผู้เรียนเป็นสำคัญ'}
                </p>
              </div>

              {canEdit && (
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onEditSchoolInfo('governance')}
                    className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>แก้ไขข้อความส่วนนี้</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('staff')}
                    className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    <span>จัดการบุคลากร</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('boards')}
                    className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>จัดการบอร์ด</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {activeGovernanceCards.map((card, idx) => {
                const bgStyles = [
                  { iconBg: 'bg-blue-500/20 text-blue-300', hoverText: 'group-hover:text-blue-300' },
                  { iconBg: 'bg-amber-500/20 text-amber-300', hoverText: 'group-hover:text-amber-300' },
                  { iconBg: 'bg-emerald-500/20 text-emerald-300', hoverText: 'group-hover:text-emerald-300' }
                ];
                const currentStyle = bgStyles[idx % bgStyles.length];

                return (
                  <div
                    key={card.id || idx}
                    onClick={() => setActiveTab(card.targetTab || 'staff')}
                    className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className={`w-12 h-12 rounded-xl ${currentStyle.iconBg} flex items-center justify-center mb-4`}>
                        {getGovIcon(card.icon)}
                      </div>
                      <h3 className={`font-bold text-base text-white ${currentStyle.hoverText} transition-colors`}>
                        {card.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        {card.desc}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                      <span>{card.buttonText || 'ดูข้อมูล'}</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 11. Operational Contact & Document Quick Access Strip */}
      {vis.contactStrip !== false && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-100/90 rounded-2xl p-6 sm:p-8 border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-6 relative shadow-xs">
            <div className="space-y-1 text-center md:text-left flex-1">
              <h3 className="text-base font-extrabold text-slate-900">
                {schoolInfo.contactStripTitle || 'ติดต่อสอบถามข้อมูล หรือประสานงานราชการ'}
              </h3>
              <p className="text-xs text-slate-600">
                {schoolInfo.address}
              </p>
              {schoolInfo.contactStripDesc && (
                <p className="text-2xs text-slate-500 italic">
                  {schoolInfo.contactStripDesc}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-700 pt-1 font-medium">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-blue-900" />
                  <span>{schoolInfo.phone}</span>
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-blue-900" />
                  <span>{schoolInfo.email}</span>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {userRole !== 'guest' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('drive')}
                  className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <HardDrive className="w-4 h-4 text-amber-300" />
                  <span>{schoolInfo.contactStripButtonDrive || 'ดาวน์โหลดเอกสาร Drive'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('contact')}
                className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
              >
                <span>{schoolInfo.contactStripButtonMap || 'แผนที่และการเดินทาง'}</span>
              </button>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => onEditSchoolInfo('contact')}
                  className="p-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl transition-colors cursor-pointer"
                  title="แก้ไขข้อมูลติดต่อ & ที่อยู่"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Dedicated Interactive Video Playback Modal */}
      {activeVideoModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setActiveVideoModal(null)}
        >
          <div 
            className="bg-slate-900 text-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-rose-600 text-white rounded-xl shrink-0">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-3xs text-rose-400 font-bold uppercase tracking-wider block">
                    {activeVideoModal.category || 'วิดีโอกิจกรรม'}
                  </span>
                  <h3 className="font-bold text-sm sm:text-base text-white truncate">
                    {activeVideoModal.title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveVideoModal(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video w-full bg-black">
              {(() => {
                const embed = getEmbedUrl(activeVideoModal.videoUrl);
                if (embed.type === 'youtube' || embed.type === 'drive') {
                  return (
                    <iframe
                      src={embed.embedUrl}
                      title={activeVideoModal.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  );
                }
                return (
                  <video
                    src={activeVideoModal.videoUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                );
              })()}
            </div>

            {/* Video Details & Actions */}
            <div className="p-5 space-y-3 bg-slate-900/95 overflow-y-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {activeVideoModal.createdAt
                        ? new Date(activeVideoModal.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
                        : '-'}
                    </span>
                  </span>
                  {activeVideoModal.duration && (
                    <>
                      <span>·</span>
                      <span>ความยาว {activeVideoModal.duration}</span>
                    </>
                  )}
                  {activeVideoModal.views !== undefined && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>{activeVideoModal.views} ครั้ง</span>
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {canEdit && onEditVideo && (
                    <button
                      type="button"
                      onClick={() => {
                        const v = activeVideoModal;
                        setActiveVideoModal(null);
                        onEditVideo(v);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>แก้ไขคลิปนี้</span>
                    </button>
                  )}
                  {activeVideoModal.videoUrl && (
                    <a
                      href={activeVideoModal.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                      <span>เปิดต้นฉบับ</span>
                    </a>
                  )}
                </div>
              </div>

              {activeVideoModal.description && (
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {activeVideoModal.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
