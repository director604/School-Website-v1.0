import React, { useState } from 'react';
import { 
  Play, 
  Video, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  ExternalLink, 
  Film, 
  FolderOpen,
  Calendar,
  Eye,
  Sparkles,
  Share2,
  HardDrive
} from 'lucide-react';
import { VideoItem, UserRole, DriveSettings } from '../types';
import { extractFolderId, extractDriveFileId, getCurrentAcademicYearBE } from '../services/driveService';

interface VideoGalleryViewProps {
  videoList: VideoItem[];
  isQuickEditMode?: boolean;
  userRole?: UserRole;
  currentUserId?: string;
  onEditVideo?: (video?: VideoItem) => void;
  onDeleteVideo?: (video: VideoItem) => void;
  driveSettings?: DriveSettings;
}

export const VideoGalleryView: React.FC<VideoGalleryViewProps> = ({
  videoList,
  isQuickEditMode = false,
  userRole = 'guest',
  currentUserId,
  onEditVideo,
  onDeleteVideo,
  driveSettings
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [playingVideo, setPlayingVideo] = useState<VideoItem | null>(null);

  const canEdit = userRole === 'admin' || userRole === 'superadmin' || userRole === 'editor' || userRole === 'teacher';

  // Categories list
  const categories = ['all', 'กิจกรรมโรงเรียน', 'ผลงานนักเรียน', 'วิชาการและเทคโนโลยี', 'วิดีโอประชาสัมพันธ์'];

  // Filter video list
  const filteredVideos = videoList.filter(v => {
    if (!v.published && !canEdit) return false;
    const matchCategory = selectedCategory === 'all' || v.category === selectedCategory;
    const matchSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       (v.description && v.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  // Extract YouTube Embed URL
  const getEmbedUrl = (url: string): { type: 'youtube' | 'drive' | 'html5'; embedUrl: string } => {
    if (!url) return { type: 'html5', embedUrl: '' };

    // YouTube regex
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`
      };
    }

    // Google Drive video
    if (url.includes('drive.google.com')) {
      const fileId = extractDriveFileId(url);
      return {
        type: 'drive',
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`
      };
    }

    return { type: 'html5', embedUrl: url };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-600/20 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-2xs font-bold uppercase tracking-wider">
              <Film className="w-3.5 h-3.5 text-amber-400" />
              <span>คลังวิดีโอกิจกรรมโรงเรียนบ้านนารี</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              ประมวลภาพเคลื่อนไหวและวิดีโอกิจกรรม
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              รวบรวมคลิปบันทึกภาพกิจกรรม การจัดการเรียนรู้ วิดีโอแนะนำโรงเรียน และวิดีโอประชาสัมพันธ์ผลงานนักเรียนประจำปีการศึกษา พ.ศ. {getCurrentAcademicYearBE()}
            </p>
          </div>

          {canEdit && onEditVideo && (
            <button
              type="button"
              onClick={() => onEditVideo()}
              className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer shrink-0 self-start md:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ เพิ่มวิดีโอกิจกรรมใหม่</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'ทั้งหมด' : cat}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาวิดีโอ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Videos Grid */}
      {filteredVideos.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl p-8 space-y-4 shadow-2xs">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto text-blue-600">
            <Film className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">ยังไม่มีรายการวิดีโอในคลัง</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              ท่านสามารถเพิ่มวิดีโอกิจกรรมใหม่ โดยระบุลิงก์ YouTube หรือลิงก์วิดีโอใน Google Drive
            </p>
          </div>
          {canEdit && onEditVideo && (
            <button
              type="button"
              onClick={() => onEditVideo()}
              className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มวิดีโอใหม่ทันที</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredVideos.map((video) => {
            const driveId = video.driveFileId || (video.videoUrl.includes('drive.google.com') ? extractDriveFileId(video.videoUrl) : undefined);
            const thumbnail = video.thumbnailUrl || 
              (video.youtubeId ? `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg` :
               driveId ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w800` :
               '/src/assets/images/school_stem_learning_1792082310522.jpg');

            return (
              <div
                key={video.id}
                className="group bg-white rounded-3xl border border-slate-200 hover:border-blue-500 hover:ring-2 hover:ring-blue-500/20 shadow-2xs hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Thumbnail & Play Overlay */}
                <div
                  onClick={() => setPlayingVideo(video)}
                  className="relative aspect-16/9 bg-slate-900 overflow-hidden cursor-pointer"
                >
                  <img
                    src={thumbnail}
                    alt={video.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 fill-current ml-0.5" />
                    </div>
                  </div>

                  {video.duration && (
                    <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-slate-950/80 backdrop-blur-xs text-white text-3xs font-extrabold rounded-md">
                      {video.duration}
                    </span>
                  )}

                  {!video.published && (
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-amber-500 text-slate-950 text-3xs font-extrabold rounded-md shadow-xs">
                      ร่าง (ยังไม่เผยแพร่)
                    </span>
                  )}
                </div>

                {/* Content Details */}
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-3xs font-bold text-blue-700">
                      <span className="px-2 py-0.5 bg-blue-50 rounded-md">
                        {video.category || 'กิจกรรมโรงเรียน'}
                      </span>
                      {video.createdAt && (
                        <span className="text-slate-400 flex items-center gap-1 font-normal">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(video.createdAt).toLocaleDateString('th-TH')}</span>
                        </span>
                      )}
                    </div>
                    <h3
                      onClick={() => setPlayingVideo(video)}
                      className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug hover:text-blue-700 transition-colors cursor-pointer"
                    >
                      {video.title}
                    </h3>
                    {video.description && (
                      <p className="text-2xs text-slate-500 line-clamp-2 leading-relaxed">
                        {video.description}
                      </p>
                    )}
                  </div>

                  {/* Actions Bar for Admin / Editor */}
                  {canEdit && (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-2xs">
                      <button
                        type="button"
                        onClick={() => setPlayingVideo(video)}
                        className="font-bold text-blue-900 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>เล่นวิดีโอ</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {onEditVideo && (
                          <button
                            type="button"
                            onClick={() => onEditVideo(video)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="แก้ไขวิดีโอ"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteVideo && (
                          <button
                            type="button"
                            onClick={() => onDeleteVideo(video)}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="ลบวิดีโอ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIDEO PLAYER MODAL LIGHTBOX */}
      {playingVideo && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 text-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0">
                  <Film className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base leading-snug truncate">
                    {playingVideo.title}
                  </h3>
                  <p className="text-3xs text-slate-400 mt-0.5">
                    {playingVideo.category || 'คลังวิดีโอกิจกรรม'} • โรงเรียนบ้านนารี
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPlayingVideo(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player Frame */}
            <div className="relative aspect-16/9 bg-black w-full overflow-hidden">
              {(() => {
                const { type, embedUrl } = getEmbedUrl(playingVideo.videoUrl);

                if (type === 'youtube' || type === 'drive') {
                  return (
                    <iframe
                      src={embedUrl}
                      title={playingVideo.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  );
                }

                return (
                  <video
                    src={embedUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  >
                    เบราว์เซอร์ของคุณไม่รองรับการเล่นวิดีโอ
                  </video>
                );
              })()}
            </div>

            {/* Modal Details Footer */}
            {playingVideo.description && (
              <div className="p-5 bg-slate-900 border-t border-slate-800 space-y-2">
                <h4 className="text-2xs font-bold text-amber-400 uppercase tracking-wider">
                  รายละเอียดวิดีโอกิจกรรม
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed max-h-24 overflow-y-auto">
                  {playingVideo.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
