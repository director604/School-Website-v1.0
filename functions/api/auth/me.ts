/**
 * Endpoint: GET /api/auth/me
 * ตรวจสอบสถานะการเข้าสู่ระบบของผู้ใช้จาก Session Token
 */

import { Env, jsonResponse, authenticateUser, corsHeaders } from '../_utils';

export const onRequestOptions = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  try {
    const user = await authenticateUser(request, env);
    if (!user) {
      return jsonResponse({
        authenticated: false,
        user: null,
        role: 'guest',
      });
    }

    return jsonResponse({
      authenticated: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: user.role,
        department: user.department,
        status: user.status,
      },
      role: user.role,
      token: user.token,
    });
  } catch (error: any) {
    console.error('Check auth error:', error);
    return jsonResponse({
      authenticated: false,
      user: null,
      role: 'guest',
    });
  }
};
