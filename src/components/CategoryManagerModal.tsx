import React, { useState } from 'react';
import { X, Tag, Plus, Edit3, Trash2, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { PostCategory, NewsPost } from '../types';
import { showConfirm, showError } from '../utils/sweetalert';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: PostCategory[];
  newsList: NewsPost[];
  onSaveCategory: (category: PostCategory) => Promise<void>;
  onDeleteCategory: (categoryId: string) => Promise<void>;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  newsList,
  onSaveCategory,
  onDeleteCategory
}) => {
  const [editingCategory, setEditingCategory] = useState<PostCategory | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('blue');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const colorOptions = [
    { id: 'blue', label: 'น้ำเงิน', bg: 'bg-blue-100 text-blue-800 border-blue-300' },
    { id: 'amber', label: 'ทอง/ส้ม', bg: 'bg-amber-100 text-amber-900 border-amber-300' },
    { id: 'emerald', label: 'เขียว', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    { id: 'purple', label: 'ม่วง', bg: 'bg-purple-100 text-purple-800 border-purple-300' },
    { id: 'rose', label: 'แดง/ชมพู', bg: 'bg-rose-100 text-rose-800 border-rose-300' },
    { id: 'indigo', label: 'คราม', bg: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
    { id: 'slate', label: 'เทาเข้ม', bg: 'bg-slate-100 text-slate-800 border-slate-300' },
  ];

  const handleStartEdit = (cat: PostCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setColor(cat.color || 'blue');
    setErrorMessage(null);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setColor('blue');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const generatedSlug = slug.trim() 
      ? slug.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '-') 
      : name.trim().toLowerCase().replace(/\s+/g, '-');

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const catToSave: PostCategory = {
        id: editingCategory ? editingCategory.id : `cat-${Date.now()}`,
        name: name.trim(),
        slug: generatedSlug,
        description: description.trim(),
        color: color,
        order: editingCategory ? (editingCategory.order || 99) : categories.length + 1
      };

      await onSaveCategory(catToSave);
      handleCancelEdit();
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการบันทึกหมวดหมู่');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (cat: PostCategory) => {
    const confirmed = await showConfirm(
      'ยืนยันการลบหมวดหมู่',
      `คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่ "${cat.name}" ออกจากระบบ?`,
      'ลบหมวดหมู่',
      'ยกเลิก',
      true
    );
    if (confirmed) {
      try {
        await onDeleteCategory(cat.id);
      } catch (err: any) {
        showError('ไม่สามารถลบหมวดหมู่ได้', err.message || 'เกิดข้อผิดพลาดในการลบหมวดหมู่');
      }
    }
  };

  // Calculate post count per category
  const getPostCount = (categorySlug: string) => {
    return newsList.filter(n => n.category === categorySlug).length;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[88vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* WordPress Style Header */}
        <div className="px-6 py-4 bg-[#1d2327] text-white flex items-center justify-between border-b border-[#3c434a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-none">
                หมวดหมู่ข่าวสารและเรื่อง (Categories)
              </h3>
              <p className="text-2xs text-slate-400 mt-1">
                ระบบจัดการหมวดหมู่เนื้อหาและจัดกลุ่มข่าวสารสไตล์ BNR
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column WordPress Layout (Add Form on Left, Table on Right) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column (Col 5): Add / Edit Category Form */}
          <div className="md:col-span-5 space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h4 className="text-sm font-bold text-slate-900">
                {editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
              </h4>
              <p className="text-2xs text-slate-500">
                หมวดหมู่ช่วยจัดระเบียบข่าวสาร ประกาศ และเอกสารของโรงเรียน
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ชื่อหมวดหมู่ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingCategory && !slug) {
                      setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                    }
                  }}
                  placeholder="เช่น กิจกรรมนักเรียน, จดหมายข่าว"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-medium text-xs"
                  required
                />
                <p className="text-2xs text-slate-400 mt-1">ชื่อที่จะปรากฏบนหน้าเว็บไซต์</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  สลัก (Slug)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="เช่น student-activity"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-mono text-2xs"
                />
                <p className="text-2xs text-slate-400 mt-1">คำภาษาอังกฤษสำหรับอ้างอิงหมวดหมู่</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  สีป้ายกำกับ (Badge Color)
                </label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setColor(opt.id)}
                      className={`px-2.5 py-1 rounded-lg border text-2xs font-bold transition-all cursor-pointer ${opt.bg} ${
                        color === opt.id ? 'ring-2 ring-slate-900 shadow-xs' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  คำอธิบาย
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="คำอธิบายสั้นๆ เกี่ยวกับประเภทข่าวสารในหมวดนี้..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSaving || !name.trim()}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  {isSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>{editingCategory ? 'อัปเดตหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}</span>
                </button>

                {editingCategory && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-3 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Right Column (Col 7): Categories Table */}
          <div className="md:col-span-7 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-800">
                รายการหมวดหมู่ทั้งหมด ({categories.length})
              </span>
              <span className="text-2xs text-slate-500">
                คลิกแก้ไขหรือลบหมวดหมู่
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#f0f0f1] text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 font-bold">ชื่อหมวดหมู่</th>
                    <th className="py-2.5 px-3 font-bold">สลัก (Slug)</th>
                    <th className="py-2.5 px-3 font-bold text-center">จำนวนข่าว</th>
                    <th className="py-2.5 px-3 font-bold text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {categories.map((cat) => {
                    const count = getPostCount(cat.slug);
                    const colorStyle = colorOptions.find(c => c.id === cat.color) || colorOptions[0];

                    return (
                      <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-2xs font-bold border ${colorStyle.bg}`}>
                              {cat.name}
                            </span>
                          </div>
                          {cat.description && (
                            <p className="text-2xs text-slate-500 mt-1 line-clamp-1">{cat.description}</p>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-2xs text-slate-500">
                          {cat.slug}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-2xs">
                            {count}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(cat)}
                              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                              title="แก้ไขหมวดหมู่นี้"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(cat)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="ลบหมวดหมู่นี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
