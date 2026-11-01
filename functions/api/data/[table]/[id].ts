/**
 * Endpoint: /api/data/:table/:id
 * จัดการ Query แถวเดี่ยว (GET), อัปเดต (PUT), และ ลบ (DELETE)
 */

import {
  Env,
  jsonResponse,
  errorResponse,
  corsHeaders,
  authenticateUser,
  formatRowFromDb,
  camelToSnake,
} from '../../_utils';

export const onRequestOptions = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestGet = async (context: {
  params: { table: string; id: string };
  env: Env;
}) => {
  const { params, env } = context;
  const { table, id } = params;

  try {
    const row = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first();
    if (!row) {
      return errorResponse(`ไม่พบข้อมูลใน ${table} รหัส: ${id}`, 404);
    }
    return jsonResponse(formatRowFromDb(row as Record<string, any>));
  } catch (error: any) {
    return errorResponse(`อ่านข้อมูลล้มเหลว: ` + error?.message, 500);
  }
};

export const onRequestPut = async (context: {
  params: { table: string; id: string };
  request: Request;
  env: Env;
}) => {
  const { params, env, request } = context;
  const { table, id } = params;

  // ตรวจสอบสิทธิ์การแก้ไข
  const currentUser = await authenticateUser(request, env);
  if (!currentUser) {
    return errorResponse('กรุณาเข้าสู่ระบบก่อนทำการแก้ไข', 401);
  }

  try {
    const payload = (await request.json()) as Record<string, any>;
    payload.updatedAt = new Date().toISOString();

    const setClauses: string[] = [];
    const values: any[] = [];

    for (const [key, val] of Object.entries(payload)) {
      if (key === 'id') continue;
      const colName = camelToSnake(key);
      setClauses.push(`${colName} = ?`);

      if (val !== null && typeof val === 'object') {
        values.push(JSON.stringify(val));
      } else if (typeof val === 'boolean') {
        values.push(val ? 1 : 0);
      } else {
        values.push(val);
      }
    }

    values.push(id);
    const updateSql = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE id = ?`;
    await env.DB.prepare(updateSql).bind(...values).run();

    return jsonResponse({ success: true, message: 'อัปเดตข้อมูลสำเร็จ', id });
  } catch (error: any) {
    console.error(`Error updating ${table}/${id}:`, error);
    return errorResponse(`อัปเดตข้อมูลล้มเหลว: ` + error?.message, 500);
  }
};

export const onRequestDelete = async (context: {
  params: { table: string; id: string };
  request: Request;
  env: Env;
}) => {
  const { params, env, request } = context;
  const { table, id } = params;

  // ตรวจสอบสิทธิ์การลบ
  const currentUser = await authenticateUser(request, env);
  if (!currentUser) {
    return errorResponse('กรุณาเข้าสู่ระบบก่อนทำการลบข้อมูล', 401);
  }

  try {
    // ถ้าเป็นตาราง news, gallery_albums, video_gallery, public_documents: อนุญาตให้เจ้าของโพสต์หรือ Admin ลบได้
    if (['news', 'gallery_albums', 'video_gallery', 'public_documents'].includes(table)) {
      if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
        const item = await env.DB.prepare(`SELECT author_id FROM ${table} WHERE id = ?`)
          .bind(id)
          .first<{ author_id?: string }>();
        if (item && item.author_id !== currentUser.uid) {
          return errorResponse('คุณสามารถลบได้เฉพาะรายการที่คุณเป็นผู้สร้างเท่านั้น', 403);
        }
      }
    } else {
      // ตารางอื่นๆ ต้องเป็น Admin หรือ Super Admin เท่านั้น
      if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
        return errorResponse('ต้องใช้สิทธิ์ระดับ Admin ในการลบข้อมูลนี้', 403);
      }
    }

    await env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
    return jsonResponse({ success: true, message: 'ลบข้อมูลเรียบร้อย', id });
  } catch (error: any) {
    console.error(`Error deleting ${table}/${id}:`, error);
    return errorResponse(`ลบข้อมูลล้มเหลว: ` + error?.message, 500);
  }
};
