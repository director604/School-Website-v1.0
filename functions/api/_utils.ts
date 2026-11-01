/**
 * Cloudflare Pages Functions - Shared Utility Helpers
 * จัดการ Environment, CORS, Session Token Verification, และ Object/SQL Field Mapping
 */

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<{ success: boolean; meta: any }>;
  all<T = unknown>(): Promise<{ results: T[]; success: boolean; meta: any }>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<any[]>;
  exec(query: string): Promise<any>;
}

export interface Env {
  DB: D1Database;
  GOOGLE_CLIENT_ID?: string;
  SUPER_ADMIN_EMAIL?: string;
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export function jsonResponse(data: any, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders,
      ...extraHeaders,
    },
  });
}

export function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message, success: false }, status);
}

/**
 * ดึง Session Token จาก Authorization Header หรือ Cookie
 */
export function getSessionToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(/bnr_session=([^;]+)/);
  if (match) {
    return match[1].trim();
  }

  return null;
}

/**
 * ตรวจสอบสิทธิ์ผู้ใช้งานจาก Session Token ในตาราง user_sessions
 */
export async function authenticateUser(request: Request, env: Env) {
  const token = getSessionToken(request);
  if (!token) return null;

  try {
    const now = Date.now();
    const session = await env.DB.prepare(
      `SELECT s.token, s.user_id, s.email, s.role, s.expires_at,
              u.display_name, u.photo_url, u.department, u.status
       FROM user_sessions s
       JOIN users u ON s.user_id = u.uid
       WHERE s.token = ? AND s.expires_at > ? AND u.status = 'active'`
    )
      .bind(token, now)
      .first<any>();

    if (!session) return null;

    return {
      uid: session.user_id,
      email: session.email,
      role: session.role,
      displayName: session.display_name,
      photoURL: session.photo_url,
      department: session.department,
      status: session.status,
      token: session.token,
    };
  } catch (err) {
    console.error('Session verification error:', err);
    return null;
  }
}

/**
 * แปลง CamelCase จาก Frontend เป็น Snake_case สำหรับ SQLite Column
 */
export function camelToSnake(str: string): string {
  if (str === 'sort_order' || str === 'order') return 'sort_order';
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * แปลง Snake_case จาก SQLite Column เป็น CamelCase สำหรับ Frontend
 */
export function snakeToCamel(str: string): string {
  if (str === 'sort_order') return 'order';
  return str.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
}

/**
 * ตรวจสอบ JSON Strings และแปลงกลับเป็น Array/Object สำหรับ Frontend
 */
export function formatRowFromDb(row: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = snakeToCamel(key);

    if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
      try {
        out[camelKey] = JSON.parse(value);
        continue;
      } catch {
        out[camelKey] = value;
        continue;
      }
    }

    // แปลง 1/0 เป็น boolean สำหรับฟิลด์ Boolean ยอดนิยม
    if (
      typeof value === 'number' &&
      (camelKey === 'published' ||
        camelKey === 'pinned' ||
        camelKey === 'urgentTickerEnabled' ||
        camelKey === 'allowPublicDownload' ||
        camelKey === 'enableVideoGallery')
    ) {
      out[camelKey] = value === 1;
      continue;
    }

    out[camelKey] = value;
  }
  return out;
}
