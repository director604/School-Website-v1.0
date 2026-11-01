import React, { useState } from 'react';
import {
  Newspaper,
  Search,
  Plus,
  Calendar,
  HardDrive,
  Sparkles,
  Edit3,
  Trash2,
  Share2,
  Copy,
  Check,
  FileText,
  ExternalLink,
  X,
  Eye,
  Image as ImageIcon
} from 'lucide-react';
import { NewsPost, GalleryAlbum, NewsCategory, UserRole, PostCategory, SCHOOL_DEPARTMENTS } from '../types';
import { showSuccess } from '../utils/sweetalert';

interface NewsViewProps {
  initialTab?: string;
  newsList: NewsPost[];
  galleryList: GalleryAlbum[];
  categories?: PostCategory[];
  isQuickEditMode: boolean;
  userRole: UserRole;
  currentUserId?: string;
  onEditNews: (news?: NewsPost) => void;
  onDeleteNews: (news: NewsPost) => void;
  onEditAlbum: (album?: GalleryAlbum) => void;
  onDeleteAlbum: (album: GalleryAlbum) => void;
  selectedNewsDetail: NewsPost | null;
  setSelectedNewsDetail: (news: NewsPost | null) => void;
  selectedAlbumDetail: GalleryAlbum | null;
  setSelectedAlbumDetail: (album: GalleryAlbum | null) => void;
}

export const NewsView: React.FC<NewsViewProps> = ({
  initialTab,
  newsList,
  galleryList,
  categories = [],
  isQuickEditMode,
  userRole,
  currentUserId,
  onEditNews,
  onDeleteNews,
  onEditAlbum,
  onDeleteAlbum,
  selectedNewsDetail,
  setSelectedNewsDetail,
  selectedAlbumDetail,
  setSelectedAlbumDetail
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const getShareUrl = (news: NewsPost) => {
    const origin = window.location.origin;
    const path = window.location.pathname;
    return `${origin}${path}?tab=news&newsId=${news.id}`;
  };

  const handleShareFacebook = (news: NewsPost) => {
    const shareUrl = getShareUrl(news);
    const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(fbShareUrl, '_blank', 'width=620,height=580,noopener,noreferrer');
  };

  const handleCopyLink = async (news: NewsPost) => {
    const shareUrl = getShareUrl(news);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedId(news.id);
      showSuccess(
        'คัดลอกลิงก์สำเร็จ!',
        `คัดลอกลิงก์ข่าว "${news.title}" เรียบร้อยแล้ว สามารถนำไปวางบนเพจ Facebook เพื่อแชร์พร้อมพรีวิวได้ทันที`
      );
      setTimeout(() => setCopiedId(null), 3000);
    } catch (e) {
      console.error('Failed to copy link', e);
    }
  };

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const tabs = [
    { id: 'all', label: 'ทั้งหมด' },
    ...(categories.length > 0
      ? categories.map(c => ({ id: c.slug, label: c.name }))
      : [
          { id: 'news', label: 'ข่าวประชาสัมพันธ์' },
          { id: 'announcement', label: 'ประกาศทางการ' },
          { id: 'procurement', label: 'จัดซื้อจัดจ้าง' },
          { id: 'academic', label: 'วิชาการ/กิจกรรม' }
        ]
    ),
    { id: 'gallery', label: 'ภาพกิจกรรม (อัลบั้ม)' }
  ];

  const filteredNews = newsList.filter((item) => {
    if (!item.published && userRole !== 'admin' && userRole !== 'superadmin') return false;
    const matchesCategory = activeTab === 'all' || item.category === activeTab;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <Newspaper className="w-4 h-4" />
            <span>ศูนย์ข่าวสารและสื่อประชาสัมพันธ์</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">ข่าว ประกาศ และภาพกิจกรรม</h1>
          <p className="text-sm text-slate-500 mt-1">
            ติดตามข้อมูลข่าวสาร ความเคลื่อนไหว และผลงานของโรงเรียนบ้านนารี
          </p>
        </div>

        {/* Action Buttons for Authenticated Staff */}
        {(userRole === 'admin' || userRole === 'superadmin' || userRole === 'teacher' || userRole === 'editor') && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEditAlbum()}
              className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
              <span>เพิ่มอัลบั้มภาพ</span>
            </button>
            <button
              type="button"
              onClick={() => onEditNews()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>เขียนข่าว/ประกาศใหม่</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap gap-1 w-full md:w-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาหัวข้อข่าว..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Content Rendering: News List or Gallery */}
      {activeTab === 'gallery' ? (
        /* Photo Gallery Grid */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {galleryList.map((album) => (
            <div
              key={album.id}
              className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div
                  onClick={() => setSelectedAlbumDetail(album)}
                  className="relative aspect-4/3 w-full bg-slate-900 cursor-pointer overflow-hidden"
                >
                  <img
                    src={album.coverImage}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {(album.driveFolderUrl || album.driveFolderId) && (
                    <span className="absolute top-2.5 left-2.5 bg-white/95 text-blue-900 text-2xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-xs">
                      <HardDrive className="w-3 h-3 text-blue-600" />
                      <span>Google Drive</span>
                    </span>
                  )}
                  <span className="absolute bottom-3 right-3 bg-black/70 text-white text-2xs px-2.5 py-1 rounded-md backdrop-blur-xs">
                    {album.images.length} รูปภาพ
                  </span>

                  {((userRole === 'admin' || userRole === 'superadmin') || (isQuickEditMode && album.authorId === currentUserId)) && (
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onEditAlbum(album); }}
                        className="p-1.5 bg-white/90 text-slate-800 rounded-lg hover:bg-white"
                        title="แก้ไขอัลบั้มนี้"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDeleteAlbum(album); }}
                        className="p-1.5 bg-white/90 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white"
                        title="ลบอัลบั้มนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-2">
                  <span className="text-2xs text-amber-700 font-semibold block">
                    {album.activityDate}
                  </span>
                  <h3
                    onClick={() => setSelectedAlbumDetail(album)}
                    className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors cursor-pointer line-clamp-2"
                  >
                    {album.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {album.description}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0">
                <button
                  type="button"
                  onClick={() => setSelectedAlbumDetail(album)}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>ดูภาพทั้งหมด ({album.images.length})</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* News Posts Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((item) => (
            <div
              key={item.id}
              className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div
                  onClick={() => setSelectedNewsDetail(item)}
                  className="relative aspect-video w-full overflow-hidden bg-slate-100 cursor-pointer"
                >
                  <img
                    src={item.coverImage || 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=600'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className={`absolute top-3 left-3 text-2xs font-bold px-2.5 py-1 rounded-full shadow-xs ${
                    item.category === 'announcement'
                      ? 'bg-amber-500 text-white'
                      : item.category === 'procurement'
                      ? 'bg-purple-600 text-white'
                      : 'bg-blue-600 text-white'
                  }`}>
                    {categories.find(c => c.slug === item.category)?.name || (
                      item.category === 'announcement' ? 'ประกาศทางการ' :
                      item.category === 'procurement' ? 'จัดซื้อจัดจ้าง' :
                      item.category === 'academic' ? 'วิชาการ' : 'ข่าวประชาสัมพันธ์'
                    )}
                  </span>

                  {item.driveFileName && (
                    <span className="absolute top-3 right-3 bg-white/95 text-blue-700 text-2xs font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                      <HardDrive className="w-3 h-3" />
                      <span>Google Drive</span>
                    </span>
                  )}
                </div>

                <div className="p-5 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2 text-2xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(item.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </span>
                    <span>•</span>
                    <span>{item.authorName || 'ฝ่ายประชาสัมพันธ์'}</span>
                    {item.department && (
                      <>
                        <span>•</span>
                        <span className="text-3xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                          {SCHOOL_DEPARTMENTS.find(d => d.id === item.department)?.label || item.department}
                        </span>
                      </>
                    )}
                  </div>

                  <h3
                    onClick={() => setSelectedNewsDetail(item)}
                    className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug cursor-pointer"
                  >
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                    {item.summary || (item.content ? item.content.replace(/<[^>]+>/g, '') : '')}
                  </p>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedNewsDetail(item)}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>อ่านต่อ</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-1">
                  {/* Share to Facebook */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareFacebook(item);
                    }}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="แชร์ข่าวนี้ไปยัง Facebook"
                  >
                    <Share2 className="w-4 h-4 text-[#1877F2]" />
                  </button>

                  {/* Copy Share Link */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyLink(item);
                    }}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="คัดลอกลิงก์สำหรับโพสต์บนเพจ Facebook"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  {/* Edit/Delete if authorized */}
                  {((userRole === 'admin' || userRole === 'superadmin') || (isQuickEditMode && item.authorId === currentUserId)) && (
                    <>
                      <button
                        type="button"
                        onClick={() => onEditNews(item)}
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="แก้ไขข่าวนี้"
                      >
                        <Edit3 className="w-4 h-4 text-amber-600" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteNews(item)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="ลบข่าวนี้"
                      >
                        <Trash2 className="w-4 h-4 text-rose-600" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Single News Detail Modal / Reader */}
      {selectedNewsDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-2xs font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-md">
                    {categories.find(c => c.slug === selectedNewsDetail.category)?.name || selectedNewsDetail.category}
                  </span>
                  {selectedNewsDetail.department && (
                    <span className="text-2xs font-bold text-amber-900 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-md">
                      {SCHOOL_DEPARTMENTS.find(d => d.id === selectedNewsDetail.department)?.label || selectedNewsDetail.department}
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                  {selectedNewsDetail.title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                  <span>ผู้เผยแพร่: {selectedNewsDetail.authorName || 'ฝ่ายประชาสัมพันธ์ โรงเรียนบ้านนารี'}</span>
                  <span>•</span>
                  <span>{new Date(selectedNewsDetail.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedNewsDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-700">
              {selectedNewsDetail.coverImage && (
                <div className="rounded-2xl overflow-hidden max-h-80 w-full bg-slate-100 shadow-sm">
                  <img
                    src={selectedNewsDetail.coverImage}
                    alt={selectedNewsDetail.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div
                className="text-sm leading-relaxed text-slate-800 space-y-4 font-normal rich-content prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedNewsDetail.content }}
              />

              {/* Google Drive Document Attachment Box */}
              {selectedNewsDetail.driveFileName && (
                <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 bg-blue-600 text-white rounded-xl shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-blue-900 font-semibold truncate">
                        เอกสารแนบจาก Google Drive
                      </p>
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {selectedNewsDetail.driveFileName}
                      </p>
                    </div>
                  </div>

                  {selectedNewsDetail.driveFileUrl && (
                    <a
                      href={selectedNewsDetail.driveFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs"
                    >
                      <HardDrive className="w-3.5 h-3.5" />
                      <span>เปิดดาวน์โหลด</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleShareFacebook(selectedNewsDetail)}
                  className="px-3.5 py-2 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  title="เปิดหน้าต่างแชร์บน Facebook"
                >
                  <Share2 className="w-4 h-4" />
                  <span>แชร์ไปยัง Facebook</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyLink(selectedNewsDetail)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="คัดลอกลิงก์สำหรับโพสต์บน Facebook"
                >
                  {copiedId === selectedNewsDetail.id ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">คัดลอกลิงก์แล้ว!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-600" />
                      <span>คัดลอกลิงก์สำหรับโพสต์บน Facebook</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                {userRole === 'admin' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedNewsDetail;
                        setSelectedNewsDetail(null);
                        onEditNews(target);
                      }}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>แก้ไขข่าวนี้</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedNewsDetail;
                        setSelectedNewsDetail(null);
                        onDeleteNews(target);
                      }}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ลบข่าว</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedNewsDetail(null)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-medium transition-colors"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Album Detail Lightbox Modal */}
      {selectedAlbumDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-2xs text-amber-600 font-bold uppercase tracking-wider">
                  {selectedAlbumDetail.activityDate}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  {selectedAlbumDetail.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedAlbumDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                {selectedAlbumDetail.description}
              </p>

              {/* Google Drive Folder Banner if album is connected */}
              {(selectedAlbumDetail.driveFolderUrl || selectedAlbumDetail.driveFolderId) && (
                <div className="p-3.5 bg-blue-50/90 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-xs text-blue-900 font-semibold">
                    <HardDrive className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>อัลบั้มนี้เชื่อมต่อกับ Google Drive (เข้าถึงภาพกิจกรรมความละเอียดสูงทั้งหมด)</span>
                  </div>
                  <a
                    href={
                      selectedAlbumDetail.driveFolderUrl?.startsWith('http')
                        ? selectedAlbumDetail.driveFolderUrl
                        : `https://drive.google.com/drive/folders/${selectedAlbumDetail.driveFolderUrl || selectedAlbumDetail.driveFolderId}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs shrink-0"
                  >
                    <span>เปิดโฟลเดอร์ใน Drive</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {selectedAlbumDetail.images.map((img, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden aspect-4/3 bg-slate-100 border border-slate-200">
                    <img src={img} alt={`Album pic ${i}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 px-6 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              {userRole === 'admin' ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const target = selectedAlbumDetail;
                      setSelectedAlbumDetail(null);
                      onEditAlbum(target);
                    }}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>แก้ไขอัลบั้มนี้</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const target = selectedAlbumDetail;
                      setSelectedAlbumDetail(null);
                      onDeleteAlbum(target);
                    }}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบอัลบั้ม</span>
                  </button>
                </div>
              ) : <div></div>}

              <button
                type="button"
                onClick={() => setSelectedAlbumDetail(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-medium hover:bg-slate-900 transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-200 leading-snug">{toastMessage}</p>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
