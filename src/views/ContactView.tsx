import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send, 
  CheckCircle2, 
  ExternalLink, 
  Building2, 
  Facebook, 
  MessageSquare, 
  Sparkles, 
  Navigation,
  Settings,
  X,
  Save,
  RefreshCw,
  Info,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { SchoolInfo, UserRole } from '../types';
import { cleanMapEmbedUrl } from '../utils/mapUtils';
import { showSuccess, showError, showWarning } from '../utils/sweetalert';
import { sendInboxMessage } from '../services/inboxService';

interface ContactViewProps {
  schoolInfo: SchoolInfo;
  userRole: UserRole;
  onEditSchoolInfo?: () => void;
  onSaveSchoolInfo?: (updatedInfo: SchoolInfo) => Promise<void>;
}

export const ContactView: React.FC<ContactViewProps> = ({
  schoolInfo,
  userRole,
  onEditSchoolInfo,
  onSaveSchoolInfo
}) => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    senderName: '',
    phone: '',
    email: '',
    subject: 'ติดต่อสอบถามทั่วไป',
    message: ''
  });

  // Anti-spam Captcha & Honeypot states
  const [captchaQ, setCaptchaQ] = useState({ num1: 3, num2: 5, answer: 8 });
  const [captchaInput, setCaptchaInput] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Hidden trap for automated bots

  const generateNewCaptcha = () => {
    const n1 = Math.floor(Math.random() * 8) + 1; // 1-8
    const n2 = Math.floor(Math.random() * 9) + 1; // 1-9
    setCaptchaQ({ num1: n1, num2: n2, answer: n1 + n2 });
    setCaptchaInput('');
  };

  useEffect(() => {
    generateNewCaptcha();
  }, []);

  // Map Settings Dialog state
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [mapInput, setMapInput] = useState(schoolInfo.googleMapEmbedUrl || '');
  const [isSavingMap, setIsSavingMap] = useState(false);

  useEffect(() => {
    setMapInput(schoolInfo.googleMapEmbedUrl || '');
  }, [schoolInfo.googleMapEmbedUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Honeypot Bot Trap Check
    if (honeypot.trim() !== '') {
      console.warn('Bot submission blocked via honeypot trap.');
      showWarning('ระบบปฏิเสธการส่งข้อความ', 'ตรวจพบพฤติกรรมที่ไม่ถูกต้อง (Spam Bot Protection)');
      return;
    }

    // 2. Validate Sender Name & Message
    if (!formData.senderName.trim()) {
      showError('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุชื่อ-นามสกุลของผู้ส่ง');
      return;
    }
    if (!formData.message.trim()) {
      showError('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุข้อความรายละเอียดที่ต้องการติดต่อ');
      return;
    }

    // 3. Email Validation (RFC 5322 regex)
    if (formData.email.trim()) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email.trim())) {
        showError('อีเมลไม่ถูกต้อง', 'กรุณากรอกรูปแบบอีเมลจริงที่ถูกต้อง เช่น yourname@gmail.com');
        return;
      }
    } else {
      showError('จำเป็นต้องระบุอีเมล', 'กรุณาระบุอีเมลติดต่อกลับของผู้ส่ง เพื่อให้เจ้าหน้าที่และผู้อำนวยการสามารถตอบกลับข้อความของท่านได้');
      return;
    }

    // 4. Phone Validation (Optional format check)
    if (formData.phone.trim()) {
      const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length < 9 || cleanPhone.length > 10) {
        showWarning('หมายเลขโทรศัพท์', 'กรุณาระบุหมายเลขโทรศัพท์ 9-10 หลักที่สามารถติดต่อได้จริง');
      }
    }

    // 5. Anti-spam Math Captcha Verification
    const parsedCaptcha = parseInt(captchaInput.trim(), 10);
    if (isNaN(parsedCaptcha) || parsedCaptcha !== captchaQ.answer) {
      showError(
        'รหัสความปลอดภัย (Captcha) ไม่ถูกต้อง',
        `กรุณาคำนวณผลลัพธ์ของ ${captchaQ.num1} + ${captchaQ.num2} ให้ถูกต้อง เพื่อป้องกันสแปมบอทอัตโนมัติ`
      );
      generateNewCaptcha();
      return;
    }

    // 6. Rate Limit / Cooldown (60 seconds per submission)
    const lastSendKey = 'bnr_contact_cooldown';
    const lastSendTime = localStorage.getItem(lastSendKey);
    const now = Date.now();
    if (lastSendTime) {
      const elapsed = Math.floor((now - parseInt(lastSendTime, 10)) / 1000);
      if (elapsed < 60) {
        showWarning(
          'ส่งข้อความบ่อยเกินไป',
          `กรุณารออีก ${60 - elapsed} วินาที ก่อนส่งข้อความถัดไป เพื่อป้องกันข้อความซ้ำซ้อน`
        );
        return;
      }
    }

    // 7. Send to Firestore Inbox
    setIsSubmitting(true);
    try {
      await sendInboxMessage({
        senderName: formData.senderName,
        phone: formData.phone,
        email: formData.email,
        subject: formData.subject,
        message: formData.message
      });

      // Mark cooldown
      try {
        localStorage.setItem(lastSendKey, String(now));
      } catch {}

      setFormSubmitted(true);
      showSuccess(
        'ส่งข้อความสำเร็จแล้ว!',
        'ข้อความของท่านถูกส่งถึงกล่องข้อความโรงเรียนบ้านนารี (Inbox) เรียบร้อยแล้ว ผู้อำนวยการและเจ้าหน้าที่จะดำเนินการตรวจสอบและตอบกลับโดยเร็ว'
      );

      setFormData({
        senderName: '',
        phone: '',
        email: '',
        subject: 'ติดต่อสอบถามทั่วไป',
        message: ''
      });
      generateNewCaptcha();
    } catch (err: any) {
      console.error('Failed to send contact message:', err);
      showError('ไม่สามารถส่งข้อความได้', err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <MapPin className="w-4 h-4" />
            <span>ช่องทางการติดต่อและแผนที่การเดินทาง</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">ติดต่อโรงเรียนบ้านนารี</h1>
          <p className="text-sm text-slate-500 mt-1">
            ยินดีต้อนรับผู้ปกครอง ชุมชน และผู้มาติดต่อราชการทุกท่าน
          </p>
        </div>

        {userRole === 'admin' && onEditSchoolInfo && (
          <button
            type="button"
            onClick={onEditSchoolInfo}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <span>แก้ไขข้อมูลการติดต่อ & แผนที่</span>
          </button>
        )}
      </div>

      {/* Quick Contact Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Address */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">ที่ตั้งสถานศึกษา</h3>
          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            {schoolInfo.address}
          </p>
          <span className="inline-block text-2xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
            รหัส สพฐ: {schoolInfo.schoolIdCode}
          </span>
        </div>

        {/* Telephone */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
            <Phone className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">เบอร์โทรศัพท์ติดต่อ</h3>
          <p className="text-sm font-bold text-slate-900 mb-1">
            {schoolInfo.phone}
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            ติดต่อกลุ่มงานบริหารทั่วไปและธุรการโรงเรียน
          </p>
          <div className="mt-3">
            <a 
              href={`tel:${schoolInfo.phone.replace(/[^0-9]/g, '')}`}
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              <span>โทรออกทันที</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Email & Facebook */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-4">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">อีเมลราชการ</h3>
          <p className="text-xs font-semibold text-slate-800 break-all mb-2">
            {schoolInfo.email}
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            <a 
              href={`mailto:${schoolInfo.email}`}
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              <span>ส่งอีเมล</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            {schoolInfo.facebookUrl && (
              <a
                href={schoolInfo.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 ml-auto"
              >
                <Facebook className="w-3.5 h-3.5" />
                <span>Facebook</span>
              </a>
            )}
          </div>
        </div>

        {/* Office Hours */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">เวลาทำการติดต่อราชการ</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            วันจันทร์ - ศุกร์ : 08:30 - 16:30 น.
          </p>
          <p className="text-2xs text-rose-500 font-medium mt-1">
            * ปิดทำการวันเสาร์ - อาทิตย์ และวันหยุดนักขัตฤกษ์
          </p>
          <div className="mt-3">
            <span className="inline-block text-2xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              สถานะ: เปิดให้บริการ
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Contact Form & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Contact Form */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 text-blue-800 text-xs font-bold mb-2">
            <MessageSquare className="w-4 h-4" />
            <span>แบบฟอร์มส่งข้อความ</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">ส่งข้อความถึงโรงเรียน</h2>
          <p className="text-xs text-slate-500 mb-6">
            กรอกข้อมูลเพื่อส่งเรื่องสอบถาม ข้อเสนอแนะ หรือติดต่อราชการ
          </p>

          {formSubmitted ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3 animate-in zoom-in-95">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-emerald-900">ส่งข้อความเรียบร้อยแล้ว!</h4>
              <p className="text-xs text-emerald-700">
                โรงเรียนบ้านนารีได้รับข้อความของท่านแล้ว เจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุด
              </p>
              <button
                type="button"
                onClick={() => setFormSubmitted(false)}
                className="mt-2 text-xs font-bold text-emerald-800 underline hover:text-emerald-950"
              >
                ส่งข้อความอื่นเพิ่มเติม
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Anti-Spam Honeypot Field (Hidden from humans, traps automated spam bots) */}
              <div style={{ display: 'none', position: 'absolute', left: '-9999px' }} aria-hidden="true">
                <label htmlFor="website_hp">Do not fill this</label>
                <input
                  id="website_hp"
                  type="text"
                  name="website_hp"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อ-นามสกุล ของท่าน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.senderName}
                  onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                  placeholder="เช่น นายสมชาย ใจดี"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เบอร์โทรศัพท์ติดต่อ
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="08X-XXX-XXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    อีเมลติดต่อ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="yourname@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  หัวข้อเรื่อง
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                >
                  <option value="ติดต่อสอบถามทั่วไป">ติดต่อสอบถามทั่วไป</option>
                  <option value="การรับสมัครนักเรียน">การรับสมัครนักเรียน / ย้ายสถานศึกษา</option>
                  <option value="เอกสารทางการศึกษา">ขอเอกสาร ปพ. / วุฒิการศึกษา</option>
                  <option value="ข้อเสนอแนะและติชม">ข้อเสนอแนะ / แจ้งปัญหา</option>
                  <option value="ติดต่อผู้อำนวยการ">ติดต่อผู้บริหารสถานศึกษา</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ข้อความรายละเอียด <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="พิมพ์ข้อความที่ต้องการสอบถามหรือติดต่อกับทางโรงเรียน..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                />
              </div>

              {/* Anti-Spam Security Captcha */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>ระบบตรวจสอบความปลอดภัย (Anti-Spam Verification)</span>
                  </div>
                  <button
                    type="button"
                    onClick={generateNewCaptcha}
                    title="สุ่มโจทย์ใหม่"
                    className="text-slate-400 hover:text-blue-700 p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-800 text-sm tracking-wider select-none shadow-2xs">
                    {captchaQ.num1} + {captchaQ.num2} = ?
                  </div>
                  <input
                    type="number"
                    required
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    placeholder="ใส่ผลลัพธ์..."
                    className="w-28 px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-center focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  />
                  <span className="text-2xs text-slate-500 leading-tight">
                    คำนวณตัวเลขเพื่อยืนยันว่าท่านไม่ใช่บอท
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                    <span>กำลังส่งข้อความสู่ระบบ Inbox...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-amber-300" />
                    <span>ส่งข้อความถึงโรงเรียนบ้านนารี</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* School Location & Map */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col h-full justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                  <Navigation className="w-5 h-5 text-blue-700" />
                  <span>แผนที่การเดินทางสู่โรงเรียน</span>
                </div>
                <div className="flex items-center gap-2">
                  {userRole === 'admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMapInput(schoolInfo.googleMapEmbedUrl || '');
                        setIsMapModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>ตั้งค่าแผนที่</span>
                    </button>
                  )}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(schoolInfo.schoolName + ' ' + schoolInfo.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <span>เปิดด้วย Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Map Embed Container */}
              <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-slate-200 relative bg-slate-100 shadow-inner">
                {(() => {
                  const cleaned = cleanMapEmbedUrl(schoolInfo.googleMapEmbedUrl);
                  if (cleaned) {
                    return (
                      <iframe
                        title="Google Map Ban Naree School"
                        src={cleaned}
                        className="w-full h-full border-0"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        allowFullScreen
                      />
                    );
                  }
                  return (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-gradient-to-br from-blue-50 via-slate-50 to-amber-50">
                      <div className="w-14 h-14 bg-white rounded-2xl shadow-md flex items-center justify-center text-blue-800">
                        <MapPin className="w-8 h-8 text-amber-500" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900">{schoolInfo.schoolName}</h4>
                        <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                          {schoolInfo.address}
                        </p>
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(schoolInfo.schoolName + ' ' + schoolInfo.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors"
                      >
                        <Navigation className="w-4 h-4 text-amber-400" />
                        <span>เปิดพิกัดแผนที่การเดินทาง (GPS Navigation)</span>
                      </a>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <span>
                  <strong>หน่วยงานต้นสังกัด:</strong> {schoolInfo.affiliation}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>การประสานงาน:</strong> ติดต่อห้องธุรการ อาคาร 1 ในวันและเวลาราชการ
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Map Settings Modal */}
      {isMapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#0F224A] to-[#1E3A8A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-400 text-slate-950 rounded-xl">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base leading-tight">ตั้งค่าแผนที่การเดินทางโรงเรียน</h3>
                  <p className="text-2xs text-blue-200">ระบุโค้ดฝังแผนที่ Google Maps Embed (iframe หรือ URL)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMapModalOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-2xs text-blue-900 leading-relaxed">
                  <p className="font-bold">วิธีคัดลอกโค้ดแผนที่จาก Google Maps:</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-blue-800">
                    <li>ค้นหาสถานที่ใน Google Maps แล้วกดปุ่ม <strong>"แชร์" (Share)</strong></li>
                    <li>เลือกแท็บ <strong>"ฝังแผนที่" (Embed a map)</strong></li>
                    <li>กด <strong>"คัดลอก HTML"</strong> แล้วนำมาวางในช่องด้านล่างนี้ได้ทันที (ระบบจะคัดแยก URL ให้อัตโนมัติ)</li>
                  </ol>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  โค้ด iframe หรือ Embed URL จาก Google Maps <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={mapInput}
                  onChange={(e) => setMapInput(e.target.value)}
                  placeholder='<iframe src="https://www.google.com/maps/embed?..." ...></iframe>'
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Quick Reset to Default Bannaree Location */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const defaultUrl = 'https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d1611.3461006805749!2d101.66805158277649!3d16.102838213174568!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1z4LmC4Lij4LiH4LmA4Lij4Li14Lii4LiZ4Lia4LmJ4Liy4LiZ4LiZ4Liy4Lij4Li1IOC4q-C4oeC4ueC5iOC4l-C4teC5iCAxNiDguJXguLPguJrguKXguKvguJnguK3guIfguYHguKfguIcg4Lit4Liz4LmA4Lig4Lit4Lir4LiZ4Lit4LiH4Lia4Lix4Lin4LmB4LiU4LiHIOC4iOC4seC4h-C4q-C4p-C4seC4lOC4iuC4seC4ouC4oOC4ueC4oeC4tCAzNjIxMA!5e0!3m2!1sth!2sth!4v1793280292522!5m2!1sth!2sth';
                    setMapInput(defaultUrl);
                  }}
                  className="text-2xs font-semibold text-blue-700 hover:text-blue-900 underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>ใช้พิกัดมาตรฐานโรงเรียนบ้านนารี (หมู่ 16)</span>
                </button>
              </div>

              {/* Live Preview Box */}
              {cleanMapEmbedUrl(mapInput) && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-2xs font-bold text-slate-600">ตัวอย่างแผนที่แสดงผลจริง (Live Preview):</span>
                  <div className="w-full h-48 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    <iframe
                      title="Map Preview"
                      src={cleanMapEmbedUrl(mapInput)}
                      className="w-full h-full border-0"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsMapModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isSavingMap}
                onClick={async () => {
                  const cleaned = cleanMapEmbedUrl(mapInput);
                  if (!cleaned) {
                    showError('ข้อมูลไม่ถูกต้อง', 'กรุณาระบุโค้ดหรือ URL แผนที่ Google Maps');
                    return;
                  }
                  setIsSavingMap(true);
                  try {
                    if (onSaveSchoolInfo) {
                      await onSaveSchoolInfo({
                        ...schoolInfo,
                        googleMapEmbedUrl: cleaned
                      });
                    }
                    showSuccess('บันทึกสำเร็จ', 'อัปเดตแผนที่การเดินทางโรงเรียนบ้านนารีเรียบร้อยแล้ว');
                    setIsMapModalOpen(false);
                  } catch (err: any) {
                    showError('เกิดข้อผิดพลาดในการบันทึก', err?.message || err);
                  } finally {
                    setIsSavingMap(false);
                  }
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isSavingMap ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-amber-300" />}
                <span>บันทึกพิกัดแผนที่</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
