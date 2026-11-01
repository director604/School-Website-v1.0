import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Plus, 
  Award, 
  Briefcase, 
  Phone, 
  Edit3, 
  Trash2,
  Info
} from 'lucide-react';
import { BoardMember, BoardType, UserRole } from '../types';

interface BoardViewProps {
  boardMembers: BoardMember[];
  isQuickEditMode: boolean;
  userRole: UserRole;
  onEditBoardMember: (member?: BoardMember, defaultType?: BoardType) => void;
  onDeleteBoardMember: (member: BoardMember) => void;
}

export const BoardView: React.FC<BoardViewProps> = ({
  boardMembers,
  isQuickEditMode,
  userRole,
  onEditBoardMember,
  onDeleteBoardMember
}) => {
  const [activeTab, setActiveTab] = useState<BoardType>('basic_education');

  const filteredMembers = boardMembers.filter(m => m.boardType === activeTab);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>ภาคีเครือข่ายและการมีส่วนร่วม</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">คณะกรรมการสถานศึกษา</h1>
          <p className="text-sm text-slate-500 mt-1">
            คณะกรรมการสถานศึกษาขั้นพื้นฐาน และ คณะกรรมการเครือข่ายผู้ปกครอง
          </p>
        </div>

        {(userRole === 'admin' || userRole === 'superadmin') && (
          <button
            type="button"
            onClick={() => onEditBoardMember(undefined, activeTab)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มกรรมการใหม่</span>
          </button>
        )}
      </div>

      {/* Switch Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('basic_education')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'basic_education'
              ? 'border-blue-600 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4 text-blue-600" />
          <span>คณะกรรมการสถานศึกษาขั้นพื้นฐาน</span>
        </button>
        <button
          onClick={() => setActiveTab('parents_network')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'parents_network'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4 text-amber-600" />
          <span>คณะกรรมการเครือข่ายผู้ปกครอง</span>
        </button>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3 text-xs text-blue-950">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          {activeTab === 'basic_education' ? (
            <p>
              <strong>บทบาทหน้าที่:</strong> คณะกรรมการสถานศึกษาขั้นพื้นฐาน ปฏิบัติหน้าที่กำกับ ส่งเสริม สนับสนุน และให้คำปรึกษาแก่สถานศึกษาตามพระราชบัญญัติการศึกษาแห่งชาติ ประกอบด้วยผู้แทนผู้ปกครอง ผู้แทนครู ผู้แทนองค์กรชุมชน ผู้แทนองค์กรปกครองส่วนท้องถิ่น ผู้แทนศิษย์เก่า ผู้แทนพระภิกษุสงฆ์ และผู้ทรงคุณวุฒิ
            </p>
          ) : (
            <p>
              <strong>บทบาทหน้าที่:</strong> คณะกรรมการเครือข่ายผู้ปกครอง มีบทบาทสำคัญในการเชื่อมประสานความร่วมมือระหว่างบ้านและโรงเรียน ร่วมดูแลความประพฤติและสนับสนุนกิจกรรมพัฒนาผู้เรียนของบุตรหลานในทุกระดับชั้น
            </p>
          )}
        </div>
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMembers.map((member) => (
          <div
            key={member.id}
            className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              {/* Photo */}
              <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
                <img
                  src={member.imageUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400'}
                  alt={member.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className={`absolute top-2.5 left-2.5 text-2xs font-bold px-2 py-0.5 rounded-md shadow-xs ${
                  member.roleInBoard.includes('ประธาน')
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-blue-900 text-white'
                }`}>
                  {member.roleInBoard}
                </span>

                {(userRole === 'admin' || userRole === 'superadmin') && (
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditBoardMember(member)}
                      className="p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-lg shadow-sm"
                      title="แก้ไขข้อมูลกรรมการ"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteBoardMember(member)}
                      className="p-1.5 bg-white/90 hover:bg-rose-600 hover:text-white text-rose-600 rounded-lg shadow-sm"
                      title="ลบข้อมูลกรรมการ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="p-4 space-y-2">
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  {member.name}
                </h3>
                <p className="text-xs font-semibold text-blue-800">
                  {member.roleInBoard}
                </p>
                {member.representation && (
                  <div className="flex items-center gap-1.5 text-2xs text-slate-600 pt-1">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{member.representation}</span>
                  </div>
                )}
                {member.occupation && (
                  <div className="flex items-center gap-1.5 text-2xs text-slate-500">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{member.occupation}</span>
                  </div>
                )}
              </div>
            </div>

            {member.phone && (
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5 text-2xs text-slate-600">
                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{member.phone}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
