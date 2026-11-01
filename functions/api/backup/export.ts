import { Env, jsonResponse, errorResponse, corsHeaders, formatRowFromDb } from '../_utils';

/**
 * GET /api/backup/export
 * Cloudflare Pages Functions - D1 Database Full Export
 * สกัดข้อมูลครบทุกตารางจาก Cloudflare D1 เป็นโครงสร้าง JSON
 */
export const onRequestOptions = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestGet = async (context: { env: Env; request: Request }) => {
  const db = context.env.DB;
  if (!db) {
    return errorResponse('Cloudflare D1 Binding (env.DB) is not attached', 500);
  }

  const allTables = [
    'school_info',
    'staff',
    'board_members',
    'news',
    'gallery_albums',
    'video_gallery',
    'public_documents',
    'post_categories',
    'media_library',
    'school_settings',
    'site_stats',
    'inbox_messages',
    'system_roles',
    'users',
    'backup_audit_logs',
  ];

  try {
    const backupData: Record<string, any> = {};
    let totalRecords = 0;

    for (const table of allTables) {
      try {
        const queryResult = await db.prepare(`SELECT * FROM ${table}`).all();
        const rows = (queryResult.results || []).map((r) => formatRowFromDb(r as Record<string, any>));

        if (table === 'school_info' || table === 'school_settings' || table === 'site_stats' || table === 'system_roles') {
          backupData[table] = rows[0] || null;
          if (rows[0]) totalRecords++;
        } else {
          backupData[table] = rows;
          totalRecords += rows.length;
        }
      } catch (tableErr: any) {
        // Table might not exist yet or be empty
        backupData[table] = null;
      }
    }

    const payload = {
      metadata: {
        version: '3.0-D1',
        engine: 'Cloudflare D1 (SQLite 3)',
        database: 'bannaree-db',
        database_id: '56fe1149-9b8f-4ef9-8e8e-2d3d7bda91f4',
        app: 'Ban Naree School Web Platform',
        schoolName: 'โรงเรียนบ้านนารี (สพป.ชัยภูมิ เขต 1)',
        backupTimestamp: new Date().toISOString(),
        academicYearBE: 2569,
        totalTables: allTables.length,
        totalRecords,
      },
      data: backupData,
    };

    return jsonResponse(payload);
  } catch (error: any) {
    return errorResponse('Failed to export D1 database: ' + error?.message, 500);
  }
};
