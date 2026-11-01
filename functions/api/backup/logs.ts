import { Env, jsonResponse, errorResponse, corsHeaders } from '../_utils';

/**
 * GET & POST /api/backup/logs
 * จัดการบันทึกประวัติการสำรองและกู้คืนข้อมูลลงใน Cloudflare D1
 */
export const onRequestOptions = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestGet = async (context: { env: Env }) => {
  const db = context.env.DB;
  if (!db) {
    return errorResponse('Cloudflare D1 Binding (env.DB) is not attached', 500);
  }

  try {
    const result = await db.prepare(
      'SELECT * FROM backup_audit_logs ORDER BY timestamp DESC LIMIT 50'
    ).all();

    return jsonResponse(result.results || []);
  } catch (err: any) {
    // If table doesn't exist yet, return empty list gracefully
    return jsonResponse([]);
  }
};

export const onRequestPost = async (context: { env: Env; request: Request }) => {
  const db = context.env.DB;
  if (!db) {
    return errorResponse('Cloudflare D1 Binding (env.DB) is not attached', 500);
  }

  try {
    const body = await context.request.json() as any;
    const id = body.id || `log_${Date.now()}`;
    const timestamp = body.timestamp || new Date().toISOString();

    await db.prepare(
      `INSERT INTO backup_audit_logs 
       (id, timestamp, action, action_label, performed_by_email, performed_by_name, drive_file_id, drive_file_name, status, details, record_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      timestamp,
      body.action || 'BACKUP',
      body.actionLabel || body.action_label || 'สำรองข้อมูล',
      body.performedByEmail || body.performed_by_email || 'admin@bnr.ac.th',
      body.performedByName || body.performed_by_name || 'Admin',
      body.driveFileId || body.drive_file_id || null,
      body.driveFileName || body.drive_file_name || null,
      body.status || 'SUCCESS',
      body.details || '',
      body.recordCount || body.record_count || 0
    ).run();

    return jsonResponse({ success: true, id });
  } catch (err: any) {
    return errorResponse('Failed to record log: ' + err.message, 500);
  }
};
