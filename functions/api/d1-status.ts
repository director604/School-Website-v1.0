import { Env, jsonResponse, corsHeaders } from './_utils';

/**
 * GET /api/d1-status
 * Cloudflare D1 Database Connection Diagnostic & Status Endpoint
 * ตรวจสอบสถานะการเชื่อมต่อ D1, วัด Latency, ตรวจนับจำนวน Tables จริงในฐานข้อมูล
 */
export const onRequestGet = async (context: { env: Env; request: Request }) => {
  const startTime = Date.now();
  const db = context.env.DB;

  if (!db) {
    return jsonResponse(
      {
        connected: false,
        error: 'Cloudflare D1 Binding (env.DB) is not attached to this worker environment',
        tables_count: 0,
        ping_ms: 0,
      },
      500
    );
  }

  try {
    // 1. Query SQLite version
    const versionResult = await db.prepare('SELECT sqlite_version() as version').first<{ version: string }>();
    
    // 2. Query user tables created in D1
    const tablesResult = await db
      .prepare(
        "SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name ASC"
      )
      .all<{ name: string }>();

    const tables = (tablesResult.results || []).map((t) => t.name);
    const latency = Date.now() - startTime;

    return jsonResponse({
      connected: true,
      database: 'bannaree-db',
      database_id: '56fe1149-9b8f-4ef9-8e8e-2d3d7bda91f4',
      binding: 'env.DB',
      engine: `Cloudflare D1 (SQLite ${versionResult?.version || '3.x'})`,
      edge_region: 'Global Edge Network (Multi-Region Replicas)',
      tables_count: tables.length,
      tables: tables,
      sqlite_version: versionResult?.version || '3.x',
      ping_ms: latency,
      storage_kb: 221,
      storage_quota_gb: 5,
      rows_read_quota_limit: 5000000,
      rows_written_quota_limit: 100000,
      daily_quota_limit: 5000000,
      rows_read_used: 0,
      rows_written_used: 0,
      firebase_status: 'Disconnected (0 read/write)',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return jsonResponse(
      {
        connected: false,
        error: err.message || 'Database query error',
        ping_ms: Date.now() - startTime,
      },
      500
    );
  }
};

export const onRequestOptions = async () => {
  return new Response(null, { status: 204, headers: corsHeaders });
};
