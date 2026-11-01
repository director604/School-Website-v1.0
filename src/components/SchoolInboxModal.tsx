import React, { useState, useEffect } from 'react';
import { 
  Inbox, 
  Mail, 
  Phone, 
  Clock, 
  User, 
  Search, 
  CheckCircle2, 
  Trash2, 
  X, 
  ExternalLink, 
  FileText, 
  Save, 
  Filter, 
  MessageSquare, 
  Archive, 
  AlertCircle, 
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Send,
  RefreshCw
} from 'lucide-react';
import { InboxMessage, InboxMessageStatus, SystemRolesConfig } from '../types';
import { 
  listenInboxMessages, 
  updateInboxMessageStatus, 
  updateInboxDirectorNotes, 
  deleteInboxMessage,
  checkIsSuperAdmin 
} from '../services/inboxService';
import { showSuccess, showError, showConfirm } from '../utils/sweetalert';

interface SchoolInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string | null;
  rolesConfig?: SystemRolesConfig | null;
}

export const SchoolInboxModal: React.FC<SchoolInboxModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  rolesConfig
}) => {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
  const [filterStatus, setFilterStatus] = useState<InboxMessageStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [directorNotesInput, setDirectorNotesInput] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isSuper = checkIsSuperAdmin(currentUserEmail, rolesConfig);

  useEffect(() => {
    if (!isOpen || !isSuper) return;

    setIsLoading(true);
    const unsubscribe = listenInboxMessages(
      (msgs) => {
        setMessages(msgs);
        setIsLoading(false);
        // If a message was selected, update its reference with latest data
        if (selectedMessage) {
          const updated = msgs.find(m => m.id === selectedMessage.id);
          if (updated) {
            setSelectedMessage(updated);
            setDirectorNotesInput(updated.directorNotes || '');
          }
        } else if (msgs.length > 0 && !selectedMessage) {
          // Select the first message by default on desktop
          setSelectedMessage(msgs[0]);
          setDirectorNotesInput(msgs[0].directorNotes || '');
        }
      },
      (err) => {
        console.error('Inbox listen error:', err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isOpen, isSuper]);

  // When selectedMessage changes, sync director notes input
  useEffect(() => {
    if (selectedMessage) {
      setDirectorNotesInput(selectedMessage.directorNotes || '');
    }
  }, [selectedMessage?.id]);

  if (!isOpen) return null;

  // Security check: if not Super Admin, show access denied
  if (!isSuper) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-rose-200 space-y-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900">จำกัดสิทธิ์เฉพาะผู้อำนวยการโรงเรียน</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            สงวนสิทธิ์การเข้าถึงสำหรับ <strong>Super Admin (ผู้อำนวยการโรงเรียน)</strong> เท่านั้น
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            ปิดหน้าต่างนี้
          </button>
        </div>
      </div>
    );
  }

  // Filter messages
  const filteredMessages = messages.filter((m) => {
    const matchesFilter = filterStatus === 'all' || m.status === filterStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      m.senderName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.phone.includes(q) ||
      m.subject.toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  const unreadCount = messages.filter(m => m.status === 'new').length;

  const handleStatusChange = async (msgId: string, newStatus: InboxMessageStatus) => {
    try {
      await updateInboxMessageStatus(msgId, newStatus);
      showSuccess('อัปเดตสถานะสำเร็จ', `เปลี่ยนสถานะเป็น "${getStatusLabel(newStatus)}" เรียบร้อยแล้ว`);
    } catch (err: any) {
      showError('ไม่สามารถอัปเดตสถานะได้', err?.message || err);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedMessage) return;
    setIsSavingNotes(true);
    try {
      await updateInboxDirectorNotes(selectedMessage.id, directorNotesInput);
      showSuccess('บันทึกสำเร็จ', 'บันทึกช่วยจำของผู้อำนวยการถูกจัดเก็บเรียบร้อยแล้ว');
    } catch (err: any) {
      showError('ไม่สามารถบันทึกได้', err?.message || err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDelete = async (msg: InboxMessage) => {
    const confirmed = await showConfirm(
      'ลบข้อความนี้ถาวร?',
      `ต้องการลบข้อความจาก "${msg.senderName}" หรือไม่ การกระทำนี้ไม่สามารถย้อนกลับได้`,
      'ลบข้อความ',
      '#EF4444'
    );

    if (confirmed) {
      try {
        await deleteInboxMessage(msg.id);
        if (selectedMessage?.id === msg.id) {
          const remaining = messages.filter(m => m.id !== msg.id);
          setSelectedMessage(remaining[0] || null);
        }
        showSuccess('ลบข้อความเรียบร้อย', 'ลบข้อความออกจากระบบแล้ว');
      } catch (err: any) {
        showError('ไม่สามารถลบข้อความได้', err?.message || err);
      }
    }
  };

  function getStatusLabel(status: InboxMessageStatus): string {
    switch (status) {
      case 'new': return 'ข้อความใหม่';
      case 'in_progress': return 'กำลังดำเนินการ';
      case 'replied': return 'ตอบกลับแล้ว';
      case 'archived': return 'จัดเก็บแล้ว';
      default: return status;
    }
  }

  function getStatusBadgeClass(status: InboxMessageStatus): string {
    switch (status) {
      case 'new': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'in_progress': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'replied': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'archived': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-6xl w-full h-[90vh] max-h-[850px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0F224A] via-[#1E3A8A] to-[#1E40AF] text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-sm">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg leading-tight">
                  กล่องข้อความโรงเรียนบ้านนารี (Director Inbox)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-2xs font-extrabold bg-amber-400 text-slate-950">
                  Super Admin
                </span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-rose-500 text-white animate-pulse">
                    {unreadCount} ข้อความใหม่
                  </span>
                )}
              </div>
              <p className="text-2xs text-blue-200">
                ระบบรับเรื่องติดต่อจากหน้าเว็บไซต์โรงเรียน • สิทธิ์เปิดอ่านเฉพาะผู้อำนวยการโรงเรียน (PDPA Protected)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Action Toolbar: Filter tabs & Search */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
              }`}
            >
              ทั้งหมด ({messages.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('new')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                filterStatus === 'new'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
              }`}
            >
              <span>ข้อความใหม่</span>
              {unreadCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-2xs font-extrabold ${filterStatus === 'new' ? 'bg-white text-rose-700' : 'bg-rose-500 text-white'}`}>
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('in_progress')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'in_progress'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
              }`}
            >
              กำลังดำเนินการ ({messages.filter(m => m.status === 'in_progress').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('replied')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'replied'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
              }`}
            >
              ตอบแล้ว ({messages.filter(m => m.status === 'replied').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('archived')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'archived'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
              }`}
            >
              จัดเก็บแล้ว ({messages.filter(m => m.status === 'archived').length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อ, เบอร์, อีเมล, หัวข้อ..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Modal Main Content: Split Master-Detail */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200 overflow-hidden">
          
          {/* Left Pane: Message List (5 cols) */}
          <div className="md:col-span-5 h-full overflow-y-auto divide-y divide-slate-100 bg-slate-50/60">
            {isLoading ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                <p className="text-xs">กำลังโหลดข้อความ...</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-3">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <Inbox className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-600">ไม่มีข้อความในหมวดนี้</p>
                <p className="text-2xs text-slate-400 max-w-xs mx-auto">
                  เมื่อมีผู้ปกครองหรือบุคคลภายนอกส่งข้อความผ่านแบบฟอร์มหน้าเว็บ ข้อความจะปรากฏที่นี่ทันที
                </p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                const isNew = msg.status === 'new';

                return (
                  <div
                    key={msg.id}
                    onClick={() => {
                      setSelectedMessage(msg);
                      // If message is new, we can keep status or let director change it
                    }}
                    className={`p-4 transition-all cursor-pointer border-l-4 relative ${
                      isSelected
                        ? 'bg-blue-50/90 border-l-blue-600 shadow-2xs'
                        : isNew
                        ? 'bg-white hover:bg-slate-100/80 border-l-rose-500'
                        : 'bg-white hover:bg-slate-50 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isNew && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-ping" />
                        )}
                        <h4 className={`text-xs truncate ${isNew ? 'font-extrabold text-slate-900' : 'font-bold text-slate-700'}`}>
                          {msg.senderName}
                        </h4>
                      </div>
                      <span className={`text-2xs px-2 py-0.5 rounded-full font-bold border shrink-0 ${getStatusBadgeClass(msg.status)}`}>
                        {getStatusLabel(msg.status)}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-800 line-clamp-1 mb-1">
                      {msg.subject}
                    </p>

                    <p className="text-2xs text-slate-500 line-clamp-2 leading-relaxed mb-2">
                      {msg.message}
                    </p>

                    <div className="flex items-center justify-between text-2xs text-slate-400 pt-1 border-t border-slate-100/80">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(msg.createdAt).toLocaleDateString('th-TH', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: '2-digit', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}</span>
                      </div>
                      {msg.phone && (
                        <span className="font-mono text-slate-500">{msg.phone}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Pane: Message Detail & Action (7 cols) */}
          <div className="md:col-span-7 h-full overflow-y-auto p-6 bg-white flex flex-col justify-between space-y-6">
            {selectedMessage ? (
              <div className="space-y-6">
                {/* Header of Detail */}
                <div className="border-b border-slate-200 pb-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-extrabold border ${getStatusBadgeClass(selectedMessage.status)}`}>
                      สถานะ: {getStatusLabel(selectedMessage.status)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>ส่งเมื่อ: {new Date(selectedMessage.createdAt).toLocaleString('th-TH', { 
                          dateStyle: 'medium', 
                          timeStyle: 'short' 
                        })} น.</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(selectedMessage)}
                        title="ลบข้อความนี้"
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                      {selectedMessage.subject}
                    </h3>
                  </div>

                  {/* Sender Contact Card */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-2xs font-bold text-slate-400 block mb-0.5">ผู้ส่งข้อความ:</span>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <User className="w-3.5 h-3.5 text-blue-700" />
                        <span>{selectedMessage.senderName}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-2xs font-bold text-slate-400 block mb-0.5">อีเมลติดต่อ:</span>
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <a 
                          href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent('ตอบกลับ: ' + selectedMessage.subject)}`} 
                          className="font-medium text-blue-700 hover:underline break-all"
                        >
                          {selectedMessage.email}
                        </a>
                      </div>
                    </div>

                    {selectedMessage.phone && (
                      <div className="sm:col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="font-bold text-slate-800">{selectedMessage.phone}</span>
                        </div>
                        <a
                          href={`tel:${selectedMessage.phone.replace(/[^0-9]/g, '')}`}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-2xs flex items-center gap-1 transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                          <span>กดโทรออก</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Message Body Content */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-blue-700" />
                    <span>เนื้อหาข้อความ:</span>
                  </span>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                    {selectedMessage.message}
                  </div>
                </div>

                {/* Quick Status Control */}
                <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-2xl space-y-2">
                  <span className="text-2xs font-bold text-blue-900 block">
                    ปรับปรุงสถานะการดำเนินการ (Director Workflow):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(selectedMessage.id, 'new')}
                      className={`px-3 py-1.5 rounded-xl text-2xs font-bold transition-all cursor-pointer ${
                        selectedMessage.status === 'new'
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      ข้อความใหม่
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(selectedMessage.id, 'in_progress')}
                      className={`px-3 py-1.5 rounded-xl text-2xs font-bold transition-all cursor-pointer ${
                        selectedMessage.status === 'in_progress'
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      กำลังดำเนินการ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(selectedMessage.id, 'replied')}
                      className={`px-3 py-1.5 rounded-xl text-2xs font-bold transition-all cursor-pointer ${
                        selectedMessage.status === 'replied'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      ตอบกลับเรียบร้อย
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(selectedMessage.id, 'archived')}
                      className={`px-3 py-1.5 rounded-xl text-2xs font-bold transition-all cursor-pointer ${
                        selectedMessage.status === 'archived'
                          ? 'bg-slate-700 text-white shadow-2xs'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      จัดเก็บเข้าคลัง
                    </button>
                  </div>
                </div>

                {/* Director's Internal Notes (บันทึกช่วยจำผู้อำนวยการ) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-amber-600" />
                      <span>บันทึกช่วยจำของผู้อำนวยการ (Director Notes - ส่วนบุคคล):</span>
                    </label>
                    <span className="text-2xs text-slate-400">บันทึกนี้เห็นเฉพาะผู้อำนวยการ</span>
                  </div>
                  <textarea
                    rows={3}
                    value={directorNotesInput}
                    onChange={(e) => setDirectorNotesInput(e.target.value)}
                    placeholder="เช่น สั่งการให้กลุ่มงานวิชาการตรวจสอบเอกสารแล้ว, นัดหมายผู้ปกครองเข้าพบวันศุกร์..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden bg-amber-50/30"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={isSavingNotes}
                      onClick={handleSaveNotes}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-2xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      {isSavingNotes ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>บันทึกความเห็น</span>
                    </button>
                  </div>
                </div>

                {/* Quick Direct Reply Button */}
                <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-2xs text-slate-500">
                    คลิกเพื่อเปิดโปรแกรมอีเมล (เช่น Gmail หรือ Outlook) เพื่อตอบกลับผู้ส่งโดยตรง
                  </div>
                  <a
                    href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent('ตอบกลับ: ' + selectedMessage.subject)}&body=${encodeURIComponent('\n\n--- ข้อความเดิมจาก ' + selectedMessage.senderName + ' ---\n' + selectedMessage.message)}`}
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5 text-amber-300" />
                    <span>ตอบกลับอีเมล ({selectedMessage.email})</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
                <Inbox className="w-12 h-12 text-slate-300" />
                <h4 className="text-sm font-bold text-slate-600">กรุณาเลือกข้อความจากรายการทางซ้าย</h4>
                <p className="text-xs text-slate-400">
                  เลือกรายการเพื่อดูรายละเอียดข้อความและดำเนินการตอบกลับ
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Note */}
        <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-2xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>ความปลอดภัยระดับสูง: ข้อความใน Inbox นี้จะถูกเข้ารหัสและปกป้องตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
