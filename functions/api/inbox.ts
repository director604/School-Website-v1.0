/**
 * Endpoint: /api/inbox
 * จัดการกล่องข้อความติดต่อโรงเรียน
 * - POST: สาธารณะ (ผู้ปกครองหรือประชาชนทั่วไปส่งข้อความได้)
 * - GET, PUT, DELETE: เฉพาะผู้อำนวยการโรงเรียน (Super Admin) เท่านั้น!
 */

import {
  Env,
  jsonResponse,
  errorResponse,
  corsHeaders,
  authenticateUser,
  formatRowFromDb,
} from './_utils';

export const onRequestOptions = async () => {
  return new Response(null, { headers: corsHeaders });
};

// 1. ประชาชนทั่วไปส่งข้อความ
export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  try {
    const data = (await request.json()) as {
      senderName: string;
      phone?: string;
      email?: string;
      subject: string;
      message: string;
    };

    if (!data.senderName || !data.message) {
      return errorResponse('กรุณาระบุชื่อผู้ติดต่อและข้อความที่ต้องการส่ง', 400);
    }

    const id = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO inbox_messages (id, sender_name, phone, email, subject, message, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'new', ?, ?)`
    )
      .bind(
        id,
        data.senderName.trim(),
        (data.phone || '').trim(),
        (data.email || '').trim().toLowerCase(),
        (data.subject || 'ติดต่อสอบถามทั่วไป').trim(),
        data.message.trim(),
        nowIso,
        nowIso
      )
      .run();

    return jsonResponse({
      success: true,
      message: 'ส่งข้อความถึงผู้อำนวยการโรงเรียนบ้านนารีเรียบร้อยแล้ว',
      id,
    });
  } catch (error: any) {
    console.error('Submit inbox message error:', error);
    return errorResponse('ไม่สามารถส่งข้อความได้ในขณะนี้: ' + error?.message, 500);
  }
};

// 2. ผู้อำนวยการเปิดอ่านข้อความ
export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  const currentUser = await authenticateUser(request, env);
  if (!currentUser || currentUser.role !== 'superadmin') {
    return errorResponse('สงวนสิทธิ์การเปิดอ่านกล่องข้อความสำหรับผู้อำนวยการ (Super Admin) เท่านั้น', 403);
  }

  try {
    const result = await env.DB.prepare(
      'SELECT * FROM inbox_messages ORDER BY created_at DESC LIMIT 200'
    ).all();

    const messages = (result.results || []).map((row) => formatRowFromDb(row as Record<string, any>));
    return jsonResponse(messages);
  } catch (error: any) {
    console.error('Fetch inbox error:', error);
    return errorResponse('อ่านกล่องข้อความล้มเหลว: ' + error?.message, 500);
  }
};

// 3. ผู้อำนวยการอัปเดตสถานะหรือบันทึกข้อความตอบกลับ
export const onRequestPut = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  const currentUser = await authenticateUser(request, env);
  if (!currentUser || currentUser.role !== 'superadmin') {
    return errorResponse('สงวนสิทธิ์เฉพาะผู้อำนวยการ (Super Admin) เท่านั้น', 403);
  }

  try {
    const body = (await request.json()) as {
      id: string;
      status?: string;
      directorNotes?: string;
      repliedAt?: string;
    };

    if (!body.id) {
      return errorResponse('ไม่พบรหัสข้อความที่ต้องการอัปเดต', 400);
    }

    const nowIso = new Date().toISOString();
    await env.DB.prepare(
      `UPDATE inbox_messages
       SET status = COALESCE(?, status),
           director_notes = COALESCE(?, director_notes),
           replied_at = COALESCE(?, replied_at),
           updated_at = ?
       WHERE id = ?`
    )
      .bind(body.status || null, body.directorNotes || null, body.repliedAt || null, nowIso, body.id)
      .run();

    return jsonResponse({ success: true, message: 'อัปเดตสถานะข้อความเรียบร้อย' });
  } catch (error: any) {
    return errorResponse('อัปเดตล้มเหลว: ' + error?.message, 500);
  }
};

// 4. ผู้อำนวยการลบข้อความ
export const onRequestDelete = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  const currentUser = await authenticateUser(request, env);
  if (!currentUser || currentUser.role !== 'superadmin') {
    return errorResponse('สงวนสิทธิ์เฉพาะผู้อำนวยการ (Super Admin) เท่านั้น', 403);
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return errorResponse('ไม่พบรหัสข้อความที่ต้องการลบ', 400);
    }

    await env.DB.prepare('DELETE FROM inbox_messages WHERE id = ?').bind(id).run();
    return jsonResponse({ success: true, message: 'ลบข้อความเรียบร้อย' });
  } catch (error: any) {
    return errorResponse('ลบข้อความล้มเหลว: ' + error?.message, 500);
  }
};
