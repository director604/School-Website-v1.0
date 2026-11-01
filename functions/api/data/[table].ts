/**
 * Endpoint: /api/data/:table
 * จัดการ Query ข้อมูลแบบ List (GET) และ Create (POST) เชื่อมต่อ Cloudflare D1
 */

import {
  Env,
  jsonResponse,
  errorResponse,
  corsHeaders,
  authenticateUser,
  formatRowFromDb,
  camelToSnake,
} from '../_utils';

const ALLOWED_TABLES: Record<string, { defaultOrder?: string; requireAuthForWrite: boolean; requireAdminForWrite: boolean }> = {
  school_info: { requireAuthForWrite: true, requireAdminForWrite: true },
  staff: { defaultOrder: 'ORDER BY sort_order ASC', requireAuthForWrite: true, requireAdminForWrite: true },
  board_members: { defaultOrder: 'ORDER BY sort_order ASC', requireAuthForWrite: true, requireAdminForWrite: true },
  news: { defaultOrder: 'ORDER BY pinned DESC, created_at DESC', requireAuthForWrite: true, requireAdminForWrite: false },
  gallery_albums: { defaultOrder: 'ORDER BY created_at DESC', requireAuthForWrite: true, requireAdminForWrite: false },
  video_gallery: { defaultOrder: 'ORDER BY created_at DESC', requireAuthForWrite: true, requireAdminForWrite: false },
  public_documents: { defaultOrder: 'ORDER BY academic_year_be DESC', requireAuthForWrite: true, requireAdminForWrite: false },
  post_categories: { defaultOrder: 'ORDER BY sort_order ASC', requireAuthForWrite: true, requireAdminForWrite: true },
  media_library: { defaultOrder: 'ORDER BY uploaded_at DESC', requireAuthForWrite: true, requireAdminForWrite: false },
  school_settings: { requireAuthForWrite: true, requireAdminForWrite: true },
  site_stats: { requireAuthForWrite: false, requireAdminForWrite: false },
  system_roles: { requireAuthForWrite: true, requireAdminForWrite: true },
  users: { defaultOrder: 'ORDER BY created_at DESC', requireAuthForWrite: true, requireAdminForWrite: true },
  backup_audit_logs: { defaultOrder: 'ORDER BY timestamp DESC', requireAuthForWrite: false, requireAdminForWrite: false },
};

export const onRequestOptions = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestGet = async (context: {
  params: { table: string };
  request: Request;
  env: Env;
}) => {
  const { params, env, request } = context;
  const table = params.table;

  const config = ALLOWED_TABLES[table];
  if (!config) {
    return errorResponse(`ตาราง '${table}' ไม่ถูกต้องหรือไม่ได้รับอนุญาต`, 404);
  }

  // users table ต้องล็อกอินสิทธิ์ admin เท่านั้น
  if (table === 'users') {
    const user = await authenticateUser(request, env);
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return errorResponse('สิทธิ์ไม่เพียงพอในการดูรายชื่อผู้ใช้งาน', 403);
    }
  }

  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 500;

    const orderClause = config.defaultOrder || '';
    const sql = `SELECT * FROM ${table} ${orderClause} LIMIT ?`;
    const result = await env.DB.prepare(sql).bind(limit).all();

    const formatted = (result.results || []).map((row) => formatRowFromDb(row as Record<string, any>));

    // ตารางแถวเดี่ยว เช่น school_info, school_settings ส่งเป็น Object หรือ Array ได้
    return jsonResponse(formatted);
  } catch (error: any) {
    console.error(`Error reading ${table}:`, error);
    return errorResponse(`เกิดข้อผิดพลาดในการอ่านข้อมูล ${table}: ` + error?.message, 500);
  }
};

export const onRequestPost = async (context: {
  params: { table: string };
  request: Request;
  env: Env;
}) => {
  const { params, env, request } = context;
  const table = params.table;

  const config = ALLOWED_TABLES[table];
  if (!config) {
    return errorResponse(`ตาราง '${table}' ไม่ถูกต้อง`, 404);
  }

  // ตรวจสอบสิทธิ์การเขียน
  let currentUser: any = null;
  if (config.requireAuthForWrite) {
    currentUser = await authenticateUser(request, env);
    if (!currentUser) {
      return errorResponse('กรุณาเข้าสู่ระบบก่อนทำรายการ', 401);
    }
    if (config.requireAdminForWrite && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
      return errorResponse('คุณไม่มีสิทธิ์ระดับผู้ดูแลระบบ (Admin) ในการแก้ไขส่วนนี้', 403);
    }
  }

  try {
    const payload = (await request.json()) as Record<string, any>;

    // เตรียมฟิลด์และคอลัมน์
    const columns: string[] = [];
    const placeholders: string[] = [];
    const values: any[] = [];

    // เพิ่ม authorId/authorName อัตโนมัติถ้ามี
    if (currentUser && !payload.authorId) {
      payload.authorId = currentUser.uid;
      payload.authorName = currentUser.displayName;
    }
    if (!payload.createdAt) {
      payload.createdAt = new Date().toISOString();
    }
    payload.updatedAt = new Date().toISOString();

    for (const [key, val] of Object.entries(payload)) {
      const colName = camelToSnake(key);
      columns.push(colName);
      placeholders.push('?');

      if (val !== null && typeof val === 'object') {
        values.push(JSON.stringify(val));
      } else if (typeof val === 'boolean') {
        values.push(val ? 1 : 0);
      } else {
        values.push(val);
      }
    }

    const insertSql = `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
    await env.DB.prepare(insertSql).bind(...values).run();

    return jsonResponse({ success: true, message: 'บันทึกข้อมูลเรียบร้อย', data: payload }, 201);
  } catch (error: any) {
    console.error(`Error writing to ${table}:`, error);
    return errorResponse(`ไม่สามารถบันทึกข้อมูลลง ${table}: ` + error?.message, 500);
  }
};
