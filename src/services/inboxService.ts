/**
 * School Inbox & Super Admin Management Service
 * สำหรับจัดการข้อความติดต่อส่งถึงโรงเรียน (Inbox) และสิทธิ์ Super Admin (ผู้อำนวยการ)
 * สงวนสิทธิ์การเปิดอ่านและจัดการเฉพาะ Super Admin เท่านั้น
 * ทำงานร่วมกับ Cloudflare D1 แทน Firebase Firestore
 */

import { InboxMessage, InboxMessageStatus, SystemRolesConfig } from '../types';
import {
  fetchInboxMessages,
  sendContactMessage,
  updateInboxMessageStatus as d1UpdateStatus,
  deleteInboxMessage as d1DeleteMessage,
  fetchSystemRoles,
} from './d1Service';
import { getAuthHeaders } from './googleAuth';

export const DEFAULT_SUPER_ADMIN_EMAIL = 'director@bnr.ac.th';

/**
 * ตรวจสอบว่าอีเมลนี้เป็น Super Admin หรือไม่ (ผู้อำนวยการโรงเรียน)
 */
export function checkIsSuperAdmin(userEmail?: string | null, config?: SystemRolesConfig | null): boolean {
  if (!userEmail) return false;
  const emailNorm = userEmail.trim().toLowerCase();
  
  const targetSuperAdmin = (config?.superAdminEmail || DEFAULT_SUPER_ADMIN_EMAIL).trim().toLowerCase();
  
  if (emailNorm === targetSuperAdmin) return true;
  if (emailNorm === 'director@bnr.ac.th') return true;
  if (emailNorm === 'engine@bnr.ac.th') return true;
  if (emailNorm === 'sirasit@bnr.ac.th') return true;
  if (emailNorm === 'sirasit.p@gmail.com') return true;
  
  return false;
}

/**
 * ส่งข้อความใหม่เข้ากล่องข้อความโรงเรียน (Inbox)
 */
export async function sendInboxMessage(
  data: Omit<InboxMessage, 'id' | 'createdAt' | 'status'>
): Promise<string> {
  return await sendContactMessage(data);
}

/**
 * ฟังข้อมูลข้อความทั้งหมดในกล่องข้อความโรงเรียน (สำหรับ Super Admin เท่านั้น)
 */
export function listenInboxMessages(
  onMessages: (messages: InboxMessage[]) => void,
  onError?: (error: any) => void
): () => void {
  let isSubscribed = true;

  const load = async () => {
    try {
      const list = await fetchInboxMessages();
      if (isSubscribed) {
        onMessages(list);
      }
    } catch (err) {
      if (onError && isSubscribed) onError(err);
    }
  };

  load();
  const timer = setInterval(load, 30000); // Poll ทุก 30 วินาที

  return () => {
    isSubscribed = false;
    clearInterval(timer);
  };
}

/**
 * อัปเดตสถานะของข้อความใน Inbox
 */
export async function updateInboxMessageStatus(
  messageId: string, 
  status: InboxMessageStatus, 
  directorNotes?: string
): Promise<void> {
  await d1UpdateStatus(messageId, status, directorNotes);
}

/**
 * อัปเดตบันทึกช่วยจำของผู้อำนวยการ (Director Notes)
 */
export async function updateInboxDirectorNotes(
  messageId: string, 
  notes: string
): Promise<void> {
  await d1UpdateStatus(messageId, 'replied', notes);
}

/**
 * ลบข้อความออกจาก Inbox
 */
export async function deleteInboxMessage(messageId: string): Promise<void> {
  await d1DeleteMessage(messageId);
}

/**
 * อ่านการตั้งค่าบทบาท Super Admin & Admins จาก Cloudflare D1
 */
export async function getSystemRolesConfig(): Promise<SystemRolesConfig> {
  return await fetchSystemRoles();
}

/**
 * ฟังการเปลี่ยนแปลงบทบาท Super Admin & Admins
 */
export function listenSystemRolesConfig(
  onConfigChange: (config: SystemRolesConfig) => void
): () => void {
  fetchSystemRoles()
    .then((cfg) => onConfigChange(cfg))
    .catch(() => {});

  return () => {};
}

/**
 * บันทึกการกำหนดค่าบทบาท Super Admin & Admins ไปยัง Cloudflare D1
 */
export async function saveSystemRolesConfig(
  config: Partial<SystemRolesConfig>,
  updatedByEmail: string = 'director@bnr.ac.th'
): Promise<void> {
  const payload = {
    id: 'roles',
    superAdminEmail: config.superAdminEmail || DEFAULT_SUPER_ADMIN_EMAIL,
    adminEmails: config.adminEmails || ['director@bnr.ac.th', 'engine@bnr.ac.th'],
    updatedAt: new Date().toISOString(),
    updatedBy: updatedByEmail,
  };

  await fetch('/api/data/system_roles', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
}
