import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  GraduationCap, 
  Edit3, 
  Trash2,
  Briefcase
} from 'lucide-react';
import { StaffMember, StaffRoleCategory, UserRole } from '../types';

interface StaffViewProps {
  staffList: StaffMember[];
  isQuickEditMode: boolean;
  userRole: UserRole;
  onEditStaff: (staff?: StaffMember) => void;
  onDeleteStaff: (staff: StaffMember) => void;
}

export const StaffView: React.FC<StaffViewProps> = ({
  staffList,
  isQuickEditMode,
  userRole,
  onEditStaff,
  onDeleteStaff
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'บุคลากรทั้งหมด' },
    { id: 'executive', label: 'ผู้บริหารสถานศึกษา' },
    { id: 'teacher', label: 'ครูผู้สอน' },
    { id: 'support', label: 'บุคลากรสนับสนุน' }
  ];

  const departments = [
    'all',
    'ฝ่ายบริหารสถานศึกษา',
    'กลุ่มสาระการเรียนรู้ภาษาไทย',
    'กลุ่มสาระการเรียนรู้คณิตศาสตร์',
    'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี',
    'กลุ่มสาระการเรียนรู้สังคมศึกษา ศาสนาและวัฒนธรรม',
    'กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ',
    'ฝ่ายสนับสนุนการศึกษาและธุรการ'
  ];

  const filteredStaff = staffList.filter((staff) => {
    const matchesSearch = 
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.department.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || staff.roleCategory === selectedCategory;
    const matchesDepartment = selectedDepartment === 'all' || staff.department === selectedDepartment;

    return matchesSearch && matchesCategory && matchesDepartment;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>บุคลากรทางการศึกษา</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">ครูและบุคลากรโรงเรียนบ้านนารี</h1>
          <p className="text-sm text-slate-500 mt-1">
            ทำเนียบผู้บริหาร คณะครู และเจ้าหน้าที่ผู้ร่วมขับเคลื่อนการศึกษา
          </p>
        </div>

        {(userRole === 'admin' || userRole === 'superadmin') && (
          <button
            type="button"
            onClick={() => onEditStaff()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มครู/บุคลากร</span>
          </button>
        )}
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Department Selector */}
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">ทุกกลุ่มสาระการเรียนรู้</option>
            {departments.filter(d => d !== 'all').map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อหรือตำแหน่ง..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </div>

      {/* Staff Directory Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredStaff.map((staff) => (
          <div
            key={staff.id}
            className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              {/* Photo */}
              <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
                <img
                  src={staff.imageUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400'}
                  alt={staff.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className={`absolute top-2.5 left-2.5 text-2xs font-bold px-2 py-0.5 rounded-md shadow-xs ${
                  staff.roleCategory === 'executive'
                    ? 'bg-amber-500 text-white'
                    : staff.roleCategory === 'teacher'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-white'
                }`}>
                  {staff.roleCategory === 'executive' ? 'ผู้บริหาร' :
                   staff.roleCategory === 'teacher' ? 'ครูผู้สอน' : 'บุคลากรสนับสนุน'}
                </span>

                {(userRole === 'admin' || userRole === 'superadmin') && (
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditStaff(staff)}
                      className="p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-lg shadow-sm"
                      title="แก้ไขข้อมูลครู"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteStaff(staff)}
                      className="p-1.5 bg-white/90 hover:bg-rose-600 hover:text-white text-rose-600 rounded-lg shadow-sm"
                      title="ลบข้อมูลครู"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Bio Details */}
              <div className="p-4 space-y-2">
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  {staff.prefix}{staff.name}
                </h3>
                <p className="text-xs font-semibold text-blue-900">
                  {staff.position}
                </p>
                {staff.academicRank && (
                  <p className="text-2xs font-medium text-slate-500">
                    {staff.academicRank}
                  </p>
                )}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-2xs text-slate-600">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{staff.department}</span>
                </div>
                {staff.education && (
                  <div className="flex items-center gap-1.5 text-2xs text-slate-500">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{staff.education}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-500">
              {staff.email ? (
                <div className="flex items-center gap-1 truncate max-w-[140px]" title={staff.email}>
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{staff.email}</span>
                </div>
              ) : (
                <span>ติดต่อโรงเรียน</span>
              )}
              {staff.phone && (
                <div className="flex items-center gap-1" title={staff.phone}>
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{staff.phone}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div className="py-16 text-center text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">ไม่พบบุคลากรที่ค้นหา</p>
          <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหาหรือเลือกกลุ่มสาระอื่น</p>
        </div>
      )}
    </div>
  );
};
