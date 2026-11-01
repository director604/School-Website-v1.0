/**
 * Endpoint: POST /api/auth/logout
 * ออกจากระบบ และลบ Session Token จากตาราง user_sessions
 */

import { Env, jsonResponse, getSessionToken, corsHeaders } from '../_utils';

export const onRequestOptions = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  try {
    const token = getSessionToken(request);
    if (token) {
      await env.DB.prepare('DELETE FROM user_sessions WHERE token = ?').bind(token).run();
    }

    const clearCookie = `bnr_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`;
    return jsonResponse(
      { success: true, message: 'ออกจากระบบสำเร็จ' },
      200,
      { 'Set-Cookie': clearCookie }
    );
  } catch (error: any) {
    console.error('Logout error:', error);
    return jsonResponse({ success: true });
  }
};
