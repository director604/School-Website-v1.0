/**
 * Endpoint: POST /api/auth/google
 * ตรวจสอบ Google ID Token (JWT) จาก Google Identity Services (GIS)
 * พร้อมซิงก์ผู้ใช้งานลงตาราง `users` และออก Session Token เก็บลง `user_sessions`
 */

import { Env, jsonResponse, errorResponse, corsHeaders } from '../_utils';

export const onRequestOptions = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  try {
    const body = await request.json() as { credential?: string };
    const credential = body.credential;

    if (!credential) {
      return errorResponse('ไม่พบ Google Credential Token', 400);
    }

    // 1. ตรวจสอบ Google ID Token ผ่าน Google OAuth2 TokenInfo Endpoint
    const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
    const googleRes = await fetch(verifyUrl);

    if (!googleRes.ok) {
      const errDetail = await googleRes.text();
      console.error('Google token verification failed:', errDetail);
      return errorResponse('Google Token ไม่ถูกต้องหรือหมดอายุ', 401);
    }

    const payload = await googleRes.json() as {
      sub: string;
      email: string;
      name?: string;
      picture?: string;
      aud?: string;
      email_verified?: string | boolean;
    };

    const email = (payload.email || '').trim().toLowerCase();
    const uid = payload.sub; // Google Unique Subject ID
    const displayName = payload.name || 'ผู้ใช้งานระบบ';
    const photoURL = payload.picture || '';

    if (!email) {
      return errorResponse('ไม่พบบัญชีอีเมลใน Google Token', 400);
    }

    // 2. ตรวจสอบสิทธิ์ Super Admin และ Configured Admins
    const superAdminTarget = (env.SUPER_ADMIN_EMAIL || 'director@bnr.ac.th').toLowerCase().trim();
    const isSuperAdminEmail =
      email === superAdminTarget ||
      email === 'director@bnr.ac.th' ||
      email === 'engine@bnr.ac.th' ||
      email === 'sirasit@bnr.ac.th' ||
      email === 'sirasit.p@gmail.com';

    // ดึงรายชื่อ Admin เพิ่มเติมจากตาราง system_roles
    let configuredAdmins: string[] = [];
    try {
      const rolesRow = await env.DB.prepare('SELECT admin_emails FROM system_roles WHERE id = ?')
        .bind('roles')
        .first<{ admin_emails: string }>();

      if (rolesRow?.admin_emails) {
        configuredAdmins = JSON.parse(rolesRow.admin_emails).map((e: string) => e.toLowerCase().trim());
      }
    } catch (e) {
      console.warn('Cannot read system_roles table:', e);
    }

    const isConfiguredAdmin = configuredAdmins.includes(email);

    // 3. ตรวจสอบผู้ใช้ในตาราง `users`
    const existingUser = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first<any>();

    // นโยบายสิทธิ์: อีเมลต้องเป็น SuperAdmin, Configured Admin, อยู่ในตาราง users แล้ว หรือเป็นโดเมน @bnr.ac.th
    const isBnrDomain = email.endsWith('@bnr.ac.th');
    const isAllowed = isSuperAdminEmail || isConfiguredAdmin || isBnrDomain || !!existingUser;

    if (!isAllowed) {
      return errorResponse(
        `อีเมล "${email}" ยังไม่อยู่ในระบบโรงเรียนบ้านนารี กรุณาติดต่อผู้ดูแลระบบเพื่อเปิดสิทธิ์การใช้งานก่อนเข้าสู่ระบบ`,
        403
      );
    }

    if (existingUser && existingUser.status === 'suspended' && !isSuperAdminEmail) {
      return errorResponse(`บัญชีผู้ใช้งาน "${email}" ถูกระงับการใช้งานชั่วคราว`, 403);
    }

    // กำหนด Role
    let assignedRole = 'editor';
    if (isSuperAdminEmail) {
      assignedRole = 'superadmin';
    } else if (isConfiguredAdmin || existingUser?.role === 'admin' || existingUser?.role === 'superadmin') {
      assignedRole = 'admin';
    } else if (existingUser?.role) {
      assignedRole = existingUser.role;
    }

    const nowIso = new Date().toISOString();

    // บันทึก/อัปเดตผู้ใช้งานลงตาราง `users`
    if (!existingUser) {
      await env.DB.prepare(
        `INSERT INTO users (uid, email, display_name, photo_url, role, department, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          uid,
          email,
          displayName,
          photoURL,
          assignedRole,
          isSuperAdminEmail ? 'กลุ่มงานบริหารและอำนวยการ' : 'กลุ่มสาระการเรียนรู้',
          'active',
          nowIso,
          nowIso
        )
        .run();
    } else {
      await env.DB.prepare(
        `UPDATE users
         SET display_name = ?, photo_url = ?, role = ?, updated_at = ?
         WHERE email = ?`
      )
        .bind(displayName, photoURL, assignedRole, nowIso, email)
        .run();
    }

    // 4. ออก Session Token บันทึกลงตาราง `user_sessions`
    const sessionToken = `bnr_${crypto.randomUUID().replace(/-/g, '')}${Date.now().toString(36)}`;
    // อายุ Session 7 วัน
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    await env.DB.prepare(
      `INSERT INTO user_sessions (token, user_id, email, role, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(sessionToken, uid, email, assignedRole, expiresAt, nowIso)
      .run();

    const userProfile = {
      uid,
      email,
      displayName,
      photoURL,
      role: assignedRole,
      department: existingUser?.department || (isSuperAdminEmail ? 'กลุ่มงานบริหารและอำนวยการ' : 'กลุ่มสาระการเรียนรู้'),
      status: 'active',
      createdAt: existingUser?.created_at || nowIso,
      updatedAt: nowIso,
    };

    // ส่งคืน Token และ Cookie
    const cookieHeader = `bnr_session=${sessionToken}; Path=/; Max-Age=${7 * 86400}; HttpOnly; SameSite=Lax; Secure`;

    return jsonResponse(
      {
        success: true,
        token: sessionToken,
        user: userProfile,
      },
      200,
      { 'Set-Cookie': cookieHeader }
    );
  } catch (error: any) {
    console.error('Google Sign-In API Error:', error);
    return errorResponse('เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ' + (error?.message || 'ระบบไม่ตอบสนอง'), 500);
  }
};
