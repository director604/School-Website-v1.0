/**
 * Google Identity Services (GIS OAuth 2.0) & Session Authentication Service
 * แทนที่ระบบ Firebase Auth เดิม 100%
 * รองรับ FedCM, ป้องกัน Popup Blocked, และเชื่อมต่อ Cloudflare D1
 */

import { UserRole, UserProfile } from '../types';

declare global {
  interface Window {
    google?: any;
    gapi?: any;
  }
}

export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID ||
  '47668985482-0m3n3vbk5nv6ijnasobfsljkr5fdjd52.apps.googleusercontent.com';

export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
].join(' ');

// In-memory cache
let inMemoryDriveToken: string | null = null;
let currentAuthUser: UserProfile | null = null;

/**
 * ดึง Session Token สำหรับส่งไปยัง Cloudflare Functions API
 */
export function getSessionToken(): string | null {
  try {
    return sessionStorage.getItem('bnr_session_token') || localStorage.getItem('bnr_session_token') || null;
  } catch {
    return null;
  }
}

/**
 * ดึง HTTP Headers พร้อม Authorization Bearer Token
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getSessionToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * ดึง Google Drive Access Token (สำหรับเรียก Google Drive API ฝั่ง Client)
 */
export async function getAccessToken(): Promise<string | null> {
  if (inMemoryDriveToken) return inMemoryDriveToken;
  try {
    const stored = sessionStorage.getItem('bnr_drive_token');
    if (stored) {
      inMemoryDriveToken = stored;
      return stored;
    }
  } catch {}
  return null;
}

/**
 * ดึงข้อมูลผู้ใช้งานปัจจุบันที่แคชไว้ในหน่วยความจำ
 */
export function getCurrentUser(): UserProfile | null {
  if (currentAuthUser) return currentAuthUser;
  try {
    const raw = sessionStorage.getItem('bnr_current_user');
    if (raw) {
      currentAuthUser = JSON.parse(raw);
      return currentAuthUser;
    }
  } catch {}
  return null;
}

/**
 * ขอสิทธิ์ Google Drive Access Token ผ่าน Google OAuth 2.0 Token Client (Popup)
 */
export async function connectGoogleDrive(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      return reject(new Error('Google Identity Services SDK กำลังโหลด กรุณาลองใหม่อีกครั้ง'));
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: DRIVE_SCOPES,
        callback: (response: any) => {
          if (response.error) {
            console.error('Drive OAuth error:', response);
            return reject(new Error('การอนุญาตสิทธิ์ Google Drive ล้มเหลว: ' + (response.error_description || response.error)));
          }
          if (response.access_token) {
            inMemoryDriveToken = response.access_token;
            try {
              sessionStorage.setItem('bnr_drive_token', response.access_token);
            } catch {}
            resolve(response.access_token);
          } else {
            reject(new Error('ไม่พบ Access Token ในการตอบกลับ'));
          }
        },
      });

      client.requestAccessToken();
    } catch (err: any) {
      reject(err);
    }
  });
}

/**
 * ตรวจสอบสถานะการล็อกอินกับ Cloudflare D1 Backend
 */
export async function checkAuthSession(): Promise<{ user: UserProfile | null; role: UserRole }> {
  const token = getSessionToken();
  if (!token) {
    return { user: null, role: 'guest' };
  }

  try {
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.authenticated && data.user) {
        currentAuthUser = data.user;
        try {
          sessionStorage.setItem('bnr_current_user', JSON.stringify(data.user));
        } catch {}
        return { user: data.user, role: data.role || 'editor' };
      }
    }
  } catch (err) {
    console.warn('Check auth session warning:', err);
  }

  // Session หมดอายุหรือไม่ถูกต้อง
  try {
    sessionStorage.removeItem('bnr_session_token');
    sessionStorage.removeItem('bnr_current_user');
  } catch {}
  currentAuthUser = null;
  return { user: null, role: 'guest' };
}

/**
 * เข้าสู่ระบบด้วย Google Identity Services (GIS OAuth 2.0 Popup Flow)
 * เรียกตรงใน User Gesture ป้องกัน Popup Blocked 100%
 */
export async function googleSignIn(): Promise<{ user: UserProfile; accessToken: string; role: UserRole }> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      return reject(new Error('Google Identity Services SDK กำลังโหลด กรุณารอสักครู่แล้วกดใหม่อีกครั้ง'));
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: `openid email profile ${DRIVE_SCOPES}`,
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            console.error('Google OAuth error:', tokenResponse);
            return reject(new Error(tokenResponse.error_description || tokenResponse.error || 'การเข้าสู่ระบบถูกยกเลิก'));
          }

          const accessToken = tokenResponse.access_token;
          if (!accessToken) {
            return reject(new Error('ไม่พบ Access Token จาก Google'));
          }

          inMemoryDriveToken = accessToken;
          try {
            sessionStorage.setItem('bnr_drive_token', accessToken);
          } catch {}

          try {
            // ดึงข้อมูลโปรไฟล์ผู้ใช้จาก Google UserInfo API
            const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!infoRes.ok) throw new Error('ไม่สามารถดึงข้อมูลบัญชี Google ได้');
            const gUser = await infoRes.json();

            const email = (gUser.email || '').toLowerCase().trim();
            const isSuperAdminEmail =
              email === 'director@bnr.ac.th' ||
              email === 'engine@bnr.ac.th' ||
              email === 'sirasit@bnr.ac.th' ||
              email === 'sirasit.p@gmail.com';

            const role: UserRole = isSuperAdminEmail ? 'superadmin' : 'editor';

            const profile: UserProfile = {
              uid: gUser.sub || `user_${Date.now()}`,
              email: gUser.email,
              displayName: gUser.name || 'บุคลากรโรงเรียนบ้านนารี',
              photoURL: gUser.picture || '',
              role,
              department: isSuperAdminEmail ? 'กลุ่มงานบริหารและอำนวยการ' : 'กลุ่มสาระการเรียนรู้',
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            currentAuthUser = profile;
            const sessionToken = `bnr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

            try {
              sessionStorage.setItem('bnr_session_token', sessionToken);
              sessionStorage.setItem('bnr_current_user', JSON.stringify(profile));
            } catch {}

            // บันทึก/อัปเดตลง Backend Cloudflare D1
            fetch('/api/data/users', {
              method: 'POST',
              headers: getAuthHeaders(),
              body: JSON.stringify(profile),
            }).catch(() => {});

            resolve({
              user: profile,
              accessToken,
              role,
            });
          } catch (err: any) {
            reject(err);
          }
        },
      });

      // เรียกเปิดหน้าต่าง Google Login ทันทีโดยตรงจากคลิกของผู้ใช้
      client.requestAccessToken();
    } catch (e: any) {
      reject(e);
    }
  });
}

/**
 * ออกจากระบบ
 */
export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: getAuthHeaders(),
    }).catch(() => {});
  } finally {
    inMemoryDriveToken = null;
    currentAuthUser = null;
    try {
      sessionStorage.removeItem('bnr_session_token');
      sessionStorage.removeItem('bnr_current_user');
      sessionStorage.removeItem('bnr_drive_token');
    } catch {}
  }
}

/**
 * ตรวจสอบความพร้อมตอนเปิดเว็บ (แทน initAuth ของ Firebase)
 */
export async function initAuth(
  onSuccess?: (user: UserProfile, token: string | null, role: UserRole) => void,
  onFailure?: () => void
): Promise<() => void> {
  const { user, role } = await checkAuthSession();
  if (user) {
    if (onSuccess) onSuccess(user, inMemoryDriveToken, role);
  } else {
    if (onFailure) onFailure();
  }

  return () => {};
}
