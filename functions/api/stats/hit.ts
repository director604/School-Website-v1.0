/**
 * Endpoint: POST /api/stats/hit
 * นับสถิติการเข้าชมเว็บไซต์โรงเรียน บันทึกลงตาราง `site_stats`
 */

import { Env, jsonResponse, corsHeaders, formatRowFromDb } from '../_utils';

export const onRequestOptions = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestGet = async (context: { env: Env }) => {
  const { env } = context;
  try {
    const stats = await env.DB.prepare('SELECT * FROM site_stats WHERE id = ?')
      .bind('counter')
      .first<any>();

    if (!stats) {
      return jsonResponse({ totalVisits: 0, todayVisits: 0 });
    }
    return jsonResponse(formatRowFromDb(stats));
  } catch (err) {
    return jsonResponse({ totalVisits: 0, todayVisits: 0 });
  }
};

export const onRequestPost = async (context: { env: Env }) => {
  const { env } = context;
  const todayStr = new Date().toISOString().split('T')[0];
  const nowIso = new Date().toISOString();

  try {
    const current = await env.DB.prepare('SELECT * FROM site_stats WHERE id = ?')
      .bind('counter')
      .first<any>();

    if (!current) {
      await env.DB.prepare(
        `INSERT INTO site_stats (id, total_visits, today_visits, last_visited_at, last_date, updated_at)
         VALUES ('counter', 1, 1, ?, ?, ?)`
      )
        .bind(nowIso, todayStr, nowIso)
        .run();

      return jsonResponse({ totalVisits: 1, todayVisits: 1 });
    }

    const isSameDay = current.last_date === todayStr;
    const newToday = isSameDay ? (current.today_visits || 0) + 1 : 1;
    const newTotal = (current.total_visits || 0) + 1;

    await env.DB.prepare(
      `UPDATE site_stats
       SET total_visits = ?,
           today_visits = ?,
           last_visited_at = ?,
           last_date = ?,
           updated_at = ?
       WHERE id = 'counter'`
    )
      .bind(newTotal, newToday, nowIso, todayStr, nowIso)
      .run();

    return jsonResponse({ totalVisits: newTotal, todayVisits: newToday });
  } catch (err: any) {
    console.error('Hit counter error:', err);
    return jsonResponse({ totalVisits: 0, todayVisits: 0 });
  }
};
